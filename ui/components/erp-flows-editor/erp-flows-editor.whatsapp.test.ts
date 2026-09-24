import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

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

describe('what the tap comes home as, in the list of things to check', () => {
  beforeEach(() => document.body.replaceChildren());

  /**
   * The other half of the feature, and the half that makes it useful: offering the options is
   * pointless if the guard that reacts to them cannot name the field. The shape endpoint answers
   * with observed traffic, so on a hub where nobody has tapped yet `reply_id` is in no sample —
   * and the automation that would produce the first tap is the one being written.
   */
  const tapClient = () => {
    const client = fakeClient();
    client.events.shape = vi.fn(async () => ({
      event_name: 'hub.whatsapp.message_received',
      declared_by: ['core'],
      samples: 4,
      fields: [
        { path: 'text', type: 'string', sample: 'hola', redacted: false, truncated: false, seen_in: 4 },
      ],
    })) as never;
    return client;
  };

  async function mountOn(supported: boolean) {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    el.client = tapClient() as never;
    el.t = ((k: string, p?: Record<string, unknown>) =>
      p ? `${k}:${Object.values(p).join('|')}` : k) as never;
    el.interactiveNotify = supported;
    el.flow = {
      id: 'f1',
      name: 'Test',
      enabled: false,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
        steps: [{ id: 'n', kind: 'condition', when: {} }],
      },
    } as never;
    document.body.appendChild(el);
    await settle(el);
    return el;
  }

  const pickerPaths = (el: ErpFlowsEditor): string[] => {
    const picker = el.renderRoot.querySelector('erp-flows-field-picker') as unknown as {
      shape: { fields: { path: string }[] } | null;
    };
    return (picker.shape?.fields ?? []).map((f) => f.path);
  };

  it('offers «the option they tapped» to a later check, before anyone has tapped', async () => {
    const el = await mountOn(true);
    // …and, since hub#1951, WHICH question it answers: the raw `wamid` and — the only one a
    // condition can actually be written against — the step that asked it.
    expect(pickerPaths(el)).toEqual([
      'text',
      'reply_id',
      'reply_title',
      'reply_to',
      'reply_to_step',
    ]);
  });

  it('does not offer them on a hub that could never have sent the options', async () => {
    const el = await mountOn(false);
    expect(pickerPaths(el)).toEqual(['text']);
  });
});

/**
 * **An option is a box you can read, not a slot beside a bin** (flows#75).
 *
 * The row holding an option's identifier and its «remove» button was reusing `.param-row`, the
 * class the http step uses for `name → value → bin`. That class is a THREE column grid above
 * 560px (`0.7fr 1.6fr auto`), and this row only ever has TWO children: the identifier landed in
 * the 0.7fr column and the bin swallowed the 1.6fr one. On a phone (single column) it read fine,
 * so the defect only shows on tablet and desktop — the two viewports the owner actually composes
 * on.
 *
 * happy-dom does no layout: what these tests pin is the CONTRACT that makes the geometry true in
 * a real browser, exactly like the gallery's width tests. They do NOT prove anything about touch.
 */
describe('an option the customer taps is laid out as its own card (flows#75)', () => {
  /** One rule block of the component's static stylesheet, by its selector. */
  const rule = (selector: string): string => {
    const cssText = (ErpFlowsEditor.styles as unknown as { cssText: string }).cssText;
    const at = cssText.indexOf(`${selector} {`);
    expect(at, `${selector} is not in the stylesheet at all`).toBeGreaterThanOrEqual(0);
    return cssText.slice(at, cssText.indexOf('}', at));
  };

  it('gives the identifier and the bin a two column row, not the http step three column one', () => {
    // `1fr auto` is the whole fix: the box takes the line and the bin takes what it needs. It
    // needs no media query, which is why it is right on all three viewports at once.
    const head = rule('.tap-head');
    expect(head).toContain('display: grid');
    expect(head).toContain('grid-template-columns: 1fr auto');
  });

  it('keeps the option card fluid: nothing here caps a width', () => {
    // hub#1605's standing rule for this UI — no container carries a max-width.
    expect(rule('.tap-option')).not.toContain('max-width');
  });

  it('does not lay an option out with the class meant for three columns', async () => {
    const el = await mount(withOptions());
    const panel = await panelOf(el);
    const card = panel.querySelector('[data-tap-option="0"]')!;
    expect(card, 'the option is not on the screen at all').toBeTruthy();
    expect(
      card.querySelector('.tap-head'),
      'the identifier and the bin do not share a row of their own',
    ).toBeTruthy();
    expect(
      card.querySelector('.param-row'),
      'the option still borrows the three column row: the bin eats the wide column',
    ).toBeNull();
  });
});

