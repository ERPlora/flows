import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import './erp-flows-gallery';
import { ErpFlowsGallery, templateFromSearch } from './erp-flows-gallery';
import { TEMPLATES } from '../../lib/templates';

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
function emitterSource(): string | null {
  const modules = resolve(__dirname, '../../../..');
  for (const dir of ['whatsapp_inbox', 'whatsapp_inbox-wt-59']) {
    const file = join(modules, dir, 'ui/lib/whatsapp-uses.ts');
    if (existsSync(file)) return file;
  }
  return null;
}

describe('the module that emits the shortcut and the gallery that reads it agree (whatsapp_inbox#59)', () => {
  const file = emitterSource();
  const where = file ? `read from ${file}` : 'SKIPPED: no whatsapp_inbox checkout beside this module';

  it.skipIf(!file)(`names the parameter this gallery reads (${where})`, () => {
    expect(readFileSync(file!, 'utf8')).toContain('?template=');
  });

  it.skipIf(!file)(`only offers cards this gallery has (${where})`, () => {
    const source = readFileSync(file!, 'utf8');
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
