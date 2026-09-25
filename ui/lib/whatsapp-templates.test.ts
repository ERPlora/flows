import { describe, it, expect, vi } from 'vitest';
import {
  TEMPLATES_QUERY,
  loadWhatsappTemplates,
  readWhatsappTemplates,
  withTemplateHeader,
} from './whatsapp-templates';

/**
 * **The WhatsApp templates a notify step can pick from** (flows#132).
 *
 * The list is the one `whatsapp_inbox` keeps — the templates the business imported from WhatsApp
 * Manager or wrote there (whatsapp_inbox#180/#188) — read through the ordinary dispatcher. Only
 * what Meta approved can go out, and the header kind travels with each row, so the screen deduces
 * it instead of asking the owner to know it.
 */

const row = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  name: 'autumn_promo',
  language: 'es',
  header_format: 'TEXT',
  buttons: '[]',
  meta_status: 'approved',
  is_active: 1,
  ...over,
});

describe('readWhatsappTemplates', () => {
  it('keeps only what Meta approved and is still active, with the header kind deduced', () => {
    const list = readWhatsappTemplates([
      row({ name: 'autumn_promo', header_format: 'IMAGE' }),
      row({ name: 'menu', header_format: 'VIDEO' }),
      row({ name: 'invoice', header_format: 'DOCUMENT' }),
      row({ name: 'reminder', header_format: 'TEXT' }),
      row({ name: 'draft', meta_status: 'not_sent' }),
      row({ name: 'waiting', meta_status: 'pending' }),
      row({ name: 'refused', meta_status: 'rejected' }),
      row({ name: 'off', is_active: 0 }),
    ]);
    expect(list).toEqual([
      { name: 'autumn_promo', header: 'image' },
      { name: 'invoice', header: 'document' },
      { name: 'menu', header: 'video' },
      { name: 'reminder', header: null },
    ]);
  });

  it('says unknown, not "no header", for a row that does not carry header_format', () => {
    // A `whatsapp_inbox` older than whatsapp_inbox#188 serves the rows without the column; a
    // row with a spelling this reader does not know is the same case. Nothing can be deduced.
    expect(readWhatsappTemplates([row({ header_format: undefined }), row({ name: 'odd', header_format: 'LOCATION' })])).toEqual([
      { name: 'autumn_promo', header: 'unknown' },
      { name: 'odd', header: 'unknown' },
    ]);
  });

  it('lists a name once even when it is approved in several languages', () => {
    const list = readWhatsappTemplates([
      row({ language: 'es', header_format: 'IMAGE' }),
      row({ language: 'en', header_format: 'IMAGE' }),
    ]);
    expect(list).toEqual([{ name: 'autumn_promo', header: 'image' }]);
  });

  it('accepts the boolean spelling of is_active and ignores rows without a name', () => {
    expect(readWhatsappTemplates([row({ is_active: true }), row({ name: '  ' }), null, 'x'])).toEqual([
      { name: 'autumn_promo', header: null },
    ]);
  });

  it('answers an empty list for anything that is not a list', () => {
    expect(readWhatsappTemplates(undefined)).toEqual([]);
    expect(readWhatsappTemplates({ rows: 'no' })).toEqual([]);
  });
});

describe('loadWhatsappTemplates', () => {
  it('reads every row of the list query through queryAllOptional when the client has it', async () => {
    const queryAllOptional = vi.fn(async () => [row({ header_format: 'IMAGE' })]);
    const got = await loadWhatsappTemplates({ queryAllOptional } as never);
    expect(queryAllOptional).toHaveBeenCalledWith(TEMPLATES_QUERY, {});
    expect(TEMPLATES_QUERY).toBe('whatsapp_inbox.templates.list');
    expect(got).toEqual({ status: 'ready', templates: [{ name: 'autumn_promo', header: 'image' }] });
  });

  it('says absent when the WhatsApp module is not installed', async () => {
    const got = await loadWhatsappTemplates({ queryAllOptional: vi.fn(async () => undefined) } as never);
    expect(got.status).toBe('absent');
  });

  it('says absent on a client with only query(): the list is an OPTIONAL integration', async () => {
    // A bare query() is a REQUIRED contract for `erplora validate` (ADR-0127), which would make
    // WhatsApp a dependency of every hub with automations. Every shell since hub v1.1.20 has
    // queryAllOptional, so an older one keeps the free box instead.
    const query = vi.fn(async () => [row()]);
    expect((await loadWhatsappTemplates({ query } as never)).status).toBe('absent');
    expect(query).not.toHaveBeenCalled();
  });

  it('says absent when queryAllOptional itself reports module_not_installed', async () => {
    const missing = vi.fn(async () => {
      throw Object.assign(new Error('x'), { code: 'module_not_installed' });
    });
    expect((await loadWhatsappTemplates({ queryAllOptional: missing } as never)).status).toBe('absent');
  });

  it('says error — never an empty list — when the hub refuses', async () => {
    const denied = vi.fn(async () => {
      throw Object.assign(new Error('x'), { code: 'permission_denied' });
    });
    expect(await loadWhatsappTemplates({ queryAllOptional: denied } as never)).toEqual({
      status: 'error',
      templates: [],
    });
  });

  it('says absent when there is no client or it cannot query at all', async () => {
    expect((await loadWhatsappTemplates(null)).status).toBe('absent');
    expect((await loadWhatsappTemplates({} as never)).status).toBe('absent');
  });
});

describe('withTemplateHeader', () => {
  it('writes the one key of the template kind, carrying a link already written', () => {
    expect(withTemplateHeader({ text: 'hola', header_image: 'https://a/x.jpg' }, 'document')).toEqual({
      text: 'hola',
      header_document: 'https://a/x.jpg',
    });
    expect(withTemplateHeader({ text: 'hola' }, 'video')).toEqual({ text: 'hola', header_video: '' });
  });

  it('drops every header key for a template without media', () => {
    expect(withTemplateHeader({ text: 'hola', header_image: 'https://a/x.jpg' }, null)).toEqual({
      text: 'hola',
    });
  });
});
