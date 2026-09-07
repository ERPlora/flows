import { describe, it, expect } from 'vitest';
import {
  REDACTED,
  UNKNOWN,
  conditionResult,
  inputFromShape,
  renderTemplate,
  resolveExpr,
  resolvePath,
  simulate,
} from './simulate';
import type { EventShape } from './hub-flows';
import type { FlowDoc } from './flow-doc';

const shape = (fields: Partial<EventShape['fields'][number]>[], over: Partial<EventShape> = {}): EventShape => ({
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: fields.map((f) => ({
    path: 'x',
    type: 'string',
    redacted: false,
    truncated: false,
    seen_in: 4,
    ...f,
  })) as EventShape['fields'],
  ...over,
});

describe('the input, built from what really happened in THIS hub', () => {
  it('nests the sampled paths back into the payload the kernel would hand the run', () => {
    // The hub answers the SHAPE, never a stored payload (ADR-0312) — but each field carries one
    // real value from one real event. Reassembling them is how «probar» gets the owner's own data
    // without the hub having to export anybody's payload.
    const { input } = inputFromShape(
      shape([
        { path: 'total', type: 'number', sample: 4250 },
        { path: 'customer.name', sample: 'Marta' },
        { path: 'customer.id', sample: 'c-1' },
      ]),
    );
    expect(input).toEqual({ total: 4250, customer: { name: 'Marta', id: 'c-1' } });
  });

  it('keeps a withheld example DISTINCT from an absent one', () => {
    // These two look identical on a naive screen and mean opposite things: one is the hub
    // protecting a customer, the other is a mapping that will arrive empty at 3 AM.
    const { input, redactedPaths } = inputFromShape(
      shape([
        { path: 'customer.email', redacted: true },
        { path: 'note', type: 'string' },
      ]),
    );
    expect(resolvePath('customer.email', input)).toBe(REDACTED);
    expect(redactedPaths).toContain('customer.email');
    // No sample and not redacted: the field exists in the shape but this event carried nothing.
    expect(resolvePath('note', input)).toBeNull();
  });

  it('offers nothing from inside an array, because the mapping language cannot reach in', () => {
    const { input } = inputFromShape(
      shape([
        { path: 'lines', type: 'array', items: 3 },
        { path: 'total', type: 'number', sample: 10 },
      ]),
    );
    expect(Array.isArray((input as Record<string, unknown>).lines)).toBe(true);
    expect((input as Record<string, unknown>).total).toBe(10);
  });

  it('says there is nothing real to test with, rather than inventing a payload', () => {
    // `samples: 0` is a real answer: an infrequent event whose last occurrence aged out of the
    // ninety-day window. Making up a plausible sale would defeat the entire point of the feature.
    const { input, hasRealData } = inputFromShape(shape([{ path: 'total' }], { samples: 0 }));
    expect(hasRealData).toBe(false);
    expect(input).toEqual({});
  });

  it('has no data at all for a flow that no event starts', () => {
    const { input, hasRealData } = inputFromShape(null);
    expect(hasRealData).toBe(false);
    expect(input).toEqual({});
  });
});

describe('the mapping language, resolved exactly as def.rs resolves it', () => {
  const scope = { input: { total: 42.5, name: 'Marta', paid: true, missing: null } };

  it('reads a bare path with its type intact', () => {
    expect(resolveExpr('input.total', scope)).toBe(42.5);
    expect(resolveExpr('input.paid', scope)).toBe(true);
  });

  it('leaves a literal alone', () => {
    expect(resolveExpr('hello', scope)).toBe('hello');
    expect(resolveExpr(7, scope)).toBe(7);
  });

  it('renders a template to a string, and an unresolved path to nothing', () => {
    expect(renderTemplate('Hola {{input.name}}', scope)).toBe('Hola Marta');
    // `stringify(Null)` is the empty string in the kernel. This is THE bug worth showing an owner.
    expect(renderTemplate('Hola {{input.nope}}', scope)).toBe('Hola ');
  });

  it('leaves an unclosed brace verbatim, as the kernel does', () => {
    expect(renderTemplate('100% {{ of it', scope)).toBe('100% {{ of it');
  });

  it('recurses into objects and arrays', () => {
    expect(resolveExpr({ a: 'input.total', b: ['input.name'] }, scope)).toEqual({
      a: 42.5,
      b: ['Marta'],
    });
  });
});

