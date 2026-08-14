import { describe, it, expect } from 'vitest';
import {
  EMPTY_VIEW,
  applyView,
  copyName,
  duplicateOf,
  isFiltering,
  searchIndex,
  secretRefs,
  triggerKindOf,
} from './flow-list';
import type { Flow } from './hub-flows';

const flow = (over: Partial<Flow> & { name: string }): Flow => ({
  id: over.id ?? over.name,
  enabled: true,
  definition: {
    schema_version: 1,
    triggers: [{ kind: 'manual' }],
    steps: [],
  },
  ...over,
});

const withTrigger = (name: string, trigger: unknown, steps: unknown[] = []): Flow =>
  flow({ name, definition: { schema_version: 1, triggers: [trigger], steps } });

const FLOWS: Flow[] = [
  withTrigger('Aviso de stock bajo', { kind: 'event', event: 'inventory.stock_changed' }, [
    { id: 'a', kind: 'command', command: 'tasks.tasks.create' },
  ]),
  withTrigger('Resumen del viernes', { kind: 'cron', cron: '0 18 * * 5' }, [
    { id: 'n', kind: 'notify', channel: 'email' },
  ]),
  { ...withTrigger('Nota en ventas grandes', { kind: 'event', event: 'sales.sale.completed' }, [
    { id: 'g', kind: 'condition' },
    { id: 'n', kind: 'command', command: 'customers.notes.add' },
  ]), enabled: false },
  withTrigger('Repasar la agenda', { kind: 'manual' }),
];

describe('what a row is searched BY', () => {
  // The owner types what they remember, and what they remember is not always the name they gave
  // it: «la de las ventas», «customers», «cuando entra un cliente». So the index is the name plus
  // everything about the automation that is a WORD — the event it waits for and the actions it
  // runs. Not the whole document: a step id or a template's `{{input.total}}` matching «total»
  // would put automations in the results for reasons nobody could see on screen.
  it('is the name, the trigger event and the actions it runs', () => {
    const index = searchIndex(FLOWS[0]);
    expect(index).toContain('aviso de stock bajo');
    expect(index).toContain('inventory.stock_changed');
    expect(index).toContain('tasks.tasks.create');
  });

  it('is lower-cased, so the search does not care how it was typed', () => {
    expect(searchIndex(FLOWS[0])).toBe(searchIndex(FLOWS[0]).toLowerCase());
  });
});

describe('the search box', () => {
  it('finds by name, by event and by action, in one box', () => {
    const by = (q: string) => applyView(FLOWS, { ...EMPTY_VIEW, q }).map((f) => f.name);
    expect(by('stock')).toEqual(['Aviso de stock bajo']);
    expect(by('sales.sale')).toEqual(['Nota en ventas grandes']);
    expect(by('customers.notes')).toEqual(['Nota en ventas grandes']);
    expect(by('VIERNES')).toEqual(['Resumen del viernes']);
  });

  it('ignores the spaces around what was typed, and an empty box filters nothing', () => {
    expect(applyView(FLOWS, { ...EMPTY_VIEW, q: '   ' })).toHaveLength(FLOWS.length);
    expect(applyView(FLOWS, { ...EMPTY_VIEW, q: '  stock  ' })).toHaveLength(1);
  });

  it('answers with nothing rather than with everything when nothing matches', () => {
    expect(applyView(FLOWS, { ...EMPTY_VIEW, q: 'zzz' })).toEqual([]);
  });
});

describe('the filters', () => {
  it('separates what is running from what is paused', () => {
    expect(applyView(FLOWS, { ...EMPTY_VIEW, state: 'paused' }).map((f) => f.name)).toEqual([
      'Nota en ventas grandes',
    ]);
    expect(applyView(FLOWS, { ...EMPTY_VIEW, state: 'active' })).toHaveLength(3);
  });

  it('separates the four ways an automation starts', () => {
    const by = (trigger: 'event' | 'cron' | 'manual' | 'at') =>
      applyView(FLOWS, { ...EMPTY_VIEW, trigger }).map((f) => f.name);
    expect(by('event')).toEqual(['Aviso de stock bajo', 'Nota en ventas grandes']);
    expect(by('cron')).toEqual(['Resumen del viernes']);
    expect(by('manual')).toEqual(['Repasar la agenda']);
    expect(by('at')).toEqual([]);
  });

  it('reads a document with no trigger at all as manual, which is what the kernel does', () => {
    expect(triggerKindOf(flow({ name: 'x', definition: { schema_version: 1, steps: [] } }))).toBe(
      'manual',
    );
  });

  it('stack: a search AND a filter, not one or the other', () => {
    expect(
      applyView(FLOWS, { ...EMPTY_VIEW, q: 'a', state: 'paused' }).map((f) => f.name),
    ).toEqual(['Nota en ventas grandes']);
  });

  // What the «clear» button hangs off, and what the empty state says.
  it('knows whether anything is narrowing the list', () => {
    expect(isFiltering(EMPTY_VIEW)).toBe(false);
    expect(isFiltering({ ...EMPTY_VIEW, q: 'a' })).toBe(true);
    expect(isFiltering({ ...EMPTY_VIEW, state: 'paused' })).toBe(true);
    // Sorting is not narrowing: clearing the filters must not silently reorder the list.
    expect(isFiltering({ ...EMPTY_VIEW, sort: 'name' })).toBe(false);
  });
});

