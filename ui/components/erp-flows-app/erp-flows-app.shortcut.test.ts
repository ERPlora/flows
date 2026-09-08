import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';
import { QUERY_GRANT_PIN_CORE } from '../../lib/ai-draft';

/**
 * **A shortcut that names a card wins over whatever this screen was doing** (flows#58).
 *
 * The complaint, from the seat: from Settings → WhatsApp the owner taps «Configurar» on «Reservar
 * citas», lands on Automations with the card open, presses «Usar esta» — and the editor of the
 * automation they just created takes the screen. They leave the module by the menu, come back
 * later, tap the very same «Configurar»… and land in that editor again. The card they asked for is
 * nowhere, and nothing on screen explains why.
 *
 * Why the gallery cannot fix this on its own (flows#57 taught it to answer a second shortcut):
 * while the editor is up, `render()` does not put the gallery on screen at all, so the element
 * that listens for the shortcut is not in the document and the `popstate` reaches nobody. And
 * nothing re-creates this screen either — the shell keeps a module's page alive when the owner
 * leaves it (`hub/apps/web/src/views/ModuleView.vue`, hub#1099) and only re-mounts the element
 * when `route.fullPath` changes, which the SAME shortcut, by definition, does not change.
 *
 * So the screen that owns the editor is the one that has to step aside. Everything below drives
 * the real controls the way flows#17 established: a control is found in the shadow root and a real
 * event is dispatched on it.
 */

const LINKED = 'whatsapp-appointment';

const doc = (trigger: unknown, steps: unknown[] = []) => ({
  schema_version: 1,
  triggers: [trigger],
  steps,
});

const FLOWS = [
  {
    id: 'f1',
    name: 'Aviso de stock bajo',
    enabled: true,
    updated_at: '2026-08-14T10:00:00Z',
    definition: doc({ kind: 'event', event: 'inventory.stock_changed' }, [
      { id: 'a', kind: 'command', command: 'tasks.tasks.create' },
    ]),
  },
];

/** The shell's translator, doing what the shell's really does — see `erp-flows-app.list.test.ts`. */
function translate(catalog: Record<string, unknown>, key: string, params?: Record<string, unknown>): string {
  let node: unknown = (catalog as { en?: unknown }).en ?? catalog;
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  }
  const text = typeof node === 'string' ? node : key;
  return params
    ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole))
    : text;
}

function fakeClient() {
  const rows = [...FLOWS];
  return {
    t: translate,
    flows: {
      list: vi.fn(async () => rows),
      create: vi.fn(async (f: unknown) => ({ id: 'created-1', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      // A hub that KEEPS what it is handed, which is what a hub does — same shape as the editor's
      // fixtures. The card this file drives (`whatsapp-appointment`) installs with pinned
      // permissions, and `applyDeclaredLimits` writes them, reads them back and — fail-closed since
      // flows#86 — rolls the grant back and refuses to move the owner on when the limit did not
      // survive. A stub answering `[]` is a hub that stores nothing, so «Usar esta» would correctly
      // never reach the editor and every test below would go red about SHORTCUTS, which is not
      // what any of them is asking.
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ steps: [] })),
      run: vi.fn(async () => ({})),
      get: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
      // A hub on a CURRENT core, declaring the two step keys `whatsapp-appointment` writes
      // (`interactive`, hub#1633; `output`, hub#1639) and reporting a release that can store the
      // limit its read carries (flows#111). With an empty schema, or an older release, the gallery
      // correctly refuses to offer the card — both floors are fail-closed — and every test below
      // would go red about a card that never appears, which is not what any of them is asking.
      schema: vi.fn(async () => ({
        schema_version: 1,
        core_version: QUERY_GRANT_PIN_CORE,
        schema: {
          $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
        },
      })),
      approvals: vi.fn(async () => []),
    },
    events: {
      shape: vi.fn(async (name: string) => ({ event_name: name, declared_by: ['x'], samples: 0, fields: [] })),
    },
  };
}

async function settle(el: ErpFlowsApp): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(client: unknown = fakeClient()): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await settle(el);
  await settle(el);
  return el;
}

/** Where the shortcut leaves the owner: the shell has already navigated when the module hears it. */
function landOn(search: string): void {
  window.history.replaceState({}, '', `/m/flows/automations${search}`);
}

/** The same tap again: same address, so all the module ever gets is the event. */
async function tapTheShortcutAgain(el: ErpFlowsApp): Promise<void> {
  window.dispatchEvent(new PopStateEvent('popstate'));
  await settle(el);
  await settle(el);
}

const gallery = (el: ErpFlowsApp): Element | null => el.renderRoot.querySelector('erp-flows-gallery');
const editor = (el: ErpFlowsApp): Element | null => el.renderRoot.querySelector('erp-flows-editor');
const guide = (el: ErpFlowsApp): Element | null => el.renderRoot.querySelector('erp-flows-guide');
const openCard = (el: ErpFlowsApp): Element | null =>
  gallery(el)?.shadowRoot?.querySelector(`#panel-${LINKED}`) ?? null;

