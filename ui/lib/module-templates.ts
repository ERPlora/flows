/**
 * **The automations the INSTALLED MODULES bring, as the hub serves them** (flows#98, hub#1611).
 *
 * A business that installs the WhatsApp app gets a recipe with it — the module ships it in its own
 * `flows/` folder, `erplora pack` puts it in the zip (module-toolkit#209) and the runtime registers
 * it on install. Until hub#1645 there was no door to read them through, so this gallery offered
 * only what is written inside this module and the WhatsApp recipe was **copied by hand** into
 * `templates.ts`. Two documents saying the same thing drift apart the moment one of them is
 * touched, which happened three times in a single day.
 *
 * This is the reader for the door: `GET /api/hub/flows/templates`, one row per family, turned into
 * the same {@link FlowTemplate} the gallery already paints. Three things it does NOT do:
 *
 * - **Filter by module version again.** The hub applies each family's `requires.json` floor before
 *   it serves anything, and a module that is not installed counts as `0.0.0`, so «not there» and
 *   «there but too old» are already the same «not offered». Doing it twice here would be a second
 *   opinion about somebody else's data.
 * - **Trust the row.** Every field is checked, and a row that cannot become a card costs that row
 *   and nothing else: a hub of a newer core may serve a shape this module has not seen, and a
 *   gallery that throws on it shows the owner an empty screen instead of the cards it does have.
 * - **Grant anything.** `grants` is what the recipe **will ask for**, shown to the owner so they
 *   allow it. Like every card here, it is created paused and holding nothing (§9.3).
 */
import { grantPin, readDoc } from './flow-doc';
import type { FlowDoc, Grant, Step } from './flow-doc';
import type { FlowTemplate, TemplateNeed } from './templates';

/**
 * What keeps a served id from ever colliding with one written in `templates.ts`.
 *
 * The id is what a card is keyed by AND what `?template=` names, so it travels in URLs other
 * modules push. `module:` is not a namespace anybody can take: a card of this catalogue with a
 * colon in its id would be refused by the test that keeps the ids apart.
 */
export const MODULE_TEMPLATE_PREFIX = 'module:';

/** The id of the card a module's recipe becomes. One family, one card, for ever. */
export function moduleTemplateId(module: string, family: string): string {
  return `${MODULE_TEMPLATE_PREFIX}${module}/${family}`;
}

/** The `ion-icon` every served card wears: the shape this module already uses for «automation». */
const MODULE_TEMPLATE_ICON = 'git-branch-outline';

/** Which kernel step keys this module knows how to ask a hub about — {@link TemplateNeed}. */
const NEEDS: readonly TemplateNeed[] = ['interactive', 'output'];

/** One row of `GET /api/hub/flows/templates`, before anything has been checked. */
interface ServedRow {
  module?: unknown;
  family?: unknown;
  documents?: unknown;
  grants?: unknown;
  requires?: unknown;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * The document for the owner's language, English being the source (ADR-0055/0199).
 *
 * `es-ES` is Spanish: a REGION a module does not ship is not a LANGUAGE it does not ship, and
 * falling straight to English for it would show a Spanish salon an English automation while the
 * translation sat right there.
 */
function documentFor(documents: Record<string, unknown>, locale: string): unknown {
  const wanted = locale.trim().toLowerCase();
  const base = wanted.split('-')[0];
  return documents[wanted] ?? documents[base] ?? documents.en;
}

/**
 * The permissions the recipe declares it will ask for.
 *
 * A row that is not `{kind, value}` costs itself and nothing else: an unreadable permission must
 * not take the card down with it, and it must not be shown as a permission either — a blank row on
 * the «what it will ask you to allow» list is the one thing that list cannot afford.
 *
 * **`payload` is read when the hub sends it** (hub#1623/#1654). A `<family>.grants.json` may FIX
 * payload fields on a `command` — `whatsapp_inbox` fixes `channel: "customer"` on
 * `appointments.appointments.cancel` so a recipe that books unattended cannot cancel a stranger's
 * hour on the salon's behalf. Today `FlowTemplateGrant` is `{kind, value}` and the limit never
 * leaves the hub, so this reads nothing and {@link mergeTemplates} carries the retired copy's pin
 * instead; reading it here is what makes the pin arrive on its own the day hub#1654 lands, with no
 * second release of this module. Since hub#1662 a `query` grant carries one too — «the diary of
 * THIS customer» — and it arrives by the same door. A pin on a kind the hub hands no values to
 * fixes nothing ({@link canPinPayload}) and is dropped rather than shown as a limit that holds.
 */
function declaredGrants(raw: unknown): Grant[] {
  if (!Array.isArray(raw)) return [];
  const out: Grant[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const kind = text((row as Grant).kind);
    const value = text((row as Grant).value);
    if (!kind || !value) continue;
    const pin = grantPin({ kind, value, payload: (row as Grant).payload });
    out.push(Object.keys(pin).length ? { kind, value, payload: pin } : { kind, value });
  }
  return out;
}

/**
 * The kernel keys this document carries, so an older core is not offered a card it refuses whole.
 *
 * `parse_step` walks an allowlist per step kind: a key it does not know is not ignored, it answers
 * `flow.invalid_definition` for the WHOLE document and the recipe dies at save. The hub's own floor
 * (`requires.json`) is about MODULES and says nothing about this, and the gallery's kernel probe is
 * fail-closed, so a card that names one of these is simply not offered until the hub declares it.
 */
function neededBy(doc: FlowDoc): TemplateNeed[] {
  return NEEDS.filter((need) =>
    doc.steps.some(
      (step) => !!step && typeof step === 'object' && (step as Step)[need as keyof Step] !== undefined,
    ),
  );
}

/** A document nothing can be built from is not a card: an automation with no steps does nothing. */
function usable(doc: FlowDoc): boolean {
  return doc.steps.length > 0;
}

/**
 * The cards a hub's answer becomes, in the order it served them.
 *
 * `rows` is whatever came back — this is the far side of a network call to a hub that may be
 * newer than this module. Anything that is not a list is «no cards», never a crash.
 */
export function moduleTemplates(rows: unknown, locale: string | undefined): FlowTemplate[] {
  if (!Array.isArray(rows)) return [];
  const out: FlowTemplate[] = [];
  const seen = new Set<string>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as ServedRow;
    const module = text(row.module);
    const family = text(row.family);
    if (!module || !family) continue;
    if (!row.documents || typeof row.documents !== 'object') continue;
    const served = documentFor(row.documents as Record<string, unknown>, locale ?? 'en');
    if (!served || typeof served !== 'object') continue;
    // Copied here and not on every `build()`: the editor rewrites what it is handed, and a document
    // shared with the row it arrived in would carry somebody else's edits into the next install.
    const doc = readDoc(JSON.parse(JSON.stringify(served)) as unknown);
    if (!usable(doc)) continue;
    const id = moduleTemplateId(module, family);
    if (seen.has(id)) continue;
    seen.add(id);
    const needs = neededBy(doc);
    out.push({
      id,
      source: { module, family },
      name: text(doc.name) || family,
      icon: MODULE_TEMPLATE_ICON,
      blanks: [],
      // The hub already refused every family whose modules are missing, so there is nothing left
      // for the gallery's own module probe to hide — and a witness it cannot answer would hide a
      // card the hub has just said this business can run.
      witnesses: [],
      grantReasons: {},
      grants: declaredGrants(row.grants),
      ...(needs.length ? { needs } : {}),
      enabledOnCreate: false,
      build: () => readDoc(JSON.parse(JSON.stringify(doc)) as unknown),
    });
  }
  return out;
}
