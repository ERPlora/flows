import { describe, it, expect } from 'vitest';
import {
  MAX_BUTTONS,
  MAX_LIST_ROWS,
  blankTapOptions,
  readTapOptions,
  setTapOptions,
  tapOptionProblems,
  toInteractive,
} from './whatsapp-options';
import type { TapOptions } from './whatsapp-options';
import type { FlowDoc, Step } from './flow-doc';

function doc(step: Partial<Step>): FlowDoc {
  return {
    schema_version: 1,
    triggers: [{ kind: 'manual' }],
    steps: [{ id: 'n1', kind: 'notify', channel: 'whatsapp', ...step } as Step],
  };
}

describe('reading what the step already carries', () => {
  it('says «this is an ordinary text message» when there are no options', () => {
    expect(readTapOptions({ id: 'n1', kind: 'notify', vars: { text: 'Hola' } })).toBeNull();
  });

  it('reads Meta’s BUTTON shape back into the three things the screen edits', () => {
    const read = readTapOptions({
      id: 'n1',
      kind: 'notify',
      channel: 'whatsapp',
      interactive: {
        type: 'button',
        body: { text: '¿Confirmas la cita?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'yes', title: 'Confirmar' } },
            { type: 'reply', reply: { id: 'no', title: 'Anular' } },
          ],
        },
      },
    });
    expect(read).toEqual({
      kind: 'button',
      body: '¿Confirmas la cita?',
      openLabel: '',
      options: [
        { id: 'yes', title: 'Confirmar' },
        { id: 'no', title: 'Anular' },
      ],
    });
  });

  it('reads Meta’s LIST shape, rows and the label of the button that opens it', () => {
    const read = readTapOptions({
      id: 'n1',
      kind: 'notify',
      channel: 'whatsapp',
      interactive: {
        type: 'list',
        body: { text: 'Estos huecos quedan' },
        action: {
          button: 'Ver huecos',
          sections: [
            { rows: [{ id: 'h1', title: '10:00', description: 'con Marta' }] },
            { rows: [{ id: 'h2', title: '12:30' }] },
          ],
        },
      },
    });
    expect(read).toEqual({
      kind: 'list',
      body: 'Estos huecos quedan',
      openLabel: 'Ver huecos',
      // Ten rows IN TOTAL is Meta's limit, so the sections are read as one list: an editor that
      // showed them apart would let the owner build eleven rows in two sections that look legal.
      // The group each row came from is CARRIED, not shown (flows#91): the screen still edits one
      // flat list, and writing back puts the rows in their groups instead of flattening someone
      // else's message. Only when there is more than one section — see the case below.
      options: [
        { id: 'h1', title: '10:00', description: 'con Marta', group: 0 },
        { id: 'h2', title: '12:30', group: 1 },
      ],
    });
  });

  it('keeps a mapped value whole instead of flattening it to a string', () => {
    // `{{steps.huecos.first}}` inside a row is filled by the run, so what the screen edits has to
    // be the SAME text the document carries — a row that came back as «[object Object]» would be
    // saved back over the mapping the owner wrote.
    const read = readTapOptions({
      id: 'n1',
      kind: 'notify',
      interactive: {
        type: 'button',
        body: { text: 'Hola {{input.customer.name}}' },
        action: { buttons: [{ type: 'reply', reply: { id: 'a', title: '{{steps.h.first}}' } }] },
      },
    });
    expect(read?.body).toBe('Hola {{input.customer.name}}');
    expect(read?.options[0].title).toBe('{{steps.h.first}}');
  });

  it('does not choke on a half-written object somebody left through the API', () => {
    expect(readTapOptions({ id: 'n1', kind: 'notify', interactive: {} })).toEqual({
      kind: 'button',
      body: '',
      openLabel: '',
      options: [],
    });
    expect(readTapOptions({ id: 'n1', kind: 'notify', interactive: 'nope' as never })).toBeNull();
  });
});

