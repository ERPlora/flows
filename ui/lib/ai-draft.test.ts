import { describe, it, expect } from 'vitest';
import {
  contractProblems,
  draftGaps,
  readDraft,
  schemaFacts,
  DRAFT_STEP_KINDS,
} from './ai-draft';
import type { FlowDoc } from './flow-doc';
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
    doc.steps.push({ id: 's3', kind: 'ai', prompt: 'summarise', tools: ['sales.list'] });
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
        { id: 'b', kind: 'ai', prompt: 'x', tools: [] },
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
