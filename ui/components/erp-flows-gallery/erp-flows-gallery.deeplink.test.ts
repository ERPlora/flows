import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import { ErpFlowsGallery, templateFromSearch } from './erp-flows-gallery';
import { TEMPLATES, mergeTemplates } from '../../lib/templates';
import { moduleTemplateId, moduleTemplates } from '../../lib/module-templates';

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
/** The recipe `whatsapp_inbox` serves, which is where the shortcut lands since flows#101. */
const SERVED_ROW = {
  module: 'whatsapp_inbox',
  family: 'appointment-from-whatsapp',
  documents: {
    en: {
      schema_version: 1,
      name: 'WhatsApp → appointment',
      triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
      steps: [
        { id: 'ask', kind: 'notify', channel: 'whatsapp', interactive: { rows: [] } },
        { id: 'read', kind: 'ai', output: { slots: 'x' } },
        { id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} },
      ],
    },
  },
  grants: [{ kind: 'command', value: 'appointments.appointments.create' }],
};

function hub(shape?: (name: string) => unknown) {
  return {
    flows: {
      create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
      templates: vi.fn(async () => [SERVED_ROW]),
    },
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
  // By attribute and not `#panel-<id>`: a served id carries a colon and a slash, neither of which
  // can be written in an id selector without escaping every one of them.
  el.renderRoot.querySelector(`[data-template="${id}"] .panel`);
const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);
const cards = (el: ErpFlowsGallery): number => el.renderRoot.querySelectorAll('[data-template]').length;
const openPanels = (el: ErpFlowsGallery): number => el.renderRoot.querySelectorAll('.panel').length;

/** The card the WhatsApp shortcut names, and one that is on no hub anywhere. */
/**
 * **The address the app publishes, and the card it opens** (flows#56 → flows#101).
 *
 * `whatsapp-appointment` is built by `whatsapp_inbox`'s own settings screen, so it is a published
 * address and does not change. The card behind it does: the hand copy is gone and the app serves
 * the recipe itself, so the shortcut is forwarded to the served card. Everything below asks with
 * the address the outside world taps and looks for the card the owner actually gets.
 */
const ASKED = 'whatsapp-appointment';
const LINKED = moduleTemplateId('whatsapp_inbox', 'appointment-from-whatsapp');
const MADE_UP = 'a-template-that-never-existed';

/** The catalogue as the gallery holds it: what is written here plus what the hub served. */
const onScreen = () => mergeTemplates(TEMPLATES, moduleTemplates([SERVED_ROW], 'en'));

describe('`?template=<id>` says which card the owner asked for (flows#56)', () => {
  it('reads the id the shortcut put in the address bar', () => {
    // Handed back UNCHANGED, retired or not: forwarding is `landsOn`'s job, and answering the
    // replacement here would be the second place that decides it.
    expect(templateFromSearch(`?template=${ASKED}`, onScreen())).toBe(ASKED);
    expect(templateFromSearch(`?template=${LINKED}`, onScreen())).toBe(LINKED);
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
    landOn(`?template=${ASKED}`);
    const el = await mount();
    expect(panel(el, LINKED), 'the card the owner asked for is still shut').toBeTruthy();
    expect(
      card(el, LINKED)?.querySelector('button.pick')?.getAttribute('aria-expanded'),
      'a screen reader is told the card is shut',
    ).toBe('true');
  });

  it('opens ONLY that one: the gallery is a decision, not a comparison table', async () => {
    landOn(`?template=${ASKED}`);
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
    // A WRITTEN card on purpose, and it has to be one: a card the hub SERVES carries no witnesses
    // (the hub applied every floor before answering), so it is never the one the module probe
    // hides — pointed at it, this test would go green without hiding anything at all.
    const HIDDEN = 'no-show-followup';
    landOn(`?template=${HIDDEN}`);
    const el = await mount(hub((name) => (name.startsWith('appointments.') ? notFound() : { event_name: name, declared_by: ['x'], samples: 0, fields: [] })));
    expect(card(el, HIDDEN), 'a card whose module is missing was put back on screen').toBeNull();
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
    landOn(`?template=${ASKED}`);
    await mount();
    expect(scrolled).toEqual([LINKED]);
  });

  /** A shell without `scrollIntoView` is a gallery that scrolls badly, never one that fails to open. */
  it('still opens the card where nothing can be scrolled', async () => {
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle(el);
    expect(panel(el, LINKED)).toBeTruthy();
  });

  it('stops listening once it is off the screen', async () => {
    const el = await mount();
    el.remove();
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
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
    landOn(`?template=${ASKED}`);
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
 * The WhatsApp settings screen (`whatsapp_inbox/ui/lib/whatsapp-uses.ts`) links to this module in
 * two ways, and both are strings this repository cannot see from CI: the address its «Advanced
 * settings» pushes (`AUTOMATIONS_PATH`) and the query it asks to know whether Automations is
 * installed at all (`AUTOMATIONS_WITNESS`). Since whatsapp_inbox#123 it turns each use on through
 * the kernel and no longer names a gallery card, so the link is the bare Automations screen — the
 * `?template=` reader above stays for the addresses already published, and this guard checks what
 * the emitter sends TODAY (flows#119). Skipped LOUDLY without a checkout beside this module; in the
 * workspace it is the only thing that notices the day either side renames its half. Same rule the
 * mirror tests in `ui/lib/templates.test.ts` apply to the neighbour's flow documents.
 */
const EMITTER_PATH = 'ui/lib/whatsapp-uses.ts';
const MODULE_ROOT = resolve(__dirname, '../../..');

function emitterSource(): { source: string; where: string } | null {
  const modules = resolve(MODULE_ROOT, '..');
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
  const file = join(canonical, EMITTER_PATH);
  if (existsSync(file)) return { source: readFileSync(file, 'utf8'), where: file };
  return null;
}

/** The one `export const NAME = '…'` of the emitter, or `undefined` when it is spelled otherwise. */
const constant = (source: string, name: string): string | undefined =>
  source.match(new RegExp(`^export const ${name} = '([^']+)';$`, 'm'))?.[1];

/**
 * The address «Advanced settings» pushes, resolved the way the emitter builds it: a template
 * literal over `AUTOMATIONS_MODULE`, or a plain string.
 */
function emittedPath(source: string): string | undefined {
  const raw =
    source.match(/^export const AUTOMATIONS_PATH = `([^`]+)`;$/m)?.[1] ?? constant(source, 'AUTOMATIONS_PATH');
  const module = constant(source, 'AUTOMATIONS_MODULE');
  if (raw === undefined) return undefined;
  if (raw.includes('${') && module === undefined) return undefined;
  return module === undefined ? raw : raw.split('${AUTOMATIONS_MODULE}').join(module);
}

interface Manifest {
  id: string;
  navigation: { id: string }[];
  queries: Record<string, { sql: string }>;
}
const manifest = (): Manifest => JSON.parse(readFileSync(join(MODULE_ROOT, 'module.json'), 'utf8')) as Manifest;

describe('the WhatsApp settings screen links to a screen and a query this module has (flows#119)', () => {
  const emitter = emitterSource();
  const where = emitter
    ? `read from ${emitter.where}`
    : 'SKIPPED: no whatsapp_inbox checkout beside this module';

  it.skipIf(!emitter)(`«Advanced settings» opens an Automations screen that exists (${where})`, () => {
    const path = emittedPath(emitter!.source);
    expect(path, 'no AUTOMATIONS_PATH in the emitter — this guard is reading the wrong thing').toBeDefined();
    const url = new URL(path!, 'https://hub.invalid');
    const { id, navigation } = manifest();
    const [, prefix, module, nav, ...rest] = url.pathname.split('/');
    expect({ prefix, module, rest }, `${path} is not a screen of this module`).toEqual({
      prefix: 'm',
      module: id,
      rest: [],
    });
    expect(
      navigation.map((n) => n.id),
      `${path} names a tab this module does not declare`,
    ).toContain(nav);
    // A parameter this gallery does not read is a promise nobody keeps; the one it does read has to
    // name a card it has, or the owner lands on the plain gallery with no word of why.
    for (const [key, value] of url.searchParams) {
      expect(key, `${path} carries a parameter this gallery ignores`).toBe('template');
      expect(templateFromSearch(`?template=${value}`, onScreen()), `${value} names no card`).toBe(value);
    }
  });

  /**
   * The witness is asked BARE (`queryOptional` with no params) and `undefined` is read as «not
   * installed». A name this module does not declare answers that on every hub that HAS it, and a
   * query that wants a parameter answers `missing_required_param` — the card would hide the
   * Automations link, or paint it for the wrong reason.
   */
  it.skipIf(!emitter)(`asks whether Automations is here with a query it declares, askable bare (${where})`, () => {
    const source = emitter!.source;
    const witness = constant(source, 'AUTOMATIONS_WITNESS');
    expect(witness, 'no AUTOMATIONS_WITNESS in the emitter — this guard is reading the wrong thing').toBeDefined();
    const asked = source.match(/probeAutomations\b[\s\S]*?queryOptional\('([^']+)'\)/)?.[1];
    expect(asked, 'the probe asks something other than the witness it declares').toBe(witness);
    const { queries } = manifest();
    expect(Object.keys(queries), `${witness} is not a query of this module`).toContain(witness);
    const sql = readFileSync(join(MODULE_ROOT, queries[witness!].sql), 'utf8');
    const binds = [...new Set([...sql.replace(/--.*$/gm, '').matchAll(/(?<!:):([a-z_]+)/g)].map((m) => m[1]))];
    expect(binds, `${witness} needs a parameter the emitter never sends`).toEqual(['hub_id']);
  });
});

afterEach(() => {
  landOn('');
});
