import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  grantAllowsCall,
  emptyDoc,
  readDoc,
  addStep,
  removeStep,
  moveStep,
  patchStep,
  removeStepKeys,
  STEP_KEYS,
  isPath,
  partsToValue,
  valueToParts,
  requiredGrants,
  missingGrants,
  mergeGrants,
  canPinPayload,
  setGrantPin,
  pinRows,
  readPinRows,
  isSpineKind,
  partsToTemplate,
  httpPatternFor,
  MAX_QUERY_ROWS,
  queryOutputs,
  MAX_APPROVAL_TTL_SECONDS,
  DEFAULT_APPROVAL_TTL_SECONDS,
  EXPIRY_POLICIES,
  REJECT_POLICIES,
  approvalOutputs,
} from './flow-doc';
import type { Grant } from './flow-doc';

describe('the document a flow is', () => {
  it('is born with the version this core enforces and one trigger', () => {
    const doc = emptyDoc();
    expect(doc.schema_version).toBe(SCHEMA_VERSION);
    expect(doc.steps).toEqual([]);
    // A flow with no trigger only ever runs by hand, and nobody writing their first automation
    // means that. `manual` is the honest default: it says what it does and needs no picking.
    expect(doc.triggers).toEqual([{ kind: 'manual' }]);
  });

  it('reads back what the hub stored, and survives a document it did not write', () => {
    const doc = readDoc({
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'sale.completed' }],
      steps: [{ id: 's1', kind: 'command', command: 'tasks.task.create' }],
    });
    expect(doc.triggers[0].event).toBe('sale.completed');
    expect(doc.steps).toHaveLength(1);

    // Nulls, missing arrays and outright rubbish must not throw: this is what a hub answers when
    // a flow was written by an older editor, or by hand.
    expect(readDoc(null).steps).toEqual([]);
    expect(readDoc({ steps: 'nope', triggers: 7 }).triggers).toEqual([]);
  });

  it('keeps every step id unique, because a later step reads an earlier one BY id', () => {
    let doc = emptyDoc();
    doc = addStep(doc, 'command');
    doc = addStep(doc, 'command');
    doc = addStep(doc, 'delay');
    const ids = doc.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(3);
    expect(doc.steps.map((s) => s.kind)).toEqual(['command', 'command', 'delay']);
  });

  it('does not reuse an id that a removed step left behind', () => {
    // A later step reads an earlier one as `steps.<id>.field`. Handing a fresh step the id of a
    // deleted one would silently re-point that reference at a different step — a flow that keeps
    // running and does the wrong thing, which is the worst failure this editor can ship.
    let doc = addStep(addStep(emptyDoc(), 'command'), 'command');
    const removed = doc.steps[1].id;
    doc = removeStep(doc, 1);
    doc = addStep(doc, 'command');
    expect(doc.steps[1].id).not.toBe(removed);
    expect(new Set(doc.steps.map((s) => s.id)).size).toBe(2);
  });

  it('reorders without mutating the document it was given', () => {
    const before = addStep(addStep(addStep(emptyDoc(), 'command'), 'delay'), 'condition');
    const kinds = before.steps.map((s) => s.kind);
    const after = moveStep(before, 2, 0);
    expect(after.steps.map((s) => s.kind)).toEqual(['condition', 'command', 'delay']);
    expect(before.steps.map((s) => s.kind)).toEqual(kinds);
  });

  it('patches one step and leaves the rest alone', () => {
    const doc = patchStep(addStep(addStep(emptyDoc(), 'command'), 'delay'), 1, { seconds: 3600 });
    expect(doc.steps[1].seconds).toBe(3600);
    expect(doc.steps[0].seconds).toBeUndefined();
  });

  // `patchStep` spreads, so `{vars: undefined}` leaves the key sitting there holding `undefined`,
  // and whether it reaches the hub at all comes down to `JSON.stringify` dropping it on the way
  // out. That is a save that works by accident. When a key has to GO — the copy of a message that
  // just became a tappable one — it goes for real.
  it('takes a key off a step instead of leaving it holding undefined', () => {
    const doc = patchStep(addStep(emptyDoc(), 'notify'), 0, {
      template: 'appointment-reminder',
      vars: { text: 'hola' },
      channel: 'whatsapp',
    });
    const after = removeStepKeys(doc, 0, ['template', 'vars']);
    expect('template' in after.steps[0]).toBe(false);
    expect('vars' in after.steps[0]).toBe(false);
    expect(after.steps[0].channel).toBe('whatsapp');
    expect(after.steps[0].id).toBe(doc.steps[0].id);
  });

  it('leaves the other steps and the document it was handed untouched', () => {
    const doc = patchStep(addStep(addStep(emptyDoc(), 'notify'), 'notify'), 0, { template: 'a' });
    const after = removeStepKeys(patchStep(doc, 1, { template: 'b' }), 1, ['template']);
    expect(after.steps[0].template).toBe('a');
    expect(doc.steps[0].template).toBe('a');
    expect('template' in doc.steps[1]).toBe(false);
  });

  it('says nothing about a key the step never carried, and about an index that is not there', () => {
    const doc = addStep(emptyDoc(), 'notify');
    expect(removeStepKeys(doc, 0, ['interactive']).steps[0]).toEqual(doc.steps[0]);
    expect(removeStepKeys(doc, 7, ['id']).steps).toEqual(doc.steps);
  });
});

