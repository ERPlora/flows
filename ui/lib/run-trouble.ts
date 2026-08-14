/**
 * **A failed run, said in words the owner can act on** (flows#20).
 *
 * What the history showed until now was `last_error` exactly as the kernel wrote it —
 * `step s2 failed: flow.grant_denied`. That string is correct, it is in English, and it is a code:
 * the person reading it hours later, who was not there when it happened, learns that something
 * broke and nothing about what to do next. Which is how an automation quietly stays broken.
 *
 * The set below is not guessed. Every entry is one of the `ERR_*` constants in
 * `crates/runtime/src/flows/{executor,grants,…}.rs`, which are the only codes the kernel itself
 * puts into `last_error`. A test asserts the table covers all of them, so a new kernel code that
 * arrives without a sentence here turns something red instead of reaching a screen.
 *
 * **What is deliberately not classified**: anything else. A refusal that is not in this list came
 * from the MODULE whose command ran — «no hay stock suficiente», «el cliente no existe» — and that
 * sentence is the actionable one. Replacing it with a generic story about a problem this product
 * does not understand would be strictly worse than showing it.
 */
import type { RunRow } from './plain-language';

/** How a failure is fixed, which is the only useful way to group them. */
export type TroubleKind =
  | 'none'
  | 'permission'
  | 'secret'
  | 'recipient'
  | 'reach'
  | 'setup'
  | 'gone'
  | 'approval'
  | 'unknown';

export interface Trouble {
  kind: TroubleKind;
  /** i18n key of the sentence. `''` when the module's own words are better than ours. */
  messageKey: string;
  /** i18n key of the next thing to do. `''` when there is nothing honest to suggest. */
  actionKey: string;
  /** The raw text, always. Support asks for it, and it lives behind a fold, never as the headline. */
  technical: string;
}

/**
 * Every code the kernel writes, mapped to how it is fixed.
 *
 * Ordered longest-first at match time so `flow.grant_kind_not_available` cannot be swallowed by
 * `flow.grant_denied`'s neighbour — the codes share prefixes and a naive scan gets it wrong.
 */
const TABLE: Readonly<Record<string, TroubleKind>> = {
  'flow.grant_denied': 'permission',
  'flow.grant_kind_not_available': 'permission',
  'flow.unknown_grant_kind': 'permission',
  'flow.invalid_notify_grant': 'permission',
  'flow.invalid_recipient_grant': 'permission',
  'flow.internal_command': 'permission',

  'flow.secret_not_found': 'secret',
  'flow.secret_not_available': 'secret',
  'flow.secret_unreadable': 'secret',
  'flow.secrets_key_missing': 'secret',
  'flow.invalid_secret_name': 'secret',

  'flow.recipient_not_found': 'recipient',
  'flow.recipient_ambiguous': 'recipient',
  'flow.recipient_invalid': 'recipient',

  'flow.http_url_invalid': 'reach',
  'flow.invalid_http_pattern': 'reach',

  'flow.invalid_cron': 'setup',
  'flow.invalid_at': 'setup',
  'flow.invalid_definition': 'setup',
  'flow.unknown_operator': 'setup',
  'flow.unknown_schema_version': 'setup',
  'flow.step_kind_not_available': 'setup',

  'flow.flow_deleted': 'gone',
  'flow.definition_gone': 'gone',
  'flow.not_found': 'gone',
  'flow.io_step_gone': 'gone',
  'flow.step_output_lost': 'gone',
  'flow.agent_step_not_in_flight': 'gone',

  'flow.approval_expired': 'approval',
  'flow.approval_not_found': 'approval',
  'flow.approval_already_decided': 'approval',
};

/** The codes this table answers for, exported so a test can prove it answers for all of them. */
export const KERNEL_ERRORS: readonly string[] = Object.keys(TABLE);

/** What this failure is, and what to do about it. */
export function classify(lastError: string | undefined): Trouble {
  const technical = (lastError ?? '').trim();
  if (!technical) return { kind: 'none', messageKey: '', actionKey: '', technical: '' };
  // Longest first: the codes share prefixes, and `flow.grant_denied` would otherwise match inside
  // a message that really carried `flow.grant_kind_not_available`.
  const code = KERNEL_ERRORS.slice()
    .sort((a, b) => b.length - a.length)
    .find((candidate) => technical.includes(candidate));
  if (!code) return { kind: 'unknown', messageKey: '', actionKey: '', technical };
  const kind = TABLE[code];
  const suffix = kind.charAt(0).toUpperCase() + kind.slice(1);
  return {
    kind,
    messageKey: `ui.trouble${suffix}`,
    actionKey: `ui.troubleDo${suffix}`,
    technical,
  };
}

/**
 * Is this run asking for a person?
 *
 * `waiting_approval` is somebody's job too, and it is deliberately NOT here: it is not a fault, it
 * has its own tray (`erp-flows-approvals`), and filing it under a heading that says something
 * broke would send the owner looking for a problem that does not exist.
 */
export function needsAttention(run: RunRow): boolean {
  return run.status === 'failed';
}
