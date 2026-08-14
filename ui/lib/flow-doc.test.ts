import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  emptyDoc,
  readDoc,
  addStep,
  removeStep,
  moveStep,
  patchStep,
  isPath,
  partsToValue,
  valueToParts,
  requiredGrants,
  missingGrants,
  mergeGrants,
  isSpineKind,
  partsToTemplate,
  httpPatternFor,
} from './flow-doc';

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
  it('draws all SIX kinds the kernel executes (flows#3)', () => {
    // Until flows#3 the last three opened read-only, which meant the owner could see the step and
    // not fix it. All six are editable now; anything else is still a document from a newer editor
    // and must open untouched rather than be rewritten without it.
    for (const kind of ['command', 'condition', 'delay', 'http', 'ai', 'notify']) {
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
