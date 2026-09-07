import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery, offScreen } from './erp-flows-gallery';

/**
 * **Scrolling to the card when the screen is not on screen yet** (flows#58).
 *
 * The second half of the same complaint. The owner taps «Configurar» in Settings → WhatsApp a
 * second time and the card they asked for IS opened — but it stays wherever it was, under however
 * many automations the business already has, so the tap reads as ignored.
 *
 * The reason is timing, and it is invisible from inside this element. The shortcut is a
 * `pushState` + `popstate` fired from the OTHER module (`whatsapp_inbox/ui/lib/whatsapp-uses.ts`),
 * so this gallery hears it while its own page is still the cached one the shell keeps alive
 * (`hub/apps/web/src/views/ModuleView.vue`, hub#1099) — hidden with `display: none` by Ionic's
 * `.ion-page-hidden`. `scrollIntoView` on an element with no box does nothing at all, and it fails
 * silently: the card was marked as «brought on screen» and nothing ever tried again.
 *
 * So «revealed» has to mean «actually shown», and the retry has to hang off the only thing that
 * says the page came back: the card getting a box. happy-dom does no layout — that is why the
 * observer is driven by hand below and why the ancestor walk is tested directly.
 */

const LINKED = 'whatsapp-appointment';

/** A `ResizeObserver` the test can fire, because happy-dom lays nothing out. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  observed: Element[] = [];

  disconnected = false;

  constructor(private readonly cb: () => void) {
    FakeResizeObserver.instances.push(this);
  }

  observe(el: Element): void {
    this.observed.push(el);
  }

  unobserve(el: Element): void {
    this.observed = this.observed.filter((x) => x !== el);
  }

  disconnect(): void {
    this.disconnected = true;
    this.observed = [];
  }

  /** What the browser does when the page stops being `display: none`. */
  fire(): void {
    this.cb();
  }
}

const realObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;

function hub() {
  return {
    flows: { create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })) },
    events: {
      shape: vi.fn(async (name: string) => ({ event_name: name, declared_by: ['x'], samples: 0, fields: [] })),
    },
  };
}

const t = (key: string): string => key;

function landOn(search: string): void {
  window.history.replaceState({}, '', `/m/flows/automations${search}`);
}

async function settle(el: ErpFlowsGallery): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
}

/** The page the shell keeps alive off screen: Ionic's `.ion-page-hidden` is `display: none`. */
function cachedPage(): HTMLElement {
  const page = document.createElement('div');
  page.style.display = 'none';
  document.body.appendChild(page);
  return page;
}

async function mountIn(parent: HTMLElement): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.client = hub() as never;
  el.t = t;
  parent.appendChild(el);
  await settle(el);
  return el;
}

const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);
const panel = (el: ErpFlowsGallery, id: string): Element | null =>
  el.renderRoot.querySelector(`#panel-${id}`);

let scrolled: string[] = [];

