import { describe, it, expect } from 'vitest';

import './erp-flows-app/erp-flows-app';
import './erp-flows-approvals/erp-flows-approvals';
import './erp-flows-dead-letter/erp-flows-dead-letter';
import './erp-flows-editor/erp-flows-editor';
import './erp-flows-field-picker/erp-flows-field-picker';
import './erp-flows-gallery/erp-flows-gallery';
import './erp-flows-guide/erp-flows-guide';
import './erp-flows-value/erp-flows-value';

/**
 * **No component of this module may redefine something the DOM already gives it** (flows#107).
 *
 * A custom element IS an `HTMLElement`, so every name on that prototype chain is already taken and
 * already CALLED — by the browser, by Lit, by any delegated handler. Reusing one of those names for
 * the component's own logic does not shadow it locally: it replaces it for everybody.
 *
 * Two of them were live in this module and the typecheck was the only thing that saw it:
 *
 * - `ErpFlowsApp.remove(flow)` sat on top of `ChildNode.remove()`. Anything that detaches the
 *   element the ordinary way — a parent clearing its children, a router swapping a view — called
 *   the flow DELETION with `flow` undefined.
 * - `ErpFlowsFieldPicker.matches` sat on top of `Element.matches(selectors)` and returned an ARRAY.
 *   Every `matches()` returns a boolean and callers branch on it; an array is truthy always, so a
 *   delegated `if (el.matches('button'))` matched everything.
 *
 * This runs over the registered tag, not over a list written by hand, so a component added
 * tomorrow is covered without touching this file — and it names the member it found, because
 * «a class member clashes» is not something anybody can act on.
 */
const TAGS = [
  'erp-flows-app',
  'erp-flows-approvals',
  'erp-flows-dead-letter',
  'erp-flows-editor',
  'erp-flows-field-picker',
  'erp-flows-gallery',
  'erp-flows-guide',
  'erp-flows-value',
];

/** Every name the DOM already defines on an `HTMLElement`, walking the real prototype chain. */
function domMemberNames(): Set<string> {
  const names = new Set<string>();
  let proto: object | null = HTMLElement.prototype;
  while (proto) {
    for (const name of Object.getOwnPropertyNames(proto)) names.add(name);
    proto = Object.getPrototypeOf(proto);
  }
  return names;
}

/** The names a component defines ITSELF — its own prototypes, stopping at `HTMLElement`. */
function ownMemberNames(ctor: CustomElementConstructor): string[] {
  const names: string[] = [];
  let proto: object | null = ctor.prototype;
  while (proto && proto !== HTMLElement.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name !== 'constructor') names.push(name);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return names;
}

describe('a component never takes a name the DOM already uses (flows#107)', () => {
  const dom = domMemberNames();

  it.each(TAGS)('%s defines nothing that already exists on HTMLElement', (tag) => {
    const ctor = customElements.get(tag);
    expect(ctor, `${tag} is not registered`).toBeDefined();
    const clashes = ownMemberNames(ctor as CustomElementConstructor).filter((n) => dom.has(n));
    expect(clashes, `${tag} redefines DOM member(s): ${clashes.join(', ')}`).toEqual([]);
  });

  it('the check sees a clash when there is one', () => {
    // The guard is worth nothing if it cannot fail: a class that redefines `remove` — exactly what
    // `erp-flows-app` did — has to come back named, not swallowed.
    class Shadowing extends HTMLElement {
      remove(): void {}
    }
    const clashes = ownMemberNames(Shadowing).filter((n) => dom.has(n));
    expect(clashes).toContain('remove');
  });
});
