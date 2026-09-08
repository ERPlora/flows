import { describe, it, expect } from 'vitest';
import {
  contractProblems,
  draftGaps,
  readDraft,
  schemaFacts,
  DRAFT_STEP_KINDS,
} from './ai-draft';
import type { AiTools, FlowDoc } from './flow-doc';
import en from '../../locales/en.json';
import es from '../../locales/es.json';

/** The catalogue lookup the shell does at runtime, reduced to what a test needs. */
const lookup = (catalogue: unknown, key: string): string | undefined => {
  let cur: unknown = catalogue;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
};

/**
 * The live contract, as `GET /api/hub/flows/schema` serves it — the same shape as
 * `hub/schemas/flow.schema.json`, trimmed to the parts this module reads out of it.
 *
 * It is written out here rather than imported so a test can MOVE it: the whole point of reading
 * the enums off the live schema is that a hub which froze a different set is obeyed, and a
 * hard-coded copy could not prove that.
 */
const liveSchema = {
  properties: {
    schema_version: { const: 1 },
  },
  $defs: {
    trigger: { properties: { kind: { enum: ['event', 'cron', 'at', 'manual'] } } },
    step: {
      properties: {
        kind: { enum: ['command', 'condition', 'delay', 'http', 'ai', 'notify'] },
        tools: { type: 'object' },
      },
    },
    condition: {
      additionalProperties: {
        properties: {
          eq: {},
          neq: {},
          in: {},
          exists: {},
          contains: {},
          gt: {},
          gte: {},
          lt: {},
          lte: {},
        },
      },
    },
  },
} as unknown as Record<string, unknown>;

/** A draft the assistant could plausibly have proposed for «call back the no-shows». */
const goodDoc = (): FlowDoc => ({
  schema_version: 1,
  triggers: [{ kind: 'event', event: 'appointments.appointment.no_show' }],
  steps: [
    { id: 's1', kind: 'condition', when: { 'input.appointment_id': { exists: true } } },
    { id: 's2', kind: 'command', command: 'tasks.tasks.create', params: { title: 'Call back' } },
  ],
});

const row = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'd1',
  name: 'Call back the no-shows',
  definition: JSON.stringify(goodDoc()),
  notes: JSON.stringify(['Decide how long to wait before calling.']),
  status: 'pending',
  created_at: '2026-08-14T10:00:00Z',
  ...over,
});

describe('reading what the assistant proposed', () => {
  it('turns the stored row into a document, its name and its notes', () => {
    const read = readDraft(row());
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.draft.name).toBe('Call back the no-shows');
    expect(read.draft.doc.steps).toHaveLength(2);
    expect(read.draft.notes).toEqual(['Decide how long to wait before calling.']);
  });

  it('accepts a definition that arrived already parsed, not as text', () => {
    // The column is TEXT and the dispatcher hands it back as a string, but a hub that ever
    // serves it as JSON must not make the screen go blank.
    const read = readDraft(row({ definition: goodDoc() }));
    expect(read.ok).toBe(true);
  });

  it('refuses a definition that is not JSON at all, with something to read', () => {
    const read = readDraft(row({ definition: 'Sure! Here is your flow:' }));
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(lookup(en, read.problem.key)).toBeTypeOf('string');
  });

  it('survives notes that are missing or malformed instead of losing the draft', () => {
    expect(readDraft(row({ notes: null })).ok).toBe(true);
    const read = readDraft(row({ notes: 'not json' }));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.draft.notes).toEqual([]);
  });
});

