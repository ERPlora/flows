import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The picture in a template's header, chosen on the screen** (hub#2101).
 *
 * A WhatsApp template approved with an image, a video or a document in its header is refused by
 * Meta unless the send carries that media. Until the kernel learned `vars.header_<kind>`, the only
 * way to say it was Meta's `components` block typed by hand — which this screen cannot offer and an
 * owner cannot write. This file is the screen half: a kind and a link, written as the one key the
 * hub turns into the `header` parameter, and **not there at all** on a hub that never declared the
 * keys (there they would travel as a body variable and Meta would refuse the send anyway).
 *
 * Same idiom as `erp-flows-editor.whatsapp.test.ts`: controls are found in the shadow root and
 * driven with real events.
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [{ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 }],
};

function fakeClient() {
  return {
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
    },
    events: {
      shape: vi.fn(async () => SHAPE),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

/**
 * @param supported whether the HUB declared the header keys — the fail-closed fact from `schemaFacts`.
 */
async function mount(steps: unknown[], supported = true): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.headerMedia = supported;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: false,
    definition: { schema_version: 1, triggers: [{ kind: 'event', event: 'sale.completed' }], steps },
  } as never;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

async function settle(el: ErpFlowsEditor): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

/** Opens the step card the way a finger does, and hands back its panel. */
async function panelOf(el: ErpFlowsEditor): Promise<Element> {
  const opener = el.renderRoot.querySelector('[data-node="n"] button.open') as HTMLButtonElement;
  expect(opener, 'the step card has no way to open it').toBeTruthy();
  opener.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
  return el.renderRoot.querySelector('[data-node="n"] .panel')!;
}

async function pick(el: ErpFlowsEditor, select: Element | null | undefined, value: string): Promise<void> {
  expect(select, 'the control is not on the screen at all').toBeTruthy();
  (select as HTMLSelectElement).value = value;
  select!.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
}

async function type(el: ErpFlowsEditor, input: Element | null | undefined, value: string): Promise<void> {
  expect(input, 'the control is not on the screen at all').toBeTruthy();
  (input as HTMLInputElement).value = value;
  input!.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
}

/** Composes a value in one of the pill boxes, exactly as `erp-flows-value` reports it. */
async function compose(el: ErpFlowsEditor, box: Element | null | undefined, parts: unknown[]): Promise<void> {
  expect(box, 'the value is not composed with the picker at all').toBeTruthy();
  box!.dispatchEvent(
    new CustomEvent('flows-value-change', { detail: { parts }, bubbles: true, composed: true }),
  );
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

const step = (el: ErpFlowsEditor): Record<string, unknown> =>
  el.document.steps[0] as unknown as Record<string, unknown>;

const HEADER_KEYS = ['header_image', 'header_video', 'header_document'];
const headerKeys = (el: ErpFlowsEditor): string[] =>
  Object.keys((step(el).vars ?? {}) as Record<string, unknown>).filter((k) => HEADER_KEYS.includes(k));

describe('the header control only exists where it can be sent', () => {
  beforeEach(() => document.body.replaceChildren());

  it('offers the header kinds on a WhatsApp template when the hub declared them', async () => {
    const el = await mount(whatsapp({ template: 'autumn_promo' }));
    const kind = (await panelOf(el)).querySelector('select[data-field="header-kind"]');
    expect(kind, 'a hub that sends headers is not offering one').toBeTruthy();
    expect(Array.from(kind!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value)).toEqual([
      'none',
      'image',
      'video',
      'document',
    ]);
    // No kind chosen yet: nothing to link.
    expect((kind as HTMLSelectElement).value).toBe('none');
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]')).toBeNull();
  });

  it('is not there on a hub that never declared the keys', async () => {
    const el = await mount(whatsapp({ template: 'autumn_promo' }), false);
    const panel = await panelOf(el);
    expect(panel.querySelector('[data-field="header-kind"]')).toBeNull();
    // Hiding, not disabling: the rest of the message is still fully editable.
    expect(panel.querySelector('erp-flows-value[data-field="var-text"]')).toBeTruthy();
  });

  it('is not there on email, nor on a free WhatsApp text', async () => {
    for (const over of [{ channel: 'email', template: 'promo' }, { template: '' }]) {
      document.body.replaceChildren();
      const el = await mount(whatsapp(over));
      expect((await panelOf(el)).querySelector('[data-field="header-kind"]'), JSON.stringify(over)).toBeNull();
    }
  });

  it('opens on the kind the step already carries, with its link', async () => {
    const el = await mount(
      whatsapp({ template: 'menu', vars: { header_video: 'https://cdn.example.com/menu.mp4' } }),
    );
    const panel = await panelOf(el);
    // Read off the option that CARRIES `selected`, not `select.value`: happy-dom answers the second
    // option for any `selected` past it (measured on a plain innerHTML select: `video` → `image`),
    // while a real browser honours the attribute — which is what `option()` writes.
    const chosen = panel.querySelectorAll('select[data-field="header-kind"] option[selected]');
    expect(Array.from(chosen).map((o) => (o as HTMLOptionElement).value)).toEqual(['video']);
    expect(panel.querySelector('erp-flows-value[data-field="header-link"]')).toBeTruthy();
  });
});

describe('what the header control writes', () => {
  beforeEach(() => document.body.replaceChildren());

  it('writes the link under the one key of the chosen kind, next to the copy', async () => {
    const el = await mount(whatsapp({ template: 'autumn_promo', vars: { who: 'input.name' } }));
    const panel = await panelOf(el);
    await pick(el, panel.querySelector('select[data-field="header-kind"]'), 'image');
    await compose(el, el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]'), [
      { kind: 'field', path: 'input.picture_url' },
    ]);
    // A lone field still travels as {{…}}: Meta's link is a string.
    expect(step(el).vars).toEqual({ who: 'input.name', header_image: '{{input.picture_url}}' });
  });

  it('carries the link over when the kind changes, and drops it when there is no header', async () => {
    const el = await mount(whatsapp({ template: 'promo', vars: { header_image: 'https://a/x.jpg' } }));
    const panel = await panelOf(el);
    await pick(el, panel.querySelector('select[data-field="header-kind"]'), 'document');
    expect(headerKeys(el)).toEqual(['header_document']);
    expect((step(el).vars as Record<string, unknown>).header_document).toBe('https://a/x.jpg');

    await pick(el, el.renderRoot.querySelector('select[data-field="header-kind"]'), 'none');
    expect(headerKeys(el)).toEqual([]);
  });

  it('takes the header away when the template goes, so the step can still be saved', async () => {
    // The kernel refuses a header without its template at save time: leaving it behind would build
    // a document the owner cannot save and cannot see why.
    const el = await mount(whatsapp({ template: 'promo', vars: { header_image: 'https://a/x.jpg', text: 'hola' } }));
    const panel = await panelOf(el);
    await type(el, panel.querySelector('input[data-field="template"]'), '  ');
    expect(headerKeys(el)).toEqual([]);
    expect((step(el).vars as Record<string, unknown>).text).toBe('hola');
  });

  it('takes the header away when the channel becomes email', async () => {
    const el = await mount(whatsapp({ template: 'promo', vars: { header_image: 'https://a/x.jpg' } }));
    const panel = await panelOf(el);
    await pick(el, panel.querySelector('select#ch-n'), 'email');
    expect(step(el).channel).toBe('email');
    expect(headerKeys(el)).toEqual([]);
  });
});
