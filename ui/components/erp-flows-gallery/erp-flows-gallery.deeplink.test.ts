import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import './erp-flows-gallery';
import { schemaFacts } from '../../lib/ai-draft';
import { ErpFlowsGallery, templateFromSearch } from './erp-flows-gallery';
import { TEMPLATES } from '../../lib/templates';

/**
 * **The hub these tests are about: one on a current core** (flows#92).
 *
 * The gallery's kernel probe is fail-closed, so a mount that says nothing about the hub is a hub
 * that declares nothing — and the card whose document needs `interactive`/`output` is correctly
 * absent from it. Every test here that is about something ELSE says «a normal hub» once, right
 * here, so the floor is asserted where it belongs and nowhere else.
 */
const CURRENT_CORE = schemaFacts({
  $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
});


/**
 * **A shortcut that names a card has to open THAT card** (flows#56).
 *
 * The complaint: from Settings → WhatsApp the owner taps «Configurar» on «Reservar citas», the hub
 * carries them to Automations — and drops them in front of the whole gallery, a dozen cards, none
 * of them marked. They have to recognise their own among them, which is exactly the work the
 * shortcut existed to save.
 *
 * The other half of the contract is already written, in the module that emits it:
 * `whatsapp_inbox/ui/lib/whatsapp-uses.ts::galleryPath()` pushes
 * `/m/flows/automations?template=<id>` and says of it — «a gallery that does not read it yet still
 * lands the owner in Automations». This file is that gallery learning to read it.
 *
 * The rule that governs every case below: **a parameter that matches nothing can never leave this
 * screen broken or empty.** An old link, a typo, a template retired two releases ago — all of them
 * land on the plain gallery, which is what the owner would have seen anyway.
 */

const t = (key: string): string => key;

/** A hub that knows every event a template asks about, so nothing is hidden. */
function hub(shape?: (name: string) => unknown) {
  return {
    flows: { create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })) },
    events: {
      shape: vi.fn(async (name: string) =>
        shape ? shape(name) : { event_name: name, declared_by: ['x'], samples: 0, fields: [] },
      ),
    },
  };
}

/** A refusal shaped like the runtime's: `404` arrives as a `not_found` code. */
const notFound = (): never => {
  throw Object.assign(new Error('nope'), { code: 'not_found' });
};

/** Where the shortcut left the owner before the gallery mounts — the shell has already navigated. */
function landOn(search: string): void {
  window.history.replaceState({}, '', `/m/flows/automations${search}`);
}

async function mount(client: unknown = hub()): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

async function settle(el: ErpFlowsGallery): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
}

const panel = (el: ErpFlowsGallery, id: string): Element | null =>
  el.renderRoot.querySelector(`#panel-${id}`);
const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);
const cards = (el: ErpFlowsGallery): number => el.renderRoot.querySelectorAll('[data-template]').length;
const openPanels = (el: ErpFlowsGallery): number => el.renderRoot.querySelectorAll('.panel').length;

/** The card the WhatsApp shortcut names, and one that is on no hub anywhere. */
const LINKED = 'whatsapp-appointment';
const MADE_UP = 'a-template-that-never-existed';

describe('`?template=<id>` says which card the owner asked for (flows#56)', () => {
  it('reads the id the shortcut put in the address bar', () => {
    expect(templateFromSearch(`?template=${LINKED}`)).toBe(LINKED);
  });

  it('answers «no card» to an id this gallery does not have — an old link is not an error', () => {
    expect(templateFromSearch(`?template=${MADE_UP}`)).toBe('');
  });

  it('answers «no card» when the parameter is absent, empty or somebody else’s', () => {
    expect(templateFromSearch('')).toBe('');
    expect(templateFromSearch('?template=')).toBe('');
    expect(templateFromSearch('?status=inactive')).toBe('');
  });

  /**
   * Every id in the catalogue survives the round trip the emitter puts it through
   * (`encodeURIComponent`). This is the guard that stops a template being added with a character
   * that travels badly — a shortcut to it would land on the plain gallery and nobody would know.
   */
  it('accepts every id in the catalogue, encoded the way the emitter encodes it', () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);
    for (const template of TEMPLATES) {
      expect(templateFromSearch(`?template=${encodeURIComponent(template.id)}`)).toBe(template.id);
    }
  });
});

