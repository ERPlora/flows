/**
 * **Everything the owner reads, in words.**
 *
 * The whole reason this module exists is that a business owner will judge an automation by whether
 * they can tell it worked. `{"kind":"condition","when":{"input.total":{"gt":100}}}` does not tell
 * them that; «Se envió el WhatsApp a Marta a las 19:04» does. So every raw value the kernel stores
 * passes through here on its way to a screen.
 *
 * Two rules this file exists to keep:
 *
 * 1. **An event is not a state.** The trigger says «Cuando pase…» and a guard says «Solo sigue
 *    si…». Confusing the two is the nº1 documented mental-model error in trigger-action
 *    programming (Huang & Cakmak, UbiComp 2015), and it is a wording problem, not a layout one.
 * 2. **A guard that does not pass is the flow WORKING.** The kernel ends such a run as `done`
 *    (`flows.md` §1). Calling it a failure in the history sends the owner hunting for a bug that
 *    is not there.
 *
 * Nothing here is translated: it returns i18n KEYS with parameters, and the component resolves
 * them against the module catalogue (ADR-0055).
 */
import type { Step, Trigger } from './flow-doc';
import type { EventFieldShape } from './hub-flows';

/** The component's `t()`, injected so this file stays pure and testable. */
export type Translator = (key: string, params?: Record<string, unknown>) => string;

/** A run row as `GET …/flows/{id}/runs` returns it (only the fields a sentence needs). */
export interface RunRow {
  id?: string;
  status?: string;
  trigger_kind?: string;
  last_error?: string;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  [k: string]: unknown;
}

/** One executed step, as `GET …/flows/runs/{run_id}` returns it. */
export interface RunStepRow {
  step_index?: number;
  step_id?: string;
  kind?: string;
  status?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  started_at?: string | null;
  finished_at?: string | null;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * «3 days», «90 minutes» — the biggest unit that comes out **whole**.
 *
 * It drops to a smaller unit rather than rounding because the number on this card is a promise:
 * an owner who reads «1 hour» and gets 90 minutes stops trusting the screen, and there is no
 * second screen that explains it.
 */
export function describeDelay(seconds: number, t: Translator): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s === 0) return t('ui.delayNone');
  if (s % DAY === 0) return t('ui.delayDays', { count: s / DAY });
  if (s % HOUR === 0) return t('ui.delayHours', { count: s / HOUR });
  if (s % MINUTE === 0) return t('ui.delayMinutes', { count: s / MINUTE });
  return t('ui.delaySeconds', { count: s });
}

/** `"09:30"` → `"30 9 * * *"`. The one schedule an owner asks for without being taught cron. */
export function dailyCron(time: string): string {
  const [h, m] = time.split(':');
  return `${Number(m)} ${Number(h)} * * *`;
}

/**
 * `"30 9 * * *"` → `"09:30"`, and **`null` for anything richer**.
 *
 * Refusing is the point: a `0 9 * * MON-FRI` shown in a time box that can only say «every day»
 * would be silently rewritten to something else the moment the owner touched any other field.
 */
