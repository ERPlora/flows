import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  SECTORS,
  availableTemplates,
  buildTemplate,
  missingModules,
  moduleName,
  runnableHere,
  templateGrants,
  templateById,
  unavailableModules,
  flowsOnSameTrigger,
  templatesOf,
} from './templates';
import { moduleTemplates } from './module-templates';
import { conditionResult } from './simulate';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from './ai-draft';
import type { SchemaFacts } from './ai-draft';
import type { Condition, FlowDoc } from './flow-doc';
import {
  MAX_ITERS_CAP,
  canPinPayload,
  grantAllowsCall,
  grantPin,
  isSpineKind,
  readDoc,
} from './flow-doc';
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
/**
 * A hub on a current core, for the tests that are not about the kernel floor (flows#92).
 *
 * It carries a VERSION as well as the step keys since flows#111: one card capability is answered
 * by the release and not by the schema's shape, and a hub that declared every key while reporting
 * no version would hide the two WhatsApp appointment cards from every test in this file.
 */
const CURRENT_CORE = schemaFacts(
  {
    $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
  },
  QUERY_GRANT_PIN_CORE,
);

const t = (key: string): string => lookup(en, key) ?? key;

/** The same, in Spanish: a card says the same thing in BOTH languages or it says it in one. */
const tEs = (key: string): string => lookup(es, key) ?? key;