// `STEP_KEYS` DECLARES itself a mirror of the kernel's whitelist, which is strict: a key missing
// from it is a key this editor believes the hub refuses. Drifting from `def.rs` is not a cosmetic
// lag — it is the editor lying about the contract to every part of itself that asks.
describe('the keys the kernel allows, per kind', () => {
  it('lets a whatsapp notify carry the options the customer taps', () => {
    // `def.rs:1452`: ["id","kind","channel","to","template","vars","interactive"].
    expect(STEP_KEYS.notify).toContain('interactive');
  });
});

describe('the mapping language, as the editor has to speak it', () => {
  // Mirrors `crates/runtime/src/flows/def.rs::is_path`. Getting this wrong is silent: a literal
  // that looks like a path is READ as one by the kernel, and the step runs with a null.
  it('knows a path from a literal exactly as the runtime does', () => {
    expect(isPath('input.total')).toBe(true);
    expect(isPath('steps.s1.id')).toBe(true);
    expect(isPath('event.customer.id')).toBe(true);
    expect(isPath('secret.API_KEY')).toBe(true);
    expect(isPath('input')).toBe(false);
    expect(isPath('input.')).toBe(false);
    expect(isPath('total')).toBe(false);
    expect(isPath('Hello world')).toBe(false);
  });

  it('writes ONE field as a bare path, so the value keeps its type', () => {
    // 42.50 has to stay a number for a command whose schema says number. A template would make it
    // the string "42.5" and the command would be refused at the far end of the flow.
    expect(partsToValue([{ kind: 'field', path: 'input.total' }])).toBe('input.total');
  });

  it('writes text mixed with fields as a template, and never shows the braces to anybody', () => {
    expect(
      partsToValue([
        { kind: 'text', text: 'Sale of ' },
        { kind: 'field', path: 'input.total' },
        { kind: 'text', text: ' €' },
      ]),
    ).toBe('Sale of {{input.total}} €');
  });

  it('reads a stored value back into the pills that produced it', () => {
    expect(valueToParts('input.total')).toEqual([{ kind: 'field', path: 'input.total' }]);
    expect(valueToParts('Sale of {{input.total}} €')).toEqual([
      { kind: 'text', text: 'Sale of ' },
      { kind: 'field', path: 'input.total' },
      { kind: 'text', text: ' €' },
    ]);
    expect(valueToParts('plain text')).toEqual([{ kind: 'text', text: 'plain text' }]);
    expect(valueToParts(7)).toEqual([{ kind: 'text', text: '7' }]);
  });

  it('round-trips a number so a quantity does not arrive as a string', () => {
    expect(partsToValue(valueToParts(7))).toBe(7);
    expect(partsToValue(valueToParts(true))).toBe(true);
  });

  it('does NOT turn something that merely looks numeric into a number', () => {
    // A phone, a postcode and an invoice code are strings that a naive parse would mangle.
    expect(partsToValue([{ kind: 'text', text: '007' }])).toBe('007');
    expect(partsToValue([{ kind: 'text', text: '+34600111222' }])).toBe('+34600111222');
    expect(partsToValue([{ kind: 'text', text: '2 units' }])).toBe('2 units');
  });

  it('an empty composition is an empty string, never a null the command has to guess about', () => {
    expect(partsToValue([])).toBe('');
  });
});