describe('writing Meta’s own object, untranslated', () => {
  it('writes the BUTTON shape the proxy forwards verbatim', () => {
    expect(
      toInteractive({
        kind: 'button',
        body: '¿Confirmas?',
        openLabel: '',
        options: [{ id: 'yes', title: 'Sí' }],
      }),
    ).toEqual({
      type: 'button',
      body: { text: '¿Confirmas?' },
      action: { buttons: [{ type: 'reply', reply: { id: 'yes', title: 'Sí' } }] },
    });
  });

  it('writes the LIST shape as ONE section, with the description only when there is one', () => {
    expect(
      toInteractive({
        kind: 'list',
        body: 'Elige',
        openLabel: 'Ver huecos',
        options: [
          { id: 'h1', title: '10:00', description: 'con Marta' },
          { id: 'h2', title: '12:30', description: '' },
        ],
      }),
    ).toEqual({
      type: 'list',
      body: { text: 'Elige' },
      action: {
        button: 'Ver huecos',
        sections: [
          {
            rows: [
              { id: 'h1', title: '10:00', description: 'con Marta' },
              { id: 'h2', title: '12:30' },
            ],
          },
        ],
      },
    });
  });

  it('leaves NO trace of the other kind’s keys', () => {
    // `interactive` travels untranslated: a stray `button` on a `type: button` message is a key
    // Meta never defined for that shape, and it is the proxy that pays for finding out.
    const written = toInteractive({
      kind: 'button',
      body: 'x',
      openLabel: 'Ver huecos',
      options: [{ id: 'a', title: 'A' }],
    });
    expect((written.action as Record<string, unknown>).button).toBeUndefined();
    expect((written.action as Record<string, unknown>).sections).toBeUndefined();
  });

  it('survives a round trip: what is read back is what was written', () => {
    for (const opts of [
      { kind: 'button' as const, body: 'b', openLabel: '', options: [{ id: 'a', title: 'A' }] },
      {
        kind: 'list' as const,
        body: 'b',
        openLabel: 'Abrir',
        options: [{ id: 'a', title: 'A', description: 'd' }],
      },
    ]) {
      const step = { id: 'n1', kind: 'notify', interactive: toInteractive(opts) } as Step;
      expect(readTapOptions(step)).toEqual(opts);
    }
  });
});

describe('a blank one, for the moment the owner turns the mode on', () => {
  it('starts with one empty option, not zero: a mode with nothing in it looks broken', () => {
    expect(blankTapOptions('button').options).toHaveLength(1);
    expect(blankTapOptions('list').options).toHaveLength(1);
    expect(blankTapOptions('list').kind).toBe('list');
  });
});

describe('the limits the SaaS refuses, painted as a WARNING before the send is paid for', () => {
  const opt = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `o${i}`, title: `Option ${i}` }));

  it('says nothing about a message that is within every limit', () => {
    expect(
      tapOptionProblems({ kind: 'button', body: 'Hola', openLabel: '', options: opt(3) }),
    ).toEqual([]);
    expect(
      tapOptionProblems({ kind: 'list', body: 'Hola', openLabel: 'Ver', options: opt(10) }),
    ).toEqual([]);
  });

  it('warns at the FOURTH button and at the ELEVENTH row, naming the limit', () => {
    const buttons = tapOptionProblems({
      kind: 'button',
      body: 'Hola',
      openLabel: '',
      options: opt(4),
    });
    expect(buttons.map((p) => p.key)).toContain('ui.tapTooMany');
    expect(buttons.find((p) => p.key === 'ui.tapTooMany')?.params?.max).toBe(MAX_BUTTONS);

    const rows = tapOptionProblems({ kind: 'list', body: 'Hola', openLabel: 'Ver', options: opt(11) });
    expect(rows.find((p) => p.key === 'ui.tapTooMany')?.params?.max).toBe(MAX_LIST_ROWS);
  });

  it('names the identifier that is repeated, because that is the one to change', () => {
    const problems = tapOptionProblems({
      kind: 'button',
      body: 'Hola',
      openLabel: '',
      options: [
        { id: 'yes', title: 'Sí' },
        { id: 'yes', title: 'También sí' },
      ],
    });
    expect(problems.find((p) => p.key === 'ui.tapDuplicateId')?.params?.id).toBe('yes');
  });

  it('warns about an option with no label and about one with no identifier', () => {
    const noLabel = tapOptionProblems({
      kind: 'button',
      body: 'Hola',
      openLabel: '',
      options: [{ id: 'a', title: '  ' }],
    });
    expect(noLabel.map((p) => p.key)).toContain('ui.tapOptionBlank');
    const noId = tapOptionProblems({
      kind: 'button',
      body: 'Hola',
      openLabel: '',
      options: [{ id: '', title: 'A' }],
    });
    expect(noId.map((p) => p.key)).toContain('ui.tapOptionBlank');
  });

  it('warns about a message with no copy in it, on both kinds', () => {
    for (const kind of ['button', 'list'] as const) {
      const problems = tapOptionProblems({
        kind,
        body: '   ',
        openLabel: 'Ver',
        options: [{ id: 'a', title: 'A' }],
      });
      expect(problems.map((p) => p.key), kind).toContain('ui.tapBodyBlank');
    }
  });

  it('asks for the button that OPENS the list, and only on a list', () => {
    expect(
      tapOptionProblems({ kind: 'list', body: 'Hola', openLabel: '', options: [{ id: 'a', title: 'A' }] }).map(
        (p) => p.key,
      ),
    ).toContain('ui.tapOpenLabelBlank');
    expect(
      tapOptionProblems({ kind: 'button', body: 'Hola', openLabel: '', options: [{ id: 'a', title: 'A' }] }).map(
        (p) => p.key,
      ),
    ).not.toContain('ui.tapOpenLabelBlank');
  });
});

