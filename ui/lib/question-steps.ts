import type { Flow } from './hub-flows';
import type { FlowDoc } from './flow-doc';

/**
 * A step that sends a WhatsApp, as the owner recognises it: the automation it lives in and what
 * it says (flows#118).
 *
 * `stepId` is what the hub puts in `reply_to_step` when a customer answers that message, so it is
 * the VALUE a guard compares; the other two are only the words the dropdown shows.
 */
export interface QuestionStep {
  stepId: string;
  flowName: string;
  text: string;
}

/** The automation open on screen: its unsaved document wins over the copy `flows.list()` holds. */
export interface OpenFlow {
  id: string | undefined;
  name: string;
  doc: FlowDoc;
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** What a WhatsApp step says: the question of an interactive message, its text, or its template. */
function textOf(step: Record<string, unknown>): string {
  const body = obj(obj(step.interactive)?.body);
  return str(body?.text) || str(obj(step.vars)?.text) || str(step.template);
}

function fromSteps(steps: unknown, flowName: string): QuestionStep[] {
  if (!Array.isArray(steps)) return [];
  const out: QuestionStep[] = [];
  for (const raw of steps) {
    const step = obj(raw);
    if (!step || step.kind !== 'notify' || step.channel !== 'whatsapp') continue;
    const stepId = str(step.id);
    if (!stepId) continue;
    out.push({ stepId, flowName, text: textOf(step) });
  }
  return out;
}

/**
 * Every step of this hub that sends a WhatsApp — the only ones a reply can answer.
 *
 * Across ALL the automations, because the question is usually asked by one (the reminder) and the
 * tap handled by another (the one triggered by `hub.whatsapp.message_received`). The open one is
 * read from the screen: a step added a minute ago and not saved yet is still one the owner means.
 */
export function questionSteps(flows: Flow[], open: OpenFlow | null): QuestionStep[] {
  const out: QuestionStep[] = [];
  if (open) out.push(...fromSteps(open.doc.steps, open.name));
  for (const flow of flows) {
    if (open?.id && flow.id === open.id) continue;
    out.push(...fromSteps(obj(flow.definition)?.steps, str(flow.name)));
  }
  return out;
}
