import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **Offering options the customer TAPS, from the screen the owner already uses** (flows#75).
 *
 * A `notify` step could SAY things and not ASK them. An automation offering three slots wrote them
 * into the copy and begged for a number back — «contesta 1, 2 o 3» — and what came back was free
 * text no `condition` can tell from «las 2». The kernel half landed in hub#1633; this file is the
 * screen half, and it is about two things being true at once:
 *
 * - the control is **the same picker as the copy**, because an option's label is composed exactly
 *   like a message is (`{{steps.x.y}}`), and
 * - the control **is not there at all** on a hub that cannot take it. That is not politeness: a
 *   document carrying `interactive` on an older core does not degrade, it dies whole
 *   (`flow.invalid_definition`), and today's fleet has not shipped that core yet.
 *
 * Idiom, copied from `erp-flows-editor.interaction.test.ts` and for its reason: **nothing calls a
 * method on the component**. Controls are found in the shadow root and driven with real events, so
 * this file turns red if the wiring goes, not just if the state machine does.
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
 * @param supported what the HUB said about itself — the fail-closed fact from `schemaFacts`.
 */
async function mount(steps: unknown[], supported = true): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.interactiveNotify = supported;
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

const withOptions = () =>
  whatsapp({
    interactive: {
      type: 'button',
      body: { text: '¿Cuándo te viene bien?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'slot_1', title: 'Mañana 10:00' } },
          { type: 'reply', reply: { id: 'slot_2', title: 'Mañana 12:00' } },
        ],
      },
    },
  });

describe('the control only exists where the hub can take it', () => {
  beforeEach(() => document.body.replaceChildren());

  it('offers the two modes on WhatsApp when the hub declared the key', async () => {
    const el = await mount(whatsapp());
    const mode = (await panelOf(el)).querySelector('select[data-field="notify-mode"]');
    expect(mode, 'a hub that supports options is not offering them').toBeTruthy();
    expect(Array.from(mode!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value)).toEqual([
      'text',
      'options',
    ]);
  });

  /**
   * The whole guard, and the one that has to be a test rather than a comment: on the fleet as it
   * stands TODAY, `interactiveNotify` is false everywhere. A screen that let the owner build this
   * document anyway would hand them a flow their hub refuses to parse AT ALL.
   */
  it('does not offer them at all on a hub that never declared it', async () => {
    const el = await mount(whatsapp(), false);
    const panel = await panelOf(el);
    expect(panel.querySelector('[data-field="notify-mode"]')).toBeNull();
    expect(panel.querySelector('[data-field="tap-body"]')).toBeNull();
    // …and the message it CAN send is still fully editable, which is the point of hiding rather
    // than disabling: nothing about the old screen got worse.
    expect(panel.querySelector('erp-flows-value[data-field="var-text"]')).toBeTruthy();
  });

  it('never offers them on email, however new the hub is', async () => {
    // An email has nothing to tap. The kernel refuses the pair by name; the screen refuses to
    // suggest it, so nobody builds a step that only fails on save.
    const el = await mount(whatsapp({ channel: 'email' }));
    expect((await panelOf(el)).querySelector('[data-field="notify-mode"]')).toBeNull();
  });

  it('opens on the mode the step really is in', async () => {
    const el = await mount(withOptions());
    const mode = (await panelOf(el)).querySelector('select[data-field="notify-mode"]') as HTMLSelectElement;
    expect(mode.value).toBe('options');
  });
});

describe('copy and options are two messages and one send', () => {
  beforeEach(() => document.body.replaceChildren());

  it('takes the copy away when the options go in', async () => {
    // The hub answers `conflicting_message_type` for a step carrying both. Leaving `vars` behind
    // would build a document the owner cannot save and cannot see why.
    const el = await mount(whatsapp({ template: 'reminder', vars: { text: 'hola' } }));
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'options');
    expect(step(el).interactive).toBeTruthy();
    expect('vars' in step(el)).toBe(false);
    expect('template' in step(el)).toBe(false);
  });

  it('takes the options away when the copy comes back', async () => {
    const el = await mount(withOptions());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'text');
    expect('interactive' in step(el)).toBe(false);
    // The card is already open — asking `panelOf` again would TOGGLE it shut.
    const back = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    expect(back.querySelector('erp-flows-value[data-field="var-text"]')).toBeTruthy();
  });

  /**
   * The one that bites in real use: the owner builds the options, then decides to send an email
   * instead. Nothing on the email panel mentions `interactive`, so it would sit there invisible
   * and take the whole definition down at save.
   */
  it('takes the options away when the channel stops being WhatsApp', async () => {
    const el = await mount(withOptions());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="channel"]'), 'email');
    expect('interactive' in step(el)).toBe(false);
    expect(step(el).channel).toBe('email');
  });

  it('leaves the options alone when the channel is set to WhatsApp again', async () => {
    const el = await mount(withOptions());
    const panel = await panelOf(el);
    await pick(el, panel.querySelector('select[data-field="channel"]'), 'whatsapp');
    expect(step(el).interactive).toBeTruthy();
  });
});

