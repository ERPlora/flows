/**
 * **The WhatsApp templates a notify step can pick from** (flows#132).
 *
 * The list is the one `whatsapp_inbox` keeps: the templates the business wrote there or brought in
 * from WhatsApp Manager, each with the kind of its header (whatsapp_inbox#180/#188). It is read
 * through the ordinary dispatcher, like any module reads another's data, so the step can offer a
 * list instead of a box — a typo in a typed name, or a header the owner had to know about, was a
 * message that never left.
 *
 * Only what Meta APPROVED is offered: anything else is refused by Meta at send time, days after
 * the flow was saved. A name is offered once even when it is approved in several languages,
 * because the step names the template and not its translation.
 */
import { errorCode } from './hub-flows';
import type { ModuleClient } from './hub-flows';

/**
 * The list query of `whatsapp_inbox` (its manifest, whatsapp_inbox#188). Spelled as a literal again
 * at each call below: `erplora validate` reads consumed contracts off the literal (ADR-0127).
 */
export const TEMPLATES_QUERY = 'whatsapp_inbox.templates.list';

/** The media kinds a template header can carry, as the kernel's `vars.header_<kind>` names them. */
export type TemplateHeader = 'image' | 'video' | 'document';

export interface WhatsappTemplateChoice {
  name: string;
  /**
   * `null` for a template whose header is text or absent: nothing to attach. `'unknown'` when the
   * row does not say — a `whatsapp_inbox` older than whatsapp_inbox#188 serves no `header_format` —
   * and then nothing is deduced: the owner keeps choosing the header by hand, as before flows#132.
   */
  header: TemplateHeader | null | 'unknown';
  /**
   * The title is text with a `{{1}}` («Your appointment on {{1}}», hub#2111): the step asks for
   * its value. Present only when true.
   */
  titleVariable?: true;
  /**
   * The link buttons whose URL ends in a `{{1}}` (hub#2110), each with its position — as Meta counts
   * ALL the template's buttons, from 0 — and the text the customer sees on it, which is how the
   * owner recognises it. The step asks for that end. Present only when there is one.
   */
  linkButtons?: { index: number; text: string }[];
}

/**
 * `absent` is a hub where the list cannot exist (no WhatsApp module, or a client that cannot
 * query); `error` is a list that exists and could not be read. The screen says different things.
 */
export type WhatsappTemplatesState =
  | { status: 'idle' | 'loading' | 'absent' | 'error'; templates: WhatsappTemplateChoice[] }
  | { status: 'ready'; templates: WhatsappTemplateChoice[] };

const HEADER_OF: Record<string, TemplateHeader | null> = {
  TEXT: null,
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
};

const HEADER_KEYS = ['header_image', 'header_video', 'header_document'];

/** The kernel key of a text title's value (hub#2111). */
export const TITLE_KEY = 'header_text';
/** The kernel key of the end of the link button at position `n` (hub#2110). */
export const linkKey = (n: number): string => `button_url_${n}`;
const LINK_KEY = /^button_url_[0-9]$/;

const HAS_VARIABLE = /\{\{[^}]*\}\}/;

/**
 * Where the link buttons with a variable sit. `buttons` is a JSON array in Meta's order
 * (whatsapp_inbox#180), served as the TEXT column holds it; anything unreadable asks for nothing.
 * The kernel takes positions 0-9, which is every position Meta allows on a template.
 */
function linkButtonsOf(raw: unknown): { index: number; text: string }[] {
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: { index: number; text: string }[] = [];
  list.forEach((b, i) => {
    if (!b || typeof b !== 'object' || i > 9) return;
    const button = b as Record<string, unknown>;
    if (String(button.type ?? '').toUpperCase() !== 'URL') return;
    if (typeof button.url === 'string' && HAS_VARIABLE.test(button.url)) {
      out.push({ index: i, text: typeof button.text === 'string' ? button.text : '' });
    }
  });
  return out;
}

