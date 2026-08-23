import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { ErpFlowsApp } from '../erp-flows-app/erp-flows-app';
import { TEMPLATES, templateById } from '../../lib/templates';
import en from '../../../locales/en.json';

/** The shell's translator, reduced to the lookup a test needs, `{param}` included. */
const t = (key: string, params?: Record<string, unknown>): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  const found = typeof cur === 'string' ? cur : key;
  return params
    ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
    : found;
};

/** A hub that knows every event a template asks about. */
function hub(over: Record<string, unknown> = {}) {
  return {
    flows: {
      create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
      ...(over.flows as object),
    },
    events: {
      shape: vi.fn(async (name: string) => ({
        event_name: name,
        declared_by: ['x'],
        samples: 0,
        fields: [],
      })),
      ...(over.events as object),
    },
  };
}

/** A refusal shaped like the runtime's: `404` arrives as a `not_found` code. */
const notFound = (): never => {
  throw Object.assign(new Error('nope'), { code: 'not_found' });
};

async function mount(client: unknown): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

const text = (el: ErpFlowsGallery): string => el.renderRoot.textContent ?? '';
const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);

describe('the way in is a gallery, not an empty list', () => {
  beforeEach(() => document.body.replaceChildren());

  it('offers every template, grouped by the kind of business', async () => {
    const el = await mount(hub());
    for (const template of TEMPLATES) {
      expect(card(el, template.id), template.id).toBeTruthy();
    }
    // The sectors a hub sells to are headings, not a filter the owner has to find first.
    expect(el.renderRoot.querySelectorAll('[data-sector]').length).toBeGreaterThan(1);
  });

  it('says what each one does in the owner’s words, not the event name', async () => {
    const el = await mount(hub());
    expect(text(el)).toContain(t('tpl.noShow.name'));
    expect(text(el)).toContain(t('tpl.noShow.summary'));
    expect(text(el)).not.toContain('appointments.appointment.no_show');
  });
});

describe('a template this hub cannot run', () => {
  beforeEach(() => document.body.replaceChildren());

  // The gallery asks the hub about one declared event per module a template needs. A `404` is the
  // hub saying it has never heard of it — which happens for exactly one reason: the module that
  // emits it is not installed here.
  it('is offered with the reason and cannot be used', async () => {
    const el = await mount(
      hub({ events: { shape: vi.fn(async (name: string) => (name.startsWith('tasks.') ? notFound() : { event_name: name, declared_by: ['x'], samples: 0, fields: [] })) } }),
    );
    const target = card(el, 'no-show-followup');
    expect(target?.getAttribute('data-missing')).toBe('tasks');
    // Offered, not hidden: «you need the Tasks module» is a thing the owner can act on; a card
    // that silently is not there is not.
    expect(target).toBeTruthy();
  });

  it('does not grey anything out while the hub has not answered yet', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<never>((resolve) => {
      release = resolve as () => void;
    });
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.client = hub({ events: { shape: vi.fn(() => pending) } }) as never;
    el.t = t;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.renderRoot.querySelector('[data-missing]')).toBeNull();
    release?.();
  });
});

describe('picking one explains it before anything is created', () => {
  beforeEach(() => document.body.replaceChildren());

  it('shows the whole automation as a sentence, the blanks and the permissions', async () => {
    const el = await mount(hub());
    el.open('note-big-sale');
    await el.updateComplete;

    const shown = text(el);
    expect(shown).toContain(t('tpl.bigSale.plain'));
    // The blank and its hint: the cents trap is the single most likely thing to get wrong, and it
    // is written down where the decision is made, not in a manual.
    expect(shown).toContain(t('tpl.bigSale.blankAmount'));
    expect(shown).toContain(t('tpl.bigSale.blankAmountHint'));
    // The permission, with the reason, BEFORE the flow exists — pm#134 point 3 is the place
    // people get stuck, and it is not a surprise the owner should meet after saying yes.
    expect(el.renderRoot.querySelector('[data-grant="customers.notes.add"]')).toBeTruthy();
    expect(shown).toContain(t('tpl.grant.customersNote'));
  });

  it('says «nothing to fill in» rather than showing an empty heading', async () => {
    const el = await mount(hub());
    el.open('no-show-followup');
    await el.updateComplete;
    expect(templateById('no-show-followup')?.blanks).toHaveLength(0);
    expect(text(el)).toContain(t('ui.tplNoBlanks'));
  });
});

