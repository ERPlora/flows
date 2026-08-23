import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  SECTORS,
  buildTemplate,
  missingModules,
  moduleName,
  templateGrants,
} from './templates';
import { isSpineKind, readDoc } from './flow-doc';
import en from '../../locales/en.json';
import es from '../../locales/es.json';

/** The catalogue lookup the shell does at runtime, reduced to what a test needs. */
const lookup = (catalogue: unknown, key: string): string | undefined => {
  let cur: unknown = catalogue;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
};

/** A translator that returns the ENGLISH string, so a document can be inspected as it is stored. */
const t = (key: string): string => lookup(en, key) ?? key;

/** Every i18n key a template hands to `t()`. */
const keysOf = (template: (typeof TEMPLATES)[number]): string[] => [
  template.nameKey,
  template.summaryKey,
  template.plainKey,
  ...template.blanks.flatMap((b) => [b.labelKey, b.hintKey]),
  ...Object.values(template.grantReasons),
];

describe('the template catalogue', () => {
  it('offers something to start from', () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it('gives every template a sector the gallery knows how to group', () => {
    for (const template of TEMPLATES) {
      expect(SECTORS).toContain(template.sector);
    }
  });

  it('never repeats an id — the id is what a gallery card is keyed by', () => {
    const ids = TEMPLATES.map((tpl) => tpl.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The one rule that decides what may be offered at all. A template carrying an `http`, `ai` or
  // `notify` step would land the owner in a card this editor opens READ-ONLY: they would be handed
  // an automation and no way to finish it. Offering fewer templates that can be completed beats
  // offering a shop window of dead ends.
  it('only uses steps this editor can actually edit', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      expect(doc.steps.length).toBeGreaterThan(0);
      for (const step of doc.steps) {
        expect(isSpineKind(step.kind)).toBe(true);
      }
    }
  });

  it('writes the document version this editor writes, and exactly one trigger', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      expect(doc.schema_version).toBe(1);
      expect(doc.triggers).toHaveLength(1);
    }
  });

  it('gives every step a distinct id, because one step reads another by id', () => {
    for (const template of TEMPLATES) {
      const ids = buildTemplate(template, t).steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('names a command in every command step — an empty one asks for nothing and does nothing', () => {
    for (const template of TEMPLATES) {
      for (const step of buildTemplate(template, t).steps) {
        if (step.kind === 'command') expect(String(step.command ?? '').trim()).not.toBe('');
      }
    }
  });

  // The grants screen and the document must agree. Deriving the list from the document (rather
  // than writing it out a second time in the template) is what stops a typo reading as
  // authorisation — `requiredGrants` is the same function the editor's Permissions tab uses.
  it('asks for exactly the commands its own document runs', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const commands = doc.steps
        .filter((s) => s.kind === 'command')
        .map((s) => String(s.command));
      expect(templateGrants(template, t).map((g) => g.value).sort()).toEqual(
        [...new Set(commands)].sort(),
      );
      expect(templateGrants(template, t).every((g) => g.kind === 'command')).toBe(true);
    }
  });

  it('explains every permission it will ask for, one sentence per command', () => {
    for (const template of TEMPLATES) {
      for (const grant of templateGrants(template, t)) {
        expect(template.grantReasons[grant.value], `${template.id} → ${grant.value}`).toBeTruthy();
      }
    }
  });

  // A template's document is written once, in the language the owner is reading. What it must NOT
  // do is leave a raw i18n key inside a task title — that is what a missing catalogue entry looks
  // like three weeks later, in the middle of somebody's to-do list.
  it('resolves its texts through the catalogue instead of storing keys', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const written = JSON.stringify(doc.steps);
      expect(written).not.toMatch(/tpl\.[a-zA-Z]/);
    }
  });

  it('is translated whole: every key it uses exists in English AND in Spanish', () => {
    for (const template of TEMPLATES) {
      for (const key of keysOf(template)) {
        expect(lookup(en, key), `${template.id} → ${key} (en)`).toBeTruthy();
        expect(lookup(es, key), `${template.id} → ${key} (es)`).toBeTruthy();
      }
    }
  });

  it('survives being read back, so a template opens in the editor like any other flow', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      expect(readDoc(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
    }
  });
});