describe('a guard, judged the way the kernel judges it', () => {
  const scope = { input: { total: 4250, money: '12.10', when: '2026-08-14T09:00:00Z', tags: ['a', 'b'] } };

  it('compares money written as a string against a number, because money IS a string', () => {
    // ADR-0123. Without this every condition written against an amount would be a silent `false`.
    expect(conditionResult({ 'input.money': { eq: 12.1 } }, scope).matched).toBe(true);
  });

  it('orders numerically when both sides are numbers', () => {
    expect(conditionResult({ 'input.total': { gte: 4250 } }, scope).matched).toBe(true);
    expect(conditionResult({ 'input.total': { gt: 4250 } }, scope).matched).toBe(false);
  });

  it('orders lexicographically otherwise, which is what makes RFC-3339 dates sort right', () => {
    expect(conditionResult({ 'input.when': { gt: '2026-08-13T23:59:59Z' } }, scope).matched).toBe(true);
    expect(conditionResult({ 'input.when': { lt: '2026-08-13T23:59:59Z' } }, scope).matched).toBe(false);
  });

  it('NEVER matches a field the event does not carry, except with exists:false', () => {
    expect(conditionResult({ 'input.nope': { eq: 'x' } }, scope).matched).toBe(false);
    expect(conditionResult({ 'input.nope': { gt: 0 } }, scope).matched).toBe(false);
    expect(conditionResult({ 'input.nope': { exists: false } }, scope).matched).toBe(true);
    expect(conditionResult({ 'input.total': { exists: true } }, scope).matched).toBe(true);
  });

  it('reads `in` and `contains` the way the kernel does', () => {
    expect(conditionResult({ 'input.total': { in: [1, 4250] } }, scope).matched).toBe(true);
    expect(conditionResult({ 'input.tags': { contains: 'a' } }, scope).matched).toBe(true);
    expect(conditionResult({ 'input.tags': { contains: 'z' } }, scope).matched).toBe(false);
  });

  it('holds only when EVERY clause holds — the set is an AND', () => {
    expect(
      conditionResult({ 'input.total': { gte: 100 }, 'input.tags': { contains: 'z' } }, scope).matched,
    ).toBe(false);
  });

  it('names the clause that did NOT hold, which is the only actionable thing on the screen', () => {
    const out = conditionResult({ 'input.total': { gte: 100 }, 'input.tags': { contains: 'z' } }, scope);
    expect(out.failed).toEqual([{ path: 'input.tags', op: 'contains', expected: 'z' }]);
  });

  it('refuses to guess about a field whose example the hub WITHHELD', () => {
    // The alternative is being confidently wrong: comparing against a placeholder would tell an
    // owner their guard does not pass when, with the real value, it might.
    const hidden = { input: { email: REDACTED } };
    const out = conditionResult({ 'input.email': { eq: 'marta@example.com' } }, hidden);
    expect(out.uncertain).toBe(true);
    expect(out.matched).toBe(false);
  });

  it('is still SURE about a hidden field when the question is only whether it is there', () => {
    const hidden = { input: { email: REDACTED } };
    const out = conditionResult({ 'input.email': { exists: true } }, hidden);
    expect(out.uncertain).toBe(false);
    expect(out.matched).toBe(true);
  });
});