/** The rows of the list query turned into what the picker offers, sorted by name. */
export function readWhatsappTemplates(rows: unknown): WhatsappTemplateChoice[] {
  if (!Array.isArray(rows)) return [];
  const byName = new Map<string, WhatsappTemplateChoice>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    if (!name || byName.has(name)) continue;
    if (String(r.meta_status ?? '').toLowerCase() !== 'approved') continue;
    if (!(r.is_active === true || Number(r.is_active) === 1)) continue;
    const format = String(r.header_format ?? '').toUpperCase();
    const choice: WhatsappTemplateChoice = { name, header: format in HEADER_OF ? HEADER_OF[format] : 'unknown' };
    // A row without `header_format` predates whatsapp_inbox#180, when every header was text.
    const textTitle = format === 'TEXT' || !r.header_format;
    if (textTitle && typeof r.header === 'string' && HAS_VARIABLE.test(r.header)) choice.titleVariable = true;
    const links = linkButtonsOf(r.buttons);
    if (links.length) choice.linkButtons = links;
    byName.set(name, choice);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const ABSENT_CODES = new Set(['module_not_installed', 'module_inactive']);

/**
 * Asks the hub for the list. Every row, not one page: a business with more than a page of
 * templates would otherwise find the one it wants missing from the picker.
 */
export async function loadWhatsappTemplates(
  client: Pick<ModuleClient, 'queryAllOptional'> | null | undefined,
): Promise<WhatsappTemplatesState> {
  try {
    // Only through the OPTIONAL door: a hub without WhatsApp is an ordinary hub, not a broken
    // dependency. Every shell since hub v1.1.20 hands it out; one that does not keeps the box.
    if (typeof client?.queryAllOptional !== 'function') return { status: 'absent', templates: [] };
    const rows = await client.queryAllOptional('whatsapp_inbox.templates.list', {});
    if (rows === undefined) return { status: 'absent', templates: [] };
    return { status: 'ready', templates: readWhatsappTemplates(rows) };
  } catch (e) {
    if (ABSENT_CODES.has(errorCode(e))) return { status: 'absent', templates: [] };
    return { status: 'error', templates: [] };
  }
}

/**
 * `vars` carrying exactly the header the chosen template needs: the one key of its kind — with a
 * link already written carried over, since it is usually the same picture — or none at all.
 */
export function withTemplateHeader(
  vars: Record<string, unknown>,
  header: TemplateHeader | null,
): Record<string, unknown> {
  const next = { ...vars };
  const link = HEADER_KEYS.map((k) => next[k]).find((v) => v !== undefined);
  for (const k of HEADER_KEYS) delete next[k];
  if (header) next[`header_${header}`] = link ?? '';
  return next;
}

/** `vars` without the title value nor any link-button end — what a step that cannot carry them must keep. */
export function withoutTemplateSlots(vars: Record<string, unknown>): Record<string, unknown> {
  const next = { ...vars };
  for (const k of Object.keys(next)) if (k === TITLE_KEY || LINK_KEY.test(k)) delete next[k];
  return next;
}

/**
 * `vars` carrying exactly the gaps the chosen template has — its title value and the end of each
 * link button with a variable — keeping what was already written in them, and nothing else.
 *
 * @param can what THIS hub sends (`schemaFacts().headerText` / `.buttonUrl`). A key the hub does not
 * know travels as a BODY variable and Meta refuses the send, so it is never written there.
 */
export function withTemplateSlots(
  vars: Record<string, unknown>,
  template: WhatsappTemplateChoice,
  can: { title: boolean; links: boolean },
): Record<string, unknown> {
  let next = withoutTemplateSlots(vars);
  if (template.titleVariable && can.title) {
    // A template has ONE header: a title with a gap leaves no room for a picture.
    next = withTemplateHeader(next, null);
    next[TITLE_KEY] = vars[TITLE_KEY] ?? '';
  }
  if (can.links) for (const { index } of template.linkButtons ?? []) next[linkKey(index)] = vars[linkKey(index)] ?? '';
  return next;
}