export function readDailyCron(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m, h, dom, mon, dow] = parts;
  if (dom !== '*' || mon !== '*' || dow !== '*') return null;
  if (!/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(h)) return null;
  const mi = Number(m);
  const hi = Number(h);
  if (mi > 59 || hi > 23) return null;
  return `${String(hi).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

/**
 * «Cuando pase…» — what starts this flow.
 *
 * `label` is what the owner picked the event by («Se cobra una venta»); the raw name is the
 * fallback, and it appearing on screen is a signal that this hub knows an event this editor has
 * no words for.
 */
export function describeTrigger(trigger: Trigger, t: Translator, label?: string): string {
  switch (trigger.kind) {
    case 'event':
      return t('ui.triggerEvent', { event: label || trigger.event || '' });
    case 'cron': {
      const time = readDailyCron(trigger.cron ?? '');
      return time ? t('ui.triggerDaily', { time }) : t('ui.triggerCron', { cron: trigger.cron ?? '' });
    }
    case 'at':
      return t('ui.triggerAt', { when: trigger.at ?? '' });
    default:
      return t('ui.triggerManual');
  }
}

/** The one line on a step card. */
export function describeStep(step: Step, t: Translator): string {
  switch (step.kind) {
    case 'command': {
      const command = typeof step.command === 'string' ? step.command.trim() : '';
      return command ? t('ui.stepCommand', { command }) : t('ui.stepCommandEmpty');
    }
    case 'condition':
      return t('ui.stepGuard', { count: Object.keys(step.when ?? {}).length });
    case 'delay':
      return describeDelay(Number(step.seconds ?? 0), t);
    default:
      // `http`, `ai` and `notify` are real kernel steps this editor does not edit yet. Saying so is
      // the honest half of opening the document at all.
      return t('ui.stepUnsupported', { kind: step.kind });
  }
}

/** How a run reads at a glance, and in what colour. */
export function runOutcome(
  run: RunRow,
  t: Translator,
): { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral' } {
  switch (run.status) {
    case 'done':
      return { label: t('ui.runDone'), tone: 'success' };
    case 'failed':
      return { label: t('ui.runFailed'), tone: 'danger' };
    case 'sleeping':
      return { label: t('ui.runSleeping'), tone: 'warning' };
    case 'waiting_approval':
      return { label: t('ui.runWaitingApproval'), tone: 'warning' };
    case 'cancelled':
      return { label: t('ui.runCancelled'), tone: 'neutral' };
    default:
      return { label: t('ui.runRunning'), tone: 'neutral' };
  }
}

/**
 * One line of «what the hub actually did».
 *
 * `spec` is the step as the DOCUMENT declares it, because the executed row does not carry the
 * command name — the kernel stores the resolved input, not the definition.
 */
export function describeRunStep(row: RunStepRow, t: Translator, spec?: Step): string {
  if (row.status === 'failed') {
    return t('ui.ranFailed', { reason: row.error || t('ui.ranFailedUnknown') });
  }
  if (row.kind === 'condition') {
    const matched = (row.output as { matched?: boolean } | undefined)?.matched;
    return matched === false ? t('ui.ranGuardStopped') : t('ui.ranGuardPassed');
  }
  if (row.kind === 'delay') {
    const wake = (row.output as { wake_at?: string } | undefined)?.wake_at;
    return row.status === 'sleeping' && wake
      ? t('ui.ranWaitingUntil', { when: wake })
      : t('ui.ranWaited');
  }
  if (row.kind === 'command') {
    const command = typeof spec?.command === 'string' ? spec.command : '';
    return command ? t('ui.ranCommand', { command }) : t('ui.ranCommandUnnamed');
  }
  return t('ui.ranStep', { kind: row.kind ?? '' });
}

/**
 * `customer.first_name` → `Customer › First name`.
 *
 * The path is what the kernel resolves; this is what the owner reads. It is a mechanical
 * transformation on purpose — the alternative is a translated dictionary of every field of every
 * module, which would be wrong for exactly the fields nobody thought of.
 */
export function humaniseField(path: string): string {
  if (!path) return '';
  return path
    .split('.')
    .map((segment) => {
      const words = segment.replace(/_/g, ' ').trim();
      return words.charAt(0).toUpperCase() + words.slice(1);
    })
    .join(' › ');
}

/**
 * The example beside a field: **a real value from this hub**, which is what turns «pick a field»
 * into «pick this one, it says 42,50 €».
 *
 * Three answers and no fourth: the value, the reason it is missing, or nothing at all for a shape
 * that has no single value to show. A withheld example is `redacted` — the field is still offered,
 * because the editor needs `customer.email` to exist even though nobody needs to see a customer's
 * address to map it (hub#715).
 */
export function describeSample(field: EventFieldShape, t: Translator): string {
  if (field.redacted) return t('ui.pickFieldRedacted');
  if (field.type === 'object' || field.type === 'array') return '';
  if (field.sample === undefined || field.sample === null) return '';
  const text = typeof field.sample === 'string' ? field.sample : JSON.stringify(field.sample);
  return field.truncated ? `${text}…` : text;
}
