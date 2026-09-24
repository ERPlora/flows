import { describe, it, expect } from 'vitest';
import { questionSteps } from './question-steps';
import type { Flow } from './hub-flows';
import type { FlowDoc } from './flow-doc';

/**
 * **«The step that asked the question» is picked, never typed** (flows#118).
 *
 * `reply_to_step` carries the internal id of the WhatsApp step that asked (`s3k9xq`), an id the
 * editor shows nowhere. What the owner recognises is the MESSAGE — so the guard offers every step
 * that sends a WhatsApp, in this automation and in the others (the question usually lives in a
 * different flow from the one that handles the tap), labelled by its flow and what it says.
 */

function flow(id: string, name: string, steps: unknown[]): Flow {
  return { id, name, enabled: true, definition: { schema_version: 1, triggers: [], steps } };
}

const ASK = {
  id: 's3k9xq',
  kind: 'notify',
  channel: 'whatsapp',
  interactive: { type: 'button', body: { text: '¿Confirmas tu cita?' }, action: { buttons: [] } },
};

const EMPTY_DOC: FlowDoc = { schema_version: 1, triggers: [{ kind: 'manual' }], steps: [] };

describe('the questions a reply can answer', () => {
  it('lists the WhatsApp steps of OTHER automations, labelled by flow and by what they say', () => {
    const got = questionSteps([flow('f-ask', 'Recordatorio de cita', [ASK])], {
      id: 'f-tap',
      name: 'Atender respuesta',
      doc: EMPTY_DOC,
    });
    expect(got).toEqual([{ stepId: 's3k9xq', flowName: 'Recordatorio de cita', text: '¿Confirmas tu cita?' }]);
  });

  it('reads a plain message by its text and a template message by its template name', () => {
    const got = questionSteps(
      [
        flow('f1', 'A', [
          { id: 'p1', kind: 'notify', channel: 'whatsapp', vars: { text: 'Hola' } },
          { id: 't1', kind: 'notify', channel: 'whatsapp', template: 'appointment_reminder', vars: {} },
        ]),
      ],
      null,
    );
    expect(got.map((q) => [q.stepId, q.text])).toEqual([
      ['p1', 'Hola'],
      ['t1', 'appointment_reminder'],
    ]);
  });

  it('leaves out what does not send a WhatsApp: emails, commands, conditions', () => {
    const got = questionSteps(
      [
        flow('f1', 'A', [
          { id: 'e1', kind: 'notify', channel: 'email', vars: { text: 'x' } },
          { id: 'c1', kind: 'command', command: 'sales.create' },
          { id: 'g1', kind: 'condition', when: {} },
        ]),
      ],
      null,
    );
    expect(got).toEqual([]);
  });

  it('reads THIS automation from the screen, not from its saved copy', () => {
    const saved = flow('f-self', 'Viejo nombre', [{ ...ASK, id: 'old1' }]);
    const doc: FlowDoc = { schema_version: 1, triggers: [{ kind: 'manual' }], steps: [{ ...ASK, id: 'new1' } as never] };
    const got = questionSteps([saved], { id: 'f-self', name: 'Nombre nuevo', doc });
    expect(got).toEqual([{ stepId: 'new1', flowName: 'Nombre nuevo', text: '¿Confirmas tu cita?' }]);
  });

  it('includes an automation that has never been saved', () => {
    const doc: FlowDoc = { schema_version: 1, triggers: [{ kind: 'manual' }], steps: [ASK as never] };
    const got = questionSteps([], { id: undefined, name: 'Sin guardar', doc });
    expect(got.map((q) => q.flowName)).toEqual(['Sin guardar']);
  });

  it('survives a definition that is not the shape it expects', () => {
    const broken = { id: 'x', name: 'Roto', enabled: true, definition: { steps: 'nope' } } as unknown as Flow;
    const noName = flow('y', '', [{ ...ASK, id: 'q2', interactive: { body: { text: 42 } } }]);
    expect(questionSteps([broken, noName], null)).toEqual([{ stepId: 'q2', flowName: '', text: '' }]);
  });
});