describe('the order', () => {
  const stamped: Flow[] = [
    { ...flow({ name: 'Zulu' }), updated_at: '2026-08-01T10:00:00Z' },
    { ...flow({ name: 'alfa' }), updated_at: '2026-08-14T10:00:00Z' },
    { ...flow({ name: 'Bravo' }), updated_at: '2026-08-07T10:00:00Z' },
  ];

  it('puts what was touched last on top, because that is what is being worked on', () => {
    expect(applyView(stamped, { ...EMPTY_VIEW, sort: 'updated' }).map((f) => f.name)).toEqual([
      'alfa',
      'Bravo',
      'Zulu',
    ]);
  });

  it('sorts by name the way a person reads, not the way a byte compares', () => {
    // Plain `<` puts every capital before every lower-case letter, so «Zulu» would come before
    // «alfa» and the list would look shuffled to everybody except a programmer.
    expect(applyView(stamped, { ...EMPTY_VIEW, sort: 'name' }).map((f) => f.name)).toEqual([
      'alfa',
      'Bravo',
      'Zulu',
    ]);
  });

  it('does not throw away a flow the hub never stamped', () => {
    const mixed = [...stamped, flow({ name: 'sin fecha' })];
    expect(applyView(mixed, { ...EMPTY_VIEW, sort: 'updated' })).toHaveLength(4);
    expect(applyView(mixed, { ...EMPTY_VIEW, sort: 'updated' }).at(-1)?.name).toBe('sin fecha');
  });

  it('never mutates the list it was handed', () => {
    const before = stamped.map((f) => f.name);
    applyView(stamped, { ...EMPTY_VIEW, sort: 'name' });
    expect(stamped.map((f) => f.name)).toEqual(before);
  });
});

describe('duplicating one', () => {
  const source: Flow = {
    id: 'f1',
    name: 'Aviso de stock bajo',
    enabled: true,
    updated_at: '2026-08-14T10:00:00Z',
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'inventory.stock_changed' }],
      steps: [{ id: 'a', kind: 'command', command: 'tasks.tasks.create', params: { title: 'x' } }],
    },
  };

  // The one thing a copy must never be. A duplicate that arrives running is an automation acting
  // on the business because somebody wanted to READ it.
  it('is created PAUSED, always, even from one that was running', () => {
    expect(duplicateOf(source, 'Copia de Aviso de stock bajo').enabled).toBe(false);
  });

  it('carries the document over whole, and shares nothing with the original', () => {
    const copy = duplicateOf(source, 'Copia');
    expect(copy.definition).toEqual(source.definition);
    // A shared sub-object would mean editing the copy edits the original in the list.
    expect(copy.definition).not.toBe(source.definition);
    expect((copy.definition as { steps: unknown[] }).steps[0]).not.toBe(
      (source.definition as { steps: unknown[] }).steps[0],
    );
  });

  // Grants, runs and approvals belong to the flow that EARNED them. A copy that arrived holding
  // the original's permissions would be a way to get an automation authorised without anybody
  // authorising it — which is the whole of what the grants system is for.
  it('is a document and a name, and nothing else: no id, no grants, no history', () => {
    expect(Object.keys(duplicateOf(source, 'Copia')).sort()).toEqual([
      'definition',
      'enabled',
      'name',
    ]);
  });

  it('names it «a copy of», and keeps going when that name is taken too', () => {
    const t = (k: string, p?: Record<string, unknown>) =>
      k === 'ui.copyOf' ? `Copia de ${p?.name}` : k;
    expect(copyName('Aviso', [], t)).toBe('Copia de Aviso');
    expect(copyName('Aviso', ['Copia de Aviso'], t)).toBe('Copia de Aviso (2)');
    expect(copyName('Aviso', ['Copia de Aviso', 'Copia de Aviso (2)'], t)).toBe('Copia de Aviso (3)');
  });
});

describe('the secrets a copy points at', () => {
  // A secret is write-only: no endpoint returns a value, so a copy cannot carry one even by
  // accident. What it CAN carry is the reference — and a reference to a credential is a thing the
  // person turning the copy on has to be told about before they do.
  it('are named, so the copy can say what has to be checked before it is switched on', () => {
    const doc = {
      schema_version: 1,
      triggers: [{ kind: 'manual' }],
      steps: [
        {
          id: 'h',
          kind: 'http',
          url: 'https://x.example/hook',
          headers: { Authorization: 'Bearer {{secret.stripe_key}}' },
          body: { token: '{{secret.other}}' },
        },
      ],
    };
    expect(secretRefs(doc as never).sort()).toEqual(['other', 'stripe_key']);
  });

  it('are empty when the automation touches none', () => {
    expect(secretRefs(FLOWS[0].definition as never)).toEqual([]);
  });
});