describe('the contract is read off the LIVE schema, not remembered', () => {
  it('takes the version, the kinds and the operators from what the hub served', () => {
    const facts = schemaFacts(liveSchema);
    expect(facts.schemaVersion).toBe(1);
    expect(facts.stepKinds).toContain('notify');
    expect(facts.triggerKinds).toContain('cron');
    expect(facts.operators).toContain('gte');
    expect(facts.toolsIsObject).toBe(true);
  });

  // The one fact in here that CANNOT fall back to the mirror. Everything else degrades: a hub that
  // served nothing usable still runs the document, it just judges it against `flow-doc.ts`. A
  // document carrying `interactive` on a hub older than hub#1633 does not degrade — `parse_step`
  // refuses the unknown key and takes the WHOLE definition down with it (`flow.invalid_definition`).
  // So the floor here is `false`: no proof, no control.
  it('offers the options that get tapped only where the hub declared the key', () => {
    const declaring = JSON.parse(JSON.stringify(liveSchema));
    declaring.$defs.step.properties.interactive = { type: 'object' };
    expect(schemaFacts(declaring).interactiveNotify).toBe(true);
  });

  it('hides them on a hub whose schema does not name the key', () => {
    // `liveSchema` is a pre-hub#1633 hub: `interactive` is simply not among the step's properties.
    expect(schemaFacts(liveSchema).interactiveNotify).toBe(false);
  });

  it('hides them when the schema could not be read at all, unlike every other fact here', () => {
    expect(schemaFacts(undefined).interactiveNotify).toBe(false);
    expect(schemaFacts({ $defs: { step: {} } }).interactiveNotify).toBe(false);
    // ...while the neighbouring facts DO fall back to the mirror, which is the contrast that
    // makes this one deliberate rather than an oversight.
    expect(schemaFacts(undefined).stepKinds).toContain('notify');
  });

  /**
   * **The one fact no schema can answer** (flows#111, hub#1662).
   *
   * Every other fact here is read off the shape the hub served, because a capability the hub
   * declares is the only witness that cannot go stale. A `query` grant that FIXES its parameters
   * declares nothing: the pin is stored in `_flow_grants`, never in the document, so the served
   * schema has no `grant`, no `pin` and no `payload` anywhere in it — and `schema_version` is
   * `const 1` on `v1.1.15`, `v1.1.16` and `develop` alike, so it did not move either.
   *
   * What is left is the number the SAME response carries (`core_version`), and the floor is the
   * release that first carries `GrantKind::can_pin(Query)`. Fail-closed like its two neighbours,
   * and for a harder reason: below the floor `check_grants` refuses the pin and `PUT …/grants` is
   * all-or-nothing, so the recipe does not install wide — it installs with NO permission at all
   * and dies at its first step.
   */
  it('lets a read fix who it is about only from the release that can store that', () => {
    expect(schemaFacts(liveSchema, '1.1.17').queryGrantPin).toBe(true);
    expect(schemaFacts(liveSchema, '1.2.0').queryGrantPin).toBe(true);
  });

  it('refuses it on the releases that would lose the whole permission screen over it', () => {
    expect(schemaFacts(liveSchema, '1.1.16').queryGrantPin).toBe(false);
    expect(schemaFacts(liveSchema, '1.1.15').queryGrantPin).toBe(false);
    // A `:dev` build floors at its base version, the same way the runtime floors a module's.
    expect(schemaFacts(liveSchema, '1.1.16-dev.305+gabc1234').queryGrantPin).toBe(false);
  });

  it('refuses it when nobody said which version this hub is', () => {
    expect(schemaFacts(liveSchema).queryGrantPin).toBe(false);
    expect(schemaFacts(undefined).queryGrantPin).toBe(false);
    expect(schemaFacts(liveSchema, '').queryGrantPin).toBe(false);
    expect(schemaFacts(liveSchema, 'unreadable').queryGrantPin).toBe(false);
  });

  // The fact is about the RELEASE and nothing else: a hub that declares every step key in the
  // world is still a hub that cannot store the pin, and a hub that declares none can.
  it('does not read the answer off the schema, which cannot know it', () => {
    const declaring = JSON.parse(JSON.stringify(liveSchema));
    declaring.$defs.step.properties.interactive = { type: 'object' };
    declaring.$defs.step.properties.output = { type: 'object' };
    expect(schemaFacts(declaring, '1.1.16').queryGrantPin).toBe(false);
    expect(schemaFacts(undefined, '1.1.17').queryGrantPin).toBe(true);
  });

  it('obeys a hub that froze a NARROWER vocabulary than this editor mirrors', () => {
    const narrower = JSON.parse(JSON.stringify(liveSchema));
    narrower.$defs.step.properties.kind.enum = ['command', 'condition'];
    const doc = goodDoc();
    doc.steps.push({ id: 's3', kind: 'delay', seconds: 60 });
    const problems = contractProblems(doc, schemaFacts(narrower));
    expect(problems.map((p) => p.params?.kind)).toContain('delay');
  });

  it('falls back to the mirrored contract when the hub served nothing usable', () => {
    const facts = schemaFacts(undefined);
    expect(facts.schemaVersion).toBe(1);
    expect(facts.stepKinds).toContain('command');
    // The mirror has to keep up with the kernel: a fallback that still said «six kinds» would
    // call a draft with a `query` step (hub#954) invalid on a hub that runs it.
    expect(facts.stepKinds).toContain('query');
    expect(facts.stepKinds).toContain('approval');
    expect(facts.operators).toContain('eq');
    expect(facts.toolsIsObject).toBe(true);
  });
});