/** Every i18n key a template hands to `t()`. */
const keysOf = (template: (typeof TEMPLATES)[number]): string[] => [
  ...[template.nameKey, template.summaryKey, template.plainKey].filter(
    (key): key is string => !!key,
  ),
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

  /**
   * flows#98 opened `sector` and the three text keys because a card the HUB serves has neither: its
   * title travels inside the module's document and its heading is the app it came with. Nothing
   * written in this file may take that door — a card here without a `nameKey` would render blank.
   */
  it('gives every card written HERE its own texts, whatever the type now allows', () => {
    for (const template of TEMPLATES) {
      expect(template.nameKey, template.id).toBeTruthy();
      expect(template.summaryKey, template.id).toBeTruthy();
      expect(template.plainKey, template.id).toBeTruthy();
      expect(template.source, `${template.id} is written here, it cannot claim a module served it`)
        .toBeUndefined();
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

  it('writes the document version this editor writes, and one trigger unless they are disjoint', () => {
    // One trigger was «one way in» — two ways in is two automations wearing one name, and on an
    // event card it is also the same message answered twice. It stays the rule, with ONE shape of
    // exception and only because it cannot fire twice: a WhatsApp card wakes on words
    // (`text: neq ''`) and on a TAP (`text: eq ''` + `reply_id: neq ''`), and no message can
    // satisfy both. Disjoint by construction, not by luck.
    //
    // Judged on the FILTERS and not on a list of ids (flows#100): the list said one card and the
    // source had grown the second way in on all four, so the rule would have had to be relaxed
    // card by card — each edit reading like a fact about that card rather than what it is, the
    // guard being switched off. The union is also asserted where the document is AUTHORED:
    // `whatsapp_inbox/tests/flow_templates.test.py` refuses the overlap that reads as disjoint.
    // Here the digest guard holds the other end: a mirror whose triggers overlap stops matching.
    const wakesOnWords = (trigger: FlowDoc['triggers'][number]) =>
      JSON.stringify(trigger.filter?.['event.text']) === JSON.stringify({ neq: '' });
    const wakesOnATap = (trigger: FlowDoc['triggers'][number]) =>
      JSON.stringify(trigger.filter?.['event.text']) === JSON.stringify({ eq: '' }) &&
      JSON.stringify(trigger.filter?.['event.reply_id']) === JSON.stringify({ neq: '' });
    let disjointPairs = 0;
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      expect(doc.schema_version).toBe(1);
      expect(doc.triggers.length, `${template.id} has more ways in than a card may have`)
        .toBeLessThanOrEqual(2);
      if (doc.triggers.length === 1) continue;
      const [first, second] = doc.triggers;
      // Same event, and the pair contradicts on `event.text`: whichever way she answered, exactly
      // one of the two can match the message.
      expect(second.event, template.id).toBe(first.event);
      expect(
        wakesOnWords(first) && wakesOnATap(second),
        `${template.id} has two ways in that are not disjoint by construction`,
      ).toBe(true);
      disjointPairs += 1;
    }
    // …and the exception is reachable, so the rule above is not a rule about an empty set.
    expect(disjointPairs).toBeGreaterThan(0);
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
  //
  // Re-derived BY HAND below, kind by kind, rather than by calling `requiredGrants` a second
  // time: a guard that asks the function whether it agrees with itself proves nothing. Until
  // flows#52 every template ran commands and nothing else, so this could compare one list of
  // command names; the WhatsApp card writes on WhatsApp and offers tools to a model, so a guard
  // that only knows about commands would have gone green while eleven permissions went unchecked.
  it('asks for exactly the permissions its own document needs, of every kind', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const expected = new Set<string>();
      for (const step of doc.steps) {
        // An `http` step would add a URL pattern, and no card in this catalogue has one. The
        // assertion is here rather than in a test of its own because the moment one appears, this
        // derivation stops being complete.
        expect(step.kind, `${template.id} carries an http step`).not.toBe('http');
        if (step.kind === 'command') expected.add(`command ${String(step.command)}`);
        if (step.kind === 'query') expected.add(`query ${String(step.query)}`);
        if (step.kind === 'ai') {
          for (const query of step.tools?.queries ?? []) expected.add(`query ${query}`);
          for (const command of step.tools?.commands ?? []) expected.add(`command ${command}`);
        }
        if (step.kind === 'notify') {
          // Two grants, never one: what it costs (the channel) and who gets written to.
          expected.add(`notify ${String(step.channel)}`);
          expected.add(`recipient_query ${String(step.to?.query)}#${String(step.to?.field)}`);
        }
      }
      expect(
        templateGrants(template, t)
          .map((g) => `${g.kind} ${g.value}`)
          .sort(),
      ).toEqual([...expected].sort());
    }
  });

  // The hub REFUSES a document above the cap at save (`flow.max_iters_out_of_range`; this
  // module's `MAX_ITERS_CAP` mirrors it): a card that asks for more is a card whose «Use this»
  // fails three screens later, in words nobody outside this repository can read.
  it('never asks a model step for more iterations than the hub allows', () => {
    for (const template of TEMPLATES) {
      for (const step of buildTemplate(template, t).steps) {
        if (step.kind !== 'ai') continue;
        expect(step.max_iters, `${template.id} › ${step.id}`).toBeLessThanOrEqual(MAX_ITERS_CAP);
      }
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
  it('names a witness event for its trigger and for every module it touches', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const trigger = doc.triggers[0];
      // `hub.*` is the core's own event (the runtime's outbox), not a module's: every hub has it,
      // so there is nothing to witness and no module to tell the owner to install.
      if (trigger.kind === 'event' && !String(trigger.event).startsWith('hub.')) {
        expect(template.witnesses.map((w) => w.event)).toContain(trigger.event);
      }
      // Every module the document reaches into, whichever way it reaches: a command step, a query
      // step, a tool OFFERED to a model, and the query a `notify` resolves its recipient with. A
      // card is hidden on the strength of these, so one missing here is a card offered on a hub
      // that cannot run it.
      const owners = new Set<string>();
      for (const step of doc.steps) {
        if (step.kind === 'command') owners.add(String(step.command).split('.')[0]);
        if (step.kind === 'query') owners.add(String(step.query).split('.')[0]);
        if (step.kind === 'ai') {
          for (const query of step.tools?.queries ?? []) owners.add(query.split('.')[0]);
          for (const command of step.tools?.commands ?? []) owners.add(command.split('.')[0]);
        }
        if (step.kind === 'notify' && step.to?.query) owners.add(step.to.query.split('.')[0]);
      }
      for (const owner of owners) {
        const covered = template.witnesses.some((w) => w.module === owner);
        expect(covered, `${template.id} has no witness for the \`${owner}\` module`).toBe(true);
      }
    }
  });

  /**
   * **A step key an older core refuses is a FLOOR, and the floor has to be declared** (flows#92).
   *
   * `parse_step` walks an allowlist per step kind, so a key it does not know is not ignored and
   * does not degrade: the hub answers `flow.invalid_definition` for the WHOLE document and the
   * recipe dies at save. {@link FlowTemplate.needs} is what keeps such a card from being offered
   * where it cannot be parsed — and it is hand-written next to a document that is a MIRROR of what
   * another module publishes, so it goes stale exactly when the mirror is re-synced and the source
   * has grown a key. That is how three of these four cards ended up writing `interactive` and
   * `output` while only one of them declared them (flows#100).
   *
   * Derived from the document rather than listed here, and anchored BOTH ways: a card that writes
   * a gated key without declaring it is offered to a hub that refuses it whole, and a card that
   * declares a key it never writes is hidden from hubs that could run it perfectly well.
   *
   * The names match the step keys because that is what the probe reads — `schemaFacts` answers
   * `interactiveNotify`/`aiOutput` off `$defs.step.properties.interactive`/`.output`.
   */
  const GATED_STEP_KEYS = ['interactive', 'output'] as const;

  it('declares every gated step key its document writes, and none that it does not', () => {
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      const written = GATED_STEP_KEYS.filter((key) =>
        doc.steps.some((step) => Object.prototype.hasOwnProperty.call(step, key)),
      );
      // Only the step-key half of `needs`: since flows#111 the list also carries a need that no
      // step writes (`queryPin`), and it has its own two-way anchor below.
      const declared = (template.needs ?? []).filter((need) =>
        (GATED_STEP_KEYS as readonly string[]).includes(need),
      );
      expect([...declared].sort(), template.id).toEqual([...written].sort());
    }
  });

  /**
   * **The need that is not a step key, anchored the same way** (flows#111).
   *
   * `queryPin` says «this hub can store the limit a READ carries» (hub#1662). It cannot be derived
   * from the document, because a pin does not live in the document — it lives in the permission.
   * So it is derived here from the permissions the card installs, and anchored in BOTH directions
   * for the same reason the step keys are:
   *
   * - A card that pins a read without declaring it is offered to a hub that refuses the pin, and
   *   `PUT …/grants` is all-or-nothing: the recipe installs with NO permissions and dies at step
   *   one. That is worse than the wide permission it was trying to avoid.
   * - A card that declares it without pinning anything is hidden from hubs that run it perfectly
   *   well, for a containment it does not actually carry.
   */
  it('declares the read limit exactly when it carries one', () => {
    for (const template of TEMPLATES) {
      const pinsARead = templateGrants(template, t).some(
        (grant) => grant.kind === 'query' && Object.keys(grantPin(grant)).length > 0,
      );
      expect((template.needs ?? []).includes('queryPin'), template.id).toBe(pinsARead);
    }
  });

  it('has a card that pins a read at all, so the rule above is not vacuous', () => {
    const pinners = TEMPLATES.filter((tpl) =>
      templateGrants(tpl, t).some(
        (grant) => grant.kind === 'query' && Object.keys(grantPin(grant)).length > 0,
      ),
    );
    expect(pinners.map((tpl) => tpl.id)).toEqual([
      'whatsapp-appointment',
      'whatsapp-appointment-unattended',
    ]);
  });

  // The control above only means something if a gated key is actually reachable from this
  // catalogue: with none written anywhere it would be green on an empty set for ever.
  it('has cards that write a gated key at all, so the rule above is not vacuous', () => {
    for (const key of GATED_STEP_KEYS) {
      const writers = TEMPLATES.filter((tpl) =>
        buildTemplate(tpl, t).steps.some((step) => Object.prototype.hasOwnProperty.call(step, key)),
      );
      expect(writers.length, `no card writes \`${key}\``).toBeGreaterThan(0);
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

  // The third column is the trigger's `filter`, spelled out rather than allowed for: the
  // comparison below stays a whole-object `toEqual`, so a clause that appears on any of these
  // cards without being written here is still a failure. `undefined` means «this card filters
  // nothing», which is an assertion too — three of the four run on every event of their kind.
  // Named tuple, so the table is ONE type: left to inference the rows collapse into a union of two
  // tuple shapes (one with a filter, one with `undefined`) and the three-argument callback below
  // stops being assignable to it.
  const startsOn: [id: string, event: string, filter: Condition | undefined, why: string][] = [
    ['new-staff-checklist', 'staff.member.created', undefined, 'R0 #7 — somebody joins → the checklist'],
    [
      'whatsapp-answer',
      'whatsapp_inbox.message.received',
      // flows#67 — the owner's own echo and Meta's 180 days of backlog. Asserted in full, with
      // the filter RUN against the kernel's evaluator, in the card's own block further down.
      { 'event.direction': { neq: 'outbound' }, 'event.source': { neq: 'history' } },
      'R0 #8 — a message arrives → answer it',
    ],
    ['cash-close-review', 'cash_register.session_closed', undefined, 'R0 #12 — the till closes → check the day'],
    [
      'fiscal-rejection-alert',
      'verifactu.record.rejected',
      undefined,
      'R0 #6 — the AEAT said no → somebody finds out without opening a screen',
    ],
  ];
  it.each(startsOn)('%s starts on %s', (id, event, filter) => {
    const template = byId(id);
    expect(template, id).toBeTruthy();
    const doc = buildTemplate(template!, t);
    expect(doc.triggers[0]).toEqual(filter ? { kind: 'event', event, filter } : { kind: 'event', event });
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

/**
 * **The card that turns a WhatsApp into a job on somebody's list** (flows#67).
 *
 * It waits on the MODULE's event and not the core's, which is the whole reason it needed fixing
 * separately from its neighbour below. `whatsapp_inbox._ingest_inbound_message` is a manifest
 * listener on `hub.whatsapp.message_received`, and a manifest listener has no mapping layer: the
 * relay hands the core event's payload straight to the command, and the command's `emit` writes
 * that same bound payload into the outbox. So `whatsapp_inbox.message.received` carries
 * `direction` and `source` exactly when the core carries them — and it inherits the owner's echo
 * and Meta's 180 days of backlog on the same day, through one more hop.
 *
 * Unguarded, that is a task per reply the owner types on her own phone and a task per conversation
 * anybody had in March: the list this card exists to keep short is the first thing it buries.
 */
describe('WhatsApp → task, the card that puts a message on somebody’s list (flows#67)', () => {
  const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-answer');

  /** The event as the module re-emits it, plus whatever fields this hub's core knows about. */
  const message = (extra: Record<string, unknown> = {}) => ({
    event: { from: '34600111222', text: '¿tenéis hueco mañana?', ...extra },
  });

  const filterOf = () => buildTemplate(template!, t).triggers[0].filter;

  it('is in the gallery at all', () => {
    expect(template, 'no `whatsapp-answer` template in the catalogue').toBeTruthy();
  });

  it('waits on the module’s own event, guarded against the echo and the backlog', () => {
    // No `event.text` clause, and that is a decision rather than an omission: its neighbour below
    // filters an empty body because every reply IT sends is billed by Meta, while this card only
    // writes a task. A customer who sends a photo, a voice note or a location has written to the
    // shop just as much as one who types, and dropping her on the floor is the failure this card
    // is for. No `input` either — every word of the task is a fixed string.
    expect(buildTemplate(template!, t).triggers[0]).toEqual({
      kind: 'event',
      event: 'whatsapp_inbox.message.received',
      filter: {
        'event.direction': { neq: 'outbound' },
        'event.source': { neq: 'history' },
      },
    });
  });

  // ── Both senses of the same clause, against the kernel's own evaluator ──────────────────────
  //
  // `conditionResult` mirrors `crates/runtime/src/flows/def.rs`, so these two tests are the filter
  // being RUN and not the filter being read back. One sense without the other is how this gets
  // written wrong: excluding the bad is easy to check and easy to over-tighten into requiring the
  // good, which is silent and much worse.

  it('does not fire on the owner’s own reply, nor on a message out of the backlog', () => {
    expect(conditionResult(filterOf(), message({ direction: 'inbound', source: 'live' })).matched).toBe(true);
    expect(conditionResult(filterOf(), message({ direction: 'outbound', source: 'live' })).matched).toBe(false);
    expect(conditionResult(filterOf(), message({ direction: 'inbound', source: 'history' })).matched).toBe(false);
  });

  it('STILL fires on a hub that sends neither field — which is why it is `neq` and never `eq`', () => {
    // Every hub tag published today. `direction` and `source` reach the event only from hub#1621,
    // so on the fleet as it stands both paths resolve to `null`.
    expect(conditionResult(filterOf(), message()).matched).toBe(true);

    // And the shape that would have looked right and broken every card already installed: in the
    // kernel `json_eq(null, x)` is false, so an affirmative filter matches NOTHING on that hub —
    // no run, no error, no log, and an owner whose task list went quiet finds out from a customer.
    const affirmative = {
      'event.direction': { eq: 'inbound' },
      'event.source': { eq: 'live' },
    };
    expect(conditionResult(affirmative, message()).matched).toBe(false);
  });
});

/**
 * **A card for a module this hub does not have is not offered at all** (flows#52).
 *
 * It used to be shown greyed out, naming what to install (flows#38). What changed the answer is
 * that the catalogue now carries cards for modules a business will never own: the WhatsApp card
 * above needs Appointments, Services and Staff, and whatsapp_inbox#60 adds a table-booking twin
 * that needs Reservations. Listed by whether WhatsApp is installed, a hair salon is offered a
 * card about restaurant tables — and a gallery whose cards are mostly things you cannot use is a
 * gallery people stop reading.
 *
 * What flows#38 was actually protecting — the owner learning WHICH app to install, by its name,
 * and that the screen needs a reload — is kept, in one line under the cards instead of on N grey
 * ones.
 */
describe('the gallery only offers what this hub can run (flows#52)', () => {
  /** The hub answered `404` for every event of the given modules: they are not installed. */
  const without = (...modules: string[]): Record<string, boolean> =>
    Object.fromEntries(
      TEMPLATES.flatMap((tpl) => tpl.witnesses).map((w) => [w.event, !modules.includes(w.module)]),
    );

  // The kernel probe is held open in this whole describe (`CURRENT_CORE`) for the same reason it
  // is held open below: it is fail-closed, so leaving it unanswered hides the WhatsApp cards
  // whatever the modules say — and every assertion here about them would pass without testing the
  // module probe at all.
  it('drops the cards whose modules are missing, and keeps the rest', () => {
    const known = without('sales');
    const shown = SECTORS.flatMap((sector) => availableTemplates(sector, known, CURRENT_CORE)).map(
      (tpl) => tpl.id,
    );
    expect(shown).not.toContain('note-big-sale');
    expect(shown).toContain('whatsapp-answer');
  });

  it('hides the WhatsApp card on a hub that has WhatsApp but no task list', () => {
    // The case that made hiding the answer: every module of the card but one. `whatsapp-answer`
    // reads a message and writes a job on somebody's list, so a hub with WhatsApp and no `tasks`
    // is a hub that can receive the message and do nothing with it.
    const shown = SECTORS.flatMap((sector) =>
      availableTemplates(sector, without('tasks'), CURRENT_CORE),
    ).map((tpl) => tpl.id);
    expect(shown).not.toContain('whatsapp-answer');
    // …and it is the missing list that hides it, not the kernel floor: with `tasks` back the same
    // hub is offered the card.
    expect(
      SECTORS.flatMap((sector) => availableTemplates(sector, without(), CURRENT_CORE)).map(
        (tpl) => tpl.id,
      ),
    ).toContain('whatsapp-answer');
  });

  it('offers everything while the hub has not answered yet', () => {
    // «Not asked yet» is not a refusal. Hiding on an unanswered probe would empty the gallery for
    // the first second of every visit and then fill it back in, which reads as a broken screen.
    //
    // This is about the MODULE probe, so the kernel one is held open here on purpose: it is the
    // other way round (fail-closed) and it has its own describe at the end of this file, where it
    // belongs. Holding it open is what keeps THIS test about the one thing it names.
    const shown = SECTORS.flatMap((sector) => availableTemplates(sector, {}, CURRENT_CORE)).map(
      (tpl) => tpl.id,
    );
    expect(shown.sort()).toEqual(TEMPLATES.map((tpl) => tpl.id).sort());
  });

  it('says which modules the hidden cards needed, each named once', () => {
    const missing = unavailableModules(without('tasks', 'appointments'));
    expect(missing).toContain('tasks');
    expect(missing).toContain('appointments');
    // Deduped: most cards here need `tasks`, and «Tasks, Tasks, Tasks» is not a sentence.
    expect(new Set(missing).size).toBe(missing.length);
  });

  it('names nothing when nothing is hidden', () => {
    expect(unavailableModules(without())).toEqual([]);
    expect(unavailableModules({})).toEqual([]);
  });

  it('does not name a module that is missing but was not needed by any hidden card', () => {
    // The control that stops this from being «list every module that answered 404»: a hub without
    // `sales` hides `note-big-sale`, whose OTHER module (`customers`) is installed and must not
    // be named — sending the owner to install something they already have.
    const missing = unavailableModules(without('sales'));
    expect(missing).toContain('sales');
    expect(missing).not.toContain('customers');
  });
});

/**
 * **Two automations on one event fire twice** (whatsapp_inbox#58).
 *
 * Two automations can wait on the SAME event with the SAME filter, so a hub that runs both acts on
 * every incoming message twice — two jobs on the list, two replies, one customer who now hears the
 * same thing from the shop twice. Nothing in the kernel prevents it, and nothing should: two flows
 * on one event is a normal thing to want (log every message AND act on it). What was missing is
 * that the owner is never TOLD, and the only warning lived in a README they do not read.
 *
 * So the gallery asks before it creates the second one, which is what Zapier does with a duplicate
 * Zap and what Power Automate does with a duplicate flow — warn, name the one already there, and
 * let the owner decide. Blocking would be wrong: it is their hub.
 *
 * This is the pure half — the decision, with no component and no network around it.
 */
describe('the gallery can see that a card would double up on a trigger (whatsapp_inbox#58)', () => {
  // The card is the one this catalogue still writes: the four WhatsApp copies went with flows#101,
  // and the recipes that replaced them are served by the hub, so the collision this warns about is
  // now between a written card and whatever the owner already has — which is the shape every
  // assertion below already used.
  const unattended = templateById('whatsapp-answer')!;
  const asFlow = (name: string, template: (typeof TEMPLATES)[number]) => ({
    name,
    definition: buildTemplate(template, t) as unknown as Record<string, unknown>,
  });
  /** A flow of the owner's own, waiting on the very event the card above waits on. */
  const onTheSameEvent = (name: string) => ({
    name,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
      steps: [],
    } as Record<string, unknown>,
  });

  it('names the flow already waiting on that event', () => {
    expect(flowsOnSameTrigger(unattended, t, [onTheSameEvent('WhatsApp → appointment proposal')])).toEqual([
      'WhatsApp → appointment proposal',
    ]);
  });

  it('says nothing when the hub has no flow on that event', () => {
    // The control that stops «warns about everything» from passing: a flow that exists but waits
    // on another event is not a collision, and warning about it would teach the owner to click
    // through the warning that matters.
    expect(flowsOnSameTrigger(unattended, t, [asFlow('Welcome', TEMPLATES[0])])).toEqual([]);
    expect(flowsOnSameTrigger(unattended, t, [])).toEqual([]);
  });

  it('warns about a copy of ITSELF, which is what tapping «Use this» twice makes', () => {
    // The same card, already installed. `asFlow` builds the document the card installs, so this is
    // the collision an owner actually creates: the second «Use this» on a card they already used.
    expect(flowsOnSameTrigger(unattended, t, [asFlow('WhatsApp → task', unattended)])).toEqual([
      'WhatsApp → task',
    ]);
  });

  it('sees a flow the owner has since edited, as long as the event is the same', () => {
    // The match is the EVENT, not the document: an owner who renamed the flow and reworded a
    // prompt still has an automation that fires on every message. Comparing documents would miss
    // exactly the flow that has been in production longest.
    const edited = {
      name: 'My WhatsApp thing',
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
        steps: [],
      },
    };
    expect(flowsOnSameTrigger(unattended, t, [edited])).toEqual(['My WhatsApp thing']);
  });

  it('does not name a flow that is PAUSED — a flow that is off does not fire', () => {
    // The warning is about double-firing, and a paused twin books nothing. The real switch-over is
    // exactly this: the salon turns the attended flow off to move to the unattended one, and a
    // warning that keeps naming it tells them to do what they have just done — the warning that
    // teaches an owner to click through warnings. A flow handed back WITHOUT `enabled` still counts:
    // not knowing is not the same as knowing it is off.
    const twin = onTheSameEvent('WhatsApp → appointment proposal');
    expect(flowsOnSameTrigger(unattended, t, [{ ...twin, enabled: false }])).toEqual([]);
    expect(flowsOnSameTrigger(unattended, t, [{ ...twin, enabled: true }])).toEqual([twin.name]);
    expect(flowsOnSameTrigger(unattended, t, [twin])).toEqual([twin.name]);
  });

  it('does not fall over on a flow whose definition is not a document it understands', () => {
    // `Flow.definition` is `Record<string, unknown>` — whatever the hub stored. A gallery that
    // throws here shows the owner an error instead of a catalogue.
    const junk = [
      { name: 'no triggers', definition: { schema_version: 1, steps: [] } },
      { name: 'triggers is not a list', definition: { triggers: 'nope' } },
      { name: 'a trigger with no event', definition: { triggers: [{ kind: 'cron', cron: '0 9 * * *' }] } },
      { name: 'empty', definition: {} },
    ];
    expect(flowsOnSameTrigger(unattended, t, junk)).toEqual([]);
  });
});

/**
 * **A recipe an older core cannot even parse is not offered to it** (flows#92).
 *
 * The unattended card's document carries `interactive` (hub#1633) and `output` (hub#1639), and a
 * core below `v1.1.16` does not degrade on them: `parse_step` walks an allowlist per step kind and
 * answers `flow.invalid_definition` for the WHOLE document, so the recipe dies at save. The
 * gallery has to know that BEFORE it offers the card.
 *
 * 🔴 And the floor is the CARD's, never the module's. Raising `flows`' own
 * `min_erplora_version` would put this floor on the twenty other cards that do not need it, and
 * take the gallery away from hubs using it perfectly well today.
 *
 * The probe is the same one the editor uses for the control (flows#75) and it is **fail-closed**,
 * unlike the module probe two describes above: «not asked yet» there costs a card that flickers
 * in, and here it would cost an automation that installs broken. Measured on the real schemas:
 * `v1.1.15` declares neither key and `v1.1.16` declares both.
 */
describe('the floor of a card is the card’s, not the module’s (flows#92)', () => {
  const everything: Record<string, boolean> = Object.fromEntries(
    TEMPLATES.flatMap((tpl) => tpl.witnesses.map((w) => [w.module, true])),
  );

  /** A hub whose flow schema declares exactly these step keys, on the release it says it is. */
  const hubDeclaring = (keys: string[], coreVersion?: string) =>
    schemaFacts(
      {
        $defs: {
          step: { properties: Object.fromEntries(keys.map((k) => [k, { type: 'object' }])) },
        },
      },
      coreVersion,
    );

  /** Everything the two appointment cards need: both step keys AND a core that stores their pin. */
  const currentHub = () => hubDeclaring(['interactive', 'output'], QUERY_GRANT_PIN_CORE);

  const beautyOn = (facts?: SchemaFacts): string[] =>
    availableTemplates('beauty', everything, facts).map((tpl) => tpl.id);

  it('offers it on a hub that declares both keys and can store its limits', () => {
    expect(beautyOn(currentHub())).toContain('whatsapp-appointment-unattended');
  });

  it('hides it on a hub that declares neither, which is every hub on v1.1.15', () => {
    expect(beautyOn(hubDeclaring([]))).not.toContain('whatsapp-appointment-unattended');
  });

  it('hides it on a hub that declares only half of what the document carries', () => {
    // A build between the two kernel merges. Fail-closed means BOTH or nothing.
    expect(beautyOn(hubDeclaring(['interactive'], QUERY_GRANT_PIN_CORE))).not.toContain(
      'whatsapp-appointment-unattended',
    );
    expect(beautyOn(hubDeclaring(['output'], QUERY_GRANT_PIN_CORE))).not.toContain(
      'whatsapp-appointment-unattended',
    );
  });

  /**
   * **A hub that parses the document but cannot hold its limit is still the wrong hub** (flows#111).
   *
   * `v1.1.16` is exactly that hub: it declares `interactive` and `output`, so the document saves —
   * and it has no `GrantKind::can_pin(Query)`, so `check_grants` refuses the read's pin. `PUT
   * …/grants` is all-or-nothing, so the owner would not get the wide permission they were warned
   * about: they would get NO permissions, and an automation that stops at its first step with the
   * card still saying it was installed.
   */
  it('hides both appointment cards on a v1.1.16 hub, which parses them but cannot hold the limit', () => {
    const shown = beautyOn(hubDeclaring(['interactive', 'output'], '1.1.16'));
    expect(shown).not.toContain('whatsapp-appointment');
    expect(shown).not.toContain('whatsapp-appointment-unattended');
  });

  it('hides them while the hub has not said which release it is', () => {
    // Same fail-closed rule as the step keys, and the reason the version is read from the same
    // response: «not answered yet» must not read as «current».
    const shown = beautyOn(hubDeclaring(['interactive', 'output']));
    expect(shown).not.toContain('whatsapp-appointment');
    expect(shown).not.toContain('whatsapp-appointment-unattended');
  });

  it('offers them again on the release that can hold the limit', () => {
    expect(beautyOn(currentHub())).toContain('whatsapp-appointment');
  });

  it('hides it while the hub has not answered yet: this probe is fail-closed', () => {
    // The opposite of the module probe, and on purpose: an unanswered module probe costs a card
    // that appears a second late; an unanswered kernel probe would cost an automation that
    // installs and then refuses to parse.
    expect(beautyOn()).not.toContain('whatsapp-appointment-unattended');
  });

  // Derived from `needs` rather than from a list of ids: four cards carry the floor now, not one
  // (flows#100), and an id list here would have gone on claiming the other three were offered on a
  // `v1.1.15` hub — where they are refused whole at save.
  it('keeps offering every OTHER card of the sector on that same old hub', () => {
    const shown = beautyOn(hubDeclaring([]));
    const gated = templatesOf('beauty').filter((tpl) => (tpl.needs ?? []).length > 0);
    const others = templatesOf('beauty')
      .filter((tpl) => (tpl.needs ?? []).length === 0)
      .map((tpl) => tpl.id);
    expect(gated.length, 'no beauty card carries a floor: this test proves nothing').toBeGreaterThan(
      0,
    );
    expect(shown.sort()).toEqual(others.sort());
    expect(shown.length).toBeGreaterThan(0);
  });
});