/**
 * **A message this screen did not compose survives being edited on it** (flows#91).
 *
 * The recipe wi#101 installs writes a `list` with a header, a footer and two groups the customer
 * reads as «Mañana» and «Tarde». The owner opens it to change one label — the only thing she came
 * to do — and the save used to hand Meta a rebuilt `{type, body, action}`: no header, no footer,
 * one nameless group. Nothing failed, nothing warned; the message simply stopped being the message
 * that was designed.
 */
describe('an interactive that came from outside is not rebuilt from the form (flows#91)', () => {
  beforeEach(() => document.body.replaceChildren());

  const fromOutside = () =>
    whatsapp({
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Tus huecos' },
        body: { text: '¿Cuándo te viene bien?' },
        footer: { text: 'Responde tocando una opción' },
        x_meta_future: { anything: true },
        action: {
          button: 'Ver huecos',
          sections: [
            { title: 'Mañana', rows: [{ id: 'm1', title: '10:00' }, { id: 'm2', title: '11:00' }] },
            { title: 'Tarde', rows: [{ id: 't1', title: '17:00' }] },
          ],
        },
      },
    });

  const interactiveOf = (el: ErpFlowsEditor): Record<string, unknown> =>
    step(el).interactive as Record<string, unknown>;

  it('keeps the header, the footer and the group titles when she edits one label', async () => {
    const el = await mount(fromOutside());
    const panel = await panelOf(el);
    await compose(el, panel.querySelector('erp-flows-value[data-field="tap-title-0"]'), [
      { kind: 'text', text: '10:30' },
    ]);
    const after = interactiveOf(el);
    expect(after.header, 'the header the client saw is gone').toEqual({
      type: 'text',
      text: 'Tus huecos',
    });
    expect(after.footer, 'the footer the client saw is gone').toEqual({
      text: 'Responde tocando una opción',
    });
    expect(after.x_meta_future, 'a key this screen does not know was deleted').toEqual({
      anything: true,
    });
    const sections = (after.action as Record<string, unknown>).sections as {
      title?: string;
      rows: { id: string; title: unknown }[];
    }[];
    expect(sections.map((s) => s.title)).toEqual(['Mañana', 'Tarde']);
    expect(sections[0].rows[0].title).toBe('10:30');
  });

  it('keeps them when she adds a row and when she removes one', async () => {
    const el = await mount(fromOutside());
    let panel = await panelOf(el);
    (panel.querySelector('[data-act="add-tap-option"]') as HTMLElement | null)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await settle(el);
    panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    (panel.querySelector('[data-act="remove-tap-option-0"]') as HTMLElement | null)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await settle(el);
    const after = interactiveOf(el);
    const sections = (after.action as Record<string, unknown>).sections as {
      title?: string;
      rows: { id: string }[];
    }[];
    expect(sections.map((s) => s.title)).toEqual(['Mañana', 'Tarde']);
    expect(sections.map((s) => s.rows.map((r) => r.id))).toEqual([['m2'], ['t1', '']]);
    expect(after.header).toBeTruthy();
  });
});

/**
 * **The message the owner already typed does not disappear when she changes her mind** (flows#90).
 *
 * She writes «Tenemos estos huecos libres esta semana», then realises she would rather the client
 * TAPPED an answer than typed one. The copy has to go out of the document — the hub refuses a step
 * carrying both, `conflicting_message_type` — but that is a reason to MOVE it, not to lose it:
 * there is no undo on this screen, so what goes is gone and has to be typed again.
 */
