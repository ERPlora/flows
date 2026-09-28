import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The photo of a template's header, uploaded from the step** (hub#2335).
 *
 * A template approved with a photo at the top sends a photo on every message, and Meta downloads it
 * from a link. The owner of a salon has no public link to her salon's picture — she has the file.
 * So next to the link, the step offers «Upload image»: the hub keeps the photo in its own files and
 * answers a reference (`whatsapp/headers/<id>.jpg`) that the step stores as `vars.header_image`;
 * every send signs a fresh link to it. Only the image kind (video and PDF stay a link for now), and
 * only on a hub whose client carries the upload — an older hub keeps the link alone.
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [{ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 }],
};

const REF = `whatsapp/headers/${'ab'.repeat(32)}.jpg`;

type Upload = (file: Blob) => Promise<unknown>;

function fakeClient(upload: Upload | null, query?: unknown) {
  return {
    ...(query ? { queryAllOptional: query } : {}),
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
      ...(upload ? { uploadWhatsappHeaderImage: vi.fn(upload) } : {}),
    },
    events: {
      shape: vi.fn(async () => SHAPE),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

const stored = async () => ({ ref: REF, mime_type: 'image/jpeg', size: 3 });

async function mount(
  steps: unknown[],
  upload: Upload | null = stored,
  query?: unknown,
): Promise<{ el: ErpFlowsEditor; client: ReturnType<typeof fakeClient> }> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  const client = fakeClient(upload, query);
  el.client = client as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.headerMedia = true;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: false,
    definition: { schema_version: 1, triggers: [{ kind: 'event', event: 'sale.completed' }], steps },
  } as never;
  document.body.appendChild(el);
  await settle(el);
  return { el, client };
}

async function settle(el: ErpFlowsEditor): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function panelOf(el: ErpFlowsEditor): Promise<Element> {
  const opener = el.renderRoot.querySelector('[data-node="n"] button.open') as HTMLButtonElement;
  expect(opener, 'the step card has no way to open it').toBeTruthy();
  opener.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
  return el.renderRoot.querySelector('[data-node="n"] .panel')!;
}

/** Picks a file in the hidden input, the way the browser reports it. */
async function choose(el: ErpFlowsEditor, file: File): Promise<void> {
  const input = el.renderRoot.querySelector('input[type="file"][data-field="header-file"]') as HTMLInputElement;
  expect(input, 'there is no file input behind the upload button').toBeTruthy();
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
  await settle(el);
}

const whatsapp = (over: Record<string, unknown> = {}) => [
  {
    id: 'n',
    kind: 'notify',
    channel: 'whatsapp',
    to: { query: 'customers.customer.get', params: {}, field: 'phone' },
    ...over,
  },
];

const vars = (el: ErpFlowsEditor): Record<string, unknown> =>
  ((el.document.steps[0] as unknown as Record<string, unknown>).vars ?? {}) as Record<string, unknown>;

const PHOTO = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'salon.jpg', { type: 'image/jpeg' });