describe('what a flow needs permission to do', () => {
  const doc = readDoc({
    schema_version: 1,
    triggers: [{ kind: 'manual' }],
    steps: [
      { id: 's1', kind: 'command', command: 'tasks.task.create' },
      { id: 's2', kind: 'condition', when: {} },
      { id: 's3', kind: 'command', command: 'customers.customer.update' },
      { id: 's4', kind: 'command', command: 'tasks.task.create' },
    ],
  });

  it('reads the permissions out of the document, so nobody has to type them twice', () => {
    expect(requiredGrants(doc)).toEqual([
      { kind: 'command', value: 'tasks.task.create' },
      { kind: 'command', value: 'customers.customer.update' },
    ]);
  });

  it('says which of them are not granted yet', () => {
    const live = [{ id: 'g1', kind: 'command', value: 'tasks.task.create' }];
    expect(missingGrants(doc, live)).toEqual([
      { kind: 'command', value: 'customers.customer.update' },
    ]);
  });

  it('NEVER drops a live grant it does not understand', () => {
    // `PUT …/grants` is a COMPLETE replace. An editor that sends only what it derived would
    // silently revoke the `http` and `notify` grants of a flow written by a newer editor — the
    // owner would read «granted» on one screen and the flow would stop working.
    const live = [
      { id: 'g1', kind: 'http', value: 'https://api.example.com/*' },
      { id: 'g2', kind: 'command', value: 'tasks.task.create' },
    ];
    const merged = mergeGrants(live, [{ kind: 'command', value: 'customers.customer.update' }], []);
    expect(merged).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
      { kind: 'command', value: 'tasks.task.create' },
      { kind: 'command', value: 'customers.customer.update' },
    ]);
  });

  it('revokes only what was explicitly named', () => {
    const live = [
      { id: 'g1', kind: 'command', value: 'tasks.task.create' },
      { id: 'g2', kind: 'http', value: 'https://api.example.com/*' },
    ];
    expect(mergeGrants(live, [], [{ kind: 'command', value: 'tasks.task.create' }])).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
    ]);
  });
});

describe('what the spine can draw', () => {
  it('draws all the kinds the kernel executes (flows#3, flows#30, flows#31)', () => {
    // Until flows#3 the last three opened read-only, which meant the owner could see the step and
    // not fix it. Every kind is editable now; anything else is still a document from a newer
    // editor and must open untouched rather than be rewritten without it.
    for (const kind of ['command', 'condition', 'delay', 'http', 'ai', 'notify', 'query', 'approval']) {
      expect(isSpineKind(kind), kind).toBe(true);
    }
    expect(isSpineKind('whatever-comes-next')).toBe(false);
  });
});

describe('a step is born with exactly the keys the kernel allows', () => {
  // `def.rs:1018-1025` is a STRICT whitelist per kind and an unknown key is refused at save. A
  // blank step carrying a stray field would make the very first save fail on a document the owner
  // never typed into.
  const KEYS: Record<string, string[]> = {
    command: ['id', 'kind', 'command', 'params'],
    condition: ['id', 'kind', 'when'],
    delay: ['id', 'kind', 'seconds', 'until'],
    http: ['id', 'kind', 'method', 'url', 'headers', 'body', 'timeout'],
    ai: ['id', 'kind', 'prompt', 'tools', 'policy', 'max_iters'],
    notify: ['id', 'kind', 'channel', 'to', 'template', 'vars'],
  };

  for (const [kind, allowed] of Object.entries(KEYS)) {
    it(`a blank ${kind} step declares nothing the hub would refuse`, () => {
      const doc = addStep(emptyDoc(), kind as never);
      expect(Object.keys(doc.steps[0]).filter((k) => !allowed.includes(k))).toEqual([]);
    });
  }

  it('a new http step is a GET, because the harmless verb is the one to default to', () => {
    const step = addStep(emptyDoc(), 'http').steps[0];
    expect(step.method).toBe('GET');
    expect(step.url).toBe('');
  });

  it('a new ai step asks for approval, exactly as the kernel defaults', () => {
    // `policy` defaults to `manual` in def.rs and the default is the RESTRICTIVE one on purpose.
    // Writing it out loud is the point: the permissive option is the one nobody types and
    // everybody assumes, and here it means a model writing to the business at 3 AM.
    const step = addStep(emptyDoc(), 'ai').steps[0];
    expect(step.policy).toBe('manual');
    expect(step.max_iters).toBe(6);
    expect(step.tools).toEqual({ queries: [], commands: [] });
  });

  it('a new notify step has NO recipient, because there is no default person to write to', () => {
    const step = addStep(emptyDoc(), 'notify').steps[0];
    expect(step.channel).toBe('email');
    expect(step.to).toEqual({ query: '', params: {}, field: '' });
  });
});