describe('changing the mode keeps the sentence that was already written (flows#90)', () => {
  beforeEach(() => document.body.replaceChildren());

  /** What the box on screen actually shows, read from the parts the picker composes. */
  const shown = (box: Element | null | undefined): string => {
    expect(box, 'the box is not on the screen at all').toBeTruthy();
    const parts =
      (box as unknown as { parts?: { kind: string; text?: string; path?: string }[] }).parts ?? [];
    return parts.map((p) => (p.kind === 'field' ? `{{${p.path}}}` : (p.text ?? ''))).join('');
  };

  it('opens the options with the copy she had just written, not an empty box', async () => {
    const el = await mount(whatsapp({ vars: { text: 'Tenemos huecos el jueves' } }));
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'options');
    const body = (step(el).interactive as Record<string, Record<string, unknown>>).body;
    expect(body.text).toBe('Tenemos huecos el jueves');
    const panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    expect(shown(panel.querySelector('erp-flows-value[data-field="tap-body"]'))).toBe(
      'Tenemos huecos el jueves',
    );
  });

  it('hands the message back when she returns to plain text', async () => {
    const el = await mount(withOptions());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'text');
    expect((step(el).vars as Record<string, unknown>).text).toBe('¿Cuándo te viene bien?');
    const panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    expect(shown(panel.querySelector('erp-flows-value[data-field="var-text"]'))).toBe(
      '¿Cuándo te viene bien?',
    );
  });

  it('carries a composed message across, pills and all', async () => {
    const el = await mount(whatsapp({ vars: { text: 'Hola {{input.name}}' } }));
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'options');
    const body = (step(el).interactive as Record<string, Record<string, unknown>>).body;
    expect(body.text).toBe('Hola {{input.name}}');
  });

  /**
   * The same loss through the other door: the options only exist on WhatsApp, so picking email
   * takes them away — and used to take the sentence with them, on a panel that then showed an
   * empty message box.
   */
  it('keeps the message when she moves the step to email instead', async () => {
    const el = await mount(withOptions());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="channel"]'), 'email');
    expect('interactive' in step(el)).toBe(false);
    expect((step(el).vars as Record<string, unknown>).text).toBe('¿Cuándo te viene bien?');
  });
});

/**
 * **Se lo piensa y lo devuelve** (flows#95).
 *
 * The owner opens a step that arrived from a recipe with a header, a footer and two titled groups,
 * flips «Qué es este mensaje» to plain text to reread the sentence on its own, thinks better of it
 * and flips back. What came back was one empty button: the mode switch has to take `interactive`
 * off the document (the hub refuses a step carrying both), so there was nothing left to rebuild
 * from. The screen remembers it instead — for as long as it is open, which is as long as
 * «me lo pienso» lasts.
 */
describe('flipping out of the options mode and back keeps the message (flows#95)', () => {
  beforeEach(() => document.body.replaceChildren());

  const rich = () =>
    whatsapp({
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Tus huecos' },
        body: { text: 'Elige hueco' },
        footer: { text: 'Toca una opción' },
        action: {
          button: 'Ver huecos',
          sections: [
            { title: 'Jueves', rows: [{ id: 'j1', title: '10:00' }] },
            { title: 'Viernes', rows: [{ id: 'v1', title: '17:00' }] },
          ],
        },
      },
    });

  const mode = (el: ErpFlowsEditor): Element | null =>
    el.renderRoot.querySelector('[data-node="n"] .panel select[data-field="notify-mode"]');

  /** The open panel — opening the card only if it is closed, since `panelOf` TOGGLES. */
  const openPanel = async (el: ErpFlowsEditor): Promise<Element> =>
    el.renderRoot.querySelector('[data-node="n"] .panel') ?? (await panelOf(el));

  const listOf = (el: ErpFlowsEditor) => {
    const back = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(back.type, 'the list came back as a bare button').toBe('list');
    return back.action.sections as { title?: string; rows: { id: string }[] }[];
  };

  it('gives back the list, its groups, its titles and the button that opens it', async () => {
    const el = await mount(rich());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'text');
    expect('interactive' in step(el), 'the copy mode still carries the options').toBe(false);
    await pick(el, mode(el), 'options');

    const back = step(el).interactive as Record<string, unknown>;
    expect(back.type, 'the list came back as a bare button').toBe('list');
    expect(back.header).toEqual({ type: 'text', text: 'Tus huecos' });
    expect(back.footer).toEqual({ text: 'Toca una opción' });
    const action = back.action as Record<string, unknown>;
    expect(action.button).toBe('Ver huecos');
    const sections = action.sections as { title?: string; rows: { id: string }[] }[];
    expect(sections.map((s) => s.title)).toEqual(['Jueves', 'Viernes']);
    expect(sections.map((s) => s.rows.map((r) => r.id))).toEqual([['j1'], ['v1']]);
  });

  it('keeps the sentence she rewrote while it was a plain message', async () => {
    const el = await mount(rich());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'text');
    const panel = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    await compose(el, panel.querySelector('erp-flows-value[data-field="var-text"]'), [
      { kind: 'text', text: 'Estos son los huecos' },
    ]);
    await pick(el, mode(el), 'options');
    const back = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(back.body.text).toBe('Estos son los huecos');
    expect(back.type).toBe('list');
  });

  it('remembers what she edited, not what the recipe brought', async () => {
    const el = await mount(rich());
    let panel = await panelOf(el);
    await type(el, panel.querySelector('input[data-field="tap-id-0"]'), 'jueves_10');
    await pick(el, mode(el), 'text');
    await pick(el, mode(el), 'options');
    expect(listOf(el)[0].rows[0].id).toBe('jueves_10');
  });

  /**
   * The memory belongs to the flow on screen, not to the screen: `n` is the id every one-step
   * automation gets, so a memory that outlived the flow would put one automation's message into
   * another's.
   */
  it('does not hand one automation’s message to the next one', async () => {
    const el = await mount(rich());
    await pick(el, (await panelOf(el)).querySelector('select[data-field="notify-mode"]'), 'text');
    el.flow = {
      id: 'f2',
      name: 'Otra',
      enabled: false,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'sale.completed' }],
        steps: whatsapp({ vars: { text: 'otra cosa' } }),
      },
    } as never;
    await settle(el);
    await pick(el, (await openPanel(el)).querySelector('select[data-field="notify-mode"]'), 'options');
    const back = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(back.type, 'the other automation’s message leaked in').toBe('button');
    expect(back.header).toBeUndefined();
    expect(back.body.text).toBe('otra cosa');
  });
});

