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
  it('draws the three kinds this editor owns, and refuses to pretend about the rest', () => {
    // `http` and `ai` are real steps of the kernel; this editor does not edit them yet. A flow
    // that has one must still OPEN — read-only — instead of being silently rewritten without it.
    expect(isSpineKind('command')).toBe(true);
    expect(isSpineKind('condition')).toBe(true);
    expect(isSpineKind('delay')).toBe(true);
    expect(isSpineKind('http')).toBe(false);
    expect(isSpineKind('ai')).toBe(false);
    expect(isSpineKind('notify')).toBe(false);
  });
});