describe('options and text are two messages and ONE send', () => {
  it('turning the mode on removes the copy that would make the save fail', () => {
    const before = doc({ template: 'hello_world', vars: { text: 'Hola', body: 'x' } });
    const after = setTapOptions(before, 0, blankTapOptions('button'));
    const step = after.steps[0];
    expect(step.interactive).toBeTruthy();
    // The hub answers `conflicting_message_type` for a step carrying both, so a screen that left
    // them behind would produce a document it had just refused to let the owner see.
    expect('template' in step).toBe(false);
    expect('vars' in step).toBe(false);
  });

  it('turning it back off removes the options and leaves the rest of the step alone', () => {
    const before = doc({ interactive: { type: 'button' }, to: { query: 'q', params: {}, field: 'f' } });
    const after = setTapOptions(before, 0, null);
    expect('interactive' in after.steps[0]).toBe(false);
    expect(after.steps[0].to).toEqual({ query: 'q', params: {}, field: 'f' });
  });

  it('never touches the OTHER steps of the document', () => {
    const two: FlowDoc = {
      schema_version: 1,
      triggers: [{ kind: 'manual' }],
      steps: [
        { id: 'a', kind: 'notify', channel: 'whatsapp', vars: { text: 'uno' } },
        { id: 'b', kind: 'notify', channel: 'whatsapp', vars: { text: 'dos' } },
      ],
    };
    const after = setTapOptions(two, 1, blankTapOptions('list'));
    expect(after.steps[0].vars).toEqual({ text: 'uno' });
    expect(after.steps[1].interactive).toBeTruthy();
  });
});

/**
 * **What the screen does not model, the screen does not delete** (flows#91).
 *
 * `interactive` is Meta's own object and it travels UNTRANSLATED: the hub forwards it verbatim and
 * the SaaS proxy accepts an `header` and a `footer` this editor has no box for. So a message that
 * arrived from a module template, a recipe or the API carries keys this file never reads — and
 * writing it back by rebuilding `{type, body, action}` from three flat fields threw them away in
 * silence, on a save the owner asked for to change ONE label.
 *
 * The rule is a MERGE over the object that was there, not a serialisation of the form.
 */