/**
 * The same round trip through the OTHER door (flows#95): the options only exist on WhatsApp, so
 * picking email takes them off the document exactly like the mode switch does.
 */
describe('the trip through email keeps the message too (flows#95)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('gives the list back after a detour to email and back', async () => {
    const el = await mount(
      whatsapp({
        interactive: {
          type: 'list',
          header: { type: 'text', text: 'Tus huecos' },
          body: { text: 'Elige hueco' },
          action: {
            button: 'Ver huecos',
            sections: [{ title: 'Jueves', rows: [{ id: 'j1', title: '10:00' }] }],
          },
        },
      }),
    );
    const panel = await panelOf(el);
    await pick(el, panel.querySelector('select[data-field="channel"]'), 'email');
    expect('interactive' in step(el)).toBe(false);
    const back = el.renderRoot.querySelector('[data-node="n"] .panel')!;
    await pick(el, back.querySelector('select[data-field="channel"]'), 'whatsapp');
    await pick(
      el,
      el.renderRoot.querySelector('[data-node="n"] .panel select[data-field="notify-mode"]'),
      'options',
    );
    const restored = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(restored.type, 'the detour through email threw the message away').toBe('list');
    expect(restored.header).toEqual({ type: 'text', text: 'Tus huecos' });
    expect((restored.action.sections as { title?: string }[])[0].title).toBe('Jueves');
  });
});

/**
 * **The two doors, taken one after the other** (flows#95).
 *
 * The message is written down on the way OUT, and there are two ways out — the mode and the
 * channel. Taken in a row they are not the same trip twice: she flips to plain text to reread the
 * sentence on its own, and only THEN decides this one should go by email. The channel door then
 * finds a step carrying nothing, and a screen that wrote that nothing down would erase what the
 * mode door had just saved — the bug of this issue again, by the long way round.
 *
 * And the memory belongs to a STEP, not to the editor: an automation that sends two WhatsApp
 * messages has two of them on screen at once.
 */