describe('using a template', () => {
  beforeEach(() => document.body.replaceChildren());

  it('creates it PAUSED, with the document the template describes', async () => {
    const client = hub();
    const el = await mount(client);
    el.open('no-show-followup');
    await el.updateComplete;
    await el.use();

    expect(client.flows.create).toHaveBeenCalledTimes(1);
    const body = client.flows.create.mock.calls[0][0] as {
      name: string;
      enabled: boolean;
      definition: { steps: { command?: string }[] };
    };
    // An automation nobody has read yet must not act. It is created off, and the owner turns it on.
    expect(body.enabled).toBe(false);
    expect(body.name).toBe(t('tpl.noShow.name'));
    expect(body.definition.steps[0].command).toBe('tasks.tasks.create');
  });

  it('hands the new flow over saying it still needs permission', async () => {
    const el = await mount(hub());
    const seen: CustomEvent[] = [];
    el.addEventListener('flows-template-used', (e) => seen.push(e as CustomEvent));
    el.open('no-show-followup');
    await el.updateComplete;
    await el.use();

    expect(seen).toHaveLength(1);
    expect(seen[0].detail.flow.id).toBe('created-1');
    // A flow with no grants does nothing at all, silently. The screen it opens on is the one that
    // fixes that, not the step list.
    expect(seen[0].detail.needsGrants).toBe(true);
  });

  it('refuses to pretend it worked when the hub said no', async () => {
    const client = hub({
      flows: {
        create: vi.fn(async () => {
          throw Object.assign(new Error('command no encontrado: tasks.tasks.create'), {
            code: 'not_found',
          });
        }),
      },
    });
    const el = await mount(client);
    const seen: CustomEvent[] = [];
    el.addEventListener('flows-template-used', (e) => seen.push(e as CustomEvent));
    el.open('no-show-followup');
    await el.updateComplete;
    await el.use();

    expect(seen).toHaveLength(0);
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
  });
});

describe('the way to the guide', () => {
  beforeEach(() => document.body.replaceChildren());

  it('is on the gallery, where somebody who has never seen this screen is standing', async () => {
    const el = await mount(hub());
    const seen: Event[] = [];
    el.addEventListener('flows-open-guide', (e) => seen.push(e));
    (el.renderRoot.querySelector('[data-act="guide"]') as HTMLElement)?.click();
    expect(seen).toHaveLength(1);
  });
});

/**
 * **The width contract** (flows#40).
 *
 * happy-dom does no layout — the vitest config says so and points here: what these tests fix is
 * the CONTRACT that makes the real-browser geometry true. The geometry itself (measured on the QA
 * hub): at 1440 the gallery host gets 1144px and the old `.wrap { max-width: 44rem }` spent 704px
 * of them, 220px dead on each side, while the «Nueva automatización» button floated on the far
 * right of the 1144px bar above — an orphan 550px from the column that governed the screen.
 */
