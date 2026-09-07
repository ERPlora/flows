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
      options: [
        { id: 'h1', title: '10:00', description: 'con Marta' },
        { id: 'h2', title: '12:30' },
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
