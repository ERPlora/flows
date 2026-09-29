import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The video or the PDF of a template's header, uploaded from the step** (hub#2347).
 *
 * The promotion's video or the restaurant's menu travel in the header like the photo of hub#2335:
 * the owner has the file, not a public link. On a hub whose client carries
 * `uploadWhatsappHeaderMedia(file, kind)`, every media header offers the upload of its own kind —
 * an MP4 of up to 16 MB for a video, a PDF of up to 100 MB for a document — and the step stores
 * the reference the hub answers in `vars.header_<kind>`. The words say which file it is; a file
 * over Meta's cap is refused here, before minutes of upload.
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

type Upload = (file: Blob, kind: string) => Promise<unknown>;

const answer: Upload = async (_file, kind) => ({ ref: REFS[kind], mime_type: 'x', size: 4 });

function fakeClient(upload: Upload) {
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
      uploadWhatsappHeaderImage: vi.fn(async () => ({ ref: REFS.image, mime_type: 'image/jpeg', size: 4 })),
      uploadWhatsappHeaderMedia: vi.fn(upload),
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

async function mount(
  vars: Record<string, unknown>,
  upload: Upload = answer,
): Promise<{ el: ErpFlowsEditor; client: ReturnType<typeof fakeClient>; panel: Element }> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  const client = fakeClient(upload);
  el.client = client as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.headerMedia = true;
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
          template: 'promo',
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
  return { el, client, panel: el.renderRoot.querySelector('[data-node="n"] .panel')! };
}

async function choose(el: ErpFlowsEditor, file: File): Promise<void> {
  const input = el.renderRoot.querySelector('input[type="file"][data-field="header-file"]') as HTMLInputElement;
  expect(input, 'there is no file input behind the upload button').toBeTruthy();
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
  await settle(el);
}

const varsOf = (el: ErpFlowsEditor): Record<string, unknown> =>
  ((el.document.steps[0] as unknown as Record<string, unknown>).vars ?? {}) as Record<string, unknown>;

const fileOf = (name: string, size?: number): File => {
  const file = new File([new Uint8Array([0, 0, 0, 0x18])], name);
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
};

const MB = 1024 * 1024;