describe('a proposal that does not meet the contract is refused, not half-saved', () => {
  it('passes a document that does meet it', () => {
    expect(contractProblems(goodDoc(), schemaFacts(liveSchema))).toEqual([]);
  });

  it('refuses a document written for another schema version', () => {
    const doc = { ...goodDoc(), schema_version: 2 };
    expect(contractProblems(doc, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('refuses a document with no steps at all', () => {
    const doc = { ...goodDoc(), steps: [] };
    expect(contractProblems(doc, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('refuses a step kind this hub does not execute', () => {
    const doc = goodDoc();
    doc.steps.push({ id: 's3', kind: 'branch' as never });
    expect(contractProblems(doc, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('refuses two steps sharing an id, because that is how one reads the other', () => {
    const doc = goodDoc();
    doc.steps.push({ id: 's1', kind: 'delay', seconds: 60 });
    expect(contractProblems(doc, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('refuses an operator outside the frozen set', () => {
    const doc = goodDoc();
    doc.steps[0].when = { 'input.total': { between: [1, 2] } as never };
    expect(contractProblems(doc, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('refuses `tools` written as an ARRAY — the shape hub#786 lost a day to', () => {
    const doc = goodDoc();
    // Wrong shape ON PURPOSE — an array where the kernel parses an object. The cast is the only
    // way to hand it to `contractProblems`, which is exactly what this test checks it rejects.
    doc.steps.push({
      id: 's3',
      kind: 'ai',
      prompt: 'summarise',
      tools: ['sales.list'] as unknown as AiTools,
    });
    const problems = contractProblems(doc, schemaFacts(liveSchema));
    expect(problems.map((p) => p.key)).toContain('draft.errToolsShape');
  });

  it('accepts `tools` written as the object the kernel parses', () => {
    const doc = goodDoc();
    doc.steps.push({
      id: 's3',
      kind: 'ai',
      prompt: 'summarise',
      tools: { queries: ['sales.list'], commands: [] },
    });
    const problems = contractProblems(doc, schemaFacts(liveSchema));
    expect(problems.map((p) => p.key)).not.toContain('draft.errToolsShape');
  });

  it('refuses a trigger kind the hub does not know, and one missing its own field', () => {
    const missingEvent = { ...goodDoc(), triggers: [{ kind: 'event' as const }] };
    expect(contractProblems(missingEvent, schemaFacts(liveSchema))).not.toEqual([]);
    const unknownKind = { ...goodDoc(), triggers: [{ kind: 'webhook' as never }] };
    expect(contractProblems(unknownKind, schemaFacts(liveSchema))).not.toEqual([]);
  });

  it('names every problem with a key both catalogues can say out loud', () => {
    const broken: FlowDoc = {
      schema_version: 9,
      triggers: [{ kind: 'webhook' as never }],
      steps: [
        { id: 'a', kind: 'nope' as never },
        { id: 'a', kind: 'condition', when: { 'input.x': { between: 1 } as never } },
        { id: 'b', kind: 'ai', prompt: 'x', tools: [] as unknown as AiTools }, // wrong shape on purpose
      ],
    };
    const problems = contractProblems(broken, schemaFacts(liveSchema));
    expect(problems.length).toBeGreaterThan(3);
    for (const problem of problems) {
      expect(lookup(en, problem.key), problem.key).toBeTypeOf('string');
      expect(lookup(es, problem.key), problem.key).toBeTypeOf('string');
    }
  });
});

describe('the holes the assistant left, highlighted rather than hidden', () => {
  it('finds nothing to fill in a proposal that is already complete', () => {
    expect(draftGaps(goodDoc(), { 'appointments.appointment.no_show': true })).toEqual([]);
  });

  it('flags an event THIS hub does not emit, and says which step it belongs to', () => {
    const gaps = draftGaps(goodDoc(), { 'appointments.appointment.no_show': false });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].stepId).toBe('trigger');
  });

  it('does not flag an event it has not been able to ask about yet', () => {
    // «not asked» is not «not there»: greying the trigger out for the first second of every
    // visit is the exact mistake `missingModules` was written to avoid.
    expect(draftGaps(goodDoc(), {})).toEqual([]);
  });

  it('flags a command the assistant left empty', () => {
    const doc = goodDoc();
    doc.steps[1].command = '';
    const gaps = draftGaps(doc, {});
    expect(gaps.map((g) => g.stepId)).toContain('s2');
  });

  it('flags a parameter left blank, naming the parameter', () => {
    const doc = goodDoc();
    doc.steps[1].params = { title: 'Call back', customer_id: '' };
    const gaps = draftGaps(doc, {});
    expect(gaps.some((g) => g.params?.name === 'customer_id')).toBe(true);
  });

  it('flags a guard with no field or no value to compare against', () => {
    const doc = goodDoc();
    doc.steps[0].when = { '': { eq: 'x' }, 'input.total': { gte: '' } };
    expect(draftGaps(doc, {})).not.toEqual([]);
  });

  it('flags a step this editor cannot finish yet instead of pretending it can', () => {
    const doc = goodDoc();
    doc.steps.push({ id: 's3', kind: 'notify', channel: 'whatsapp' });
    const gaps = draftGaps(doc, {});
    expect(gaps.map((g) => g.stepId)).toContain('s3');
  });

  it('says every gap with a key both catalogues can say out loud', () => {
    const doc = goodDoc();
    doc.triggers = [{ kind: 'event', event: 'nope.nope' }];
    doc.steps[0].when = { '': { eq: '' } };
    doc.steps[1].command = '';
    doc.steps[1].params = { title: '' };
    doc.steps.push({ id: 's3', kind: 'http', url: '' });
    const gaps = draftGaps(doc, { 'nope.nope': false });
    expect(gaps.length).toBeGreaterThan(4);
    for (const gap of gaps) {
      expect(lookup(en, gap.key), gap.key).toBeTypeOf('string');
      expect(lookup(es, gap.key), gap.key).toBeTypeOf('string');
    }
  });
});

describe('what the assistant is allowed to propose', () => {
  it('offers only the kinds this editor can finish, so no draft arrives unfinishable', () => {
    expect([...DRAFT_STEP_KINDS].sort()).toEqual(['command', 'condition', 'delay']);
  });
});