describe('«probar»: what this flow WOULD do, with nothing actually happening', () => {
  const doc = (steps: unknown[], triggers: unknown[] = [{ kind: 'manual' }]) =>
    ({ schema_version: 1, triggers, steps } as never);

  it('walks the steps in order and says each one would run', () => {
    const out = simulate(
      doc([
        { id: 's1', kind: 'command', command: 'tasks.tasks.create', params: { title: 'Hola {{input.name}}' } },
        { id: 's2', kind: 'delay', seconds: 3600 },
      ]),
      { name: 'Marta' },
    );
    expect(out.steps.map((s) => s.outcome)).toEqual(['would-run', 'would-run']);
    expect(out.steps[0].values).toEqual([{ label: 'title', text: 'Hola Marta', blank: false, redacted: false }]);
  });

  it('STOPS at a guard that does not pass, and marks the rest not reached', () => {
    // v1 is linear on purpose: a guard that does not pass ENDS the run. There is no second path,
    // so the preview must not draw one.
    const out = simulate(
      doc([
        { id: 'g', kind: 'condition', when: { 'input.total': { gte: 10000 } } },
        { id: 's2', kind: 'command', command: 'customers.notes.add', params: {} },
      ]),
      { total: 500 },
    );
    expect(out.steps[0].outcome).toBe('stops-here');
    expect(out.steps[1].outcome).toBe('not-reached');
    expect(out.stoppedAt).toBe('g');
  });

  it('says a guard that does not pass is the flow WORKING, not a failure', () => {
    const out = simulate(doc([{ id: 'g', kind: 'condition', when: { 'input.x': { eq: 1 } } }]), { x: 2 });
    expect(out.failed).toBe(false);
  });

  it('names every mapping that would arrive EMPTY — the bug this feature exists to find', () => {
    // Brackenbury et al. (CHI 2019): people do not predict a faulty flow's behaviour, even reading
    // it. A `{{input.customer_name}}` that resolves to nothing is precisely that kind of fault.
    const out = simulate(
      doc([
        {
          id: 's1',
          kind: 'command',
          command: 'tasks.tasks.create',
          params: { title: 'Call {{input.customer_name}}', priority: 'high' },
        },
      ]),
      { total: 10 },
    );
    expect(out.steps[0].values).toContainEqual({
      label: 'title',
      text: 'Call ',
      blank: true,
      redacted: false,
    });
    expect(out.blanks).toBe(1);
  });

  it('does NOT call a blank what the hub is merely hiding', () => {
    const out = simulate(
      doc([{ id: 's1', kind: 'notify', channel: 'email', to: { query: 'q', field: 'email' }, vars: { text: 'Hola {{input.email}}' } }]),
      { email: REDACTED },
    );
    const value = out.steps[0].values.find((v) => v.label === 'text')!;
    expect(value.redacted).toBe(true);
    expect(value.blank).toBe(false);
    expect(out.blanks).toBe(0);
  });

  it('shows the address a http step would really call, templates resolved', () => {
    const out = simulate(
      doc([{ id: 'h', kind: 'http', method: 'POST', url: 'https://api.test/orders/{{input.id}}' }]),
      { id: 'o-9' },
    );
    expect(out.steps[0].values).toContainEqual({
      label: 'url',
      text: 'https://api.test/orders/o-9',
      blank: false,
      redacted: false,
    });
  });

  it('never resolves a secret, not even into the preview', () => {
    // The value does not exist on this side at all — and a «probar» screen that printed one would
    // be the one place in the product where a write-only credential became readable.
    const out = simulate(
      doc([
        {
          id: 'h',
          kind: 'http',
          url: 'https://api.test/x',
          headers: { Authorization: 'Bearer {{secret.API_KEY}}' },
        },
      ]),
      {},
    );
    const header = out.steps[0].values.find((v) => v.label === 'Authorization')!;
    expect(header.text).not.toContain('API_KEY');
    expect(header.redacted).toBe(true);
    expect(header.blank).toBe(false);
  });

  it('checks the trigger FILTER against the same real data', () => {
    const out = simulate(
      doc([{ id: 's1', kind: 'command', command: 'x', params: {} }], [
        { kind: 'event', event: 'sale.completed', filter: { 'event.total': { gte: 10000 } } },
      ]),
      { total: 500 },
    );
    // The flow would never even start: saying so is more useful than walking steps that never run.
    expect(out.triggerMatched).toBe(false);
    expect(out.steps.every((s) => s.outcome === 'not-reached')).toBe(true);
  });

  it('passes the trigger when it has no filter at all', () => {
    const out = simulate(
      doc([{ id: 's1', kind: 'command', command: 'x', params: {} }], [
        { kind: 'event', event: 'sale.completed' },
      ]),
      { total: 500 },
    );
    expect(out.triggerMatched).toBe(true);
  });

  it('shows the params a query step would read with, resolved — and executes nothing (flows#30)', () => {
    // A read has no side effects, but «probar» still runs NOTHING: the values it shows are what
    // the kernel would hand the query. What comes back is only known once it has run, and a
    // later step reading `steps.<id>.found` says so instead of guessing.
    const out = simulate(
      doc([
        { id: 'w', kind: 'query', query: 'sales.summary', params: { from: '{{input.day}}', to: 'input.day' } },
        { id: 'g', kind: 'condition', when: { 'steps.w.found': { eq: true } } },
      ]),
      { day: '2026-08-18' },
    );
    expect(out.steps[0].outcome).toBe('would-run');
    expect(out.steps[0].values).toEqual([
      { label: 'from', text: '2026-08-18', blank: false, redacted: false },
      { label: 'to', text: '2026-08-18', blank: false, redacted: false },
    ]);
    // The guard on `found` is UNCERTAIN, not failed: it does not stop the walk.
    expect(out.steps[1].outcome).toBe('would-run');
    expect(out.steps[1].condition?.uncertain).toBe(true);
  });

  it('says an approval step WAITS for a person and decides nothing on their behalf (flows#31)', () => {
    // «Probar» must not invent a yes. The honest thing is: the question, as it would be asked
    // (title and summary resolved), a mark that the run pauses here, and the steps after it
    // shown as they are — with a guard on the decision UNCERTAIN, since all three outcomes are
    // still possible.
    const out = simulate(
      doc([
        { id: 'ok', kind: 'approval', title: 'Approve {{input.total}} €?', summary: 'From {{input.who}}' },
        { id: 'g', kind: 'condition', when: { 'steps.ok.decision': { eq: 'approved' } } },
        { id: 'do', kind: 'command', command: 'tasks.tasks.create', params: {} },
      ]),
      { total: '120', who: 'Marta' },
    );
    expect(out.steps[0].outcome).toBe('would-run');
    expect(out.steps[0].pauses).toBe(true);
    expect(out.steps[0].values).toEqual([
      { label: 'title', text: 'Approve 120 €?', blank: false, redacted: false },
      { label: 'summary', text: 'From Marta', blank: false, redacted: false },
    ]);
    expect(out.steps[1].outcome).toBe('would-run');
    expect(out.steps[1].condition?.uncertain).toBe(true);
    expect(out.steps[2].outcome).toBe('would-run');
    // No other kind pauses.
    expect(out.steps[2].pauses).toBeUndefined();
  });

  it('reads a later step as unknown rather than pretending to know its output', () => {
    // `steps.s1.id` is real in the kernel and unknowable here: nothing ran. Calling it a blank
    // would report a bug that is not there.
    const out = simulate(
      doc([
        { id: 's1', kind: 'command', command: 'a', params: {} },
        { id: 's2', kind: 'command', command: 'b', params: { ref: '{{steps.s1.id}}' } },
      ]),
      {},
    );
    const value = out.steps[1].values.find((v) => v.label === 'ref')!;
    expect(value.blank).toBe(false);
    expect(value.unknown).toBe(true);
  });
});