describe('the gallery takes the width it is given (flows#40)', () => {
  /** One rule block of a component's static stylesheet, by its selector. */
  const rule = (styles: { cssText: string }, selector: string): string => {
    const at = styles.cssText.indexOf(`${selector} {`);
    expect(at, `${selector} is not in the stylesheet at all`).toBeGreaterThanOrEqual(0);
    const end = styles.cssText.indexOf('}', at);
    return styles.cssText.slice(at, end);
  };

  it('lays the cards on a fluid auto-fill grid, not on a fixed 44rem column', () => {
    // `repeat(auto-fill, minmax(…, 1fr))` is the workspace's own recipe (kitchen's tickets,
    // customers' cards): 3 columns at 1440, 2 at 834, 1 at 390 — the same cards, no dead margins.
    const cards = rule(ErpFlowsGallery.styles as { cssText: string }, '.cards');
    expect(cards).toContain('display: grid');
    expect(cards).toContain('grid-template-columns: repeat(auto-fill, minmax(');
  });

  it('does not cap the gallery to a 44rem column: the wrap is fluid', () => {
    // The 704px strip with 220px dead on each side was `.wrap { max-width: 44rem }`. The wrap now
    // fills the box the screen hands it, which is the same box the CTA bar sits in.
    const wrap = rule(ErpFlowsGallery.styles as { cssText: string }, '.wrap');
    expect(wrap).not.toContain('max-width');
  });

  it('keeps one column on a phone even if the card minimum stops fitting', () => {
    // The guard kitchen's grid also carries: below 480px the auto-fill minimum (bigger than the
    // remaining container on a 320px screen) would push the cards off the edge instead of
    // wrapping. One column is the 390px design the issue said not to touch.
    const cssText = (ErpFlowsGallery.styles as { cssText: string }).cssText;
    expect(cssText).toMatch(/@media \(max-width: 480px\)[^}]*\.cards[^}]*grid-template-columns: 1fr/);
  });

  it('anchors the CTA to the same box as the cards: head and body share one gutter', () => {
    // The «Nueva automatización» button lives in the app's `.head`, the gallery in its `.body`.
    // They read as one screen only if both boxes are the same, and they are the same because both
    // gutters are 0.75rem — this is the contract that keeps the CTA on the grid's right edge
    // instead of 550px away from it.
    const head = rule(ErpFlowsApp.styles as { cssText: string }, '.head');
    const body = rule(ErpFlowsApp.styles as { cssText: string }, '.body');
    expect(head).toContain('0.75rem');
    expect(body).toContain('0.75rem');
  });
});

/**
 * **«Falta un módulo» is not an answer** (flows#38).
 *
 * On a hub built from the Restaurant template — seventeen apps, no `tasks` — the whole gallery
 * came out grey with the same label on every card, naming nothing. The module id the witnesses
 * compute (`tasks`) was known all along; it was the label that threw it away.
 */
describe('a template this hub cannot run says WHICH module it is missing (flows#38)', () => {
  beforeEach(() => document.body.replaceChildren());

  /** A hub that has never heard of the events of the given modules (their apps are not installed). */
  const hubWithout = (...modules: string[]) =>
    hub({
      events: {
        shape: vi.fn(async (name: string) =>
          modules.some((m) => name.startsWith(`${m}.`))
            ? notFound()
            : { event_name: name, declared_by: ['x'], samples: 0, fields: [] },
        ),
      },
    });

  it('carries the readable module name on the grey card, not just «Needs a module»', async () => {
    const el = await mount(hubWithout('tasks'));
    const pill = card(el, 'no-show-followup')?.querySelector('ok-status-pill');
    expect(pill?.getAttribute('label')).toContain(t('ui.mod_tasks'));
    expect(pill?.getAttribute('label')).not.toBe(t('ui.tplUnavailable'));
  });

  it('lists every missing module when there is more than one', async () => {
    // `no-show-followup` needs Appointments for its trigger and Tasks for its action: a hub with
    // neither has to hear about both, or the owner installs one and the card stays grey.
    const el = await mount(hubWithout('appointments', 'tasks'));
    const label = card(el, 'no-show-followup')?.querySelector('ok-status-pill')?.getAttribute('label');
    expect(label).toContain(t('ui.mod_appointments'));
    expect(label).toContain(t('ui.mod_tasks'));
  });

  it('says it by name when the card is open, and that the screen needs a reload after installing', async () => {
    // The panel is where the sentence fits; the card carries the badge. Installing happens in the
    // marketplace, out of this screen's hands — what this screen owes the owner is the name and
    // the fact that a reload brings the cards to life.
    const el = await mount(hubWithout('tasks'));
    el.open('no-show-followup');
    await el.updateComplete;
    // The warning carries the whole sentence — name and reload included: installing happens in the
    // marketplace, and this screen owes the owner the fact that a reload is what brings the cards
    // to life. (The permissions block below it shows `tasks.tasks.create` on purpose: a grant is
    // named by its command. The missing-module sentence is the one that must speak in names.)
    const warning = el.renderRoot.querySelector('#panel-no-show-followup ok-inline-feedback');
    expect(warning?.textContent).toContain(t('ui.mod_tasks'));
    expect(warning?.textContent).not.toContain(' tasks,');
    expect(warning?.textContent).toContain(t('ui.tplNeedsModule', { modules: t('ui.mod_tasks') }));
  });
});
