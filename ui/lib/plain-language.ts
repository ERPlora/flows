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
import type { Condition, Step, Trigger } from './flow-doc';
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
  if (s % DAY === 0) return plural(t, 'ui.delayDays', s / DAY);
  if (s % HOUR === 0) return plural(t, 'ui.delayHours', s / HOUR);
  if (s % MINUTE === 0) return plural(t, 'ui.delayMinutes', s / MINUTE);
  return plural(t, 'ui.delaySeconds', s);
}

/**
 * One of two keys, by count. `«1 día»` and `«3 días»`, never `«1 día(s)»`.
 *
 * The lazy plural would be on EVERY card of every automation, which is exactly the kind of small
 * sloppiness a shop owner reads as «this was not finished». Only the catalogue knows which word
 * the singular is, so the choice is a key and not a rule in the code.
 */
function plural(t: Translator, base: string, count: number): string {
  return t(count === 1 ? `${base}One` : base, { count });
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
 * A schedule the editor can both DRAW and WRITE BACK whole (flows#77).
 *
 * `weekday` is crontab's own numbering — 0 is Sunday — because that is what travels to the kernel
 * and what a template already carries (`friday-week-review` is born `0 18 * * 5`). Translating it
 * to a local convention here would mean two numbering schemes in one file, and the wrong one
 * would only show up as an automation running on the wrong day.
 */
export type Schedule =
  | { every: 'day'; time: string }
  | { every: 'week'; time: string; weekday: number }
  | { every: 'month'; time: string; monthday: number };

/** `"09:30"` and the fields the kernel wants, in the order it wants them. */
function hhmm(time: string): { m: number; h: number } | null {
  const parts = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!parts) return null;
  const h = Number(parts[1]);
  const m = Number(parts[2]);
  if (h > 23 || m > 59) return null;
  return { m, h };
}

/**
 * `"0 18 * * 5"` → «every week, Friday, 18:00», and **`null` for anything richer**.
 *
 * The refusal is the same one [`readDailyCron`] makes and for the same reason, one shape wider:
 * whatever this cannot read, the editor must not offer to rewrite. `0 9 * * MON-FRI` and
 * `*` with a step are perfectly good schedules the kernel runs — they are simply not something
 * three dropdowns can say without dropping half of the expression on the floor.
 *
 * A day of the month AND a day of the week together (`0 9 1 * 5`) is refused on purpose: crontab
 * ORs those two fields, so it means «the 1st, and also every Friday», which no single control on
 * this screen says.
 */
export function readSchedule(cron: string): Schedule | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m, h, dom, mon, dow] = parts;
  if (mon !== '*') return null;
  if (!/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(h)) return null;
  const at = hhmm(`${h}:${m.padStart(2, '0')}`);
  if (!at) return null;
  const time = `${String(at.h).padStart(2, '0')}:${String(at.m).padStart(2, '0')}`;
  if (dom === '*' && dow === '*') return { every: 'day', time };
  if (dom === '*') {
    if (!/^[0-7]$/.test(dow)) return null;
    // crontab accepts BOTH 0 and 7 for Sunday and the kernel normalises 7 to 0 (scheduler.rs), so
    // reading it as 7 would write back a different-looking expression for the same day.
    return { every: 'week', time, weekday: Number(dow) % 7 };
  }
  if (dow === '*') {
    if (!/^\d{1,2}$/.test(dom)) return null;
    const day = Number(dom);
    if (day < 1 || day > 31) return null;
    return { every: 'month', time, monthday: day };
  }
  return null;
}

/**
 * The hour of a cron whose DAYS this screen cannot draw, or `null` when even that is ambiguous.
 *
 * `0 9 * * MON-FRI` runs at 9:00 on five days; the days are the part no control here can say, but
 * the hour is not in doubt. It is the one thing worth carrying over when an owner deliberately
 * replaces such a schedule with a simple one — everything else about it is what they chose to
 * drop. `0 8,20 * * *` has two hours and `*` has none, so both answer `null` rather than pick one.
 */
export function readCronTime(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const at = hhmm(`${parts[1]}:${parts[0].padStart(2, '0')}`);
  if (!at) return null;
  return `${String(at.h).padStart(2, '0')}:${String(at.m).padStart(2, '0')}`;
}

