import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The name the customer sees on the header's PDF** (hub#2405).
 *
 * The hub stores an uploaded PDF under its fingerprint, and without a name the customer's chat
 * shows that fingerprint — a string of letters and numbers that reads like spam. On a hub that
 * declares `vars.header_document_filename`, the PDF header carries a «Name the customer sees»
 * field, filled with the name of the file she uploaded and editable; a photo or a video has no
 * such name, and a hub that never declared the key never gets it (it would travel as a BODY
 * variable, and Meta would refuse the send).
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [{ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 }],
};

const REFS: Record<string, string> = {
  image: `whatsapp/headers/${'ab'.repeat(32)}.jpg`,
  video: `whatsapp/headers/${'cd'.repeat(32)}.mp4`,
  document: `whatsapp/headers/${'ef'.repeat(32)}.pdf`,
};

const NAME_KEY = 'header_document_filename';

function fakeClient() {
  return {
    fetchMediaBlob: vi.fn(async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' })),
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
      uploadWhatsappHeaderMedia: vi.fn(async (_file: Blob, kind: string) => ({ ref: REFS[kind], mime_type: 'x', size: 4 })),
    },
    events: {
      shape: vi.fn(async () => SHAPE),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

async function settle(el: ErpFlowsEditor): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
}

/**
 * @param declared whether the HUB declared `vars.header_document_filename` — the fail-closed fact
 * `schemaFacts().documentName`.
 */
async function mount(vars: Record<string, unknown>, declared = true): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.headerMedia = true;
  el.documentName = declared;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: false,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'sale.completed' }],
      steps: [
        {
          id: 'n',
          kind: 'notify',
          channel: 'whatsapp',
          template: 'autumn_menu',
          to: { query: 'customers.customer.get', params: {}, field: 'phone' },
          vars,
        },
      ],
    },
  } as never;
  document.body.appendChild(el);
  await settle(el);
  const opener = el.renderRoot.querySelector('[data-node="n"] button.open') as HTMLButtonElement;
  opener.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
  return el;
}

async function choose(el: ErpFlowsEditor, name: string): Promise<void> {
  const input = el.renderRoot.querySelector('input[type="file"][data-field="header-file"]') as HTMLInputElement;
  expect(input, 'there is no file input behind the upload button').toBeTruthy();
  Object.defineProperty(input, 'files', { value: [new File([new Uint8Array([0x25, 0x50])], name)], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
  await settle(el);
}

async function pick(el: ErpFlowsEditor, value: string): Promise<void> {
  const select = el.renderRoot.querySelector('select[data-field="header-kind"]') as HTMLSelectElement;
  expect(select, 'the header kind is not on the screen').toBeTruthy();
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
}

async function compose(el: ErpFlowsEditor, field: string, text: string): Promise<void> {
  const box = el.renderRoot.querySelector(`erp-flows-value[data-field="${field}"]`);
  expect(box, `${field} is not on the screen`).toBeTruthy();
  box!.dispatchEvent(
    new CustomEvent('flows-value-change', {
      detail: { parts: [{ kind: 'text', text }] },
      bubbles: true,
      composed: true,
    }),
  );
  await settle(el);
}

const varsOf = (el: ErpFlowsEditor): Record<string, unknown> =>
  ((el.document.steps[0] as unknown as Record<string, unknown>).vars ?? {}) as Record<string, unknown>;

const nameField = (el: ErpFlowsEditor): Element | null =>
  el.renderRoot.querySelector('erp-flows-value[data-field="header-document-name"]');

describe('the name the customer sees on the header PDF', () => {
  beforeEach(() => document.body.replaceChildren());

  it('is the name of the file she uploaded, next to the reference the hub answered', async () => {
    const el = await mount({ header_document: '' });
    await choose(el, 'Carta de otoño.pdf');
    expect(varsOf(el)).toEqual({ header_document: REFS.document, [NAME_KEY]: 'Carta de otoño.pdf' });
    expect(nameField(el), 'the name is not shown to be changed').toBeTruthy();
  });

  it('is hers to change, and changing the link keeps it', async () => {
    const el = await mount({ header_document: 'https://cdn.example.com/menu.pdf', [NAME_KEY]: 'Menu.pdf' });
    await compose(el, 'header-document-name', 'Tarifa 2026.pdf');
    expect(varsOf(el)[NAME_KEY]).toBe('Tarifa 2026.pdf');
    await compose(el, 'header-link', 'https://cdn.example.com/tarifa.pdf');
    expect(varsOf(el)).toEqual({
      header_document: 'https://cdn.example.com/tarifa.pdf',
      [NAME_KEY]: 'Tarifa 2026.pdf',
    });
  });

  it('follows a new upload: another file, its own name', async () => {
    const el = await mount({ header_document: REFS.document, [NAME_KEY]: 'Old menu.pdf' });
    await choose(el, 'Winter menu.pdf');
    expect(varsOf(el)[NAME_KEY]).toBe('Winter menu.pdf');
  });

  it('goes away with the PDF: another kind of header, or none, carries no name', async () => {
    for (const kind of ['image', 'video', 'none']) {
      document.body.replaceChildren();
      const el = await mount({ header_document: REFS.document, [NAME_KEY]: 'Menu.pdf' });
      await pick(el, kind);
      expect(NAME_KEY in varsOf(el), `${kind}: ${JSON.stringify(varsOf(el))}`).toBe(false);
      expect(nameField(el), kind).toBeNull();
    }
  });

  it('is not asked for a photo or a video', async () => {
    for (const kind of ['image', 'video']) {
      document.body.replaceChildren();
      const el = await mount({ [`header_${kind}`]: '' });
      await choose(el, `promo.${kind === 'image' ? 'jpg' : 'mp4'}`);
      expect(NAME_KEY in varsOf(el), kind).toBe(false);
      expect(nameField(el), kind).toBeNull();
    }
  });

  it('is never written on a hub that did not declare it', async () => {
    const el = await mount({ header_document: '' }, false);
    await choose(el, 'Carta de otoño.pdf');
    expect(varsOf(el)).toEqual({ header_document: REFS.document });
    expect(nameField(el)).toBeNull();
  });
});