describe('a card is only «brought on screen» when there is a screen (flows#58)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    landOn('');
    scrolled = [];
    FakeResizeObserver.instances = [];
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver;
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset?.template ?? '');
    };
  });

  afterEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = realObserver;
    landOn('');
  });

  it('opens the card even while the page is still off screen', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mountIn(cachedPage());
    expect(panel(el, LINKED), 'the card was not even opened').toBeTruthy();
  });

  it('does not spend its one scroll on a page with no box', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mountIn(cachedPage());
    expect(scrolled, 'it scrolled into a hidden page and called the job done').toEqual([]);
    expect(FakeResizeObserver.instances.length, 'nothing is watching for the page to come back').toBe(1);
    expect(FakeResizeObserver.instances[0].observed).toEqual([card(el, LINKED)]);
  });

  it('brings the card on screen as soon as the page is shown again', async () => {
    landOn(`?template=${LINKED}`);
    const page = cachedPage();
    const el = await mountIn(page);
    page.style.display = '';
    FakeResizeObserver.instances[0].fire();
    await settle(el);
    expect(scrolled, 'the card never came on screen once the page was back').toEqual([LINKED]);
    expect(FakeResizeObserver.instances[0].disconnected, 'it kept watching a card it already showed').toBe(true);
  });

  it('does it once, and does not drag the owner back to it later', async () => {
    landOn(`?template=${LINKED}`);
    const page = cachedPage();
    const el = await mountIn(page);
    page.style.display = '';
    FakeResizeObserver.instances[0].fire();
    await settle(el);
    el.open('welcome-new-customer');
    await settle(el);
    el.requestUpdate();
    await settle(el);
    expect(scrolled, 'the owner picked another card and was scrolled away from it').toEqual([LINKED]);
  });

  /**
   * A shell with no `ResizeObserver` is a gallery that may scroll to nothing, never one that
   * refuses to scroll: the attempt costs nothing and «never» is the bug this file is about.
   */
  it('still tries where there is nothing to observe with', async () => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    landOn(`?template=${LINKED}`);
    await mountIn(cachedPage());
    expect(scrolled).toEqual([LINKED]);
  });

  /**
   * Two taps on «Configurar» before the page has come back — for two DIFFERENT cards, which is
   * what Settings → WhatsApp offers: «Reservar citas» and «Reservar mesa» are two shortcuts to the
   * same gallery. The card that gets brought on screen is the one the owner asked for LAST; the
   * first one is not what they are waiting to see any more.
   */
  it('shows the card of the second shortcut, not the one before it', async () => {
    landOn(`?template=${LINKED}`);
    const page = cachedPage();
    const el = await mountIn(page);
    const other = [...el.renderRoot.querySelectorAll('[data-template]')]
      .map((c) => (c as HTMLElement).dataset.template ?? '')
      .find((id) => id && id !== LINKED) as string;
    expect(other, 'the catalogue rendered a single card: there is no second shortcut to test').toBeTruthy();

    landOn(`?template=${other}`);
    window.dispatchEvent(new Event('popstate'));
    await settle(el);
    expect(scrolled, 'it scrolled while the page was still hidden').toEqual([]);

    page.style.display = '';
    for (const observer of FakeResizeObserver.instances) {
      if (!observer.disconnected && observer.observed.some((x) => x.isConnected)) observer.fire();
    }
    await settle(el);
    expect(scrolled, 'the card of the second shortcut never came on screen').toEqual([other]);
  });

  it('stops watching when it leaves the screen', async () => {
    landOn(`?template=${LINKED}`);
    const el = await mountIn(cachedPage());
    el.remove();
    expect(FakeResizeObserver.instances[0].disconnected, 'a detached gallery left an observer behind').toBe(true);
  });
});

/**
 * The walk has to cross shadow boundaries or it answers «on screen» for every card there is: the
 * card lives in this element's shadow root and the hidden page is a light-DOM ancestor of the
 * module's host, several roots up. This is the one thing happy-dom can be asked about layout —
 * `display` is a declared value, not a measurement.
 */
describe('knowing whether an element is on a page the shell is hiding (flows#58)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('says no for an element on the open page', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(offScreen(el)).toBe(false);
  });

  it('says yes for an element under a hidden ancestor', () => {
    const page = cachedPage();
    const el = document.createElement('div');
    page.appendChild(el);
    expect(offScreen(el)).toBe(true);
  });

  it('says yes through a shadow root, where the hidden page always is', () => {
    const page = cachedPage();
    const host = document.createElement('div');
    page.appendChild(host);
    const inner = document.createElement('span');
    host.attachShadow({ mode: 'open' }).appendChild(inner);
    expect(offScreen(inner), 'the walk stopped at the shadow boundary').toBe(true);
  });

  it('says no for the same shadow tree on a page that is showing', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const inner = document.createElement('span');
    host.attachShadow({ mode: 'open' }).appendChild(inner);
    expect(offScreen(inner)).toBe(false);
  });

  it('says no for an element nobody has put on the page yet', () => {
    expect(offScreen(document.createElement('div')), 'a detached element is not a hidden page').toBe(false);
  });
});