describe('the `query` step — the deterministic read (hub#954, flows#30)', () => {
  it('is a kind this editor draws and edits', () => {
    // Until flows#30 a `query` step opened read-only: the owner could see it and not fix it.
    expect(isSpineKind('query')).toBe(true);
  });

  it('is born with exactly the keys the kernel whitelists, and the kernel defaults', () => {
    // `def.rs`: `id, kind, query, params, result, limit`. `result: first` and `limit: 200` are
    // the kernel's own defaults, written out loud so the panel shows what will really happen.
    const step = addStep(emptyDoc(), 'query').steps[0];
    expect(Object.keys(step).sort()).toEqual(['id', 'kind', 'limit', 'params', 'query', 'result']);
    expect(step.query).toBe('');
    expect(step.params).toEqual({});
    expect(step.result).toBe('first');
    expect(step.limit).toBe(MAX_QUERY_ROWS);
  });

  it('caps the rows at the kernel ceiling, which is 200 and refuses rather than trims', () => {
    expect(MAX_QUERY_ROWS).toBe(200);
  });

  it('asks for a `query` grant on the read it performs — the same grant an ai tool would', () => {
    // hub#954 added no permission surface: the step goes through `GrantKind::Query`, exactly like
    // `tools.queries` of an `ai` step. So the permissions tab derives it the same way.
    const doc = readDoc({
      schema_version: 1,
      steps: [{ id: 'week', kind: 'query', query: 'sales.summary', params: {}, result: 'first' }],
    });
    expect(requiredGrants(doc)).toEqual([{ kind: 'query', value: 'sales.summary' }]);
  });

  it('asks for nothing while the read has no name yet', () => {
    const doc = readDoc({ schema_version: 1, steps: [{ id: 'q', kind: 'query', query: '  ' }] });
    expect(requiredGrants(doc)).toEqual([]);
  });

  it('names what a later step can read out of it — and never `rows`', () => {
    // `result: first` leaves the row's fields at the root plus `found` and `count`; `count`
    // leaves only those two. `rows` does not exist in v1: the mapping language cannot index an
    // array, and offering `steps.week.rows.0.total` would resolve to nothing in silence.
    expect(queryOutputs({ id: 'week', kind: 'query', query: 'sales.summary', result: 'first' })).toEqual([
      'steps.week.found',
      'steps.week.count',
      'steps.week.<field>',
    ]);
    expect(queryOutputs({ id: 'week', kind: 'query', query: 'sales.summary', result: 'count' })).toEqual([
      'steps.week.found',
      'steps.week.count',
    ]);
  });
});

