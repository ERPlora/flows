import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **A picked template asks for the gaps it has, and only those** (flows#132, after hub#2110/#2111).
 *
 * A template whose title reads «Your appointment on {{1}}», or whose «See your booking» button
 * ends its link in a `{{1}}`, cannot go out without a value for that gap: Meta refuses the send
 * and the owner finds out later in the failed-notices tray. The hub now sends both
 * (`vars.header_text`, `vars.button_url_<n>`); the step asks for them the moment she picks such a
 * template — composed in the same picker as the rest of the message — and nowhere else.
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [{ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 }],
};

function fakeClient(query?: unknown) {
  return {
    ...(query ? { queryAllOptional: query } : {}),
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
 * @param supported whether the HUB declared the title and link keys — the fail-closed facts from `schemaFacts`.
 */
async function mount(steps: unknown[], query?: unknown, supported = true): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient(query) as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.headerMedia = supported;
  el.headerText = supported;
  el.buttonUrl = supported;
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

const vars = (el: ErpFlowsEditor): Record<string, unknown> => (step(el).vars ?? {}) as Record<string, unknown>;

const rows = [
  {
    name: 'booking_link',
    header_format: 'TEXT',
    header: 'Your appointment on {{1}}',
    buttons: JSON.stringify([
      { type: 'QUICK_REPLY', text: 'OK' },
      { type: 'URL', text: 'See it', url: 'https://salon.example/b/{{1}}' },
    ]),
    meta_status: 'approved',
    is_active: 1,
  },
  { name: 'plain', header_format: 'TEXT', header: 'Hello', buttons: '[]', meta_status: 'approved', is_active: 1 },
  { name: 'promo', header_format: 'IMAGE', header: '', buttons: '[]', meta_status: 'approved', is_active: 1 },
];
const listed = () => vi.fn(async () => rows);
const templateSelect = (el: ErpFlowsEditor) => el.renderRoot.querySelector('select[data-field="template-pick"]');

describe('the gaps of the picked template', () => {
  beforeEach(() => document.body.replaceChildren());

  it('asks for the title value and the link end the template needs, and writes them', async () => {
    const el = await mount(whatsapp({ vars: { text: 'hola' } }), listed());
    await panelOf(el);
    await pick(el, templateSelect(el), 'booking_link');
    expect(vars(el)).toEqual({ text: 'hola', header_text: '', button_url_1: '' });

    await compose(el, el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]'), [
      { kind: 'field', path: 'input.day' },
    ]);
    await compose(el, el.renderRoot.querySelector('erp-flows-value[data-field="button-url-1"]'), [
      { kind: 'field', path: 'input.code' },
    ]);
    expect(vars(el)).toEqual({ text: 'hola', header_text: '{{input.day}}', button_url_1: '{{input.code}}' });
    // Only the button that has a gap is asked for: the quick reply at position 0 has none.
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="button-url-0"]')).toBeNull();
  });

  it('forgets them when she switches to a template without gaps, or to free text', async () => {
    const el = await mount(
      whatsapp({ template: 'booking_link', vars: { text: 'hola', header_text: 'a', button_url_1: 'b' } }),
      listed(),
    );
    await panelOf(el);
    await pick(el, templateSelect(el), 'plain');
    expect(vars(el)).toEqual({ text: 'hola' });
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]')).toBeNull();

    await pick(el, templateSelect(el), 'booking_link');
    await pick(el, templateSelect(el), '');
    expect(vars(el)).toEqual({ text: 'hola' });
  });

  it('drops them when the step becomes an email', async () => {
    const el = await mount(
      whatsapp({ template: 'booking_link', vars: { text: 'hola', header_text: 'a', button_url_1: 'b' } }),
      listed(),
    );
    await panelOf(el);
    await pick(el, el.renderRoot.querySelector('select[data-field="channel"]'), 'email');
    expect(vars(el)).toEqual({ text: 'hola' });
  });

  it('shows what was saved when the step is opened again', async () => {
    const el = await mount(
      whatsapp({ template: 'booking_link', vars: { header_text: '{{input.day}}', button_url_1: '{{input.code}}' } }),
      listed(),
    );
    await panelOf(el);
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="button-url-1"]')).toBeTruthy();
  });

  it('asks for nothing extra on a template without gaps', async () => {
    const el = await mount(whatsapp(), listed());
    await panelOf(el);
    await pick(el, templateSelect(el), 'promo');
    expect(vars(el)).toEqual({ header_image: '' });
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]')).toBeNull();
    expect(el.renderRoot.querySelector('[data-field^="button-url"]')).toBeNull();
  });

  it('warns, instead of writing the keys, on a hub that cannot send them', async () => {
    const el = await mount(whatsapp(), listed(), false);
    await panelOf(el);
    await pick(el, templateSelect(el), 'booking_link');
    expect(vars(el)).toEqual({});
    expect(el.renderRoot.querySelector('[data-field="header-text-unsupported"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('[data-field="button-url-unsupported"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]')).toBeNull();
  });

  // A row from a `whatsapp_inbox` older than #188 carries no `header_format`, so the picture header
  // stays chosen by hand (flows#134) — except when the title itself has a gap: then the header is
  // text, and offering a picture would build the pair the hub refuses.
  it('offers no picture header on an old row whose title has a gap', async () => {
    const old = vi.fn(async () => [{ name: 'dated', header: 'On {{1}}', meta_status: 'approved', is_active: 1 }]);
    const el = await mount(whatsapp({ template: 'dated', vars: { header_text: 'x' } }), old);
    await panelOf(el);
    expect(el.renderRoot.querySelector('select[data-field="header-kind"]')).toBeNull();
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-text"]')).toBeTruthy();
  });
});
