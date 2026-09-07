/**
 * **What is wrong with an automation this hub is already running** (flows#63).
 *
 * The gallery hands out a COPY. Nothing links the automation it created back to the card it came
 * from — `FlowInput` is `{name, definition, enabled}` and the document's key list is a strict
 * whitelist mirrored from the kernel's `def.rs`, so there is nowhere to write «this came from
 * version N» and no save that would accept it. Fixing a card therefore reaches everybody who taps
 * it from now on and nobody who already did.
 *
 * That is not a gap in our design: it is what every automation tool does. A Zap keeps working
 * independently of the template it was published from; a Power Automate flow, a Shopify Flow
 * workflow and a Make scenario are the same one-shot copy; and n8n, which does version its nodes,
 * deliberately PINS an existing workflow to the version it was built with. What those tools do
 * instead — Power Automate's flow checker, n8n's deprecation notice on a node, Zapier's «this Zap
 * needs attention» — is tell the owner, on the automation itself, that something in it needs
 * looking at, and let her decide. So that is what this file feeds: a warning on the row and a
 * button, never a silent rewrite of an automation somebody else owns.
 *
 * It follows that a problem is recognised by the SHAPE of the stored document, the same way
 * `flowsOnSameTrigger` recognises a duplicate by its event: an owner who renamed her automation
 * and reworded its prompts still has the flaw, and hers is the one that has been running longest.
 */
import { readDoc } from './flow-doc';
import type { Condition, Trigger } from './flow-doc';

/** The CORE's WhatsApp event (`crates/server/src/inbound_poll.rs`), not the module's. */
export const WHATSAPP_MESSAGE_EVENT = 'hub.whatsapp.message_received';

/** An automation that answers the owner's own replies and Meta's 180 days of backlog. */
export const ECHO_AND_BACKLOG = 'whatsapp_echo_and_backlog';

/** One thing to tell the owner about one automation. Keys, never prose (ADR-0055). */
export interface FlowProblem {
  id: string;
  titleKey: string;
  bodyKey: string;
  /** The label of the button that repairs it. */
  fixKey: string;
}

/**
 * The clauses that keep this automation to what a customer actually wrote, as `path → the value
 * that must NOT come through`.
 *
 * 🔴 **The operator is `neq` and it is not a style choice.** `direction`, `source` and `contact`
 * only reach the event from hub#1621, which no published hub tag carries — `v1.1.15` is the newest
 * and it is the floor `whatsapp_inbox` declares. In the kernel an absent path resolves to `Null`
 * and `json_eq` answers false whenever either side is null (`crates/runtime/src/flows/def.rs`), so
 * an affirmative clause — `direction eq inbound` — matches NOTHING on such a core: no run, no
 * error, no log, and an owner whose WhatsApp went quiet finds out from a customer. Written as
 * `neq`, `Null` passes, which is exactly the traffic that core serves (inbound only, live only).
 * We EXCLUDE what is bad; we never REQUIRE what is good.
 */
const ECHO_GUARDS: readonly (readonly [string, string])[] = [
  ['event.direction', 'outbound'],
  ['event.source', 'history'],
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Has this filter anything at all to say about `path`?
 *
 * Any operator counts, including one we would not have written. The screen's job is to name an
 * automation nobody ever guarded, not to grade the guard: a warning on a flow whose owner already
 * dealt with this is a warning she learns to dismiss. A clause with no operator in it guards
 * nothing, so it does not count.
 */
function isGuarded(filter: Condition | undefined, path: string): boolean {
  const clause = filter?.[path];
  return isRecord(clause) && Object.keys(clause).length > 0;
}

const isWhatsappTrigger = (trigger: Trigger): boolean =>
  trigger?.kind === 'event' && trigger?.event === WHATSAPP_MESSAGE_EVENT;

const answersEchoAndBacklog = (trigger: Trigger): boolean =>
  isWhatsappTrigger(trigger) && ECHO_GUARDS.some(([path]) => !isGuarded(trigger.filter, path));

/** Everything to tell the owner about this document, in the order the screen shows it. */
export function flowProblems(definition: unknown): FlowProblem[] {
  const doc = readDoc(definition);
  if (!doc.triggers.some((trigger) => answersEchoAndBacklog(trigger))) return [];
  return [
    {
      id: ECHO_AND_BACKLOG,
      titleKey: 'ui.checkupEchoTitle',
      bodyKey: 'ui.checkupEchoBody',
      fixKey: 'ui.checkupEchoFix',
    },
  ];
}

/**
 * The same document with the missing clauses added — or `null` when there is nothing to add.
 *
 * A SURGICAL patch of the trigger, never a swap for today's card. The owner may have renamed the
 * automation, reworded every prompt and added steps of her own, and all of that is hers; replacing
 * the document would throw it away to fix two lines. Nothing here touches steps, grants or the
 * on/off switch, so no permission has to be granted again for the repair to take.
 *
 * `null` and not «the same object» on purpose: the caller must not send a save that changes
 * nothing, which would bump `updated_at` and reorder the list under the hand that pressed it.
 */
export function repairedDefinition(
  definition: unknown,
  problemId: string,
): Record<string, unknown> | null {
  if (problemId !== ECHO_AND_BACKLOG) return null;
  if (!isRecord(definition)) return null;
  if (!flowProblems(definition).some((problem) => problem.id === ECHO_AND_BACKLOG)) return null;

  const repaired = structuredClone(definition) as Record<string, unknown>;
  const triggers = repaired.triggers;
  if (!Array.isArray(triggers)) return null;

  for (const raw of triggers) {
    const trigger = raw as Trigger;
    if (!answersEchoAndBacklog(trigger)) continue;
    const filter: Condition = isRecord(trigger.filter) ? (trigger.filter as Condition) : {};
    for (const [path, unwanted] of ECHO_GUARDS) {
      if (!isGuarded(filter, path)) filter[path] = { neq: unwanted };
    }
    trigger.filter = filter;
  }
  return repaired;
}