describe('the memory survives the second door and stays with its own step (flows#95)', () => {
  beforeEach(() => document.body.replaceChildren());

  const list = (text: string) => ({
    type: 'list',
    header: { type: 'text', text: 'Tus huecos' },
    body: { text },
    action: {
      button: 'Ver huecos',
      sections: [{ title: 'Jueves', rows: [{ id: 'j1', title: '10:00' }] }],
    },
  });

  /** The panel of a given card, opening it only if it is not the one already open. */
  const panelFor = async (el: ErpFlowsEditor, node: string): Promise<Element> => {
    const open = el.renderRoot.querySelector(`[data-node="${node}"] .panel`);
    if (open) return open;
    const opener = el.renderRoot.querySelector(`[data-node="${node}"] button.open`) as HTMLButtonElement;
    expect(opener, `the card ${node} has no way to open it`).toBeTruthy();
    opener.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    await settle(el);
    return el.renderRoot.querySelector(`[data-node="${node}"] .panel`)!;
  };

  const field = async (el: ErpFlowsEditor, node: string, name: string): Promise<Element | null> =>
    (await panelFor(el, node)).querySelector(`select[data-field="${name}"]`);

  it('keeps it when the email detour starts from plain text', async () => {
    const el = await mount(whatsapp({ interactive: list('Elige hueco') }));
    // Out through the mode door first: the message is now only in the screen's memory.
    await pick(el, await field(el, 'n', 'notify-mode'), 'text');
    // …and only now does she decide it should be an email. The step carries nothing to remember;
    // writing that down would throw away what the first door saved.
    await pick(el, await field(el, 'n', 'channel'), 'email');
    await pick(el, await field(el, 'n', 'channel'), 'whatsapp');
    await pick(el, await field(el, 'n', 'notify-mode'), 'options');

    const back = step(el).interactive as Record<string, Record<string, unknown>>;
    expect(back.type, 'the second door threw the message away').toBe('list');
    expect(back.header).toEqual({ type: 'text', text: 'Tus huecos' });
    expect((back.action.sections as { title?: string }[])[0].title).toBe('Jueves');
  });

  it('does not give one step the message of the other', async () => {
    const el = await mount([
      { ...whatsapp({ interactive: list('Elige hueco') })[0] },
      {
        ...whatsapp({
          interactive: {
            type: 'button',
            body: { text: '¿Te va bien?' },
            action: { buttons: [{ type: 'reply', reply: { id: 'ok', title: 'Sí' } }] },
          },
        })[0],
        id: 'n2',
      },
    ]);
    await pick(el, await field(el, 'n', 'notify-mode'), 'text');
    await pick(el, await field(el, 'n2', 'notify-mode'), 'text');
    await pick(el, await field(el, 'n', 'notify-mode'), 'options');

    const back = el.document.steps[0] as unknown as Record<string, Record<string, unknown>>;
    expect((back.interactive as Record<string, unknown>).type, 'the other step’s message came back').toBe('list');
    expect((back.interactive as Record<string, Record<string, unknown>>).body.text).toBe('Elige hueco');
    // …and the one still in text mode is untouched.
    expect('interactive' in (el.document.steps[1] as unknown as Record<string, unknown>)).toBe(false);
  });
});

/**
 * **«If they answer my question» is written by picking the question** (flows#118).
 *
 * `reply_to_step` holds the internal id of the step that asked (`s3k9xq`), and that id is shown
 * nowhere on screen. So when a check compares that field, its value is chosen from a dropdown of
 * the steps that send a WhatsApp — this automation's and the others', because the reminder that
 * asks is usually a different automation from the one that handles the answer — each one said by
 * its automation and its message. Zapier, Make and Shopify Flow do the same whenever a field
 * refers to another step: it is picked, never typed.
 */