/** The expression the kernel parses for a schedule [`readSchedule`] understood. */
export function scheduleCron(schedule: Schedule): string {
  const at = hhmm(schedule.time) ?? { m: 0, h: 9 };
  const dom = schedule.every === 'month' ? String(schedule.monthday) : '*';
  const dow = schedule.every === 'week' ? String(schedule.weekday) : '*';
  return `${at.m} ${at.h} ${dom} * ${dow}`;
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
      // Raw cron on a card is the fallback, not the plan: a schedule this screen can edit is a
      // schedule it can also say out loud (flows#77).
      const schedule = readSchedule(trigger.cron ?? '');
      if (schedule?.every === 'day') return t('ui.triggerDaily', { time: schedule.time });
      if (schedule?.every === 'week')
        return t('ui.triggerWeekly', {
          day: t(`ui.weekday${schedule.weekday}`),
          time: schedule.time,
        });
      if (schedule?.every === 'month')
        return t('ui.triggerMonthly', { day: schedule.monthday, time: schedule.time });
      return t('ui.triggerCron', { cron: trigger.cron ?? '' });
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
    case 'condition': {
      const count = Object.keys(step.when ?? {}).length;
      // «Se cumplen 0 condiciones» is a guard nobody wrote on purpose: it lets everything through.
      // The card asks for the missing half instead of describing an empty one.
      return count === 0 ? t('ui.stepGuardEmpty') : plural(t, 'ui.stepGuard', count);
    }
    case 'delay':
      return describeDelay(Number(step.seconds ?? 0), t);
    case 'http': {
      const url = typeof step.url === 'string' ? step.url.trim() : '';
      const method = String(step.method ?? 'GET');
      if (!url) return t('ui.stepHttpEmpty');
      // The HOST is what an owner recognises and what decides whether the step is safe. The rest of
      // the URL is syntax, and syntax on a card that should read as a sentence is what makes people
      // stop reading cards. A templated host says the honest thing instead of printing braces.
      const host = hostOf(url);
      return host
        ? t('ui.stepHttp', { method, host })
        : t('ui.stepHttpTemplatedHost', { method });
    }
    case 'ai': {
      const prompt = typeof step.prompt === 'string' ? step.prompt.trim() : '';
      if (!prompt) return t('ui.stepAiEmpty');
      // Whether it ASKS is the only thing that matters about an `ai` step on a one-line card: one
      // of these two sentences means a model writes to the business unattended and the other does
      // not. `manual` is the kernel's default, so no policy reads as «it asks».
      const key = step.policy === 'auto' ? 'ui.stepAiAuto' : 'ui.stepAiManual';
      return t(key, { prompt: shorten(inWords(prompt)) });
    }
    case 'notify': {
      const field = step.to?.field;
      if (!step.to?.query || !field) return t('ui.stepNotifyEmpty');
      // The channel goes in the KEY, not in a parameter: «Sends a WhatsApp» and «Sends an email»
      // are different sentences in Spanish, and one of the two costs money every time it runs.
      const key = step.channel === 'whatsapp' ? 'ui.stepNotifyWhatsapp' : 'ui.stepNotifyEmail';
      return t(key, { field: humaniseField(String(field)) });
    }
    case 'query': {
      const query = typeof step.query === 'string' ? step.query.trim() : '';
      if (!query) return t('ui.stepQueryEmpty');
      // «Looks up» and «counts» are different sentences because they leave different things
      // behind: a row's fields, or only a number. No `result` is the kernel's `first`.
      return t(step.result === 'count' ? 'ui.stepQueryCount' : 'ui.stepQuery', { query });
    }
    case 'approval': {
      const title = typeof step.title === 'string' ? step.title.trim() : '';
      if (!title) return t('ui.stepApprovalEmpty');
      // WHO is asked is the one thing that matters on the card next to the question: a role, or
      // — no assignee — whoever administers the hub. Never an empty role.
      const role = step.assignee?.role?.trim() ?? '';
      const question = shorten(inWords(title));
      return role
        ? t('ui.stepApproval', { title: question, role })
        : t('ui.stepApprovalAdmins', { title: question });
    }
    default:
      // Not dead code: it is what keeps a document written by a NEWER editor openable, instead of
      // silently rewritten without the step this one could not draw.
      return t('ui.stepUnsupported', { kind: step.kind });
  }
}

/** The host of a URL, or `''` when the host itself is a template (or it is not a URL yet). */
function hostOf(url: string): string {
  const stable = url.indexOf('{{') < 0 ? url : url.slice(0, url.indexOf('{{'));
  try {
    const parsed = new URL(stable);
    return /[{}]/.test(parsed.host) ? '' : parsed.host;
  } catch {
    return '';
  }
}

/**
 * `«…de {{input.customer.name}}»` → `«…de Customer › Name»`.
 *
 * The pills inside the editor never show a brace; the CARD did, and the card is the one line most
 * people ever read. Raw syntax on screen is the documented failure this module is written against
 * (Make: *«staring at raw data structures without much context»*).
 */
function inWords(text: string): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_all, path: string) =>
    humaniseField(String(path).replace(/^(input|event|steps|secret)\./, '')),
  );
}