describe('uploading the video or the PDF of the header (hub#2347)', () => {
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

  it('offers each media header the upload of its own kind, worded for it', async () => {
    for (const [kind, accept, label] of [
      ['image', 'image/jpeg,image/png', 'ui.notifyHeaderUpload'],
      ['video', 'video/mp4', 'ui.notifyHeaderUpload_video'],
      ['document', 'application/pdf', 'ui.notifyHeaderUpload_document'],
    ]) {
      document.body.replaceChildren();
      const { panel } = await mount({ [`header_${kind}`]: '' });
      const button = panel.querySelector('[data-field="header-upload"]');
      expect(button, kind).toBeTruthy();
      expect(button!.textContent?.trim(), kind).toBe(label);
      const input = panel.querySelector('input[type="file"][data-field="header-file"]') as HTMLInputElement;
      expect(input.accept, kind).toBe(accept);
      const hint = panel.querySelector('.header-upload .hint');
      expect(hint?.textContent, kind).toBe(kind === 'image' ? 'ui.notifyHeaderUploadHint' : `ui.notifyHeaderUploadHint_${kind}`);
      expect(panel.querySelector('erp-flows-value[data-field="header-link"]'), `${kind}: the link stays`).toBeTruthy();
    }
  });

  it('uploads the file with the kind of its header and stores the reference there', async () => {
    for (const kind of ['video', 'document', 'image']) {
      document.body.replaceChildren();
      const { el, client } = await mount({ who: 'Ana', [`header_${kind}`]: '' });
      const file = fileOf('promo');
      await choose(el, file);
      expect(client.flows.uploadWhatsappHeaderMedia, kind).toHaveBeenCalledWith(file, kind);
      expect(client.flows.uploadWhatsappHeaderImage, kind).not.toHaveBeenCalled();
      expect(varsOf(el), kind).toEqual({ who: 'Ana', [`header_${kind}`]: REFS[kind] });
    }
  });

  it('shows an uploaded video or PDF as uploaded — never downloads it — and lets her take it away', async () => {
    for (const kind of ['video', 'document']) {
      document.body.replaceChildren();
      const { el, client, panel } = await mount({ [`header_${kind}`]: REFS[kind] });
      await settle(el);
      expect(client.fetchMediaBlob, `${kind}: a 100 MB file is not fetched to preview it`).not.toHaveBeenCalled();
      expect(panel.querySelector('img[data-field="header-preview"]'), kind).toBeNull();
      expect(panel.querySelector('[data-field="header-uploaded"]')?.textContent?.trim(), kind).toBe(
        `ui.notifyHeaderUploaded_${kind}`,
      );
      expect(panel.querySelector('erp-flows-value[data-field="header-link"]'), kind).toBeNull();
      expect(panel.querySelector('[data-field="header-upload"]')?.textContent?.trim(), kind).toBe(
        `ui.notifyHeaderReplace_${kind}`,
      );
      const remove = panel.querySelector('[data-field="header-remove"]') as HTMLElement;
      expect(remove.textContent?.trim(), kind).toBe(`ui.notifyHeaderRemove_${kind}`);
      remove.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle(el);
      expect(varsOf(el), kind).toEqual({ [`header_${kind}`]: '' });
    }
  });

  it('says WHY a video or a PDF was refused, by the code of its kind', async () => {
    for (const [kind, code, key] of [
      ['video', 'whatsapp.header_video_too_large', 'ui.notifyHeaderUploadTooLarge_video'],
      ['video', 'whatsapp.header_video_unsupported', 'ui.notifyHeaderUploadUnsupported_video'],
      ['video', 'whatsapp.header_video_not_saved', 'ui.notifyHeaderUploadFailed_video'],
      ['document', 'whatsapp.header_document_too_large', 'ui.notifyHeaderUploadTooLarge_document'],
      ['document', 'whatsapp.header_document_unsupported', 'ui.notifyHeaderUploadUnsupported_document'],
      ['document', '', 'ui.notifyHeaderUploadFailed_document'],
      ['image', 'whatsapp.header_image_too_large', 'ui.notifyHeaderUploadTooLarge'],
    ]) {
      document.body.replaceChildren();
      const refuse: Upload = async () => {
        throw Object.assign(new Error('refused'), { code });
      };
      const { el } = await mount({ [`header_${kind}`]: 'https://a/x' }, refuse);
      await choose(el, fileOf('promo'));
      const error = el.renderRoot.querySelector('[data-field="header-upload-error"]');
      expect(error?.textContent?.trim(), code).toBe(key);
      expect(varsOf(el), code).toEqual({ [`header_${kind}`]: 'https://a/x' });
    }
  });

  it('refuses a file over the cap of its kind before sending a byte of it', async () => {
    for (const [kind, over, fits] of [
      ['image', 5 * MB + 1, 5 * MB],
      ['video', 16 * MB + 1, 16 * MB],
      ['document', 100 * MB + 1, 100 * MB],
    ] as const) {
      document.body.replaceChildren();
      const { el, client } = await mount({ [`header_${kind}`]: '' });
      await choose(el, fileOf('big', over));
      expect(client.flows.uploadWhatsappHeaderMedia, kind).not.toHaveBeenCalled();
      const error = el.renderRoot.querySelector('[data-field="header-upload-error"]');
      expect(error?.textContent?.trim(), kind).toBe(
        kind === 'image' ? 'ui.notifyHeaderUploadTooLarge' : `ui.notifyHeaderUploadTooLarge_${kind}`,
      );
      await choose(el, fileOf('fits', fits));
      expect(client.flows.uploadWhatsappHeaderMedia, `${kind}: the cap itself goes up`).toHaveBeenCalledTimes(1);
      expect(el.renderRoot.querySelector('[data-field="header-upload-error"]'), kind).toBeNull();
    }
  });
});
