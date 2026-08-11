import { describe, it, expect, beforeEach } from 'vitest';
import './erp-flows-field-picker';
import type { ErpFlowsFieldPicker } from './erp-flows-field-picker';

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 5,
  fields: [
    { path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 5 },
    { path: 'customer', type: 'object', redacted: false, truncated: false, seen_in: 5 },
    { path: 'customer.email', type: 'string', redacted: true, truncated: false, seen_in: 5 },
    { path: 'table_number', type: 'number', sample: 7, redacted: false, truncated: false, seen_in: 3 },
    { path: 'lines', type: 'array', items: 3, redacted: false, truncated: false, seen_in: 5 },
  ],
};

async function mount(props: Partial<ErpFlowsFieldPicker> = {}): Promise<ErpFlowsFieldPicker> {
  const el = document.createElement('erp-flows-field-picker') as ErpFlowsFieldPicker;
  el.shape = SHAPE as never;
  el.open = true;
  el.t = (k: string) => k;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const rows = (el: ErpFlowsFieldPicker): HTMLElement[] =>
  Array.from(el.renderRoot.querySelectorAll('.field')) as HTMLElement[];

describe('picking a field out of REAL data', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows the words and the real example, not the machine path', async () => {
    const el = await mount();
    const total = rows(el).find((r) => r.textContent?.includes('Total'))!;
    expect(total.textContent).toContain('42.50');
    expect(total.textContent).not.toContain('input.total');
  });

  it('still OFFERS a field whose example was withheld, and says why it is missing', async () => {
    // hub#715 withholds the VALUE, never the field: the owner has to be able to map
    // `customer.email` into a message without anybody's address being shown to draw the row.
    const el = await mount();
    const email = rows(el).find((r) => r.textContent?.includes('Email'))!;
    expect(email.getAttribute('aria-disabled')).not.toBe('true');
    expect(email.textContent).toContain('ui.pickFieldRedacted');
  });

  it('greys out what the mapping language cannot reach, WITH the reason', async () => {
    // The language has no array indexing (`def.rs::resolve_path`). Offering `lines` as if it
    // could be dropped into a message would promise something the kernel cannot resolve; hiding
    // it would leave the owner hunting for a field they can see in their own data.
    const el = await mount();
    const lines = rows(el).find((r) => r.textContent?.includes('Lines'))!;
    expect(lines.getAttribute('aria-disabled')).toBe('true');
    expect(lines.textContent).toContain('ui.pickFieldTypeSkipped');
  });

  it('searches by the words AND by the value, not only by the key', async () => {
    // The fix that closed the complaints about Zapier's picker. Somebody looking at their own
    // last ticket searches «42», not «total».
    const el = await mount();
    el.query = '42';
    await el.updateComplete;
    expect(rows(el)).toHaveLength(1);
    expect(rows(el)[0].textContent).toContain('Total');

    el.query = 'table';
    await el.updateComplete;
    expect(rows(el)).toHaveLength(1);
  });

  it('hands back the path with the ROOT the step reads from', async () => {
    // A guard inside a step reads `input.…`; a filter inside the trigger reads `event.…`. Same
    // picker, different root — and getting it wrong is a mapping that silently resolves to null.
    const el = await mount({ root: 'event' });
    let picked = '';
    el.addEventListener('flows-field-picked', (e) => {
      picked = (e as CustomEvent).detail.path;
    });
    rows(el).find((r) => r.textContent?.includes('Total'))!.click();
    expect(picked).toBe('event.total');
  });

  it('does not hand back a field it greyed out', async () => {
    const el = await mount();
    let picked = '';
    el.addEventListener('flows-field-picked', (e) => {
      picked = (e as CustomEvent).detail.path;
    });
    rows(el).find((r) => r.textContent?.includes('Lines'))!.click();
    expect(picked).toBe('');
  });

  it('says «no examples yet» rather than looking broken when the hub has none', async () => {
    // `samples: 0` means nothing like this has happened here in 90 days — NOT that the event
    // does not exist. The fields are still the right ones.
    const el = await mount({ shape: { ...SHAPE, samples: 0 } as never });
    expect(el.renderRoot.textContent).toContain('ui.pickFieldNoSamples');
    expect(rows(el).length).toBeGreaterThan(0);
  });

  it('says there is nothing to pick when the flow has no payload at all', async () => {
    const el = await mount({ shape: null as never });
    expect(el.renderRoot.textContent).toContain('ui.pickFieldEmpty');
  });
});
