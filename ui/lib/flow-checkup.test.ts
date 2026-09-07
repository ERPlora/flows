import { describe, it, expect } from 'vitest';
import {
  ECHO_AND_BACKLOG,
  WHATSAPP_MESSAGE_EVENT,
  WHATSAPP_MODULE_MESSAGE_EVENT,
  flowProblems,
  repairedDefinition,
} from './flow-checkup';
import { TEMPLATES, buildTemplate } from './templates';

const t = (key: string): string => key;

/**
 * **The document the gallery wrote before flows v0.1.33** — copied out of the diff of `3eceac0`
 * («La galería ofrece la automatización de WhatsApp ya arreglada»), which replaced exactly this
 * one-clause filter with the three-clause one. This literal is the whole reason this file exists:
 * it is what is sitting in `_flow` today on every hub whose owner tapped «Usar esta» before that
 * commit, and no gallery change can reach it.
 */
type StoredDoc = {
  schema_version: number;
  triggers: {
    kind: string;
    event: string;
    filter: Record<string, Record<string, unknown>>;
    input: Record<string, string>;
  }[];
  steps: Record<string, unknown>[];
};

const documentBeforeTheFix = (): StoredDoc => ({
  schema_version: 1,
  triggers: [
    {
      kind: 'event',
      event: WHATSAPP_MESSAGE_EVENT,
      filter: { 'event.text': { neq: '' } },
      input: { from: 'event.from', text: 'event.text' },
    },
  ],
  steps: [
    { id: 'know_the_customer', kind: 'ai', prompt: 'the owner may have reworded this' },
    { id: 'tell_her', kind: 'notify', channel: 'whatsapp' },
  ],
});

/**
 * **The task card of flows#67, as it is sitting in `_flow` on every hub that installed it.**
 *
 * Same flaw, one hop further away: this one waits on the MODULE's event rather than the core's,
 * and the module re-emits the core payload verbatim (a manifest listener has no mapping layer), so
 * it inherits the owner's echo and Meta's backlog just the same. Fixing the card in the gallery
 * reaches nobody who already tapped «Usar esta» — this is what reaches them.
 */
const taskDocumentBeforeTheFix = (): StoredDoc => ({
  schema_version: 1,
  triggers: [
    {
      kind: 'event',
      event: WHATSAPP_MODULE_MESSAGE_EVENT,
      filter: {},
      input: {},
    },
  ],
  steps: [{ id: 's1', kind: 'command', command: 'tasks.tasks.create' }],
});

describe('the task card that opens a job for every message (flows#67)', () => {
  it('is reported too — the module’s event carries the same echo and the same backlog', () => {
    expect(flowProblems(taskDocumentBeforeTheFix()).map((p) => p.id)).toEqual([ECHO_AND_BACKLOG]);
  });

  it('is NOT reported on the document the gallery builds today', () => {
    const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-answer');
    expect(flowProblems(buildTemplate(template!, t))).toEqual([]);
  });

  it('is repaired with `neq`, so a hub that sends neither field keeps firing', () => {
    const repaired = repairedDefinition(taskDocumentBeforeTheFix(), ECHO_AND_BACKLOG) as any;
    expect(repaired.triggers[0].filter).toEqual({
      'event.direction': { neq: 'outbound' },
      'event.source': { neq: 'history' },
    });
  });

  it('leaves alone an automation waiting on some other event of the same module', () => {
    const doc = {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'whatsapp_inbox.request.created', filter: {} }],
      steps: [],
    };
    expect(flowProblems(doc)).toEqual([]);
  });
});

