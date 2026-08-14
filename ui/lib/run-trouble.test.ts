import { describe, it, expect } from 'vitest';
import { KERNEL_ERRORS, classify, needsAttention } from './run-trouble';
import type { RunRow } from './plain-language';

describe('what went wrong, in the owner’s words', () => {
  // The control: every code the kernel can write has to come back as something other than the
  // catch-all, or this table is decoration and the screen still shows `flow.grant_denied`.
  it('has an answer for every failure code the kernel writes', () => {
    expect(KERNEL_ERRORS.length).toBeGreaterThan(25);
    for (const code of KERNEL_ERRORS) {
      const trouble = classify(`something: ${code}`);
      expect(trouble.kind, code).not.toBe('unknown');
      expect(trouble.messageKey, code).toMatch(/^ui\.trouble/);
      expect(trouble.actionKey, code).toMatch(/^ui\.troubleDo/);
    }
  });

  it.each([
    ['flow.grant_denied', 'permission'],
    ['flow.invalid_notify_grant', 'permission'],
    ['flow.secret_not_found', 'secret'],
    ['flow.recipient_not_found', 'recipient'],
    ['flow.http_url_invalid', 'reach'],
    ['flow.invalid_cron', 'setup'],
    ['flow.definition_gone', 'gone'],
    ['flow.approval_expired', 'approval'],
  ])('reads %s as a %s problem', (code, kind) => {
    expect(classify(`step s2 failed: ${code}`).kind).toBe(kind);
  });

  /**
   * Anything the kernel did not name is a refusal from the MODULE that ran the command — «no hay
   * stock suficiente», «el cliente no existe». That sentence is the actionable one, so it is not
   * classified away: it becomes the main line, and the owner is not told a generic story about a
   * problem the product does not understand.
   */
  it('leaves a module’s own refusal alone rather than guessing at it', () => {
    const trouble = classify('customers.notes.add: customer 8f2 does not exist');
    expect(trouble.kind).toBe('unknown');
    expect(trouble.messageKey).toBe('');
    expect(trouble.technical).toBe('customers.notes.add: customer 8f2 does not exist');
  });

  it('keeps the technical text whatever it decided, because support asks for it', () => {
    expect(classify('boom: flow.grant_denied').technical).toBe('boom: flow.grant_denied');
  });

  it('says nothing at all about an empty error', () => {
    expect(classify('').kind).toBe('none');
    expect(classify(undefined).kind).toBe('none');
  });
});

describe('which runs are asking for somebody', () => {
  const run = (status: string): RunRow => ({ id: 'r', status });

  it('is the failed ones, and only those', () => {
    expect(needsAttention(run('failed'))).toBe(true);
    for (const ok of ['done', 'running', 'sleeping', 'cancelled', 'waiting_approval']) {
      expect(needsAttention(run(ok)), ok).toBe(false);
    }
  });

  // «Waiting for approval» is somebody's job too, but it is not a FAULT — it has its own tray
  // (`erp-flows-approvals`), and mixing the two would put a healthy automation under a heading
  // that says something is broken.
  it('does not call an automation waiting on a person a fault', () => {
    expect(needsAttention(run('waiting_approval'))).toBe(false);
  });
});
