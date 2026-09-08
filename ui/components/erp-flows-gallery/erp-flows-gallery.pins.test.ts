import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { templateById, templateGrants } from '../../lib/templates';
import { moduleTemplateId, moduleTemplates } from '../../lib/module-templates';
import { grantPin, type Grant } from '../../lib/flow-doc';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

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

/**
 * **The limited card is one the HUB SERVES, not one written here** (flows#101).
 *
 * It used to be `whatsapp-appointment-unattended`, a hand copy of a recipe `whatsapp_inbox`
 * publishes itself, and that copy is gone: the hub serves the module's own `flows/` folder since
 * `v1.1.17` and carries each permission's payload limit with it (hub#1654). So the limits this
 * screen has to install now arrive over the wire, and a test anchored on a card written in this
 * repository would be measuring a path production no longer takes.
 *
 * The row below is what `GET /api/hub/flows/templates` answers for the family, with the permissions
 * copied from `whatsapp_inbox/flows/appointment-from-whatsapp-unattended.grants.json` as published
 * on its `main`: three limited (the two writes say WHO, the read says WHOSE) among unlimited ones,
 * which is what makes «only the limited ones are installed» a claim with a negative in it.
 */
const MODULE = 'whatsapp_inbox';
const FAMILY = 'appointment-from-whatsapp-unattended';
const LIMITED = moduleTemplateId(MODULE, FAMILY);
/** A card that limits nothing, so «unchanged» has something to be measured against. */
const PLAIN = 'no-show-followup';
const CANCEL = 'appointments.appointments.cancel';
const RESCHEDULE = 'appointments.appointments.reschedule';
/** The READ the same card limits since flows#111 — the diary of whoever wrote, and nobody else. */
const READ = 'appointments.appointments.list_for_customer';
/** What each limited permission fixes, by operation: the two writes say WHO, the read says WHOSE. */
const PINS: Record<string, Record<string, unknown>> = {
  [CANCEL]: { channel: 'customer' },
  [RESCHEDULE]: { channel: 'customer' },
  [READ]: { customer_id: 'steps.resolve_customer.id' },
};

const servedDocument = () => ({
  schema_version: 1,
  name: 'Book an appointment from WhatsApp, unattended',
  triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
  steps: [
    { id: 'resolve_customer', kind: 'command', command: 'customers.create', params: {} },
    { id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} },
  ],
});

