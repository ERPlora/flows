import { describe, it, expect, beforeEach } from 'vitest';
import './erp-flows-value';
import type { ErpFlowsValue } from './erp-flows-value';

async function mount(parts: unknown[]): Promise<ErpFlowsValue> {
  const el = document.createElement('erp-flows-value') as ErpFlowsValue;
  el.parts = parts as never;
  el.fieldLabel = (path: string) => (path === 'input.total' ? 'Sale total' : path);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('composing a value out of text and real fields', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows a picked field as a pill with the words the owner chose it by', async () => {
    const el = await mount([{ kind: 'field', path: 'input.total' }]);
    const pill = el.renderRoot.querySelector('.pill');
    expect(pill?.textContent).toContain('Sale total');
  });

  it('NEVER shows the braces of the mapping language', async () => {
    // Make's documented failure mode is «staring at raw data structures without much context».
    // `{{input.total}}` is that. The path lives in the model and nowhere else.
    const el = await mount([
      { kind: 'text', text: 'Total: ' },
      { kind: 'field', path: 'input.total' },
    ]);
    expect(el.renderRoot.textContent).not.toContain('{{');
    expect(el.renderRoot.textContent).not.toContain('input.total');
  });

  it('gives every text segment its own box, so a word in the middle can be fixed', async () => {
    const el = await mount([
      { kind: 'text', text: 'Hi ' },
      { kind: 'field', path: 'input.name' },
      { kind: 'text', text: ', your table is ready' },
    ]);
    expect(el.renderRoot.querySelectorAll('input')).toHaveLength(2);
  });

  it('starts with one empty box when there is nothing yet', async () => {
    const el = await mount([]);
    expect(el.renderRoot.querySelectorAll('input')).toHaveLength(1);
  });

  it('announces a change with the parts, and merges the text it can', async () => {
    const el = await mount([
      { kind: 'text', text: 'a' },
      { kind: 'text', text: 'b' },
    ]);
    let seen: unknown = null;
    el.addEventListener('flows-value-change', (e) => {
      seen = (e as CustomEvent).detail;
    });
    const input = el.renderRoot.querySelector('input') as HTMLInputElement;
    input.value = 'ab!';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(seen).toEqual({ parts: [{ kind: 'text', text: 'ab!' }] });
  });

  it('removing a pill leaves the text around it joined, not two empty holes', async () => {
    const el = await mount([
      { kind: 'text', text: 'Hi ' },
      { kind: 'field', path: 'input.name' },
      { kind: 'text', text: '!' },
    ]);
    let seen: { parts: unknown[] } | null = null;
    el.addEventListener('flows-value-change', (e) => {
      seen = (e as CustomEvent).detail;
    });
    (el.renderRoot.querySelector('.pill button') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(seen!.parts).toEqual([{ kind: 'text', text: 'Hi !' }]);
  });

  it('asks the editor for the picker instead of opening one of its own', async () => {
    // One picker for the whole editor: it is the thing that talks to the hub, and every box on
    // the screen must offer the same fields with the same real examples.
    const el = await mount([]);
    let asked = 0;
    el.addEventListener('flows-pick-field', () => {
      asked += 1;
    });
    (el.renderRoot.querySelector('.insert') as HTMLButtonElement).click();
    expect(asked).toBe(1);
  });

  it('hides the insert button when there is nothing to insert from', async () => {
    // A manual flow with no trigger payload has no fields. Offering the button would open an
    // empty picker, which reads as «broken» rather than as «nothing here».
    const el = await mount([]);
    el.canPickFields = false;
    await el.updateComplete;
    expect(el.renderRoot.querySelector('.insert')).toBeNull();
  });
});
