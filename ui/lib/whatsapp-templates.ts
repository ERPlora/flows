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

/** The list query of `whatsapp_inbox` (its manifest, whatsapp_inbox#188). */
export const TEMPLATES_QUERY = 'whatsapp_inbox.templates.list';

/** The media kinds a template header can carry, as the kernel's `vars.header_<kind>` names them. */
export type TemplateHeader = 'image' | 'video' | 'document';

export interface WhatsappTemplateChoice {
  name: string;
  /** `null` for a template whose header is text or absent: nothing to attach. */
  header: TemplateHeader | null;
}

/**
 * `absent` is a hub where the list cannot exist (no WhatsApp module, or a client that cannot
 * query); `error` is a list that exists and could not be read. The screen says different things.
 */
export type WhatsappTemplatesState =
  | { status: 'idle' | 'loading' | 'absent' | 'error'; templates: WhatsappTemplateChoice[] }
  | { status: 'ready'; templates: WhatsappTemplateChoice[] };

const HEADER_OF: Record<string, TemplateHeader> = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
};

const HEADER_KEYS = ['header_image', 'header_video', 'header_document'];

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
    byName.set(name, { name, header: HEADER_OF[String(r.header_format ?? '').toUpperCase()] ?? null });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const ABSENT_CODES = new Set(['module_not_installed', 'module_inactive']);

/**
 * Asks the hub for the list. Every row, not one page: a business with more than a page of
 * templates would otherwise find the one it wants missing from the picker.
 */
export async function loadWhatsappTemplates(
  client: Pick<ModuleClient, 'query' | 'queryAllOptional'> | null | undefined,
): Promise<WhatsappTemplatesState> {
  try {
    let rows: unknown;
    if (typeof client?.queryAllOptional === 'function') {
      rows = await client.queryAllOptional(TEMPLATES_QUERY, {});
    } else if (typeof client?.query === 'function') {
      rows = await client.query(TEMPLATES_QUERY, { limit: 500 });
    } else {
      return { status: 'absent', templates: [] };
    }
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
