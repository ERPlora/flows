import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The schedule of a `cron` trigger, and the data loss it used to cause** (flows#77).
 *
 * Until this file existed the panel drew ONE control for every schedule there is: an
 * `<input type="time">` whose value was `readDailyCron(cron)` — `null` for anything richer than
 * «every day at H:MM» — and whose `@change` wrote `dailyCron(value)`, which is always `M H * * *`.
 *
 * So «every Friday at 18:00» (`0 18 * * 5`, the schedule the `friday-week-review` template is
 * born with) showed an EMPTY time box, and the first time its owner typed the hour they meant to
 * change, the `* * 5` became `* * *`: the automation stopped being weekly and started running
 * every single day, with no warning and nothing to undo it. The owner thought they were moving
 * the hour and they moved how often it runs.
 *
 * Both halves are pinned here, because either one alone passes with the bug still in:
 *
 *   1. **reading** — opening a weekly flow fills the box with the hour it really has;
 *   2. **writing** — changing the hour keeps the day of the week.
 *
 * A test that only looked at the daily case went green throughout the whole life of the bug.
 *
 * The third half is the one that keeps this closed for schedules the controls still cannot draw
 * — a range of weekdays, a step, a list of days of the month: those get NO editing controls at
 * all, so there is nothing to touch that could flatten them. Replacing one is a labelled button,
 * not a side effect.
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 1,
  fields: [{ path: 'total', type: 'string', sample: '1', redacted: false, truncated: false, seen_in: 1 }],
};

function fakeClient() {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      run: vi.fn(async () => ({})),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      secrets: vi.fn(async () => []),
      approvals: vi.fn(async () => []),
    },
    events: {
      shape: vi.fn(async () => SHAPE),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

/** Mounted with a real cron trigger and the trigger panel OPEN, the way an owner finds it. */
async function openSchedule(cron: string): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: true,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'cron', cron }],
      steps: [{ id: 'a', kind: 'delay', seconds: 60 }],
    },
  } as never;
  document.body.appendChild(el);
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
  (el.renderRoot.querySelector('[data-node="trigger"] button.open') as HTMLButtonElement).click();
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
  return el;
}

const field = <T extends Element>(el: ErpFlowsEditor, name: string): T | null =>
  el.renderRoot.querySelector(`[data-node="trigger"] [data-field="${name}"]`) as T | null;

/** What a `<select>` really shows on first paint: the child carrying `selected`. */
const chosen = (el: ErpFlowsEditor, name: string): string | null => {
  const option = field<HTMLSelectElement>(el, name)?.querySelector(
    'option[selected]',
  ) as HTMLOptionElement | null;
  return option ? option.value : null;
};

/** The cron the document holds right now — the only thing that reaches the hub. */
const cronOf = (el: ErpFlowsEditor): string =>
  ((el as unknown as { document: { triggers: { cron?: string }[] } }).document.triggers[0].cron ??
    '') as string;

const change = async (el: ErpFlowsEditor, name: string, value: string): Promise<void> => {
  const input = field<HTMLInputElement | HTMLSelectElement>(el, name)!;
  input.value = value;
  input.dispatchEvent(new Event('change'));
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
};

describe('a weekly schedule survives being edited (flows#77)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows the hour a weekly automation really has, instead of an empty box', async () => {
    const el = await openSchedule('0 18 * * 5');
    expect(field<HTMLInputElement>(el, 'trigger-time')?.value).toBe('18:00');
  });

  it('opens a weekly automation on «every week» and on ITS day', async () => {
    const el = await openSchedule('0 18 * * 5');
    expect(chosen(el, 'cron-every')).toBe('week');
    expect(chosen(el, 'cron-weekday')).toBe('5');
  });

  it('changing the hour of a weekly automation keeps the day of the week', async () => {
    // The whole issue in one line: this used to write `30 19 * * *` and the Friday review
    // started arriving every day of the week.
    const el = await openSchedule('0 18 * * 5');
    await change(el, 'trigger-time', '19:30');
    expect(cronOf(el)).toBe('30 19 * * 5');
  });

  it('changing the day of a weekly automation keeps the hour', async () => {
    const el = await openSchedule('0 18 * * 5');
    await change(el, 'cron-weekday', '1');
    expect(cronOf(el)).toBe('0 18 * * 1');
  });

  it('still edits a plain daily schedule, hour only', async () => {
    const el = await openSchedule('0 9 * * *');
    expect(chosen(el, 'cron-every')).toBe('day');
    expect(field<HTMLInputElement>(el, 'trigger-time')?.value).toBe('09:00');
    await change(el, 'trigger-time', '07:15');
    expect(cronOf(el)).toBe('15 7 * * *');
  });

  it('reads and writes a monthly schedule by day of the month', async () => {
    const el = await openSchedule('0 8 1 * *');
    expect(chosen(el, 'cron-every')).toBe('month');
    expect(chosen(el, 'cron-monthday')).toBe('1');
    await change(el, 'cron-monthday', '15');
    expect(cronOf(el)).toBe('0 8 15 * *');
  });

  it('switching «every day» to «every week» keeps the hour and picks a real day', async () => {
    const el = await openSchedule('0 9 * * *');
    await change(el, 'cron-every', 'week');
    expect(cronOf(el)).toMatch(/^0 9 \* \* [0-6]$/);
  });

  it('offers the weekday control only when the schedule is weekly', async () => {
    const daily = await openSchedule('0 9 * * *');
    expect(field(daily, 'cron-weekday')).toBeNull();
    expect(field(daily, 'cron-monthday')).toBeNull();
    const weekly = await openSchedule('0 18 * * 5');
    expect(field(weekly, 'cron-weekday')).not.toBeNull();
    expect(field(weekly, 'cron-monthday')).toBeNull();
  });
});

describe('a schedule the screen cannot draw is never rewritten (flows#77)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  // Two shapes the hub runs happily and these controls cannot say: a range of weekdays and a step.
  // Both were flattened to `M H * * *` by the old time box.
  for (const cron of ['0 9 * * MON-FRI', '*/15 * * * *', '0 9 1,15 * *']) {
    it(`draws no editing control for \`${cron}\`, so nothing can flatten it`, async () => {
      const el = await openSchedule(cron);
      expect(field(el, 'trigger-time')).toBeNull();
      expect(field(el, 'cron-every')).toBeNull();
      expect(field(el, 'cron-weekday')).toBeNull();
      expect(field(el, 'cron-monthday')).toBeNull();
      // …and it says out loud what it is keeping, rather than showing an empty box.
      expect(field(el, 'cron-raw')?.textContent).toContain(cron);
      expect(cronOf(el)).toBe(cron);
    });
  }

  it('replaces such a schedule only when the owner presses the button that says so', async () => {
    const el = await openSchedule('0 9 * * MON-FRI');
    const replace = el.renderRoot.querySelector(
      '[data-node="trigger"] [data-act="cron-simplify"]',
    ) as HTMLButtonElement | null;
    expect(replace).not.toBeNull();
    expect(cronOf(el)).toBe('0 9 * * MON-FRI');
    replace!.click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    // Deliberate, and it keeps the hour that was already there — only the «which days» is gone.
    expect(cronOf(el)).toBe('0 9 * * *');
    expect(field(el, 'trigger-time')?.getAttribute('type')).toBe('time');
  });
});