describe('an option is composed with the same picker as the message', () => {
  beforeEach(() => document.body.replaceChildren());

  it('composes the message body with pills, forced to a template', async () => {
    const el = await mount(withOptions());
    const panel = await panelOf(el);
    await compose(el, panel.querySelector('erp-flows-value[data-field="tap-body"]'), [
      { kind: 'text', text: 'Hola ' },
      { kind: 'field', path: 'input.name' },
    ]);
    // A string, not a bare path: Meta's `body.text` is a string, so the value has to stay one
    // even when it is nothing but a field — the same rule `url` follows in an http step.
    const body = (step(el).interactive as Record<string, Record<string, unknown>>).body;
    expect(body.text).toBe('Hola {{input.name}}');
  });

  it('composes each option label with the picker too', async () => {
    const el = await mount(withOptions());
    const panel = await panelOf(el);
    await compose(el, panel.querySelector('erp-flows-value[data-field="tap-title-0"]'), [
      { kind: 'field', path: 'steps.slots.0.label' },
    ]);
    const action = (step(el).interactive as Record<string, Record<string, unknown>>).action;
    const buttons = action.buttons as { reply: Record<string, unknown> }[];
    expect(buttons[0].reply.title).toBe('{{steps.slots.0.label}}');
    expect(buttons[0].reply.id).toBe('slot_1');
  });

  /**
   * The id is the ONLY thing the reply comes home as (`event.reply_id`), and a `condition`
   * compares it literally. A composed id would be a guard comparing against something that moves.
   */
  it('keeps the identifier a plain literal, with no picker on it', async () => {
    const el = await mount(withOptions());
    const panel = await panelOf(el);
    expect(panel.querySelector('erp-flows-value[data-field="tap-id-0"]')).toBeNull();
    await type(el, panel.querySelector('input[data-field="tap-id-0"]'), 'slot_morning');
    const action = (step(el).interactive as Record<string, Record<string, unknown>>).action;
    expect((action.buttons as { reply: Record<string, unknown> }[])[0].reply.id).toBe('slot_morning');
  });

  it('adds and removes an option from the screen', async () => {
    const el = await mount(withOptions());
    let panel = await panelOf(el);
    (panel.querySelector('[data-act="add-tap-option"]') as HTMLElement | null)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await settle(el);
    const buttonsOf = (): unknown[] => {
      const action = (step(el).interactive as Record<string, Record<string, unknown>>).action;
      return action.buttons as unknown[];
    };
    expect(buttonsOf()).toHaveLength(3);
    panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    (panel.querySelector('[data-act="remove-tap-option-2"]') as HTMLElement | null)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await settle(el);
    expect(buttonsOf()).toHaveLength(2);
  });
});

describe('buttons and a list are not the same message', () => {
  beforeEach(() => document.body.replaceChildren());

  it('asks for the label that OPENS the list, and only for a list', async () => {
    const el = await mount(withOptions());
    let panel = await panelOf(el);
    expect(panel.querySelector('[data-field="tap-open-label"]')).toBeNull();
    await pick(el, panel.querySelector('select[data-field="tap-kind"]'), 'list');
    panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    expect(panel.querySelector('erp-flows-value[data-field="tap-open-label"]')).toBeTruthy();
    // Meta has no description on a button, so it only appears here.
    expect(panel.querySelector('erp-flows-value[data-field="tap-desc-0"]')).toBeTruthy();
  });

  it('carries the options across when the kind changes, instead of starting over', async () => {
    const el = await mount(withOptions());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="tap-kind"]'), 'list');
    const interactive = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(interactive.type).toBe('list');
    const rows = (interactive.action.sections as { rows: Record<string, unknown>[] }[])[0].rows;
    expect(rows.map((r) => r.id)).toEqual(['slot_1', 'slot_2']);
    expect(rows[0].title).toBe('Mañana 10:00');
  });
});

describe('the limits are told to the owner, never enforced on them', () => {
  beforeEach(() => document.body.replaceChildren());

  const fourButtons = () =>
    whatsapp({
      interactive: {
        type: 'button',
        body: { text: 'Elige' },
        action: {
          buttons: [1, 2, 3, 4].map((n) => ({ type: 'reply', reply: { id: `s${n}`, title: `S${n}` } })),
        },
      },
    });

  it('warns about a fourth button, with the number Meta allows', async () => {
    const panel = await panelOf(await mount(fourButtons()));
    const warnings = Array.from(panel.querySelectorAll('ok-inline-feedback[tone="warning"]'))
      .map((n) => n.textContent ?? '')
      .join(' ');
    expect(warnings).toContain('ui.tapTooMany:3');
  });

  /**
   * A warning, not a block, and the reason is not timidity: the SaaS checks these BEFORE it pays
   * for the send and answers with a code. Blocking here would be a second copy of Meta's table,
   * ageing on its own — and it would strand any owner whose hub is newer than this module.
   */
  it('still lets the flow be saved', async () => {
    const el = await mount(fourButtons());
    await panelOf(el);
    const save = el.renderRoot.querySelector('ion-button[data-act="save"], [data-act="save"]');
    expect((save as HTMLElement | null)?.hasAttribute('disabled')).not.toBe(true);
  });

  it('names the identifier that is repeated, rather than saying one of them is', async () => {
    const el = await mount(
      whatsapp({
        interactive: {
          type: 'button',
          body: { text: 'Elige' },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'same', title: 'A' } },
              { type: 'reply', reply: { id: 'same', title: 'B' } },
            ],
          },
        },
      }),
    );
    const panel = await panelOf(el);
    expect(panel.textContent).toContain('ui.tapDuplicateId:same');
  });
});