describe('landing on the gallery from a shortcut (flows#56)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    landOn('');
  });

  it('opens the card the shortcut named, ready to read and switch on', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    expect(panel(el, LINKED), 'the card the owner asked for is still shut').toBeTruthy();
    expect(
      card(el, LINKED)?.querySelector('button.pick')?.getAttribute('aria-expanded'),
      'a screen reader is told the card is shut',
    ).toBe('true');
  });

  it('opens ONLY that one: the gallery is a decision, not a comparison table', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    expect(openPanels(el)).toBe(1);
  });

  it('shows the plain gallery when the id matches nothing — never a blank screen', async () => {
    landOn(`?template=${MADE_UP}`);
    const el = await mount();
    expect(openPanels(el), 'something opened for an id that does not exist').toBe(0);
    expect(cards(el), 'the gallery emptied itself over an unknown parameter').toBeGreaterThan(1);
  });

  it('shows the plain gallery when there is no parameter at all', async () => {
    const el = await mount();
    expect(openPanels(el)).toBe(0);
    expect(cards(el)).toBeGreaterThan(1);
  });

  /**
   * The card is hidden on this hub because a module it needs is missing (flows#52 hides, it no
   * longer greys out). The shortcut cannot be served, and the answer is the gallery the owner
   * would have got anyway — plus the line that names the app to install.
   */
  it('falls back to the plain gallery when the card is hidden on this hub', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount(hub((name) => (name.startsWith('appointments.') ? notFound() : { event_name: name, declared_by: ['x'], samples: 0, fields: [] })));
    expect(card(el, LINKED), 'a card whose module is missing was put back on screen').toBeNull();
    expect(openPanels(el)).toBe(0);
    expect(cards(el), 'the gallery went blank instead of hiding one card').toBeGreaterThan(1);
    expect(el.renderRoot.querySelector('[data-missing-modules]')).toBeTruthy();
  });

  /**
   * The gallery sits under the list of automations the hub already has. On a business with a dozen
   * of them the opened card is below the fold, so «opened» and «found» are not the same thing:
   * without this the owner still arrives at a screen that looks untouched.
   */
  it('brings the card on screen instead of opening it below the fold', async () => {
    const scrolled: string[] = [];
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset?.template ?? '');
    };
    landOn(`?template=${LINKED}`);
    await mount();
    expect(scrolled).toEqual([LINKED]);
  });

  /** A shell without `scrollIntoView` is a gallery that scrolls badly, never one that fails to open. */
  it('still opens the card where nothing can be scrolled', async () => {
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    landOn(`?template=${LINKED}`);
    const el = await mount();
    expect(panel(el, LINKED)).toBeTruthy();
  });

  /**
   * Same module, same tab: the shell's router watches `moduleId` and `navId` only
   * (`hub/apps/web/src/views/ModuleView.vue`), so a navigation that changes nothing but the query
   * string never re-creates this element. Without `popstate` the second shortcut of the session
   * does nothing at all.
   */
  it('answers a shortcut that arrives while the gallery is already on screen', async () => {
    const el = await mount();
    expect(openPanels(el)).toBe(0);
    landOn(`?template=${LINKED}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, LINKED)).toBeTruthy();
  });

  it('stops listening once it is off the screen', async () => {
    const el = await mount();
    el.remove();
    landOn(`?template=${LINKED}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, LINKED), 'a detached gallery reacted to a navigation').toBeNull();
  });

  /**
   * The owner shuts the card the shortcut opened. It stays shut: the URL says where they were sent,
   * not what the screen must keep showing. Re-applying it on every render is how a card becomes
   * impossible to close.
   */
  it('lets the owner close the card the shortcut opened', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    card(el, LINKED)?.querySelector('button.pick')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await settle(el);
    expect(openPanels(el)).toBe(0);
    el.requestUpdate();
    await settle(el);
    expect(openPanels(el), 'the card re-opened by itself on the next render').toBe(0);
  });

  /**
   * The same shortcut, tapped again, opens the card again — even though the address did not
   * change.
   *
   * The shell keeps a module's screen alive when the owner leaves it (`ModuleView.vue`, hub#1099)
   * and, on the way back, re-creates the element ONLY when `route.fullPath` differs from the one it
   * mounted. So the second time the owner taps «Set it up» in Settings → WhatsApp, this very
   * instance is what comes back on screen, and the `popstate` the shortcut fires is the only word
   * it gets. Answering «that card was already served once» is the original complaint all over
   * again: a tap that lands on the gallery with nothing open. A navigation that names a card opens
   * the card; closing it is something the owner does BETWEEN navigations, and it holds until the
   * next one (the test above pins that a plain re-render never re-opens it).
   */
  it('opens the card again when the owner comes back through the same shortcut', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mount();
    el.open(LINKED);
    await settle(el);
    expect(openPanels(el)).toBe(0);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, LINKED), 'the second tap on the same shortcut opened nothing').toBeTruthy();
  });

  /** «Opened» is not «found» the second time either: the card is brought on screen again. */
  it('brings the card on screen again on that second visit', async () => {
    const scrolled: string[] = [];
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset?.template ?? '');
    };
    landOn(`?template=${LINKED}`);
    const el = await mount();
    el.open(LINKED);
    await settle(el);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(scrolled, 'the card was left below the fold the second time').toEqual([LINKED, LINKED]);
  });

  /**
   * The card may still be open from the first visit when the same shortcut arrives again. It is
   * brought on screen in THAT cycle, not remembered as «still to reveal» and sprung on the owner
   * the next time anything else re-renders — which, from the seat, is the gallery scrolling away
   * from the card they just picked.
   */
  it('serves a shortcut whose card is still open without dragging the owner back to it later', async () => {
    const scrolled: string[] = [];
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset?.template ?? '');
    };
    landOn(`?template=${LINKED}`);
    const el = await mount();
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, LINKED)).toBeTruthy();
    expect(scrolled, 'the second visit did not bring the open card on screen').toEqual([LINKED, LINKED]);
    el.open('welcome-new-customer');
    await settle(el);
    expect(scrolled, 'the owner picked another card and was scrolled back to the linked one').toEqual([LINKED, LINKED]);
  });

  /**
   * A failed «Use this» leaves its reason on the panel. Following the next shortcut has to clear
   * it: an error about the card the owner left behind, printed on the card they just asked for,
   * blames the wrong automation.
   */
  it('does not carry an old failure over to the card the next shortcut opens', async () => {
    landOn(`?template=${LINKED}`);
    const broken = hub();
    broken.flows.create = vi.fn(async () => {
      throw new Error('command no encontrado: appointments.appointments.create');
    });
    const el = await mount(broken);
    await el.use();
    await settle(el);
    expect(el.renderRoot.querySelector('ok-inline-feedback[tone="danger"]')).toBeTruthy();

    landOn('?template=welcome-new-customer');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, 'welcome-new-customer')).toBeTruthy();
    expect(
      el.renderRoot.querySelector('ok-inline-feedback[tone="danger"]'),
      'the new card opened wearing the previous card’s error',
    ).toBeNull();
  });
});