describe('the `approval` step — the pause (hub#950, flows#31)', () => {
  it('is a kind this editor draws and edits', () => {
    expect(isSpineKind('approval')).toBe(true);
  });

  it('is born with only keys the kernel whitelists, and the kernel defaults, and NO assignee', () => {
    // `def.rs`: `id, kind, title, summary, assignee, expires_in, on_expire, on_reject`. The
    // defaults are the kernel's own — 72 h, `reject` on expiry, `cancel` on a no — written out
    // loud so the panel shows what will really happen. `assignee` is ABSENT, which the kernel
    // reads as «whoever administers the hub»: the one answer that cannot name a role nobody holds.
    const step = addStep(emptyDoc(), 'approval').steps[0];
    const allowed = ['id', 'kind', 'title', 'summary', 'assignee', 'expires_in', 'on_expire', 'on_reject'];
    expect(Object.keys(step).filter((k) => !allowed.includes(k))).toEqual([]);
    expect(step.title).toBe('');
    expect(step.assignee).toBeUndefined();
    expect(step.expires_in).toBe(DEFAULT_APPROVAL_TTL_SECONDS);
    expect(step.on_expire).toBe('reject');
    expect(step.on_reject).toBe('cancel');
    // Never `command`/`payload`: this step executes nothing, and the kernel refuses both by name.
    expect(step.command).toBeUndefined();
    expect(step.payload).toBeUndefined();
  });

  it('mirrors the kernel ceilings and vocabularies', () => {
    expect(DEFAULT_APPROVAL_TTL_SECONDS).toBe(259200);
    expect(MAX_APPROVAL_TTL_SECONDS).toBe(2592000);
    expect([...EXPIRY_POLICIES]).toEqual(['reject', 'cancel', 'continue']);
    expect([...REJECT_POLICIES]).toEqual(['cancel', 'continue']);
  });

  it('needs NO grant: asking a person is not reaching a capability', () => {
    // The grant belongs to the step that WRITES afterwards. A permissions tab that listed
    // something for a question would teach that permissions are about questions.
    const doc = readDoc({
      schema_version: 1,
      steps: [
        { id: 'ok', kind: 'approval', title: 'Approve?', assignee: { role: 'manager' } },
        { id: 'do', kind: 'command', command: 'tasks.tasks.create', params: {} },
      ],
    });
    expect(requiredGrants(doc)).toEqual([{ kind: 'command', value: 'tasks.tasks.create' }]);
  });

  it('names what a later step can read out of it — the decision and who made it', () => {
    expect(approvalOutputs({ id: 'ok', kind: 'approval', title: 'x' })).toEqual([
      'steps.ok.decision',
      'steps.ok.decided_by',
      'steps.ok.decided_at',
      'steps.ok.comment',
    ]);
  });
});

describe('a URL is always a template, never a bare path', () => {
  // `url` is `type: string` in the schema. A lone field would be stored as the bare path
  // `input.endpoint`, which the kernel reads as a LITERAL URL and refuses — the one place where
  // the type-preserving rule of `partsToValue` is the wrong rule.
  it('wraps a single field in braces instead of writing it bare', () => {
    expect(partsToTemplate([{ kind: 'field', path: 'input.endpoint' }])).toBe('{{input.endpoint}}');
  });

  it('joins text and fields the way the kernel templates them', () => {
    expect(
      partsToTemplate([
        { kind: 'text', text: 'https://api.example.com/orders/' },
        { kind: 'field', path: 'input.order_id' },
      ]),
    ).toBe('https://api.example.com/orders/{{input.order_id}}');
  });

  it('an empty composition is an empty string, not the word undefined in a URL bar', () => {
    expect(partsToTemplate([])).toBe('');
  });
});

describe('a secret is written the ONE way the kernel documents', () => {
  it('always templates a secret, even when it is the only thing in the box', () => {
    // `{{secret.X}}` is the documented form (flows.md §4). A bare `secret.API_KEY` may well
    // resolve too, but «may well» is exactly the kind of silent difference that ships a header
    // carrying the literal eighteen characters of a path — the bug hub#662 already lived once.
    expect(partsToValue([{ kind: 'field', path: 'secret.API_KEY' }])).toBe('{{secret.API_KEY}}');
    expect(
      partsToValue([
        { kind: 'text', text: 'Bearer ' },
        { kind: 'field', path: 'secret.API_KEY' },
      ]),
    ).toBe('Bearer {{secret.API_KEY}}');
  });

  it('reads that form back into the pill it was written from', () => {
    expect(valueToParts('{{secret.API_KEY}}')).toEqual([{ kind: 'field', path: 'secret.API_KEY' }]);
  });
});