/** A prompt on a card, cut at a word so the card stays a card. */
function shorten(text: string, max = 70): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
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
    if (matched !== false) return t('ui.ranGuardPassed');
    // The kernel stores only `{matched: false}`, so WHAT was checked comes from the document. With
    // three guards in a row, the same sentence for all of them left the owner counting positions
    // (flows#163). Every clause is named: they are an AND and the kernel does not say which failed.
    const clauses = spec?.kind === 'condition' ? guardClauses(spec.when, t) : [];
    return clauses.length ? t('ui.ranGuardStoppedOn', { conditions: clauses.join('; ') }) : t('ui.ranGuardStopped');
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
  // Zero rows is the flow WORKING (hub#954): the run carries on with `found: false` and a guard
  // decides. Said as «found nothing», never as a failure.
  if (row.kind === 'query') {
    const output = row.output as { found?: boolean; count?: number } | undefined;
    return output?.found ? t('ui.ranQueryFound', { count: output.count ?? 0 }) : t('ui.ranQueryNothing');
  }
  // Three terminal answers and one open state. `expired` is a DECIDED status in the kernel
  // (hub#972): the question is closed, not still hanging.
  if (row.kind === 'approval') {
    const decision = (row.output as { decision?: string } | undefined)?.decision;
    if (decision === 'approved') return t('ui.ranApprovalApproved');
    if (decision === 'rejected') return t('ui.ranApprovalRejected');
    if (decision === 'expired') return t('ui.ranApprovalExpired');
    return t('ui.ranApprovalWaiting');
  }
  // A notice with nothing to offer queues nothing (hub#1651): the step is `stopped` and the run
  // ends `done`. It must never read as sent — the owner would think the customer got it.
  if (row.kind === 'notify') {
    const output = row.output as { queued?: boolean; channel?: string; reason?: string } | undefined;
    if (output?.queued === true) {
      return output.channel === 'email' ? t('ui.ranNotifyQueuedEmail') : t('ui.ranNotifyQueuedWhatsapp');
    }
    // Only the kernel's own `queued: false` means nothing left. A `committed` row with no output is
    // a message that WAS queued and lost its output to a restart: that is not «not sent».
    if (output?.queued === false) {
      return output.reason === 'flow.nothing_to_offer' ? t('ui.ranNothingToOffer') : t('ui.ranNotifyNotSent');
    }
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
 * **The handful of fields that are the CORE's contract, said the way an owner says them.**
 *
 * {@link humaniseField} stays the rule for everything else, and deliberately: a translated
 * dictionary of every field of every module would be wrong for exactly the fields nobody thought
 * of. But it turns `reply_id` into «Reply id», and these are not somebody's column — they are
 * what the kernel promises a tap comes home as (hub#1633, hub#1673, hub#1951), the same argument
 * that gives an event a hand-written phrase in `event-phrasing.ts` instead of a composed one.
 *
 * `reply_to_step` earns its phrase twice over: mechanically it reads «Reply to step», which says
 * the opposite of what it means — it is not a step being replied to, it is the step that ASKED.
 * `reply_to_flow` (hub#1962) is its automation, for the same reason.
 */
const FIELD_PHRASES: Readonly<Record<string, string>> = {
  reply_id: 'ui.fieldReplyId',
  reply_title: 'ui.fieldReplyTitle',
  reply_to: 'ui.fieldReplyTo',
  reply_to_step: 'ui.fieldReplyToStep',
  reply_to_flow: 'ui.fieldReplyToFlow',
  // hub#2675 — the call's own repeat-protection key; mechanically «Run › Idempotency key».
  'run.idempotency_key': 'ui.fieldRunIdempotencyKey',
};

export function fieldPhrase(path: string, t: Translator): string {
  const key = FIELD_PHRASES[path];
  return key ? t(key) : humaniseField(path);
}

/** A guard's field as the editor's pill shows it: `steps.week.found` → «Week › Found». */
export function guardFieldPhrase(path: string, t: Translator): string {
  return fieldPhrase(path.replace(/^(input|event|steps)\./, ''), t);
}

/**
 * Each comparison of a guard as one line: «Customer phone: not equal to (empty)».
 *
 * The same three parts the editor's row shows — field, operator, value — so the history and the
 * editor name a guard the same way. `exists` carries no value worth reading: `true` is «present»
 * and `false` is its own word, never «present false».
 */
function guardClauses(when: Condition | undefined, t: Translator): string[] {
  const out: string[] = [];
  for (const [path, ops] of Object.entries(when ?? {})) {
    for (const [op, expected] of Object.entries(ops ?? {})) {
      const field = guardFieldPhrase(path, t);
      if (op === 'exists') {
        const key = expected === false ? 'ui.opAbsent' : 'ui.opExists';
        out.push(t('ui.guardClause', { field, op: t(key), expected: '' }).trimEnd());
        continue;
      }
      const opKey = `ui.op${op.charAt(0).toUpperCase()}${op.slice(1)}`;
      out.push(t('ui.guardClause', { field, op: t(opKey), expected: guardValue(expected, t) }));
    }
  }
  return out;
}

/** The value of a comparison in words: yes/no, «(empty)», a list with commas. */
function guardValue(value: unknown, t: Translator): string {
  if (value === true) return t('ui.clauseYes');
  if (value === false) return t('ui.clauseNo');
  if (value === '' || value === null || value === undefined) return t('ui.clauseEmpty');
  if (Array.isArray(value)) return value.map((v) => guardValue(v, t)).join(', ');
  return typeof value === 'string' ? value : JSON.stringify(value);
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