describe('the automation that answers the echo and the backlog', () => {
  it('is reported on a document created before the gallery was fixed', () => {
    const problems = flowProblems(documentBeforeTheFix());
    expect(problems.map((p) => p.id)).toEqual([ECHO_AND_BACKLOG]);
  });

  /**
   * The positive control's other half: the cards the gallery hands out TODAY must come back clean,
   * or the screen nags every owner who did nothing wrong. Read from the real catalogue and not
   * from a copy, so a revert of the filter fails here too.
   */
  it('is NOT reported on the documents the gallery builds today', () => {
    for (const template of TEMPLATES) {
      expect(flowProblems(buildTemplate(template, t)), template.id).toEqual([]);
    }
  });

  it('is reported when only one of the two clauses is there', () => {
    const doc = documentBeforeTheFix();
    doc.triggers[0].filter = { 'event.text': { neq: '' }, 'event.direction': { neq: 'outbound' } };
    expect(flowProblems(doc).map((p) => p.id)).toEqual([ECHO_AND_BACKLOG]);
  });

  /**
   * An owner who wrote her own guard on those paths is left alone, whatever operator she chose.
   * The screen's job is to name an automation nobody ever guarded, not to grade the guard: a
   * warning on a flow whose owner already dealt with this is a warning she learns to dismiss.
   */
  it('is not reported when the owner already filters on both paths', () => {
    const doc = documentBeforeTheFix();
    doc.triggers[0].filter = {
      'event.direction': { eq: 'inbound' },
      'event.source': { in: ['live'] },
    };
    expect(flowProblems(doc)).toEqual([]);
  });

  it('does not count a path whose clause carries no operator at all', () => {
    const doc = documentBeforeTheFix();
    doc.triggers[0].filter = { 'event.direction': {}, 'event.source': {} };
    expect(flowProblems(doc).map((p) => p.id)).toEqual([ECHO_AND_BACKLOG]);
  });

  it('says nothing about an automation that waits on another event', () => {
    const doc = documentBeforeTheFix();
    doc.triggers[0].event = 'sale.completed';
    expect(flowProblems(doc)).toEqual([]);
  });

  it('says nothing about a document with no triggers, or none at all', () => {
    expect(flowProblems({ schema_version: 1, triggers: [], steps: [] })).toEqual([]);
    expect(flowProblems(undefined)).toEqual([]);
    expect(flowProblems({ triggers: 'not a list' })).toEqual([]);
  });

  it('carries the words the screen shows, as keys and never as prose', () => {
    const [problem] = flowProblems(documentBeforeTheFix());
    expect(problem.titleKey.startsWith('ui.')).toBe(true);
    expect(problem.bodyKey.startsWith('ui.')).toBe(true);
    expect(problem.fixKey.startsWith('ui.')).toBe(true);
  });
});

describe('repairing it', () => {
  /**
   * 🔴 The rule this whole repair turns on (`hub/crates/runtime/src/flows/def.rs`: `Op::Neq =>
   * !json_eq(actual, expected)` and `json_eq` answering false the moment either side is null).
   *
   * An absent path resolves to `Null`, so an affirmative clause — `direction eq inbound` — matches
   * NOTHING on a hub whose core does not send `direction` yet, and the automation stops firing
   * with no run, no error and no log: the owner's WhatsApp goes quiet and she finds out from a
   * customer. Written as `neq`, `Null` passes, which is exactly the traffic such a core serves.
   * So the repair EXCLUDES what is bad and never REQUIRES what is good.
   */
  it('excludes the bad instead of requiring the good — `neq`, never `eq`', () => {
    const repaired = repairedDefinition(documentBeforeTheFix(), ECHO_AND_BACKLOG);
    const filter = (repaired as any).triggers[0].filter;
    expect(filter['event.direction']).toEqual({ neq: 'outbound' });
    expect(filter['event.source']).toEqual({ neq: 'history' });
  });

  it('adds only what was missing and leaves the rest of the document untouched', () => {
    const before = documentBeforeTheFix();
    const repaired = repairedDefinition(before, ECHO_AND_BACKLOG) as any;
    expect(repaired.triggers[0].filter['event.text']).toEqual({ neq: '' });
    expect(repaired.triggers[0].input).toEqual(before.triggers[0].input);
    expect(repaired.steps).toEqual(before.steps);
    expect(repaired.schema_version).toBe(1);
  });

  it('keeps the clause the owner wrote herself', () => {
    const doc = documentBeforeTheFix();
    doc.triggers[0].filter = { 'event.direction': { eq: 'inbound' } };
    const repaired = repairedDefinition(doc, ECHO_AND_BACKLOG) as any;
    expect(repaired.triggers[0].filter['event.direction']).toEqual({ eq: 'inbound' });
    expect(repaired.triggers[0].filter['event.source']).toEqual({ neq: 'history' });
  });

  it('never writes back into the document it was handed', () => {
    const before = documentBeforeTheFix();
    repairedDefinition(before, ECHO_AND_BACKLOG);
    expect(before.triggers[0].filter).toEqual({ 'event.text': { neq: '' } });
  });

  it('answers null when there is nothing to repair, so no pointless save is sent', () => {
    expect(repairedDefinition(buildTemplate(TEMPLATES[0], t), ECHO_AND_BACKLOG)).toBeNull();
    expect(repairedDefinition(documentBeforeTheFix(), 'some_other_problem')).toBeNull();
  });

  it('leaves a repaired document reporting nothing, so the warning goes away', () => {
    const repaired = repairedDefinition(documentBeforeTheFix(), ECHO_AND_BACKLOG);
    expect(flowProblems(repaired)).toEqual([]);
  });
});