describe('writing back keeps what the editor cannot edit (flows#91)', () => {
  /** The shape wi#101's recipe produces: a header, a footer, and two groups with a title. */
  const fromOutside = () => ({
    type: 'list',
    header: { type: 'text', text: 'Tus huecos' },
    body: { text: '¿Cuándo te viene bien?' },
    footer: { text: 'Responde tocando una opción' },
    x_meta_future: { anything: true },
    action: {
      button: 'Ver huecos',
      x_action_future: 7,
      sections: [
        { title: 'Mañana', rows: [{ id: 'm1', title: '10:00' }, { id: 'm2', title: '11:00' }] },
        { title: 'Tarde', rows: [{ id: 't1', title: '17:00', description: 'con Ana' }] },
      ],
    },
  });

  const write = (interactive: Record<string, unknown>, edit = (o: TapOptions): TapOptions => o) => {
    const before = doc({ interactive });
    const step = readTapOptions(before.steps[0])!;
    return setTapOptions(before, 0, edit(step)).steps[0].interactive as Record<string, unknown>;
  };

  it('keeps the header, the footer and a key Meta has not invented yet', () => {
    const after = write(fromOutside());
    expect(after.header).toEqual({ type: 'text', text: 'Tus huecos' });
    expect(after.footer).toEqual({ text: 'Responde tocando una opción' });
    // The unknown one matters MOST: it is the proof that this is a merge and not a longer list of
    // keys somebody has to remember to extend every time Meta ships a field.
    expect(after.x_meta_future).toEqual({ anything: true });
  });

  it('keeps the groups the customer sees, with their titles', () => {
    const action = write(fromOutside()).action as Record<string, unknown>;
    const sections = action.sections as { title?: string; rows: { id: string }[] }[];
    expect(sections.map((s) => s.title)).toEqual(['Mañana', 'Tarde']);
    expect(sections.map((s) => s.rows.map((r) => r.id))).toEqual([['m1', 'm2'], ['t1']]);
    expect(action.x_action_future).toBe(7);
  });

  it('keeps them while the owner edits a label, which is what she came to do', () => {
    const after = write(fromOutside(), (o) => ({
      ...o,
      options: o.options.map((opt, i) => (i === 0 ? { ...opt, title: '10:30' } : opt)),
    }));
    const sections = (after.action as Record<string, unknown>).sections as {
      title?: string;
      rows: { title: unknown }[];
    }[];
    expect(sections[0].rows[0].title).toBe('10:30');
    expect(sections.map((s) => s.title)).toEqual(['Mañana', 'Tarde']);
    expect(after.header).toBeTruthy();
  });

  it('puts a row she ADDS at the end, in the last group, and leaves the rest standing', () => {
    const after = write(fromOutside(), (o) => ({
      ...o,
      options: [...o.options, { id: 't2', title: '18:00' }],
    }));
    const sections = (after.action as Record<string, unknown>).sections as {
      title?: string;
      rows: { id: string }[];
    }[];
    expect(sections.map((s) => s.rows.map((r) => r.id))).toEqual([['m1', 'm2'], ['t1', 't2']]);
    expect(sections.map((s) => s.title)).toEqual(['Mañana', 'Tarde']);
  });

  it('drops a group she emptied instead of sending an empty one', () => {
    const after = write(fromOutside(), (o) => ({
      ...o,
      options: o.options.filter((opt) => opt.id !== 't1'),
    }));
    const sections = (after.action as Record<string, unknown>).sections as { title?: string }[];
    expect(sections.map((s) => s.title)).toEqual(['Mañana']);
  });

  it('keeps the other keys of body, and still writes the message she typed', () => {
    const after = write({ type: 'button', body: { text: 'vieja', x_body: 1 }, action: {} }, (o) => ({
      ...o,
      body: 'nueva',
    }));
    expect(after.body).toEqual({ text: 'nueva', x_body: 1 });
  });

  it('still leaves NO trace of the other kind’s keys when she switches to buttons', () => {
    // Preserving the unknown is not preserving the WRONG: `sections` on a `type: button` message
    // is a key Meta never defined for that shape, and it is the proxy that pays for finding out.
    const after = write(fromOutside(), (o) => ({ ...o, kind: 'button' }));
    const action = after.action as Record<string, unknown>;
    expect(after.type).toBe('button');
    expect(action.sections).toBeUndefined();
    expect(action.button).toBeUndefined();
    expect(action.buttons).toBeTruthy();
    // …while everything that is not about the shape is still there.
    expect(after.header).toBeTruthy();
    expect(action.x_action_future).toBe(7);
  });

  it('writes a clean object when there was nothing there before', () => {
    const before = doc({ vars: { text: 'hola' } });
    const after = setTapOptions(before, 0, blankTapOptions('button')).steps[0].interactive;
    expect(Object.keys(after as Record<string, unknown>).sort()).toEqual(['action', 'body', 'type']);
  });

  it('does not choke on an interactive that is not an object at all', () => {
    const after = setTapOptions(doc({ interactive: 'nope' }), 0, blankTapOptions('list')).steps[0]
      .interactive as Record<string, unknown>;
    expect(Object.keys(after).sort()).toEqual(['action', 'body', 'type']);
  });
});

describe('the group a row came from is carried, never shown (flows#91)', () => {
  it('tags nothing when the message has a single section, which is what this screen writes', () => {
    const read = readTapOptions({
      id: 'n1',
      kind: 'notify',
      interactive: {
        type: 'list',
        body: { text: 'x' },
        action: { button: 'Ver', sections: [{ rows: [{ id: 'a', title: 'A' }] }] },
      },
    });
    expect(read!.options).toEqual([{ id: 'a', title: 'A' }]);
  });

  it('never tags a button: there are no groups to come from', () => {
    const read = readTapOptions({
      id: 'n1',
      kind: 'notify',
      interactive: {
        type: 'button',
        body: { text: 'x' },
        action: { buttons: [{ type: 'reply', reply: { id: 'a', title: 'A' } }] },
      },
    });
    expect(read!.options).toEqual([{ id: 'a', title: 'A' }]);
  });
});

/**
 * **The promise has to hold at every level of the message** (revisión de la PR de flows#91).
 *
 * The first pass kept the header, the footer and the titles of TWO groups, and stopped one level
 * short in two places the reviewer measured:
 *
 * - a list with **one** group that has a title: nothing tagged the rows, so writing back produced
 *   a nameless section. Meta paints that title with a single section too, and a recipe offering
 *   «Mañana» and nothing else is the most likely shape of the one consumer there is (wi#101).
 * - a key **inside a row** — or inside a button's reply — was rebuilt away, which is the very
 *   thing the file's docblock says in bold cannot happen.
 */