describe('what a flow with the other three steps needs permission to do', () => {
  // Before flows#3 `requiredGrants` only ever looked at `command` steps, so the Permissions tab of
  // a flow with an `http`, an `ai` or a `notify` step said «this automation asks for nothing yet»
  // about a flow that could not run a single step. Reading «allowed» about a flow that is not is
  // the worst possible thing for this screen to do.
  const doc = readDoc({
    schema_version: 1,
    triggers: [{ kind: 'manual' }],
    steps: [
      { id: 's1', kind: 'http', method: 'POST', url: 'https://api.example.com/v1/orders' },
      {
        id: 's2',
        kind: 'ai',
        prompt: 'summarise',
        tools: { queries: ['sales.sale.list'], commands: ['tasks.tasks.create'] },
      },
      {
        id: 's3',
        kind: 'notify',
        channel: 'whatsapp',
        to: { query: 'customers.customer.get', field: 'phone' },
      },
    ],
  });

  it('asks for the http grant as a PATTERN the hub will accept', () => {
    expect(requiredGrants(doc)).toContainEqual({
      kind: 'http',
      value: 'https://api.example.com/v1/orders*',
    });
  });

  it('asks for a grant per ai tool, because offering a tool is not authorising it', () => {
    expect(requiredGrants(doc)).toContainEqual({ kind: 'query', value: 'sales.sale.list' });
    expect(requiredGrants(doc)).toContainEqual({ kind: 'command', value: 'tasks.tasks.create' });
  });

  it('asks for the channel and the recipient SEPARATELY, because they are two decisions', () => {
    // Meta charges for every WhatsApp and an email is free: allowing the reminder by email is not
    // agreeing to pay for it by WhatsApp. And allowing the channel says nothing about who is written to.
    expect(requiredGrants(doc)).toContainEqual({ kind: 'notify', value: 'whatsapp' });
    expect(requiredGrants(doc)).toContainEqual({
      kind: 'recipient_query',
      value: 'customers.customer.get#phone',
    });
  });

  it('asks for nothing it cannot name yet, so a half-typed step does not invent a grant', () => {
    const half = readDoc({
      schema_version: 1,
      steps: [
        { id: 's1', kind: 'http', url: '' },
        { id: 's2', kind: 'notify', channel: 'email', to: { query: '', field: '' } },
        { id: 's3', kind: 'ai', prompt: '', tools: { queries: [''], commands: [] } },
      ],
    });
    // The channel is the one thing that IS known: it is picked from a closed list, never typed.
    expect(requiredGrants(half)).toEqual([{ kind: 'notify', value: 'email' }]);
  });
});

describe('the http grant pattern suggested from a URL', () => {
  // `check_http_pattern` refuses a pattern with no concrete host, with no path, or written in any
  // form other than the one it will be compared in. A suggestion that gets refused at grant time
  // is worse than no suggestion: the owner reads it as a permission they already gave.
  it('covers the endpoint and nothing above it', () => {
    expect(httpPatternFor('https://api.example.com/v1/orders')).toBe(
      'https://api.example.com/v1/orders*',
    );
  });

  it('stops at the first template, because what follows is whatever the event brought', () => {
    expect(httpPatternFor('https://api.example.com/v1/orders/{{input.id}}')).toBe(
      'https://api.example.com/v1/orders/*',
    );
  });

  it('refuses to guess when the HOST itself is templated', () => {
    // A pattern without a concrete host is refused by the hub (`flow.invalid_http_pattern`) and
    // would be meaningless anyway: it authorises every host the payload can name.
    expect(httpPatternFor('{{input.base}}/orders')).toBe('');
    expect(httpPatternFor('https://{{input.host}}/orders')).toBe('');
  });

  it('never suggests a bare origin, which the hub refuses for having no path', () => {
    expect(httpPatternFor('https://api.example.com')).toBe('https://api.example.com/*');
    expect(httpPatternFor('https://api.example.com/')).toBe('https://api.example.com/*');
  });

  it('drops the query string: the grant is compared against the resolved PATH', () => {
    expect(httpPatternFor('https://api.example.com/v1/orders?since=today')).toBe(
      'https://api.example.com/v1/orders*',
    );
  });

  it('says nothing about a URL that is not one yet', () => {
    expect(httpPatternFor('')).toBe('');
    expect(httpPatternFor('not a url')).toBe('');
  });
});

