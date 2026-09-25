import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The WhatsApp template is picked from a list, and its header comes with it** (flows#132).
 *
 * Until now the step asked for the template's name typed by hand and for the kind of its header
 * chosen by the owner — two things only Meta's WhatsApp Manager knew. A typo, or the wrong header,
 * and the message never left; she found out days later in the failed-notices tray. Now the step
 * reads the templates `whatsapp_inbox` keeps (whatsapp_inbox#188), offers the approved ones, and
 * writes the header key the chosen template needs. The free text box survives only where the list
 * cannot be read, so an older hub or a hub without the WhatsApp module is not left without a step.
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
 * @param supported whether the HUB declared the header keys — the fail-closed fact from `schemaFacts`.
 */
async function mount(steps: unknown[], query?: unknown, supported = true): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient(query) as never;
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


const rows = [
  { name: 'reminder', header_format: 'TEXT', meta_status: 'approved', is_active: 1 },
  { name: 'autumn_promo', header_format: 'IMAGE', meta_status: 'approved', is_active: 1 },
  { name: 'waiting', header_format: 'TEXT', meta_status: 'pending', is_active: 1 },
];
const listed = () => vi.fn(async () => rows);

const optionValues = (select: Element | null): string[] =>
  Array.from(select?.querySelectorAll('option') ?? []).map((o) => (o as HTMLOptionElement).value);
const chosenOf = (select: Element | null): string[] =>
  Array.from(select?.querySelectorAll('option[selected]') ?? []).map((o) => (o as HTMLOptionElement).value);

describe('the template is a list, not a box to type into', () => {
  beforeEach(() => document.body.replaceChildren());

  it('offers the approved templates of the business and no free box', async () => {
    const query = listed();
    const el = await mount(whatsapp(), query);
    const panel = await panelOf(el);
    await settle(el);
    expect(query).toHaveBeenCalledWith('whatsapp_inbox.templates.list', {});
    const select = el.renderRoot.querySelector('select[data-field="template-pick"]');
    expect(select, 'the step still asks for the name typed by hand').toBeTruthy();
    // The empty option is the plain text a customer can be answered with inside 24 h.
    expect(optionValues(select)).toEqual(['', 'autumn_promo', 'reminder']);
    expect(panel.querySelector('input[data-field="template"]')).toBeNull();
  });

  it('writes the name and the header key the chosen template needs', async () => {
    const el = await mount(whatsapp({ vars: { text: 'hola' } }), listed());
    await panelOf(el);
    await settle(el);
    await pick(el, el.renderRoot.querySelector('select[data-field="template-pick"]'), 'autumn_promo');
    expect(step(el).template).toBe('autumn_promo');
    expect(step(el).vars).toEqual({ text: 'hola', header_image: '' });
    // The kind is not asked: only the link is.
    expect(el.renderRoot.querySelector('select[data-field="header-kind"]')).toBeNull();
    expect(el.renderRoot.querySelector('[data-field="header-deduced"]')).toBeTruthy();
    await compose(el, el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]'), [
      { kind: 'field', path: 'input.picture_url' },
    ]);
    expect((step(el).vars as Record<string, unknown>).header_image).toBe('{{input.picture_url}}');

    await pick(el, el.renderRoot.querySelector('select[data-field="template-pick"]'), 'reminder');
    expect(step(el).template).toBe('reminder');
    expect(headerKeys(el)).toEqual([]);
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]')).toBeNull();
  });

  it('goes back to free text with no template and no header', async () => {
    const el = await mount(whatsapp({ template: 'autumn_promo', vars: { header_image: 'https://a/x.jpg' } }), listed());
    await panelOf(el);
    await settle(el);
    const select = el.renderRoot.querySelector('select[data-field="template-pick"]');
    expect(chosenOf(select)).toEqual(['autumn_promo']);
    await pick(el, select, '');
    expect(step(el).template).toBe('');
    expect(headerKeys(el)).toEqual([]);
  });

  it('keeps a name that is not in the list, says so, and still lets her choose the header', async () => {
    const el = await mount(whatsapp({ template: 'old_typed_name' }), listed());
    await panelOf(el);
    await settle(el);
    const select = el.renderRoot.querySelector('select[data-field="template-pick"]');
    expect(optionValues(select)).toContain('old_typed_name');
    expect(chosenOf(select)).toEqual(['old_typed_name']);
    expect(el.renderRoot.querySelector('[data-field="template-unknown"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('select[data-field="header-kind"]')).toBeTruthy();
  });

  it('says there is nothing approved yet instead of an empty list', async () => {
    const el = await mount(whatsapp(), vi.fn(async () => [rows[2]]));
    await panelOf(el);
    await settle(el);
    expect(el.renderRoot.querySelector('[data-field="templates-empty"]')).toBeTruthy();
    expect(optionValues(el.renderRoot.querySelector('select[data-field="template-pick"]'))).toEqual(['']);
  });

  it('warns, instead of writing a header key, on a hub that cannot send one', async () => {
    const el = await mount(whatsapp(), listed(), false);
    await panelOf(el);
    await settle(el);
    await pick(el, el.renderRoot.querySelector('select[data-field="template-pick"]'), 'autumn_promo');
    expect(step(el).template).toBe('autumn_promo');
    expect(headerKeys(el)).toEqual([]);
    expect(el.renderRoot.querySelector('[data-field="header-unsupported"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('erp-flows-value[data-field="header-link"]')).toBeNull();
  });
});

describe('where the list cannot be read, the box stays', () => {
  beforeEach(() => document.body.replaceChildren());

  it('keeps the text box and says why when the hub refuses the list', async () => {
    const denied = vi.fn(async () => {
      throw Object.assign(new Error('x'), { code: 'permission_denied' });
    });
    const el = await mount(whatsapp({ template: 'promo' }), denied);
    const panel = await panelOf(el);
    await settle(el);
    expect(el.renderRoot.querySelector('[data-field="templates-error"]')).toBeTruthy();
    expect(panel.querySelector('input[data-field="template"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('select[data-field="template-pick"]')).toBeNull();
  });

  it('keeps the text box on a hub without the WhatsApp module', async () => {
    const el = await mount(whatsapp(), vi.fn(async () => undefined));
    const panel = await panelOf(el);
    await settle(el);
    expect(panel.querySelector('input[data-field="template"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('[data-field="templates-error"]')).toBeNull();
  });

  it('never asks for the list on an email step, where the name is the subject', async () => {
    const query = listed();
    const el = await mount(whatsapp({ channel: 'email' }), query);
    const panel = await panelOf(el);
    await settle(el);
    expect(query).not.toHaveBeenCalled();
    expect(panel.querySelector('input[data-field="template"]')).toBeTruthy();
  });
});

describe('a list that does not say what the header is', () => {
  beforeEach(() => document.body.replaceChildren());

  // A hub whose `whatsapp_inbox` predates whatsapp_inbox#188 serves the rows without
  // `header_format`. Nothing can be deduced there: hiding the manual selector would leave the
  // owner unable to attach the picture her template carries, which main let her do.
  it('keeps the manual header selector when the row carries no header_format', async () => {
    const bare = vi.fn(async () => [{ name: 'autumn_promo', meta_status: 'approved', is_active: 1 }]);
    const el = await mount(whatsapp({ template: 'autumn_promo', vars: { header_image: 'https://a/x.jpg' } }), bare);
    await panelOf(el);
    await settle(el);
    expect(chosenOf(el.renderRoot.querySelector('select[data-field="template-pick"]'))).toEqual(['autumn_promo']);
    expect(el.renderRoot.querySelector('select[data-field="header-kind"]'), 'the header can no longer be chosen').toBeTruthy();
    expect(el.renderRoot.querySelector('[data-field="header-deduced"]')).toBeNull();
    // Picking it again does not throw the saved link away either.
    await pick(el, el.renderRoot.querySelector('select[data-field="template-pick"]'), 'autumn_promo');
    expect((step(el).vars as Record<string, unknown>).header_image).toBe('https://a/x.jpg');
  });
});
