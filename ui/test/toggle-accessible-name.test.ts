import { describe, it, expect, beforeEach, vi } from 'vitest';
import en from '../../locales/en.json';
import es from '../../locales/es.json';
import '../components/erp-flows-app/erp-flows-app';
import '../components/erp-flows-editor/erp-flows-editor';
import type { ErpFlowsApp } from '../components/erp-flows-app/erp-flows-app';
import type { ErpFlowsEditor } from '../components/erp-flows-editor/erp-flows-editor';

/**
 * **The switch that turns an automation on says what it turns on** (flows#140).
 *
 * The `ion-toggle` in the editor's header and the one on every row of the list had no label and no
 * `aria-label`: the «Active / Paused» pill beside them is not tied to them, so a screen reader read
 * «switch, off» with no name, and a walk-through looking for the control by its name found nothing.
 * `ion-toggle` (Ionic 8) is itself the `role="switch"` element and takes its name from the host's
 * `aria-label`, so that attribute is what these tests read — with the module's REAL `en` and `es`
 * catalogues, so a key missing in either language shows up as the bare key and fails.
 *
 * The last block is the class guard: no `ion-toggle` of either screen renders without a name.
 */

type Catalogue = Record<string, unknown>;
type Lang = 'en' | 'es';

const CATALOGUES: Record<Lang, Catalogue> = { en, es };

function lookup(cat: Catalogue, key: string, params?: Record<string, unknown>): string {
  const hit = key.split('.').reduce<unknown>((node, part) => (node as Catalogue | undefined)?.[part], cat);
  if (typeof hit !== 'string') return key;
  return hit.replace(/\{(\w+)\}/g, (_m, p: string) => String(params?.[p] ?? ''));
}

const FLOWS = [
  {
    id: 'f1',
    name: 'Aviso de stock bajo',
    enabled: true,
    updated_at: '2026-08-14T10:00:00Z',
    definition: { schema_version: 1, triggers: [{ kind: 'event', event: 'inventory.stock_changed' }], steps: [] },
  },
  {
    id: 'f2',
    name: '',
    enabled: false,
    updated_at: '2026-08-12T10:00:00Z',
    definition: { schema_version: 1, triggers: [{ kind: 'cron', cron: '0 18 * * 5' }], steps: [] },
  },
];

function fakeClient(lang: { current: Lang }, rows = FLOWS.map((f) => ({ ...f }))) {
  return {
    // The shell's translator: the catalogue of the ACTIVE language, parameters interpolated.
    t: (catalog: Record<Lang, Catalogue>, key: string, params?: Record<string, unknown>) =>
      lookup(catalog[lang.current], key, params),
    flows: {
      list: vi.fn(async () => rows),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      run: vi.fn(async () => ({})),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
      get: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      secrets: vi.fn(async () => []),
      approvals: vi.fn(async () => []),
    },
    events: {
      shape: vi.fn(async () => null),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

async function settle(el: { updateComplete: Promise<unknown> }): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mountApp(client: unknown): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await settle(el);
  await settle(el);
  return el;
}

async function mountEditor(lang: Lang, tab = 'editor'): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient({ current: lang }) as never;
  el.t = ((key: string, params?: Record<string, unknown>) => lookup(CATALOGUES[lang], key, params)) as never;
  (el as unknown as { tab: string }).tab = tab;
  el.flow = {
    id: 'f1',
    name: 'Remind the appointment',
    enabled: false,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'sale.completed' }],
      steps: [{ id: 'a', kind: 'command', command: 'one' }],
    },
  } as never;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

const rowToggle = (el: ErpFlowsApp, id: string): Element => {
  const toggle = el.renderRoot.querySelector(`[data-testid="flows-app-row-toggle-${id}"]`);
  expect(toggle, `row ${id} has no switch`).toBeTruthy();
  return toggle!;
};

describe('the switch in the editor header is named (flows#140)', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each([
    ['en', 'Turn on the automation'],
    ['es', 'Activar automatización'],
  ] as const)('%s: «%s»', async (lang, name) => {
    const el = await mountEditor(lang);
    const toggle = el.renderRoot.querySelector('[data-testid="flows-editor-enabled"]');
    expect(toggle, 'the editor has no switch').toBeTruthy();
    expect(toggle!.getAttribute('aria-label')).toBe(name);
  });
});

describe('the switch on every row of the list names its automation (flows#140)', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each([
    ['en', 'Turn on Aviso de stock bajo', 'Turn on Untitled automation'],
    ['es', 'Activar Aviso de stock bajo', 'Activar Automatización sin nombre'],
  ] as const)('%s: «%s», and an unnamed one by the word the row shows', async (lang, named, unnamed) => {
    const el = await mountApp(fakeClient({ current: lang }));
    expect(rowToggle(el, 'f1').getAttribute('aria-label')).toBe(named);
    expect(rowToggle(el, 'f2').getAttribute('aria-label')).toBe(unnamed);
  });

  it('follows the shell when the language changes while the list is open', async () => {
    const lang = { current: 'es' as Lang };
    const el = await mountApp(fakeClient(lang));
    expect(rowToggle(el, 'f1').getAttribute('aria-label')).toBe('Activar Aviso de stock bajo');

    lang.current = 'en';
    window.dispatchEvent(new CustomEvent('erplora:locale-changed'));
    await settle(el);
    expect(rowToggle(el, 'f1').getAttribute('aria-label')).toBe('Turn on Aviso de stock bajo');
  });
});

describe('no switch renders without a name', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each(['editor', 'test', 'permissions', 'history'] as const)('editor, tab %s', async (tab) => {
    const el = await mountEditor('es', tab);
    const unnamed = [...el.renderRoot.querySelectorAll('ion-toggle')]
      .filter((t) => !(t.getAttribute('aria-label') ?? '').trim() && !(t.textContent ?? '').trim())
      .map((t) => t.getAttribute('data-testid') ?? t.outerHTML.slice(0, 120));
    expect(unnamed).toEqual([]);
  });

  it('list', async () => {
    const el = await mountApp(fakeClient({ current: 'es' }));
    const toggles = [...el.renderRoot.querySelectorAll('ion-toggle')];
    expect(toggles.length).toBe(FLOWS.length);
    const unnamed = toggles
      .filter((t) => !(t.getAttribute('aria-label') ?? '').trim() && !(t.textContent ?? '').trim())
      .map((t) => t.getAttribute('data-testid') ?? t.outerHTML.slice(0, 120));
    expect(unnamed).toEqual([]);
  });
});