describe('a `command` grant can FIX part of the payload (hub#1623, flows#66)', () => {
  const pinned = (): Grant[] => [
    { id: 'g1', kind: 'http', value: 'https://api.example.com/*' },
    {
      id: 'g2',
      kind: 'command',
      value: 'appointments.appointments.cancel',
      payload: { channel: 'customer' },
    },
  ];

  it('only a `command` grant can fix values — the hub refuses the WHOLE list otherwise', () => {
    // `flow.invalid_grant_payload`: a pin on a kind that carries no payload is refused at save,
    // and `PUT …/grants` is all-or-nothing, so one offered on the wrong row would lose the lot.
    expect(canPinPayload('command')).toBe(true);
    for (const kind of ['query', 'http', 'notify', 'recipient_query']) {
      expect(canPinPayload(kind)).toBe(false);
    }
  });

  it('carries the pin through a replace — dropping it would WIDEN the permission in silence', () => {
    // `PUT …/grants` is a complete replace, so every save of this screen re-sends every grant.
    // A merge that forgot the pin would turn «may cancel appointments AS THE CUSTOMER» back into
    // «may cancel appointments» the first time the owner touched an unrelated row.
    const merged = mergeGrants(pinned(), [{ kind: 'command', value: 'tasks.task.create' }], []);
    expect(merged).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
      {
        kind: 'command',
        value: 'appointments.appointments.cancel',
        payload: { channel: 'customer' },
      },
      { kind: 'command', value: 'tasks.task.create' },
    ]);
  });

  it('keeps the pin when an unrelated grant is withdrawn', () => {
    expect(mergeGrants(pinned(), [], [{ kind: 'http', value: 'https://api.example.com/*' }])).toEqual(
      [
        {
          kind: 'command',
          value: 'appointments.appointments.cancel',
          payload: { channel: 'customer' },
        },
      ],
    );
  });

  it('a pinned grant is still HELD: the pin narrows a grant, it does not replace it', () => {
    // Mirror of `ux_flow_grant_live`: the identity of a grant stays `(kind, value)`, so a pinned
    // command must not show up as «waiting for your permission» next to its own granted row.
    const doc = readDoc({
      schema_version: 1,
      triggers: [{ kind: 'manual' }],
      steps: [{ id: 's1', kind: 'command', command: 'appointments.appointments.cancel' }],
    });
    expect(missingGrants(doc, pinned())).toEqual([]);
  });

  it('sets the pin on the named grant and leaves every other one, pin included, alone', () => {
    const live: Grant[] = [
      { id: 'g1', kind: 'command', value: 'tasks.task.create', payload: { source: 'whatsapp' } },
      { id: 'g2', kind: 'command', value: 'appointments.appointments.cancel' },
    ];
    expect(
      setGrantPin(live, { kind: 'command', value: 'appointments.appointments.cancel' }, {
        channel: 'customer',
      }),
    ).toEqual([
      { kind: 'command', value: 'tasks.task.create', payload: { source: 'whatsapp' } },
      {
        kind: 'command',
        value: 'appointments.appointments.cancel',
        payload: { channel: 'customer' },
      },
    ]);
  });

  it('an empty pin REMOVES the limit, and sends the old shape rather than an empty object', () => {
    expect(
      setGrantPin(pinned(), { kind: 'command', value: 'appointments.appointments.cancel' }, {}),
    ).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
      { kind: 'command', value: 'appointments.appointments.cancel' },
    ]);
  });

  it('never builds a pin on a kind the hub would refuse it on', () => {
    expect(
      setGrantPin(pinned(), { kind: 'http', value: 'https://api.example.com/*' }, { a: 1 }),
    ).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
      {
        kind: 'command',
        value: 'appointments.appointments.cancel',
        payload: { channel: 'customer' },
      },
    ]);
  });

  it('reads the typed rows with the SAME literal rule as a step parameter', () => {
    // `007` is a postcode and `+34…` is a phone: both stay strings. `7` and `true` become the
    // number and the boolean a command's schema asks for — the pin is compared for EQUALITY, so
    // a string `"7"` against a numeric field would deny every call instead of narrowing it.
    expect(
      readPinRows([
        [' channel ', 'customer'],
        ['code', '007'],
        ['seats', '7'],
        ['confirmed', 'true'],
      ]),
    ).toEqual({ channel: 'customer', code: '007', seats: 7, confirmed: true });
  });

  it('a half-typed row asks for NOTHING: a nameless field would pin nothing and read as a limit', () => {
    expect(readPinRows([['', 'customer'], ['   ', 'x']])).toEqual({});
  });

  it('shows the stored pin back as the rows that produced it, and round-trips', () => {
    const grant: Grant = {
      kind: 'command',
      value: 'appointments.appointments.cancel',
      payload: { channel: 'customer', seats: 7, confirmed: true, code: '007' },
    };
    expect(pinRows(grant)).toEqual([
      ['channel', 'customer'],
      ['seats', '7'],
      ['confirmed', 'true'],
      ['code', '007'],
    ]);
    expect(readPinRows(pinRows(grant))).toEqual(grant.payload);
  });

  it('a grant with no pin has no rows to show', () => {
    expect(pinRows({ kind: 'command', value: 'tasks.task.create' })).toEqual([]);
    expect(pinRows({ kind: 'command', value: 'tasks.task.create', payload: {} })).toEqual([]);
  });

  it('round-trips a pin the API holds that this screen cannot compose by typing', () => {
    // A pin set through the API can be any JSON. Rendering it as text and reading it back as a
    // STRING would rewrite it into something that matches nothing — the owner would open the
    // screen, save an unrelated row, and their containment would quietly stop containing.
    const grant: Grant = {
      kind: 'command',
      value: 'sales.sale.void',
      payload: { origin: { channel: 'customer' }, tags: ['a', 'b'] },
    };
    expect(readPinRows(pinRows(grant))).toEqual(grant.payload);
  });
});