describe('what a template needs from this hub', () => {
  // The hub has no endpoint that lists its commands, but `GET /api/hub/events/shape` answers 404
  // for an event nobody declares — so one event per module is the witness that says whether that
  // module is installed HERE. Without it a card would promise something that fails at save.
  it('names a witness event for its trigger and for every module it commands', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const trigger = doc.triggers[0];
      if (trigger.kind === 'event') {
        expect(template.witnesses.map((w) => w.event)).toContain(trigger.event);
      }
      for (const step of doc.steps) {
        if (step.kind !== 'command') continue;
        const owner = String(step.command).split('.')[0];
        const covered = template.witnesses.some((w) => w.module === owner);
        expect(covered, `${template.id} has no witness for the \`${owner}\` module`).toBe(true);
      }
    }
  });

  it('reports the modules this hub is missing, by name', () => {
    const template = TEMPLATES[0];
    const absent = Object.fromEntries(template.witnesses.map((w) => [w.event, false]));
    expect(missingModules(template, absent).length).toBeGreaterThan(0);
    expect(missingModules(template, absent)[0]).not.toContain('.');
  });

  it('says nothing is missing when the hub answered for every witness', () => {
    const template = TEMPLATES[0];
    const present = Object.fromEntries(template.witnesses.map((w) => [w.event, true]));
    expect(missingModules(template, present)).toEqual([]);
  });

  // An unanswered probe is not a refusal. Treating «not asked yet» as «not installed» would grey
  // out the whole gallery for the first second of every visit.
  it('does not call a witness missing while its answer is still unknown', () => {
    expect(missingModules(TEMPLATES[0], {})).toEqual([]);
  });

  // flows#38: the grey card used to say «Falta un módulo» — true, and useless: on a hub without
  // `tasks` that was nine grey cards with no way to find out which of the seventeen installed apps
  // was the one missing. The id the witnesses carry (`tasks`) is not a name the owner recognises;
  // this is the dictionary that turns it into one.
  it('can say every module any witness names by its READABLE name, in both languages', () => {
    const ids = [...new Set(TEMPLATES.flatMap((tpl) => tpl.witnesses.map((w) => w.module)))];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(lookup(en, moduleName(id, (k) => k)), `${id} (en)`).toBeTruthy();
      expect(lookup(es, moduleName(id, (k) => k)), `${id} (es)`).toBeTruthy();
    }
  });

  it('translates a module id into the name its own module goes by', () => {
    // «Falta Tasks», not «Falta tasks»: the label has to carry the name on the marketplace card,
    // which is the one place the owner can act on it.
    expect(moduleName('tasks', t)).toBe(lookup(en, 'ui.mod_tasks'));
    expect(moduleName('tasks', t)).not.toBe('tasks');
  });

  it('falls back to the raw id for a module this catalogue has never heard of', () => {
    // A template from a newer module must not render an empty name — the id is worse than a
    // translation, but it beats a blank.
    expect(moduleName('not_a_module', t)).toBe('not_a_module');
  });
});

describe('a template becomes a flow', () => {
  it('is born paused — an automation nobody has read yet must not act', () => {
    for (const template of TEMPLATES) {
      expect(template.enabledOnCreate ?? false).toBe(false);
    }
  });

  it('carries the blanks it needs somebody to decide', () => {
    // At least one template has to teach that a value is the owner's to choose; a gallery where
    // nothing is ever filled in would hide the one screen the owner must visit.
    expect(TEMPLATES.some((tpl) => tpl.blanks.length > 0)).toBe(true);
  });

  it('pre-fills every blank, so a flow created and never touched still runs', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      for (const step of doc.steps) {
        if (step.kind === 'condition') {
          for (const ops of Object.values(step.when ?? {})) {
            for (const value of Object.values(ops)) expect(value).not.toBe('');
          }
        }
        if (step.kind === 'delay') expect(Number(step.seconds)).toBeGreaterThan(0);
      }
    }
  });
});