/**
 * **The other end of the contract, read from the module that emits it.**
 *
 * `?template=` is shared between two repositories: this gallery reads what
 * `whatsapp_inbox/ui/lib/whatsapp-uses.ts` writes. Nothing in CI can see that module, so this is
 * skipped LOUDLY there — but in the workspace, where both checkouts sit side by side, it is the
 * only thing that notices the day the emitter renames the parameter or offers a card this
 * catalogue does not have. Same rule the mirror tests in `ui/lib/templates.test.ts` apply to the
 * neighbour's flow documents.
 */
const EMITTER_PATH = 'ui/lib/whatsapp-uses.ts';

function emitterSource(): { source: string; where: string } | null {
  const modules = resolve(__dirname, '../../../..');
  const canonical = join(modules, 'whatsapp_inbox');
  if (existsSync(canonical)) {
    try {
      return {
        source: execFileSync('git', ['-C', canonical, 'show', `origin/main:${EMITTER_PATH}`], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }),
        where: 'whatsapp_inbox@origin/main',
      };
    } catch {
      // No `origin/main` fetched, or the emitter is not on it yet. The `where` label below reports
      // whichever source actually answered, so a fallback is never silent.
    }
  }
  for (const dir of ['whatsapp_inbox', 'whatsapp_inbox-wt-59']) {
    const file = join(modules, dir, EMITTER_PATH);
    if (existsSync(file)) return { source: readFileSync(file, 'utf8'), where: file };
  }
  return null;
}

describe('the module that emits the shortcut and the gallery that reads it agree (whatsapp_inbox#59)', () => {
  const emitter = emitterSource();
  const where = emitter
    ? `read from ${emitter.where}`
    : 'SKIPPED: no whatsapp_inbox checkout beside this module';

  it.skipIf(!emitter)(`names the parameter this gallery reads (${where})`, () => {
    expect(emitter!.source).toContain('?template=');
  });

  it.skipIf(!emitter)(`only offers cards this gallery has (${where})`, () => {
    const source = emitter!.source;
    const uses = source.slice(source.indexOf('WHATSAPP_USES'));
    const ids = [...uses.matchAll(/^\s{4}id: '([^']+)',$/gm)].map((m) => m[1]);
    expect(ids.length, 'the emitter offers no use at all — this guard is reading the wrong thing').toBeGreaterThan(0);
    for (const id of ids) {
      expect(templateFromSearch(`?template=${id}`), `${id} is offered but this gallery has no such card`).toBe(id);
    }
  });
});

afterEach(() => {
  landOn('');
});
