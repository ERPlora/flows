import { describe, it, expect, beforeEach, vi } from 'vitest';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The save button says «Save»** (flows#144).
 *
 * The header's save button lost the `>` that closes its opening tag, so its label expression sat in
 * the attribute zone — where Lit binds it as an element part and renders nothing — and the owner saw
 * an empty blue square next to «Test run», on every viewport. These tests mount the editor with the
 * module's REAL `en` and `es` catalogues and read the button's own text, so a label that does not
 * reach the button's content fails in both languages.
 *
 * The last block is the class guard: no button of the editor, on any tab, may render without a
 * visible name — an empty `ion-button` is exactly what this bug looked like from the outside.
 */

type Catalogue = Record<string, unknown>;

const CATALOGUES: Record<'en' | 'es', Catalogue> = { en, es };

/** The module's `t()` over a real catalogue: dotted key → string, `{param}` interpolated. */
function translator(cat: Catalogue) {
  return (key: string, params?: Record<string, unknown>): string => {
    const hit = key.split('.').reduce<unknown>((node, part) => (node as Catalogue | undefined)?.[part], cat);
    if (typeof hit !== 'string') return key;
    return hit.replace(/\{(\w+)\}/g, (_m, p: string) => String(params?.[p] ?? ''));
  };
}

function fakeClient(update: () => Promise<unknown>) {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(update),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      run: vi.fn(async () => ({})),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
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

async function settle(el: ErpFlowsEditor): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(
  lang: 'en' | 'es',
  update: () => Promise<unknown> = async () => ({ id: 'f1' }),
): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient(update) as never;
  el.t = translator(CATALOGUES[lang]) as never;
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

function saveButton(el: ErpFlowsEditor): HTMLElement {
  const btn = el.renderRoot.querySelector('[data-testid="flows-editor-save"]') as HTMLElement | null;
  expect(btn, 'the editor has no save button').toBeTruthy();
  return btn!;
}

const text = (node: Element): string => (node.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('the save button carries its label (flows#144)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it.each([
    ['en', 'Save', 'Saving…'],
    ['es', 'Guardar', 'Guardando…'],
  ] as const)('%s: reads «%s» at rest and «%s» while it saves', async (lang, idle, busy) => {
    let release!: (v: unknown) => void;
    const el = await mount(lang, () => new Promise((r) => (release = r)));

    expect(text(saveButton(el))).toBe(idle);

    const saving = el.save();
    await settle(el);
    expect(text(saveButton(el))).toBe(busy);
    expect(saveButton(el).hasAttribute('disabled')).toBe(true);

    release({ id: 'f1' });
    await saving;
    await settle(el);
    expect(text(saveButton(el))).toBe(idle);
    expect(saveButton(el).hasAttribute('disabled')).toBe(false);
  });

  it('the label is the button content, not a stray attribute of the opening tag', async () => {
    const el = await mount('es');
    const btn = saveButton(el);
    // With the tag left open, the label expression is bound in the attribute zone: nothing lands
    // inside the button. Its content must be exactly the label, as a text node.
    expect([...btn.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && text(n as Element) === 'Guardar')).toBe(
      true,
    );
  });
});

describe('no button of the editor renders empty', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it.each(['editor', 'test', 'permissions', 'history'] as const)('tab %s', async (tab) => {
    const el = await mount('es');
    (el as unknown as { tab: string }).tab = tab;
    await settle(el);

    const empty = [...el.renderRoot.querySelectorAll('ion-button, button')]
      .filter((b) => !text(b) && !b.getAttribute('aria-label') && !b.getAttribute('title'))
      .map((b) => b.getAttribute('data-testid') ?? b.outerHTML.slice(0, 120));
    expect(empty).toEqual([]);
  });
});
