import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { templateById, templateGrants } from '../../lib/templates';
import { grantPin, type Grant } from '../../lib/flow-doc';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

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

/** The card flows#80 is about: it cancels appointments, and only ever as the customer. */
const LIMITED = 'whatsapp-appointment-unattended';
/** A card that limits nothing, so «unchanged» has something to be measured against. */
const PLAIN = 'no-show-followup';
const CANCEL = 'appointments.appointments.cancel';

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

async function install(client: unknown, id: string): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
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
    // ONLY the limited one. Everything else stays a decision the owner makes on the Permissions
    // screen — installing a recipe is not a reason to hand it the rest without being asked.
    expect(sent.map((g: Grant) => `${g.kind} ${g.value}`)).toEqual([`command ${CANCEL}`]);
    expect(grantPin(sent[0])).toEqual({ channel: 'customer' });
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
    // And it says so: a containment that could not be applied is not something to find out later.
    expect(el.renderRoot.querySelector('ok-inline-feedback')).toBeTruthy();
  });

  it('does not move the owner along as though the recipe had installed as promised', async () => {
    const h = hub({ keepsPins: false });
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.client = h.client as never;
    el.t = t;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
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

    expect(templateGrants(templateById(PLAIN)!, t).every((g) => !Object.keys(grantPin(g)).length))
      .toBe(true);
    expect(h.replaceGrants).not.toHaveBeenCalled();
  });

  it('says so on a core whose flows surface predates grants at all', async () => {
    const h = hub({ noGrantsSurface: true });
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.client = h.client as never;
    el.t = t;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
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
});

describe('the card SAYS the limit, in the panel the owner reads before installing', () => {
  beforeEach(() => document.body.replaceChildren());

  const panel = async (id: string, translate = t): Promise<ErpFlowsGallery> => {
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.client = hub().client as never;
    el.t = translate;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
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