// ── The kernel's payload pin, as this UI mirrors it (flows#80) ─────────────────────────────────

describe('a grant that FIXES part of a payload answers about the call, not about the caller', () => {
  const pinned = (pin: Record<string, unknown>) => ({
    kind: 'command',
    value: 'appointments.appointments.cancel',
    payload: pin,
  });

  it('lets through the call that carries the fixed value', () => {
    expect(
      grantAllowsCall(pinned({ channel: 'customer' }), { appointment_id: 'a1', channel: 'customer' }),
    ).toBe(true);
  });

  // 🔴 THE case this mirror exists for. A cancellation «on behalf of the salon» is what the
  // recipe promises it cannot do, and the promise is only real if the grant refuses it.
  it('refuses the call that asks on somebody else’s behalf', () => {
    expect(
      grantAllowsCall(pinned({ channel: 'customer' }), { appointment_id: 'a1', channel: 'staff' }),
    ).toBe(false);
  });

  // `crates/runtime/src/flows/grants.rs` — «omitting it is refused just the same as contradicting
  // it». Without this line the pin would be a formality: `channel` has `"default": "staff"` in the
  // command's schema, so LEAVING IT OUT is precisely how a model gets the wide behaviour.
  it('refuses the call that leaves the fixed field out, because the default is the wide one', () => {
    expect(grantAllowsCall(pinned({ channel: 'customer' }), { appointment_id: 'a1' })).toBe(false);
  });

  it('compares by value, so a nested pin is not fooled by a re-ordered object', () => {
    expect(grantAllowsCall(pinned({ who: { a: 1, b: 2 } }), { who: { b: 2, a: 1 } })).toBe(true);
    expect(grantAllowsCall(pinned({ who: { a: 1 } }), { who: { a: 2 } })).toBe(false);
  });

  // A grant with no pin authorises whatever the command's own schema accepts — the pre-hub#1623
  // shape, and the shape every grant on the fleet still has today.
  it('lets everything through when it fixes nothing', () => {
    expect(grantAllowsCall({ kind: 'command', value: 'x' }, { channel: 'staff' })).toBe(true);
    expect(grantAllowsCall({ kind: 'command', value: 'x', payload: {} }, {})).toBe(true);
  });

  // Only a `command` grant reaches `check_command_grant`, so a `payload` sitting on any other kind
  // fixes NOTHING in the hub. Reading it as a limit here would be this screen inventing a
  // containment the kernel never applies.
  it('ignores a pin on a kind the hub never hands a payload to', () => {
    expect(grantAllowsCall({ kind: 'query', value: 'customers.list', payload: { f_phone: '+1' } }, {})).toBe(
      true,
    );
  });
});