describe('the question a reply answers is picked from a list (flows#118)', () => {
  beforeEach(() => document.body.replaceChildren());

  const REMINDER = {
    id: 'f-ask',
    name: 'Recordatorio de cita',
    enabled: true,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'cron', cron: '0 9 * * *' }],
      steps: [
        { id: 'e1', kind: 'notify', channel: 'email', vars: { text: 'Un correo' } },
        {
          id: 's3k9xq',
          kind: 'notify',
          channel: 'whatsapp',
          interactive: { type: 'button', body: { text: '¿Confirmas tu cita?' }, action: { buttons: [] } },
        },
      ],
    },
  };

  async function mountGuard(
    when: Record<string, unknown>,
    list: () => Promise<unknown> = async () => [REMINDER],
  ): Promise<ErpFlowsEditor> {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    const client = fakeClient();
    client.flows.list = vi.fn(list) as never;
    el.client = client as never;
    el.t = ((k: string, p?: Record<string, unknown>) =>
      p ? `${k}:${Object.values(p).join('|')}` : k) as never;
    el.interactiveNotify = true;
    el.flow = {
      id: 'f-tap',
      name: 'Atender respuesta',
      enabled: false,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
        steps: [{ id: 'g', kind: 'condition', when }],
      },
    } as never;
    document.body.appendChild(el);
    await settle(el);
    (el.renderRoot.querySelector('[data-node="g"] button.open') as HTMLButtonElement).click();
    await settle(el);
    await settle(el);
    return el;
  }

  const valueBox = (el: ErpFlowsEditor) =>
    el.renderRoot.querySelector('select[data-field="reply-step"]') as HTMLSelectElement | null;

  it('offers the WhatsApp steps of the other automations by what they say, not a text box', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } });
    const select = valueBox(el);
    expect(select).not.toBeNull();
    const labels = [...select!.options].filter((o) => o.value).map((o) => o.textContent);
    expect(labels).toEqual(['ui.replyStepOption:Recordatorio de cita|¿Confirmas tu cita?']);
    // The id-typing box is gone for this field.
    expect(el.renderRoot.querySelector('.guard-row input[data-field="guard-value"]')).toBeNull();
  });

  it('writes the chosen step’s id into the check', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } });
    const select = valueBox(el)!;
    select.value = [...select.options].find((o) => o.textContent?.includes('¿Confirmas tu cita?'))!.value;
    select.dispatchEvent(new Event('change'));
    await settle(el);
    expect(el.document.steps[0].when).toEqual({ 'input.reply_to_step': { eq: 's3k9xq' } });
  });

  it('keeps a saved choice whose step no longer exists, and says so', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: 'gone12' } });
    const select = valueBox(el)!;
    const kept = [...select.options].find((o) => o.textContent === 'ui.replyStepMissing');
    expect(kept).toBeDefined();
    expect(select.value).toBe(kept!.value);
    // …and nothing was rewritten just by looking.
    expect(el.document.steps[0].when).toEqual({ 'input.reply_to_step': { eq: 'gone12' } });
  });

  it('says there is no question to pick when no automation sends a WhatsApp', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } }, async () => []);
    expect(el.renderRoot.querySelector('[data-field="reply-step-empty"]')).not.toBeNull();
  });

  it('says the list could not be read, instead of an empty dropdown', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } }, async () => {
      throw new Error('boom');
    });
    expect(el.renderRoot.querySelector('[data-field="reply-step-error"]')).not.toBeNull();
  });

  it('lets the owner try again after the list failed', async () => {
    let calls = 0;
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } }, async () => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
      return [REMINDER];
    });
    (el.renderRoot.querySelector('[data-act="reply-step-retry"]') as HTMLElement).click();
    await settle(el);
    await settle(el);
    expect(el.renderRoot.querySelector('[data-field="reply-step-error"]')).toBeNull();
    expect([...valueBox(el)!.options].map((o) => o.textContent)).toContain(
      'ui.replyStepOption:Recordatorio de cita|¿Confirmas tu cita?',
    );
  });

  it('shows it is loading while the automations are on their way', async () => {
    const el = await mountGuard({ 'input.reply_to_step': { eq: '' } }, () => new Promise(() => {}));
    const select = valueBox(el)!;
    expect(select.disabled).toBe(true);
    expect(select.options[0].textContent).toBe('ui.replyStepLoading');
  });

  it('leaves every other field as a box you type into', async () => {
    const el = await mountGuard({ 'input.reply_id': { eq: 'yes' } });
    expect(valueBox(el)).toBeNull();
    expect(el.renderRoot.querySelector('.guard-row input[data-field="guard-value"]')).not.toBeNull();
  });
});

/**
 * **«The question it answers» ties the answer to the automation that asked** (flows#124).
 *
 * A step id is unique inside its automation and not across them, so the same template installed
 * twice — «confirm the appointment» for two services — asks with the same step. Comparing only
 * the step made the customer's «Yes» to one fire its twin too. The hub now says which automation
 * sent the question (`reply_to_flow`, hub#1962), and picking the question writes it beside the
 * step: two rows, both compared.
 *
 * On a hub that has never been SEEN sending `reply_to_flow` the second row is not written: an
 * older core leaves the field out, a missing field never equals anything, and the check would
 * stop matching every answer — worse than the bug it fixes.
 */