describe('uploading the photo of the header', () => {
  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;
  beforeEach(() => {
    document.body.replaceChildren();
    URL.createObjectURL = vi.fn(() => 'blob:preview-1');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });

  it('offers the upload next to the link of an image header, for JPEG and PNG only', async () => {
    const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }));
    const panel = await panelOf(el);
    expect(panel.querySelector('[data-field="header-upload"]'), 'no upload button').toBeTruthy();
    expect(panel.querySelector('erp-flows-value[data-field="header-link"]'), 'the link is still there').toBeTruthy();
    const input = panel.querySelector('input[type="file"][data-field="header-file"]') as HTMLInputElement;
    expect(input.accept).toBe('image/jpeg,image/png');
  });

  it('stores the reference the hub answers as the header of the step', async () => {
    const { el, client } = await mount(whatsapp({ template: 'promo', vars: { who: 'Ana', header_image: '' } }));
    await panelOf(el);
    const file = PHOTO();
    await choose(el, file);
    expect(client.flows.uploadWhatsappHeaderImage).toHaveBeenCalledWith(file);
    expect(vars(el)).toEqual({ who: 'Ana', header_image: REF });
  });

  it('shows the stored photo instead of its reference, and lets her take it away', async () => {
    const { el, client } = await mount(whatsapp({ template: 'promo', vars: { header_image: REF } }));
    const panel = await panelOf(el);
    await settle(el);
    expect(client.fetchMediaBlob).toHaveBeenCalledWith(REF);
    const img = el.renderRoot.querySelector('img[data-field="header-preview"]') as HTMLImageElement;
    expect(img, 'the uploaded photo is not shown').toBeTruthy();
    expect(img.getAttribute('src')).toBe('blob:preview-1');
    // The reference is the hub's business, not hers: no link box showing `whatsapp/headers/…`.
    expect(panel.querySelector('erp-flows-value[data-field="header-link"]')).toBeNull();
    // Replacing it is the same button.
    expect(panel.querySelector('[data-field="header-upload"]')).toBeTruthy();

    const remove = el.renderRoot.querySelector('[data-field="header-remove"]') as HTMLElement;
    expect(remove, 'no way to take the photo away').toBeTruthy();
    remove.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);
    expect(vars(el)).toEqual({ header_image: '' });
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]')).toBeTruthy();
  });

  it('says WHY a photo was refused, by its code, and keeps what the step had', async () => {
    for (const [code, key] of [
      ['whatsapp.header_image_too_large', 'ui.notifyHeaderUploadTooLarge'],
      ['whatsapp.header_image_unsupported', 'ui.notifyHeaderUploadUnsupported'],
      ['whatsapp.header_image_not_saved', 'ui.notifyHeaderUploadFailed'],
      ['', 'ui.notifyHeaderUploadFailed'],
    ]) {
      document.body.replaceChildren();
      const refuse = async () => {
        throw Object.assign(new Error('refused'), { code });
      };
      const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: 'https://a/x.jpg' } }), refuse);
      await panelOf(el);
      await choose(el, PHOTO());
      const error = el.renderRoot.querySelector('[data-field="header-upload-error"]');
      expect(error?.textContent, code).toContain(key);
      expect(vars(el)).toEqual({ header_image: 'https://a/x.jpg' });
    }
  });

  it('says it is uploading while it does, and does not take a second file meanwhile', async () => {
    let release: (v: unknown) => void = () => {};
    const slow = () => new Promise((resolve) => (release = resolve));
    const { el, client } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }), slow);
    await panelOf(el);
    await choose(el, PHOTO());
    const button = el.renderRoot.querySelector('[data-field="header-upload"]') as HTMLElement & { disabled?: boolean };
    expect(button.textContent).toContain('ui.notifyHeaderUploading');
    expect(button.hasAttribute('disabled')).toBe(true);
    await choose(el, PHOTO());
    expect(client.flows.uploadWhatsappHeaderImage).toHaveBeenCalledTimes(1);
    release({ ref: REF, mime_type: 'image/jpeg', size: 4 });
    await settle(el);
    await settle(el);
    expect(vars(el)).toEqual({ header_image: REF });
  });

  it('keeps what she wrote in the step while the photo was going up', async () => {
    let release: (v: unknown) => void = () => {};
    const slow = () => new Promise((resolve) => (release = resolve));
    const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }), slow);
    await panelOf(el);
    await choose(el, PHOTO());
    // She fills a variable of the template while the upload is still on its way.
    const step = el.document.steps[0] as unknown as Record<string, unknown>;
    el.document = {
      ...el.document,
      steps: [{ ...step, vars: { ...(step.vars as object), who: 'Ana' } }, ...el.document.steps.slice(1)],
    } as never;
    await settle(el);
    release({ ref: REF, mime_type: 'image/jpeg', size: 4 });
    await settle(el);
    await settle(el);
    expect(vars(el)).toEqual({ who: 'Ana', header_image: REF });
  });

  it('does not store an answer that is not a header reference of the hub', async () => {
    for (const answer of [{ ref: 'https://elsewhere.example/x.jpg' }, {}, null]) {
      document.body.replaceChildren();
      const odd = async () => answer;
      const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }), odd);
      await panelOf(el);
      await choose(el, PHOTO());
      expect(vars(el), JSON.stringify(answer)).toEqual({ header_image: '' });
      const error = el.renderRoot.querySelector('[data-field="header-upload-error"]');
      expect(error?.textContent, JSON.stringify(answer)).toContain('ui.notifyHeaderUploadFailed');
    }
  });

  it('is not offered for a video or a document header', async () => {
    for (const kind of ['video', 'document']) {
      document.body.replaceChildren();
      const { el } = await mount(whatsapp({ template: 'promo', vars: { [`header_${kind}`]: '' } }));
      const panel = await panelOf(el);
      expect(panel.querySelector('[data-field="header-upload"]'), kind).toBeNull();
    }
  });

  it('is not offered on a hub whose client cannot upload: the link stays the way', async () => {
    const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }), null);
    const panel = await panelOf(el);
    expect(panel.querySelector('[data-field="header-upload"]')).toBeNull();
    expect(panel.querySelector('erp-flows-value[data-field="header-link"]')).toBeTruthy();
  });

  it('is offered on a picked template Meta approved with a photo at the top', async () => {
    const query = vi.fn(async () => [
      { name: 'promo', header_format: 'IMAGE', header: '', buttons: '[]', meta_status: 'approved', is_active: 1 },
    ]);
    const { el } = await mount(whatsapp({ template: 'promo', vars: { header_image: '' } }), stored, query);
    await panelOf(el);
    await settle(el);
    expect(el.renderRoot.querySelector('[data-field="header-deduced"]'), 'the template is not known').toBeTruthy();
    await choose(el, PHOTO());
    expect(vars(el)).toEqual({ header_image: REF });
  });
});