describe('nothing is lost inside a group or inside an option either (flows#91)', () => {
  const listWith = (sections: unknown[]) => ({
    type: 'list',
    body: { text: '¿Cuándo?' },
    action: { button: 'Ver', sections },
  });

  const edited = (interactive: Record<string, unknown>, edit = (o: TapOptions): TapOptions => o) => {
    const before = doc({ interactive });
    return setTapOptions(before, 0, edit(readTapOptions(before.steps[0])!)).steps[0]
      .interactive as Record<string, unknown>;
  };

  const sectionsOf = (interactive: Record<string, unknown>) =>
    (interactive.action as Record<string, unknown>).sections as Record<string, unknown>[];

  it('keeps the title of a SINGLE group, which Meta paints just the same', () => {
    const after = edited(
      listWith([
        {
          title: 'Mañana',
          x_section_future: 'kept',
          rows: [{ id: 'm1', title: '10:00' }],
        },
      ]),
      (o) => ({ ...o, options: o.options.map((opt) => ({ ...opt, title: '10:30' })) }),
    );
    const sections = sectionsOf(after);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Mañana');
    expect(sections[0].x_section_future).toBe('kept');
    expect((sections[0].rows as Record<string, unknown>[])[0].title).toBe('10:30');
  });

  it('keeps a key the screen has no box for INSIDE a row', () => {
    const after = edited(
      listWith([{ rows: [{ id: 'm1', title: '10:00', x_row_future: { deep: true } }] }]),
      (o) => ({ ...o, options: o.options.map((opt) => ({ ...opt, title: '10:30' })) }),
    );
    const row = (sectionsOf(after)[0].rows as Record<string, unknown>[])[0];
    expect(row.x_row_future).toEqual({ deep: true });
    expect(row.title).toBe('10:30');
  });

  it('keeps one inside a button’s reply, and one on the button itself', () => {
    const after = edited(
      {
        type: 'button',
        body: { text: 'Elige' },
        action: {
          buttons: [
            { type: 'reply', x_button_future: 1, reply: { id: 'a', title: 'A', x_reply_future: 2 } },
          ],
        },
      },
      (o) => ({ ...o, options: o.options.map((opt) => ({ ...opt, title: 'B' })) }),
    );
    const button = ((after.action as Record<string, unknown>).buttons as Record<string, unknown>[])[0];
    expect(button.x_button_future).toBe(1);
    expect(button.type).toBe('reply');
    const reply = button.reply as Record<string, unknown>;
    expect(reply).toEqual({ id: 'a', title: 'B', x_reply_future: 2 });
  });

  it('does NOT bring back a description the owner cleared', () => {
    // The whole point of carrying only what the screen does not model: `description` it DOES
    // model, so an empty one means «she took it away», not «use the old one».
    const after = edited(
      listWith([{ rows: [{ id: 'm1', title: '10:00', description: 'con Ana', x: 1 }] }]),
      (o) => ({ ...o, options: o.options.map((opt) => ({ ...opt, description: '' })) }),
    );
    const row = (sectionsOf(after)[0].rows as Record<string, unknown>[])[0];
    expect(row.description).toBeUndefined();
    expect(row.x).toBe(1);
  });

  it('carries an option’s own key across a change of kind, without landing it on the wrapper', () => {
    const after = edited(
      listWith([{ title: 'Mañana', rows: [{ id: 'm1', title: '10:00', x_row_future: 9 }] }]),
      (o) => ({ ...o, kind: 'button' }),
    );
    const button = ((after.action as Record<string, unknown>).buttons as Record<string, unknown>[])[0];
    expect(button.reply).toEqual({ id: 'm1', title: '10:00', x_row_future: 9 });
    // The row's own keys belong to the option, not to Meta's envelope around it.
    expect(Object.keys(button).sort()).toEqual(['reply', 'type']);
  });

  it('writes the ordinary row and the ordinary button with nothing extra on them', () => {
    const clean = edited(listWith([{ rows: [{ id: 'm1', title: '10:00' }] }]));
    const row = (sectionsOf(clean)[0].rows as Record<string, unknown>[])[0];
    expect(Object.keys(row).sort()).toEqual(['id', 'title']);
    expect(Object.keys(sectionsOf(clean)[0]).sort()).toEqual(['rows']);
  });
});