describe('picking the question ties the answer to its automation (flows#124)', () => {
  beforeEach(() => document.body.replaceChildren());

  const ask = (flowId: string, name: string, text: string) => ({
    id: flowId,
    name,
    enabled: true,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'cron', cron: '0 9 * * *' }],
      steps: [
        {
          id: 'confirm',
          kind: 'notify',
          channel: 'whatsapp',
          interactive: { type: 'button', body: { text }, action: { buttons: [] } },
        },
      ],
    },
  });
  const CUT = ask('f-cut', 'Confirmar corte', '¿Confirmas el corte?');
  const DYE = ask('f-dye', 'Confirmar tinte', '¿Confirmas el tinte?');

  /** What `GET /api/hub/events/shape` answers for the WhatsApp event on a hub that runs hub#1962. */
  const shapeWith = (fields: string[]) => ({
    event_name: 'hub.whatsapp.message_received',
    declared_by: ['hub'],
    samples: 3,
    fields: fields.map((path) => ({ path, type: 'string', sample: '', redacted: false, truncated: false, seen_in: 3 })),
  });
  const NEW_CORE = shapeWith(['from', 'text', 'reply_to_step', 'reply_to_flow']);
  const OLD_CORE = shapeWith(['from', 'text', 'reply_to_step']);

  async function mountGuard(opts: {
    when: Record<string, unknown>;
    shape?: unknown;
    list?: unknown[];
    id?: string;
    extraSteps?: unknown[];
  }): Promise<ErpFlowsEditor> {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    const client = fakeClient();
    client.flows.list = vi.fn(async () => opts.list ?? [CUT, DYE]) as never;
    client.events.shape = vi.fn(async () => opts.shape ?? NEW_CORE) as never;
    el.client = client as never;
    el.t = ((k: string, p?: Record<string, unknown>) =>
      p ? `${k}:${Object.values(p).join('|')}` : k) as never;
    el.interactiveNotify = true;
    el.flow = {
      id: opts.id,
      name: 'Atender respuesta',
      enabled: false,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
        steps: [...(opts.extraSteps ?? []), { id: 'g', kind: 'condition', when: opts.when }],
      },
    } as never;
    document.body.appendChild(el);
    await settle(el);
    (el.renderRoot.querySelector('[data-node="g"] button.open') as HTMLButtonElement).click();
    await settle(el);
    await settle(el);
    return el;
  }

  const select = (el: ErpFlowsEditor) =>
    el.renderRoot.querySelector('select[data-field="reply-step"]') as HTMLSelectElement;
  /**
   * The words of the option the dropdown marks as chosen. Read from the `selected` attribute, which
   * is what a browser honours when the options land under a `<select>` whose `.value` Lit set a
   * moment earlier; happy-dom ignores it on insertion and picks the first non-empty option, so its
   * `.value` would report the first automation whatever the guard says.
   */
  const shown = (box: HTMLSelectElement) => [...box.options].find((o) => o.hasAttribute('selected'))?.textContent;
  const guard = (el: ErpFlowsEditor) => el.document.steps[el.document.steps.length - 1].when;
  const choose = async (el: ErpFlowsEditor, label: string) => {
    const box = select(el);
    const opt = [...box.options].find((o) => o.textContent?.includes(label));
    expect(opt, `an option says «${label}»`).toBeDefined();
    box.value = opt!.value;
    box.dispatchEvent(new Event('change'));
    await settle(el);
  };

  it('offers the same step of two automations as two different choices', async () => {
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: '' } } });
    const options = [...select(el).options].filter((o) => o.value);
    expect(options.map((o) => o.textContent)).toEqual([
      'ui.replyStepOption:Confirmar corte|¿Confirmas el corte?',
      'ui.replyStepOption:Confirmar tinte|¿Confirmas el tinte?',
    ]);
    expect(new Set(options.map((o) => o.value)).size, 'each choice has its own value').toBe(2);
  });

  it('picking the second one saves its step AND its automation', async () => {
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: '' } } });
    await choose(el, 'Confirmar tinte');
    expect(guard(el)).toEqual({
      'input.reply_to_step': { eq: 'confirm' },
      'input.reply_to_flow': { eq: 'f-dye' },
    });
  });

  it('re-picking moves the automation too, never leaving the old one behind', async () => {
    const el = await mountGuard({
      id: 'f-tap',
      when: { 'input.reply_to_step': { eq: 'confirm' }, 'input.reply_to_flow': { eq: 'f-dye' } },
    });
    await choose(el, 'Confirmar corte');
    expect(guard(el)).toEqual({
      'input.reply_to_step': { eq: 'confirm' },
      'input.reply_to_flow': { eq: 'f-cut' },
    });
  });

  it('shows a saved pair as the choice it was, not as the first automation with that step', async () => {
    const el = await mountGuard({
      id: 'f-tap',
      when: { 'input.reply_to_step': { eq: 'confirm' }, 'input.reply_to_flow': { eq: 'f-dye' } },
    });
    const box = select(el);
    expect(shown(box)).toBe('ui.replyStepOption:Confirmar tinte|¿Confirmas el tinte?');
    // The automation id is part of that one choice, not a second row with an id to read.
    expect(el.renderRoot.querySelectorAll('.guard-row')).toHaveLength(1);
    expect(el.renderRoot.querySelector('.guard-row input[data-field="guard-value"]')).toBeNull();
  });

  it('removing the check removes both halves', async () => {
    const el = await mountGuard({
      id: 'f-tap',
      when: { 'input.reply_to_step': { eq: 'confirm' }, 'input.reply_to_flow': { eq: 'f-dye' } },
    });
    (el.renderRoot.querySelector('.guard-row button.icon-btn') as HTMLButtonElement).click();
    await settle(el);
    expect(guard(el)).toEqual({});
  });

  it('a question of THIS automation, already saved, names this automation', async () => {
    const own = { id: 'mine', kind: 'notify', channel: 'whatsapp', vars: { text: '¿Vienes?' } };
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: '' } }, list: [], extraSteps: [own] });
    await choose(el, '¿Vienes?');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'mine' }, 'input.reply_to_flow': { eq: 'f-tap' } });
  });

  it('a question of an automation never saved has no id yet: only the step, as before', async () => {
    const own = { id: 'mine', kind: 'notify', channel: 'whatsapp', vars: { text: '¿Vienes?' } };
    const el = await mountGuard({ id: undefined, when: { 'input.reply_to_step': { eq: '' } }, list: [], extraSteps: [own] });
    await choose(el, '¿Vienes?');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'mine' } });
  });

  it('switching to a question with no automation id drops the old id instead of keeping a stale one', async () => {
    const own = { id: 'mine', kind: 'notify', channel: 'whatsapp', vars: { text: '¿Vienes?' } };
    const el = await mountGuard({
      id: undefined,
      when: { 'input.reply_to_step': { eq: 'confirm' }, 'input.reply_to_flow': { eq: 'f-dye' } },
      extraSteps: [own],
    });
    await choose(el, '¿Vienes?');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'mine' } });
  });

  it('on a hub never seen sending the automation, saves only the step (an older core would never match)', async () => {
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: '' } }, shape: OLD_CORE });
    await choose(el, 'Confirmar tinte');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'confirm' } });
  });

  it('a field the hub names but has never carried is not evidence it sends it', async () => {
    const unseen = shapeWith(['from', 'text', 'reply_to_step']);
    unseen.fields.push({ path: 'reply_to_flow', type: 'string', sample: '', redacted: false, truncated: false, seen_in: 0 });
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: '' } }, shape: unseen });
    await choose(el, 'Confirmar tinte');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'confirm' } });
  });

  it('«does not answer this question» stays one comparison on the step', async () => {
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { neq: '' } } });
    await choose(el, 'Confirmar tinte');
    // Two `neq` rows would mean «neither this step NOR this automation» — not what was picked.
    expect(guard(el)).toEqual({ 'input.reply_to_step': { neq: 'confirm' } });
  });

  it('a guard saved before, with the step only, still shows its question and is left as it was', async () => {
    const el = await mountGuard({ id: 'f-tap', when: { 'input.reply_to_step': { eq: 'confirm' } } });
    const box = select(el);
    expect(shown(box)).toBe('ui.replyStepOption:Confirmar corte|¿Confirmas el corte?');
    expect(guard(el)).toEqual({ 'input.reply_to_step': { eq: 'confirm' } });
  });
});