async function click(el: ErpFlowsApp, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
  await settle(el);
}

/** «Usar esta» on the card the shortcut opened — the tap that puts the editor on screen. */
async function useTheCard(el: ErpFlowsApp): Promise<void> {
  await click(el, openCard(el)?.querySelector('[data-act="use"]'));
}

describe('coming back through the same shortcut with the editor open (flows#58)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    landOn('');
  });

  afterEach(() => {
    landOn('');
  });

  it('opens the card on the first tap, then the editor once it is used', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    expect(openCard(el), 'the first tap did not even open the card').toBeTruthy();
    await useTheCard(el);
    expect(editor(el), '«Usar esta» did not hand the new automation to the editor').toBeTruthy();
    expect(gallery(el), 'the gallery is still on screen behind the editor').toBeNull();
  });

  /** The whole complaint, in one test: the SECOND tap, which is the one that lands wrong today. */
  it('leaves the editor and shows the card again when the same shortcut is tapped again', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    await useTheCard(el);
    expect(editor(el)).toBeTruthy();

    await tapTheShortcutAgain(el);

    expect(gallery(el), 'the second tap left the owner in the editor').toBeTruthy();
    expect(editor(el), 'the editor is still up over the gallery').toBeNull();
    expect(openCard(el), 'the gallery came back without the card the shortcut named').toBeTruthy();
  });

  /**
   * And again. And again after that — the shortcut is served on EVERY navigation that names a
   * card, never «once» (flows#57, and the whole reason this file exists).
   *
   * This is the guard, not a variation: the fix above is one `popstate` listener with no memory of
   * what it has already answered, and the cheapest way to break it is to give it one. A flag —
   * «already served», «same id as last time» — reads like an optimisation and passes every other
   * test in this file, because they all stop at the second tap. The owner does not: they set up
   * one automation, come back, set up the next, come back again. The third tap is where a served-
   * once screen puts them back in the editor, which is the exact complaint of #58 reappearing
   * under a new cause.
   */
  it('serves the same shortcut every single time, not just the second', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();

    for (const tap of [2, 3, 4]) {
      await useTheCard(el);
      expect(editor(el), `tap ${tap}: the card did not open the editor, so this test is not driving the flow`).toBeTruthy();

      await tapTheShortcutAgain(el);

      expect(gallery(el), `tap ${tap} left the owner in the editor: the shortcut is being served only once`).toBeTruthy();
      expect(editor(el), `tap ${tap}: the editor is still up over the gallery`).toBeNull();
      expect(openCard(el), `tap ${tap}: the gallery came back without the card the shortcut named`).toBeTruthy();
    }
  });

  /**
   * The guide is the same shape of screen — it replaces the gallery — so it answers the same way.
   * Left out, a shortcut tapped while the guide is open lands on a page about automations in
   * general instead of the card the owner asked for.
   */
  it('leaves the guide too', async () => {
    const el = await mount();
    await click(el, gallery(el)?.shadowRoot?.querySelector('[data-act="guide"]'));
    expect(guide(el), 'the guide did not open — this test is driving the wrong control').toBeTruthy();

    landOn(`?template=${LINKED}`);
    await tapTheShortcutAgain(el);

    expect(guide(el), 'the shortcut was swallowed by the guide').toBeNull();
    expect(openCard(el)).toBeTruthy();
  });

  /**
   * A navigation that names no card is not a shortcut: the browser's Back button, a jump to
   * another module, the shell tidying the address. Closing the editor on any of those would throw
   * away what the owner was writing — a far worse bug than the one this file fixes.
   */
  it('leaves the editor alone when the navigation names no card', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    await useTheCard(el);

    landOn('');
    await tapTheShortcutAgain(el);
    expect(editor(el), 'a navigation with no card closed the editor').toBeTruthy();

    landOn('?status=paused');
    await tapTheShortcutAgain(el);
    expect(editor(el), 'somebody else’s parameter closed the editor').toBeTruthy();

    landOn('?template=');
    await tapTheShortcutAgain(el);
    expect(editor(el), 'an empty parameter closed the editor').toBeTruthy();
  });

  /**
   * An id this catalogue does not have still asks for the gallery — an old link or a card retired
   * two releases ago lands on the screen the owner expected, never on the editor of an unrelated
   * automation. Same rule the gallery already applies to the parameter (flows#56).
   */
  it('steps aside for a card this hub does not have, and shows the plain gallery', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    await useTheCard(el);

    landOn('?template=a-template-that-never-existed');
    await tapTheShortcutAgain(el);

    expect(editor(el), 'an unknown card left the owner in the editor').toBeNull();
    expect(gallery(el)).toBeTruthy();
  });

  it('stops listening once it is off the screen', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    await useTheCard(el);
    // 🪤 `el.remove()` would look like the same thing and prove nothing: happy-dom 20 does not run
    // `disconnectedCallback` for it (measured here — the listener stayed and the assertion below
    // still passed, because the render root of an element removed that way comes out empty).
    document.body.removeChild(el);

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);

    expect(editor(el), 'a detached screen answered a navigation').toBeTruthy();
  });
});
