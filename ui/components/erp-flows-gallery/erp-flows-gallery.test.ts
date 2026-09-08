import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import type { SchemaFacts } from '../../lib/ai-draft';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { ErpFlowsApp } from '../erp-flows-app/erp-flows-app';
import { TEMPLATES, templateById, buildTemplate } from '../../lib/templates';
import en from '../../../locales/en.json';

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
  el.facts = CURRENT_CORE;
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
  //
  // It used to be shown greyed out (flows#38). flows#52 hides it instead: the catalogue now
  // carries cards for modules a business will never own — the WhatsApp card needs Appointments,
  // Services and Staff, and whatsapp_inbox#60 adds a table-booking twin for Reservations — so a
  // salon was being offered a restaurant's automation with a badge on it. What flows#38 was
  // protecting (the owner learning WHICH app, by name, and that a reload is what brings it to
  // life) is the sentence below the cards now, once instead of on every grey card.
  it('is not offered at all', async () => {
    const el = await mount(
      hub({ events: { shape: vi.fn(async (name: string) => (name.startsWith('tasks.') ? notFound() : { event_name: name, declared_by: ['x'], samples: 0, fields: [] })) } }),
    );
    expect(card(el, 'no-show-followup')).toBeNull();
    // The control: the cards this hub CAN run are still there, so «hidden» is not «broken».
    expect(card(el, 'whatsapp-appointment')).toBeTruthy();
  });

  it('does not hide anything while the hub has not answered yet', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<never>((resolve) => {
      release = resolve as () => void;
    });
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
    el.client = hub({ events: { shape: vi.fn(() => pending) } }) as never;
    el.t = t;
    document.body.appendChild(el);
    await el.updateComplete;
    // Every card of the catalogue, and no «you are missing something» line: an unanswered probe
    // is not a refusal, and a gallery that empties itself and fills back in reads as broken.
    expect(el.renderRoot.querySelectorAll('[data-template]').length).toBe(TEMPLATES.length);
    expect(el.renderRoot.querySelector('[data-missing-modules]')).toBeNull();
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
 * **«Falta un módulo» is not an answer** (flows#38, kept through flows#52).
 *
 * On a hub built from the Restaurant template — seventeen apps, no `tasks` — the whole gallery
 * came out grey with the same label on every card, naming nothing. The module id the witnesses
 * compute (`tasks`) was known all along; it was the label that threw it away.
 *
 * flows#52 removed the grey cards, so what these guard now is the line that replaced them: the
 * names are still said, still readable, still with the reload — once, instead of nine times.
 */
describe('the gallery says WHICH modules the hidden cards needed (flows#38 · flows#52)', () => {
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

  const note = (el: ErpFlowsGallery): Element | null =>
    el.renderRoot.querySelector('[data-missing-modules]');

  it('carries the readable module name, not the id the witnesses compute', async () => {
    const el = await mount(hubWithout('tasks'));
    expect(note(el)?.textContent).toContain(t('ui.mod_tasks'));
    // «Tasks», never «tasks»: the name on the marketplace card is the one the owner can act on.
    expect(note(el)?.textContent).not.toContain(' tasks');
  });

  it('lists every missing module when there is more than one, in the plural sentence', async () => {
    // A hub with neither Appointments nor Tasks has to hear about both, or the owner installs one
    // and nothing comes back.
    const el = await mount(hubWithout('appointments', 'tasks'));
    const said = note(el)?.textContent ?? '';
    expect(said).toContain(t('ui.mod_appointments'));
    expect(said).toContain(t('ui.mod_tasks'));
    expect(said).toBe(
      t('ui.tplHiddenModules', {
        modules: `${t('ui.mod_appointments')}, ${t('ui.mod_tasks')}`,
      }),
    );
  });

  it('says a reload is what brings the cards to life, because installing happens elsewhere', async () => {
    const el = await mount(hubWithout('tasks'));
    // One module, one sentence written for one — «install them» about a single app is the kind of
    // seam that makes a screen feel machine-written.
    expect(note(el)?.textContent).toBe(t('ui.tplHiddenModule', { modules: t('ui.mod_tasks') }));
  });

  it('says nothing at all when this hub can run everything', async () => {
    const el = await mount(hub());
    expect(note(el)).toBeNull();
  });
});

/**
 * **Before it creates the second automation on one event** (whatsapp_inbox#58).
 *
 * The two WhatsApp appointment families wait on the same event with the same filter: a hub running
 * both books every incoming message twice and sends two confirmations. The owner is the only one
 * who can decide that — so the gallery says it, names the flow already there, and lets them
 * through. It does not refuse: two flows on one event is a normal thing to build.
 */
describe('a card that would double up on a trigger says so first (whatsapp_inbox#58)', () => {
  beforeEach(() => document.body.replaceChildren());

  /** The attended twin, as the hub would hand it back from `flows.list()`. */
  const attendedFlow = () => ({
    id: 'f1',
    name: 'WhatsApp → appointment proposal',
    enabled: true,
    definition: buildTemplate(templateById('whatsapp-appointment')!, t) as unknown as Record<string, unknown>,
  });
  const warning = (el: ErpFlowsGallery): Element | null =>
    el.renderRoot.querySelector('[data-same-trigger]');

  it('names the flow already waiting on that event, in the panel, before the button', async () => {
    const client = hub({ flows: { list: vi.fn(async () => [attendedFlow()]) } });
    const el = await mount(client);
    el.open('whatsapp-appointment-unattended');
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;

    const note = warning(el);
    expect(note, 'no warning shown for a card that collides').toBeTruthy();
    expect(note?.textContent).toContain('WhatsApp → appointment proposal');
  });

  it('still lets them create it — it is their hub', async () => {
    const client = hub({ flows: { list: vi.fn(async () => [attendedFlow()]) } });
    const el = await mount(client);
    el.open('whatsapp-appointment-unattended');
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;
    await el.use();

    expect(client.flows.create).toHaveBeenCalledTimes(1);
  });

  it('says nothing about the twin once the owner has turned it off', async () => {
    // The switch-over this card exists for: the salon pauses the attended flow to move to the
    // unattended one. A paused flow does not fire, so there is nothing to double up on — and a
    // warning that still names it tells the owner to do what they have just done.
    const client = hub({ flows: { list: vi.fn(async () => [{ ...attendedFlow(), enabled: false }]) } });
    const el = await mount(client);
    el.open('whatsapp-appointment-unattended');
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;

    expect(warning(el), 'a PAUSED twin is still being warned about').toBeNull();
  });

  it('says nothing when no flow waits on that event', async () => {
    // The control: with the warning wired to «is there any flow at all» this passes green while
    // warning about everything, so it has to be a hub that HAS flows, just not on this event.
    const other = {
      id: 'f9',
      name: 'Friday review',
      enabled: true,
      definition: { schema_version: 1, triggers: [{ kind: 'cron', cron: '0 9 * * 5' }], steps: [] },
    };
    const el = await mount(hub({ flows: { list: vi.fn(async () => [other]) } }));
    el.open('whatsapp-appointment-unattended');
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;

    expect(warning(el)).toBeNull();
  });

  it('shows the gallery anyway when the hub cannot list flows', async () => {
    // `list` is part of the frozen §9 method list, but a hub that refuses it — offline, a blip,
    // an older core — must not cost the owner the catalogue. No answer means no warning, never an
    // error screen.
    //
    // 🔴 The panel has to be OPEN when the refusal lands, and that is the whole point of the
    // sequencing below. `open()` clears `error`, so a version of this test that opened the panel
    // AFTER the failed load passed against a gallery that DID set an error — the mutant survived.
    // Swapping the client re-runs the load through `updated()`, which is a real path (the shell
    // hands over a new client) and the one where a refusal can reach an open panel.
    const el = await mount(hub({ flows: { list: vi.fn(async () => []) } }));
    el.open('whatsapp-appointment-unattended');
    await el.updateComplete;

    el.client = hub({
      flows: {
        list: vi.fn(async () => {
          throw new Error('nope');
        }),
      },
    }) as never;
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;

    expect(warning(el)).toBeNull();
    expect(card(el, 'whatsapp-appointment-unattended')).toBeTruthy();
    expect(
      el.renderRoot.querySelector('ok-inline-feedback[tone="danger"]'),
      'a refusal to LIST flows became an error on the catalogue',
    ).toBeNull();
  });
});

/**
 * **A card the hub cannot parse is not on the shelf** (flows#92).
 *
 * The unattended WhatsApp recipe writes `interactive` (hub#1633) and `output` (hub#1639). Below
 * `v1.1.16` neither key degrades: the core answers `flow.invalid_definition` for the whole
 * document, so a hub that installed it from here would end up with an automation that refuses to
 * save. The floor is the CARD's, so every other card of the sector stays on the shelf.
 */
describe('the gallery does not offer a recipe this hub could not parse (flows#92)', () => {
  // The release is fixed at the floor and the KEYS are what each test varies: this describe is
  // about the step-key half of `needs`, and a hub with no release would hide the card for the
  // other half (flows#111) — green for a reason none of these tests is asking about.
  const declaring = (...keys: string[]) =>
    schemaFacts(
      {
        $defs: { step: { properties: Object.fromEntries(keys.map((k) => [k, { type: 'object' }])) } },
      },
      QUERY_GRANT_PIN_CORE,
    );

  async function shelf(facts?: SchemaFacts): Promise<ErpFlowsGallery> {
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.client = hub() as never;
    el.t = t;
    if (facts) el.facts = facts;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;
    return el;
  }

  it('paints it where the hub declares both keys', async () => {
    const el = await shelf(declaring('interactive', 'output'));
    expect(card(el, 'whatsapp-appointment-unattended')).toBeTruthy();
  });

  it('does not paint it on a hub that declares neither', async () => {
    const el = await shelf(declaring());
    expect(card(el, 'whatsapp-appointment-unattended')).toBeNull();
    // Its attended twin neither: both write the same two keys since whatsapp_inbox#97, and only
    // one of them said so until flows#100. A card offered here installs and then refuses to save.
    expect(card(el, 'whatsapp-appointment')).toBeNull();
    // …and the sector is not empty: the floor belongs to the cards that carry it, not to the
    // gallery. `no-show-followup` writes no gated key and stays on the shelf.
    expect(card(el, 'no-show-followup')).toBeTruthy();
  });

  it('does not paint it before the hub has answered: fail-closed', async () => {
    const el = await shelf();
    expect(card(el, 'whatsapp-appointment-unattended')).toBeNull();
  });
});
