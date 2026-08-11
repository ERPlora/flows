import { describe, it, expect } from 'vitest';
import {
  describeDelay,
  describeTrigger,
  describeStep,
  runOutcome,
  describeRunStep,
  dailyCron,
  readDailyCron,
  humaniseField,
  describeSample,
} from './plain-language';

// The catalogue is not what is under test — the CHOICE of sentence is. A fake translator that
// echoes the key and its params makes that choice visible and keeps the assertions readable in a
// repo whose UI ships in two languages.
const t = (key: string, params?: Record<string, unknown>): string =>
  params && Object.keys(params).length
    ? `${key}(${Object.entries(params)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(',')})`
    : key;

describe('how long a wait is, said the way a person would say it', () => {
  it('uses the biggest unit that comes out whole', () => {
    expect(describeDelay(259200, t)).toBe('ui.delayDays(count=3)');
    expect(describeDelay(7200, t)).toBe('ui.delayHours(count=2)');
    expect(describeDelay(1800, t)).toBe('ui.delayMinutes(count=30)');
  });

  it('drops to a smaller unit rather than rounding, because «1 hour» must mean one hour', () => {
    expect(describeDelay(5400, t)).toBe('ui.delayMinutes(count=90)');
    expect(describeDelay(90, t)).toBe('ui.delaySeconds(count=90)');
  });

  it('says «no wait» instead of «0 seconds»', () => {
    expect(describeDelay(0, t)).toBe('ui.delayNone');
  });

  it('says «1 día», not «1 día(s)»', () => {
    // The `(s)` of a lazy plural is on EVERY card of every automation. Spanish and English both
    // need a singular form, and the catalogue is the only place that knows which word it is.
    expect(describeDelay(86400, t)).toBe('ui.delayDaysOne(count=1)');
    expect(describeDelay(3600, t)).toBe('ui.delayHoursOne(count=1)');
    expect(describeDelay(60, t)).toBe('ui.delayMinutesOne(count=1)');
  });
});

describe('what starts a flow, in words that separate an EVENT from a STATE', () => {
  // The nº1 documented mental-model error in trigger-action programming is reading a trigger as a
  // condition. The wording carries the difference: «when this happens» vs «only if».
  it('names the event with the label the owner picked it by, never its raw name', () => {
    expect(describeTrigger({ kind: 'event', event: 'sale.completed' }, t, 'A sale is completed')).toBe(
      'ui.triggerEvent(event=A sale is completed)',
    );
  });

  it('falls back to the raw name only when this hub has no label for it', () => {
    expect(describeTrigger({ kind: 'event', event: 'x.y' }, t)).toBe('ui.triggerEvent(event=x.y)');
  });

  it('reads a plain daily schedule as a time, not as a cron expression', () => {
    expect(describeTrigger({ kind: 'cron', cron: '30 9 * * *' }, t)).toBe(
      'ui.triggerDaily(time=09:30)',
    );
  });

  it('shows a cron it cannot say in words as itself, instead of lying about it', () => {
    expect(describeTrigger({ kind: 'cron', cron: '0 9 * * MON-FRI' }, t)).toBe(
      'ui.triggerCron(cron=0 9 * * MON-FRI)',
    );
  });

  it('says a manual flow is manual, so nobody waits for it to fire on its own', () => {
    expect(describeTrigger({ kind: 'manual' }, t)).toBe('ui.triggerManual');
  });
});

describe('the daily-schedule builder, which is the only cron most owners will ever want', () => {
  it('writes the expression the kernel parses', () => {
    expect(dailyCron('09:30')).toBe('30 9 * * *');
    expect(dailyCron('00:05')).toBe('5 0 * * *');
  });

  it('reads one back, and refuses anything richer so the simple UI never misrepresents it', () => {
    expect(readDailyCron('30 9 * * *')).toBe('09:30');
    expect(readDailyCron('0 9 * * MON-FRI')).toBeNull();
    expect(readDailyCron('*/5 * * * *')).toBeNull();
  });
});