describe('the sentinels are exactly the strings they claim to be', () => {
  // They are written in the source as NUL escapes rather than raw bytes, because a literal NUL
  // makes git treat the file as binary and every diff of it unreadable. This pins that the escape
  // still produces the SAME value the raw byte did: a well-meaning cleanup to a plain space would
  // otherwise be invisible here and only surface as a sentinel colliding with a customer's data.
  const NUL = String.fromCharCode(0);

  it('wraps the redaction sentinel in NUL, so no real sample can collide with it', () => {
    expect(REDACTED).toBe(`${NUL}redacted${NUL}`);
  });

  it('wraps the unknown sentinel the same way', () => {
    expect(UNKNOWN).toBe(`${NUL}unknown${NUL}`);
  });

  it('and neither is a string a payload could plausibly contain on its own', () => {
    expect(REDACTED).not.toBe('redacted');
    expect(REDACTED.includes(' ')).toBe(false);
  });
});

describe('a message with options, in the preview (flows#75)', () => {
  const tapping = (): FlowDoc => ({
    schema_version: 1,
    triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
    steps: [
      {
        id: 'ask',
        kind: 'notify',
        channel: 'whatsapp',
        to: { query: 'customers.customer.get', params: {}, field: 'phone' },
        interactive: {
          type: 'list',
          body: { text: 'Hola {{input.name}}, ¿cuándo te viene bien?' },
          action: {
            button: 'Ver los huecos',
            sections: [
              {
                rows: [
                  { id: 'slot_1', title: 'Mañana a las {{input.hour}}', description: 'Con {{input.pro}}' },
                ],
              },
            ],
          },
        },
      },
    ],
  });

  /**
   * Before this, «Pruébalo» mapped `step.vars` and nothing else, so a step with options and no
   * copy showed as a BLANK card — the one screen whose whole job is answering «what would this
   * actually send» answering «nothing» about the message that has just been written.
   */
  it('shows the message and every option, resolved', () => {
    const run = simulate(tapping(), { name: 'Ana', hour: '10:00', pro: 'Marta' });
    const values = run.steps[0].values.map((v) => v.text);
    expect(values).toContain('Hola Ana, ¿cuándo te viene bien?');
    expect(values).toContain('Mañana a las 10:00');
    expect(values).toContain('Con Marta');
    expect(values).toContain('Ver los huecos');
  });

  // The same verdict the copy gets: a mapping that resolves to nothing is the fault this tab
  // exists to surface, and an option whose label came out empty is a button with no words on it.
  it('marks an option whose label resolved to nothing', () => {
    const run = simulate(tapping(), { name: 'Ana' });
    const blanks = run.steps[0].values.filter((v) => v.blank).map((v) => v.label);
    expect(blanks.length).toBeGreaterThan(0);
  });
});