/** One row of `GET /api/hub/flows/templates`, as the module publishes it. */
const servedRow = () => ({
  module: MODULE,
  family: FAMILY,
  documents: { en: servedDocument() },
  grants: [
    { kind: 'command', value: 'customers.create' },
    { kind: 'command', value: 'appointments.appointments.create' },
    { kind: 'query', value: READ, payload: { customer_id: 'steps.resolve_customer.id' } },
    { kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
    { kind: 'command', value: RESCHEDULE, payload: { channel: 'customer' } },
  ],
});

/** The same card the gallery paints, built the way the gallery builds it. */
const servedCard = () => moduleTemplates([servedRow()], 'en')[0]!;

/**
 * A hub whose `PUT …/grants` behaves like the kernel from hub#1623: a complete replace that keeps
 * the pins it was sent.
 */
function hub(over: { keepsPins?: boolean; noGrantsSurface?: boolean; failWrite?: boolean } = {}) {
  const { keepsPins = true, noGrantsSurface = false, failWrite = false } = over;
  let held: Grant[] = [];
  const replaceGrants = vi.fn(async (_id: string, grants: Grant[]) => {
    if (failWrite) throw new Error('grants refused');
    // A hub older than hub#1623 has no `payload` on a grant: serde drops the unknown key without
    // a word, which is the whole reason this install has to read back what it wrote.
    held = keepsPins ? grants : grants.map((g) => ({ kind: g.kind, value: g.value }));
    return held;
  });
  return {
    client: {
      flows: {
        create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
        list: vi.fn(async () => []),
        templates: vi.fn(async () => [servedRow()]),
        ...(noGrantsSurface ? {} : { replaceGrants }),
      },
      events: {
        shape: vi.fn(async (name: string) => ({
          event_name: name,
          declared_by: ['x'],
          samples: 0,
          fields: [],
        })),
      },
    },
    replaceGrants,
    written: () => held,
  };
}

async function mount(client: unknown, translate = t): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
  el.client = client as never;
  el.t = translate;
  document.body.appendChild(el);
  await el.updateComplete;
  // Twelve and not six: the served recipes are a round trip of their own, and a card that has not
  // landed yet is a card `open()` cannot find — the test would pass on an empty panel.
  for (let i = 0; i < 12; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

async function install(client: unknown, id: string): Promise<ErpFlowsGallery> {
  const el = await mount(client);
  el.open(id);
  await el.updateComplete;
  await el.use();
  await el.updateComplete;
  return el;
}

describe('a recipe with a limit installs LIMITED, or it does not install the permission at all', () => {
  beforeEach(() => document.body.replaceChildren());

  it('grants the limited permission as the card declared it', async () => {
    const h = hub();
    await install(h.client, LIMITED);

    expect(h.replaceGrants).toHaveBeenCalledTimes(1);
    const [flowId, sent] = h.replaceGrants.mock.calls[0];
    expect(flowId).toBe('created-1');
    // ONLY the limited ones. Everything else stays a decision the owner makes on the Permissions
    // screen — installing a recipe is not a reason to hand it the rest without being asked. Three
    // since flows#111: the two writes whatsapp_inbox#118 pinned to `channel: customer`, and the
    // READ, which is a containment of the same weight — `list_for_customer` with nothing fixed
    // answers about every customer in the salon. None of the three may install wide.
    expect(sent.map((g: Grant) => `${g.kind} ${g.value}`).sort()).toEqual(
      [`command ${CANCEL}`, `command ${RESCHEDULE}`, `query ${READ}`].sort(),
    );
    // Each one with the limit IT declares, not a shared one: asserting «they all fix `channel`»
    // would have gone green on a read pinned to the wrong field, or to nothing that names a person.
    for (const grant of sent) expect(grantPin(grant), grant.value).toEqual(PINS[grant.value]);
    // Derived from the card rather than from this list, so a limit the module adds to the family
    // is installed here too instead of being silently left behind.
    expect(sent.map((g: Grant) => g.value).sort()).toEqual(
      templateGrants(servedCard(), t)
        .filter((g) => Object.keys(grantPin(g)).length > 0)
        .map((g) => g.value)
        .sort(),
    );
  });

  // 🔴 The regression flows#80 would become if the limit were written and not checked. A hub from
  // before hub#1623 stores the row and silently drops the `payload`, so the salon would end up
  // HOLDING the wide «may cancel appointments» — granted by a screen it never pressed a button on,
  // and skipped by the Permissions screen afterwards because a held grant is not a missing one.
  it('leaves the flow with NO permission when the hub did not keep the limit', async () => {
    const h = hub({ keepsPins: false });
    const el = await install(h.client, LIMITED);

    expect(h.written()).toEqual([]);
    expect(h.written().some((g) => g.value === CANCEL)).toBe(false);
    expect(h.written().some((g) => g.value === RESCHEDULE)).toBe(false);
    // And it says so: a containment that could not be applied is not something to find out later.
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
  });

  it('does not move the owner along as though the recipe had installed as promised', async () => {
    const h = hub({ keepsPins: false });
    const el = await mount(h.client);
    const seen: CustomEvent[] = [];
    el.addEventListener('flows-template-used', (e) => seen.push(e as CustomEvent));
    el.open(LIMITED);
    await el.updateComplete;
    await el.use();

    // The sibling rule of «refuses to pretend it worked when the hub said no»: handing the flow
    // over routes straight to Permissions, and the owner would grant the WIDE cancel there
    // believing the card had contained it. So the panel keeps them, with the sentence.
    expect(seen).toHaveLength(0);
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
    // The flow is kept, not thrown away: the hub already accepted it and it sits paused in the
    // list, where the owner can grant and limit it by hand (#66).
    expect(h.client.flows.create).toHaveBeenCalledTimes(1);
  });

  it('writes nothing at all for a card that limits nothing', async () => {
    const h = hub();
    await install(h.client, PLAIN);

    // The control: without it this test passes just as well on a card that never opened.
    expect(h.client.flows.create, 'the plain card never installed — nothing was measured')
      .toHaveBeenCalledTimes(1);
    expect(templateGrants(templateById(PLAIN)!, t).every((g) => !Object.keys(grantPin(g)).length))
      .toBe(true);
    expect(h.replaceGrants).not.toHaveBeenCalled();
  });

  it('says so on a core whose flows surface predates grants at all', async () => {
    const h = hub({ noGrantsSurface: true });
    const el = await mount(h.client);
    const seen: CustomEvent[] = [];
    el.addEventListener('flows-template-used', (e) => seen.push(e as CustomEvent));
    el.open(LIMITED);
    await el.updateComplete;
    await el.use();

    // Same rule, and here it is the only one available: a core with no grants surface at all
    // cannot be told about the limit, so it must not be sold as having taken it.
    expect(seen).toHaveLength(0);
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
  });

  it('does not swallow a hub that refused to write the permission', async () => {
    const h = hub({ failWrite: true });
    const el = await install(h.client, LIMITED);
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
  });

  /**
   * **The sentence has to end with what to DO, because the obvious move makes it worse.**
   *
   * The flow is left paused and asking for permissions, so the owner's natural next click is
   * Permissions — and granting `appointments.appointments.cancel` by hand there rebuilds the WIDE
   * grant this whole issue removes, on a hub that cannot hold the limit. A warning that stops at
   * «it did not work» hands her straight to that click.
   *
   * Asserted on MEANING and in both locales, the way the card's own «nobody reviews this» line is:
   * each language has to say, in its own words, «do not grant it by hand» AND «it will work once
   * the hub is updated». The prose may be rewritten; those two promises may not quietly leave.
   */
  it('tells the owner what to do next — and that the manual grant is the wrong move', async () => {
    const localised = (dict: unknown) => (key: string, params?: Record<string, unknown>): string => {
      let cur: unknown = dict;
      for (const part of key.split('.')) {
        cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
      }
      const found = typeof cur === 'string' ? cur : key;
      return params
        ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
        : found;
    };

    for (const [lang, dict, dontGrant, willWork] of [
      ['en', en, /do not grant|don.t grant|without granting|never grant/i, /updat/i],
      ['es', es, /no (le )?conced|sin conced/i, /actualic|actualiz/i],
    ] as const) {
      const h = hub({ keepsPins: false });
      const el = await mount(h.client, localised(dict));
      el.open(LIMITED);
      await el.updateComplete;
      await el.use();
      await el.updateComplete;

      const said = el.renderRoot.querySelector('ok-inline-feedback')?.textContent ?? '';
      // The key resolved: an untranslated string would render the key itself.
      expect(said, `${lang}: the warning is still the i18n key`).not.toContain(
        'ui.errLimitNotApplied',
      );
      expect(said, `${lang}: does not say the manual grant is the wrong move`).toMatch(dontGrant);
      expect(said, `${lang}: does not say it works once the hub is updated`).toMatch(willWork);
      el.remove();
    }
  });
});

describe('the card SAYS the limit, in the panel the owner reads before installing', () => {
  beforeEach(() => document.body.replaceChildren());

  const panel = async (id: string, translate = t): Promise<ErpFlowsGallery> => {
    const el = await mount(hub().client, translate);
    el.open(id);
    await el.updateComplete;
    return el;
  };

  it('names the fixed field and its value next to the permission', async () => {
    const el = await panel(LIMITED);
    const line = el.renderRoot.querySelector(`[data-limit="${CANCEL}"]`);
    expect(line, 'the limited permission carries a line saying so').toBeTruthy();
    expect(line!.textContent).toContain('channel = customer');
  });

  // ADR-0055/0199: the source language is `en` and every string ships with its `es`. A panel that
  // only reads right in English is half a screen for a salon in Spain.
  it('says it in Spanish too', async () => {
    const tEs = (key: string, params?: Record<string, unknown>): string => {
      let cur: unknown = es;
      for (const part of key.split('.')) {
        cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
      }
      const found = typeof cur === 'string' ? cur : key;
      return params
        ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
        : found;
    };
    const el = await panel(LIMITED, tEs);
    const line = el.renderRoot.querySelector(`[data-limit="${CANCEL}"]`);
    expect(line?.textContent).toContain('Solo con channel = customer');
    // The key resolved: an untranslated string would render the key itself.
    expect(line?.textContent).not.toContain('ui.tplGrantLimited');
  });

  // The positive has to be the ABSENCE somewhere, or the test above passes on a panel that stamps
  // the line on every row.
  it('puts no such line on a permission that is not limited', async () => {
    const el = await panel(LIMITED);
    expect(el.renderRoot.querySelector('[data-limit="customers.create"]')).toBeNull();
    const plain = await panel(PLAIN);
    expect(plain.renderRoot.querySelector('[data-limit]')).toBeNull();
  });
});
