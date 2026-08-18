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

  it('names the SITE an http step calls, not the whole URL', () => {
    // The host is the part an owner recognises and the part that decides whether it is safe. A
    // full URL with a template in the middle is a line of syntax on a card that should read as a
    // sentence, and the card is the only place most people ever look.
    expect(
      describeStep({ id: 's1', kind: 'http', method: 'POST', url: 'https://api.stripe.com/v1/x' }, t),
    ).toBe('ui.stepHttp(method=POST,host=api.stripe.com)');
  });

  it('asks for the address instead of announcing a call to nowhere', () => {
    expect(describeStep({ id: 's1', kind: 'http', method: 'GET', url: '' }, t)).toBe(
      'ui.stepHttpEmpty',
    );
  });

  it('says an http step to a templated host is going wherever the payload says', () => {
    expect(describeStep({ id: 's1', kind: 'http', method: 'GET', url: '{{input.url}}' }, t)).toBe(
      'ui.stepHttpTemplatedHost(method=GET)',
    );
  });

  it('says whether an ai step ASKS or just does it — the only thing that matters about one', () => {
    expect(describeStep({ id: 's1', kind: 'ai', prompt: 'Sort out the message', policy: 'manual' }, t)).toBe(
      'ui.stepAiManual(prompt=Sort out the message)',
    );
    expect(describeStep({ id: 's1', kind: 'ai', prompt: 'Sort out the message', policy: 'auto' }, t)).toBe(
      'ui.stepAiAuto(prompt=Sort out the message)',
    );
  });

  it('treats an ai step with no policy as the kernel does: it asks', () => {
    expect(describeStep({ id: 's1', kind: 'ai', prompt: 'Do it' }, t)).toBe('ui.stepAiManual(prompt=Do it)');
  });

  it('NEVER shows braces on the card, not even inside a prompt', () => {
    // Found in a browser: the card read «Resume la venta de {{input.customer.name}}». Raw syntax on
    // screen is the documented failure this module was written against (Make: «staring at raw data
    // structures without much context»), and the pill inside the editor already avoids it — the one
    // line most people ever read was the only place still leaking it.
    const said = describeStep(
      { id: 's1', kind: 'ai', prompt: 'Summarise the sale of {{input.customer.name}} in one line' },
      t,
    );
    expect(said).not.toContain('{{');
    expect(said).not.toContain('input.');
    expect(said).toContain('Customer › Name');
  });

  it('shortens a long prompt on the card instead of letting it become the card', () => {
    const long = 'a'.repeat(200);
    const said = describeStep({ id: 's1', kind: 'ai', prompt: long, policy: 'auto' }, t);
    expect(said.length).toBeLessThan(120);
    expect(said).toContain('…');
  });

  it('asks for the prompt of an ai step that has none', () => {
    expect(describeStep({ id: 's1', kind: 'ai', prompt: '' }, t)).toBe('ui.stepAiEmpty');
  });

  it('says which CHANNEL a notify step uses and who it reads the address from', () => {
    expect(
      describeStep(
        {
          id: 's1',
          kind: 'notify',
          channel: 'whatsapp',
          to: { query: 'customers.customer.get', field: 'phone' },
        },
        t,
      ),
    ).toBe('ui.stepNotifyWhatsapp(field=Phone)');
    expect(
      describeStep(
        { id: 's1', kind: 'notify', channel: 'email', to: { query: 'staff.member.get', field: 'email' } },
        t,
      ),
    ).toBe('ui.stepNotifyEmail(field=Email)');
  });

  it('asks for the recipient of a notify step that has none', () => {
    expect(describeStep({ id: 's1', kind: 'notify', channel: 'email' }, t)).toBe('ui.stepNotifyEmpty');
  });

  it('names the read a query step performs, and whether it wants a row or a number (flows#30)', () => {
    // `first` reads as «looks up X»; `count` reads as «counts X». Both are the deterministic read
    // of hub#954, and which one it is decides what the next step can use.
    expect(
      describeStep({ id: 'w', kind: 'query', query: 'sales.summary', result: 'first' }, t),
    ).toBe('ui.stepQuery(query=sales.summary)');
    expect(describeStep({ id: 'w', kind: 'query', query: 'sales.summary', result: 'count' }, t)).toBe(
      'ui.stepQueryCount(query=sales.summary)',
    );
    // No `result` is the kernel's `first`.
    expect(describeStep({ id: 'w', kind: 'query', query: 'sales.summary' }, t)).toBe(
      'ui.stepQuery(query=sales.summary)',
    );
  });

  it('asks for the read of a query step that has none', () => {
    expect(describeStep({ id: 'w', kind: 'query', query: '' }, t)).toBe('ui.stepQueryEmpty');
  });

  it('reads an approval step as the QUESTION it asks, and who it asks (flows#31)', () => {
    // The title IS the question — the kernel refuses a step without one. Braces never reach the
    // card, exactly as for a prompt.
    expect(
      describeStep(
        { id: 'ok', kind: 'approval', title: 'Approve the order of {{steps.po.supplier_name}}?', assignee: { role: 'manager' } },
        t,
      ),
    ).toBe('ui.stepApproval(title=Approve the order of Po › Supplier name?,role=manager)');
    // No assignee: whoever administers the hub. Said as such, never as an empty role.
    expect(describeStep({ id: 'ok', kind: 'approval', title: 'Go ahead?' }, t)).toBe(
      'ui.stepApprovalAdmins(title=Go ahead?)',
    );
  });

  it('asks for the question of an approval step that has none', () => {
    expect(describeStep({ id: 'ok', kind: 'approval', title: '  ' }, t)).toBe('ui.stepApprovalEmpty');
  });

  it('still refuses to pretend about a step from an editor newer than itself', () => {
    // The fallback is not dead code: it is what keeps a document written by a future editor
    // OPENABLE instead of being silently rewritten without the step it could not draw.
    expect(describeStep({ id: 's1', kind: 'whatever' as never }, t)).toBe(
      'ui.stepUnsupported(kind=whatever)',
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

  it('says whether a query step FOUND anything — zero rows is the flow working, not failing', () => {
    // hub#954: 0 rows is not a fault. The run carries on with `found: false`, and a `condition`
    // decides. History that called that «failed» would send the owner hunting a bug.
    expect(
      describeRunStep({ step_id: 'w', kind: 'query', status: 'done', output: { found: true, count: 3 } }, t),
    ).toBe('ui.ranQueryFound(count=3)');
    expect(
      describeRunStep({ step_id: 'w', kind: 'query', status: 'done', output: { found: false, count: 0 } }, t),
    ).toBe('ui.ranQueryNothing');
  });

  it('says how an approval step was answered — or that it is still waiting (flows#31)', () => {
    // Three terminal answers and one open state. `expired` is a decided status in the kernel: the
    // question is closed, not still hanging.
    const row = (over: Record<string, unknown>) => ({ step_id: 'ok', kind: 'approval', ...over });
    expect(describeRunStep(row({ status: 'done', output: { decision: 'approved', decided_by: 'hub_user:7' } }), t)).toBe(
      'ui.ranApprovalApproved',
    );
    expect(describeRunStep(row({ status: 'done', output: { decision: 'rejected' } }), t)).toBe('ui.ranApprovalRejected');
    expect(describeRunStep(row({ status: 'done', output: { decision: 'expired' } }), t)).toBe('ui.ranApprovalExpired');
    expect(describeRunStep(row({ status: 'running', output: {} }), t)).toBe('ui.ranApprovalWaiting');
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
