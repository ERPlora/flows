import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import type { ErpFlowsGallery } from './erp-flows-gallery';
import { TEMPLATES } from '../../lib/templates';

/**
 * **The hub these tests are about: one on a current core** (flows#92).
 *
 * The gallery's kernel probe is fail-closed, so a mount that says nothing about the hub is a hub
 * that declares nothing — and the card whose document needs `interactive`/`output` is correctly
 * absent from it. Every test here that is about something ELSE says «a normal hub» once, right
 * here, so the floor is asserted where it belongs and nowhere else.
 */
const CURRENT_CORE = schemaFacts(
  {
    $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
  },
  // The release goes in too since flows#111: one need is answered by `core_version` and not by the
  // schema, so a hub described by its schema alone is a hub that cannot store a read's limit —
  // and the two appointment cards would be absent from every test in this file.
  QUERY_GRANT_PIN_CORE,
);


/**
 * **Every control on the gallery, driven the way a person drives it** (flows#17).
 *
 * The sibling of `erp-flows-editor.interaction.test.ts`, and for the same reason: the gallery's
 * own suite reaches for `el.open(id)` and `el.use()`, so a card whose click never arrives would
 * have kept it green. Nothing here touches a method or a property on the component — a control is
 * found in the shadow root, a real `click` is dispatched, and the assertion is on what the owner
 * would then see.
 */

const t = (key: string): string => key;

function hub() {
  return {
    flows: { create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })) },
    events: {
      shape: vi.fn(async (name: string) => ({
        event_name: name,
        declared_by: ['x'],
        samples: 0,
        fields: [],
      })),
    },
  };
}

async function mount(): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
  el.client = hub() as never;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

async function click(el: ErpFlowsGallery, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
}

const cardOf = (el: ErpFlowsGallery, id: string): HTMLElement =>
  el.renderRoot.querySelector(`[data-template="${id}"]`) as HTMLElement;

describe('every card on the gallery answers a click', () => {
  beforeEach(() => document.body.replaceChildren());

  // The control that stops the rest of this file passing on an empty gallery.
  it('draws one card per template, all shut', async () => {
    const el = await mount();
    const cards = el.renderRoot.querySelectorAll('[data-template]');
    expect(cards).toHaveLength(TEMPLATES.length);
    expect(cards.length).toBeGreaterThan(3);
    expect(el.renderRoot.querySelector('.panel')).toBeNull();
  });

  it('opens EACH one, and says so, when its own button is clicked', async () => {
    for (const template of TEMPLATES) {
      document.body.replaceChildren();
      const el = await mount();
      const opener = cardOf(el, template.id).querySelector('button.pick');
      expect(opener?.getAttribute('aria-expanded'), template.id).toBe('false');

      await click(el, opener);

      const card = cardOf(el, template.id);
      expect(card.querySelector('.panel'), template.id).toBeTruthy();
      expect(card.querySelector('button.pick')?.getAttribute('aria-expanded')).toBe('true');
      // One at a time: this is a decision, not a comparison table.
      expect(el.renderRoot.querySelectorAll('.panel')).toHaveLength(1);
    }
  });

  it('shuts the one that was open when another is clicked', async () => {
    const el = await mount();
    const [first, second] = TEMPLATES;
    await click(el, cardOf(el, first.id).querySelector('button.pick'));
    await click(el, cardOf(el, second.id).querySelector('button.pick'));
    expect(cardOf(el, first.id).querySelector('.panel')).toBeNull();
    expect(cardOf(el, second.id).querySelector('.panel')).toBeTruthy();
  });

  /** The button and the thing it unfolds, tied together — the panel is not read out otherwise. */
  it('points at the panel it unfolds', async () => {
    const el = await mount();
    const opener = cardOf(el, TEMPLATES[0].id).querySelector('button.pick')!;
    expect(opener.getAttribute('aria-controls')).toBeTruthy();
    await click(el, opener);
    const panel = cardOf(el, TEMPLATES[0].id).querySelector('.panel')!;
    expect(panel.id).toBe(opener.getAttribute('aria-controls'));
  });
});

describe('«Use this one», from a click and not from a method call', () => {
  beforeEach(() => document.body.replaceChildren());

  it('creates the automation PAUSED and hands it over', async () => {
    const el = await mount();
    const client = el.client as unknown as ReturnType<typeof hub>;
    const seen: CustomEvent[] = [];
    el.addEventListener('flows-template-used', (e) => seen.push(e as CustomEvent));

    await click(el, cardOf(el, 'no-show-followup').querySelector('button.pick'));
    await click(el, cardOf(el, 'no-show-followup').querySelector('[data-act="use"]'));

    expect(client.flows.create).toHaveBeenCalledTimes(1);
    expect((client.flows.create.mock.calls[0][0] as { enabled: boolean }).enabled).toBe(false);
    expect(seen).toHaveLength(1);
  });
});

describe('«How does this work?»', () => {
  beforeEach(() => document.body.replaceChildren());

  it('asks the screen that owns the guide to show it', async () => {
    const el = await mount();
    const seen: Event[] = [];
    el.addEventListener('flows-open-guide', (e) => seen.push(e));
    await click(el, el.renderRoot.querySelector('[data-act="guide"]'));
    expect(seen).toHaveLength(1);
  });
});