describe('what a step does, said once on the card', () => {
  it('draws a guard as a guard: «only continue if», never as a branch', () => {
    // The kernel has ONE path. A guard that does not pass ENDS the run — it does not take the
    // other branch, because there is no other branch to take.
    expect(describeStep({ id: 's1', kind: 'condition', when: { 'input.total': { gt: 100 } } }, t)).toBe(
      'ui.stepGuardOne(count=1)',
    );
    expect(
      describeStep(
        { id: 's1', kind: 'condition', when: { 'input.total': { gt: 100 }, 'input.paid': { eq: true } } },
        t,
      ),
    ).toBe('ui.stepGuard(count=2)');
  });

  it('asks for the condition instead of announcing «0 conditions»', () => {
    expect(describeStep({ id: 's1', kind: 'condition', when: {} }, t)).toBe('ui.stepGuardEmpty');
  });

  it('names the command a command step runs', () => {
    expect(describeStep({ id: 's1', kind: 'command', command: 'tasks.task.create' }, t)).toBe(
      'ui.stepCommand(command=tasks.task.create)',
    );
  });

  it('says a command step is unfinished instead of showing an empty card', () => {
    expect(describeStep({ id: 's1', kind: 'command', command: '' }, t)).toBe('ui.stepCommandEmpty');
  });

  it('reads a step it cannot edit without pretending it can', () => {
    expect(describeStep({ id: 's1', kind: 'http', url: 'https://x/y' }, t)).toBe(
      'ui.stepUnsupported(kind=http)',
    );
  });
});

describe('what happened, for somebody who wants to know it worked', () => {
  it('turns a run status into a sentence and a colour', () => {
    expect(runOutcome({ status: 'done' }, t)).toEqual({ label: 'ui.runDone', tone: 'success' });
    expect(runOutcome({ status: 'failed', last_error: 'flow.grant_denied' }, t)).toEqual({
      label: 'ui.runFailed',
      tone: 'danger',
    });
    expect(runOutcome({ status: 'sleeping' }, t)).toEqual({ label: 'ui.runSleeping', tone: 'warning' });
    expect(runOutcome({ status: 'running' }, t)).toEqual({ label: 'ui.runRunning', tone: 'neutral' });
  });

  it('says a guard that did not pass is the flow WORKING, not a failure', () => {
    // `flows.md`: a guard that does not pass ends the run as `done`. If the history called that
    // «failed» the owner would go looking for a bug that is not there.
    expect(
      describeRunStep({ step_id: 's1', kind: 'condition', status: 'stopped', output: { matched: false } }, t),
    ).toBe('ui.ranGuardStopped');
    expect(
      describeRunStep({ step_id: 's1', kind: 'condition', status: 'done', output: { matched: true } }, t),
    ).toBe('ui.ranGuardPassed');
  });

  it('says what a command step did, by its name', () => {
    expect(
      describeRunStep({ step_id: 's1', kind: 'command', status: 'committed', input: {} }, t, {
        id: 's1',
        kind: 'command',
        command: 'tasks.task.create',
      }),
    ).toBe('ui.ranCommand(command=tasks.task.create)');
  });

  it('gives the reason a step failed, because that is the only actionable thing on the screen', () => {
    expect(
      describeRunStep({ step_id: 's1', kind: 'command', status: 'failed', error: 'no live grant' }, t),
    ).toBe('ui.ranFailed(reason=no live grant)');
  });
});

describe('a field of an event, named the way a shop owner would name it', () => {
  it('turns a machine path into words', () => {
    expect(humaniseField('total')).toBe('Total');
    expect(humaniseField('customer.first_name')).toBe('Customer › First name');
    expect(humaniseField('lines')).toBe('Lines');
  });

  it('leaves a path it cannot improve alone rather than mangling it', () => {
    expect(humaniseField('')).toBe('');
  });
});

describe('the example beside a field, which is what removes half the doubt', () => {
  it('shows a real value from this hub', () => {
    expect(describeSample({ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 5 }, t)).toBe('42.50');
  });

  it('says WHY there is no example instead of showing an empty gap', () => {
    // The field still exists and is still offered — only the value is withheld (hub#715).
    expect(
      describeSample({ path: 'customer.email', type: 'string', redacted: true, truncated: false, seen_in: 5 }, t),
    ).toBe('ui.pickFieldRedacted');
  });

  it('does not pretend an object or a list has a value', () => {
    expect(describeSample({ path: 'lines', type: 'array', items: 3, redacted: false, truncated: false, seen_in: 5 }, t)).toBe('');
  });
});