/**
 * **The seven daily automations flows#18 measured as missing.**
 *
 * The R0 pass found 0 of 12 everyday intentions reachable without syntax. Four of the seven it
 * asked for are here; the other three are named below with the kernel gap that stops them, because
 * a card that cannot work is worse than no card — it costs the owner the walk to find out.
 */
describe('the everyday automations of flows#18', () => {
  const byId = (id: string) => TEMPLATES.find((tpl) => tpl.id === id);

  it.each([
    ['new-staff-checklist', 'staff.member.created', 'R0 #7 — somebody joins → the checklist'],
    ['whatsapp-answer', 'whatsapp_inbox.message.received', 'R0 #8 — a message arrives → answer it'],
    ['cash-close-review', 'cash_register.session_closed', 'R0 #12 — the till closes → check the day'],
    [
      'fiscal-rejection-alert',
      'verifactu.record.rejected',
      'R0 #6 — the AEAT said no → somebody finds out without opening a screen',
    ],
  ])('%s starts on %s', (id, event) => {
    const template = byId(id);
    expect(template, id).toBeTruthy();
    const doc = buildTemplate(template!, t);
    expect(doc.triggers[0]).toEqual({ kind: 'event', event });
  });

  it('friday-week-review starts on the clock, on a Friday', () => {
    const doc = buildTemplate(byId('friday-week-review')!, t);
    // Five-field cron, day 5 = Friday. The editor draws it as a clock; nobody types this.
    expect(doc.triggers[0]).toMatchObject({ kind: 'cron' });
    expect(String((doc.triggers[0] as { cron?: string }).cron).split(' ')[4]).toBe('5');
  });

  /**
   * The rule that keeps a card from being a promise nobody can keep: a step may only map a field
   * this catalogue has SEEN in a real payload. `no-show-followup` is the precedent — it puts no
   * name in its title because that event carries only an id.
   *
   * The five added here map none at all, so their text cannot go stale behind a payload change.
   *
   * `fiscal-rejection-alert` is the one where the temptation was strongest — «revisa la factura
   * INV-2» reads far better than «revisa la última rechazada» — and it is also where it would have
   * been most wrong: `verifactu.record.rejected` covers four different failures behind one name
   * (`reason`), so a sentence naming the AEAT would be a lie the day the wire is what failed. The
   * mapping can arrive when this catalogue has seen the payload against a hub that really emitted
   * one, and not before.
   */
  it.each([
    'new-staff-checklist',
    'whatsapp-answer',
    'cash-close-review',
    'friday-week-review',
    'fiscal-rejection-alert',
  ])(
    '%s maps no payload field it has not seen',
    (id) => {
      const doc = buildTemplate(byId(id)!, t);
      expect(JSON.stringify(doc)).not.toContain('input.');
    },
  );

  it('names the module behind every event it waits for, so «install X» can be said', () => {
    for (const id of ['new-staff-checklist', 'whatsapp-answer', 'cash-close-review', 'friday-week-review', 'fiscal-rejection-alert']) {
      const template = byId(id)!;
      expect(template.witnesses.length, id).toBeGreaterThan(0);
      for (const witness of template.witnesses) expect(witness.module, id).toBeTruthy();
    }
  });

  it('asks for its permissions by name, before the flow exists', () => {
    for (const id of ['new-staff-checklist', 'whatsapp-answer', 'cash-close-review', 'friday-week-review', 'fiscal-rejection-alert']) {
      const grants = templateGrants(byId(id)!, t);
      expect(grants.length, id).toBeGreaterThan(0);
      for (const grant of grants) expect(byId(id)!.grantReasons[grant.value], grant.value).toBeTruthy();
    }
  });
});
