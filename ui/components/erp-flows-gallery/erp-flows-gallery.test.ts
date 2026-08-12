import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import type { ErpFlowsGallery } from './erp-flows-gallery';
import { TEMPLATES, templateById } from '../../lib/templates';
import en from '../../../locales/en.json';

/** The shell's translator, reduced to the lookup a test needs (`{param}` is not exercised here). */
const t = (key: string): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return typeof cur === 'string' ? cur : key;
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
