import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  TEMPLATES,
  SECTORS,
  availableTemplates,
  buildTemplate,
  missingModules,
  moduleName,
  templateGrants,
  unavailableModules,
} from './templates';
import type { FlowDoc } from './flow-doc';
import { MAX_ITERS_CAP, isSpineKind, readDoc } from './flow-doc';
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

/** The same, in Spanish: a mirror is verbatim in BOTH languages or it is not a mirror. */
const tEs = (key: string): string => lookup(es, key) ?? key;

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

/**
 * **The automation the WhatsApp module ships, offered where people look for it** (flows#52).
 *
 * `whatsapp_inbox` has carried `flows/appointment-from-whatsapp.{es,en}.flow.json` since it
 * learned to book — the case the product is sold on — and nobody installed it: the hub reads no
 * `*.flow.json` anywhere (`grep '\.flow\.json' hub/crates` = 0), so the only thing that ever
 * created it was the module's own end-to-end test. A shop that connects its number and opens
 * Automations found «somebody writes on WhatsApp → make a task» and nothing else.
 *
 * The card below is that document, in this catalogue, so it can be picked. What it is NOT is a
 * second design: the trigger, the three steps and the eleven permissions are pinned here against
 * the ones the module publishes — by COMMIT, and by a hash of the whole document in both
 * languages — so the two cannot quietly say different things.
 */

/**
 * **What the mirror mirrors.** Pinned by commit and not by module version because
 * `whatsapp_inbox`'s release workflow does not bump on `flows/**`: v2.1.31 named BOTH the
 * four-step document (before whatsapp_inbox#55) and the three-step one (after), so «v2.1.31» said
 * nothing about which one a copy was. The commit does.
 *
 * Re-syncing the mirror is: copy the source's steps and prompts into `templates.ts` and the two
 * locale files, set `commit` to the source commit, and recompute the two digests from the source
 * files with the SAME canonical form `digest()` below uses:
 *
 *     git -C ../whatsapp_inbox show <commit>:flows/appointment-from-whatsapp.en.flow.json \
 *       | node -e 'const s=v=>Array.isArray(v)?v.map(s):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,s(v[k])])):v;
 *         const {name,...d}=JSON.parse(require("fs").readFileSync(0,"utf8"));
 *         console.log(require("crypto").createHash("sha256").update(JSON.stringify(s(d))).digest("hex"))'
 */
const SOURCE = {
  module: 'whatsapp_inbox',
  // whatsapp_inbox PR #63 (issue #55): the two model steps became one, `conflicting` fell out.
  commit: '6a6399eba28e8ea0e13487b8e1bc0226f7d8d3c6',
  files: {
    en: 'flows/appointment-from-whatsapp.en.flow.json',
    es: 'flows/appointment-from-whatsapp.es.flow.json',
    grants: 'flows/appointment-from-whatsapp.grants.json',
  },
  digest: {
    en: 'a19f3bd2959ef13ba10544acc708d2b4f1f782e76cfbb3367a8fadb12c88476d',
    es: 'e11dc6cd787fcd8002ae9b4cf8606a5853327fe72a4d8ac09c48078c4ffcf8c7',
  },
} as const;

/**
 * The document in its canonical form — keys sorted, no whitespace, the module's `name` left out
 * because this catalogue carries the name as the card's title — hashed. Two documents that say the
 * same thing in a different key order hash the same; one word of a prompt changed does not.
 */
function digest(doc: FlowDoc | Record<string, unknown>): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.keys(v as Record<string, unknown>)
              .sort()
              .map((k) => [k, sort((v as Record<string, unknown>)[k])]),
          )
        : v;
  const { name: _name, ...rest } = doc as Record<string, unknown>;
  return createHash('sha256').update(JSON.stringify(sort(rest))).digest('hex');
}

/**
 * The `whatsapp_inbox` checkout beside this module, if the workspace has one at or past
 * {@link SOURCE.commit}. The canonical checkout (the directory named as the module) is preferred
 * over the fleet's worktrees; a checkout OLDER than the pin is not a source to judge by — it would
 * report a drift that is its own — and neither is a directory that is not a git checkout at all.
 */
function sourceCheckout(): string | null {
  const modules = resolve(__dirname, '../../..');
  let entries: string[];
  try {
    entries = readdirSync(modules);
  } catch {
    return null;
  }
  const candidates = entries
    .filter((d) => d === SOURCE.module || d.startsWith(`${SOURCE.module}-`))
    .sort((a, b) => (a === SOURCE.module ? -1 : b === SOURCE.module ? 1 : a.localeCompare(b)));
  for (const entry of candidates) {
    const dir = join(modules, entry);
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'module.json'), 'utf8')) as { id?: string };
      if (manifest.id !== SOURCE.module || !existsSync(join(dir, SOURCE.files.en))) continue;
      execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', SOURCE.commit, 'HEAD'], {
        stdio: 'ignore',
      });
      return dir;
    } catch {
      // No manifest, no template, or a checkout older than the pin: keep looking.
    }
  }
  return null;
}
describe('WhatsApp → appointment, the card the WhatsApp module has always shipped (flows#52)', () => {
  const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment');

  it('is in the gallery at all — until flows#52 the only way in was the module’s own test', () => {
    expect(template, 'no `whatsapp-appointment` template in the catalogue').toBeTruthy();
  });

  it('starts on the message the CORE delivers, and ignores a message with no text', () => {
    const trigger = buildTemplate(template!, t).triggers[0];
    // `hub.whatsapp.message_received` is the runtime's own event (`crates/server/src/inbound_poll.rs`),
    // which is what the module's published template waits for. An empty body is a sticker or an
    // image: there is nothing for a model to read, and answering it costs money.
    expect(trigger).toEqual({
      kind: 'event',
      event: 'hub.whatsapp.message_received',
      filter: { 'event.text': { neq: '' } },
      input: {
        from: 'event.from',
        text: 'event.text',
        wa_message_id: 'event.wa_message_id',
        received_at: 'event.received_at',
      },
    });
  });

  it('acknowledges first, knows the customer, then finds the slot AND proposes in ONE turn', () => {
    const steps = buildTemplate(template!, t).steps;
    // Three steps, not four. The published document used to split «find what is free» (a step that
    // only asked, `auto`) from «propose» (a step that wrote from the report): the workaround for a
    // hub that refused a read inside a `manual` step. hub#1595 made that read legal and
    // whatsapp_inbox#55 collapsed the two — one turn asks the availability tools and proposes.
    expect(steps.map((s) => [s.id, s.kind])).toEqual([
      ['acknowledge', 'notify'],
      ['know_the_customer', 'ai'],
      ['propose_appointment', 'ai'],
    ]);
    // Both model steps WRITE (a customer card, a booking), so both wait for a person.
    expect(steps.map((s) => s.policy)).toEqual([undefined, 'manual', 'manual']);
  });

  it('gives the proposing step the whole budget the hub allows, and not one iteration more', () => {
    // The merged step asks up to nine tools in a row (catalogue, opening hours, slots, check,
    // staff, schedules, check again, customer, create), so the source pins `max_iters` at the
    // kernel's cap. Above it the hub refuses the document at save; below it the proposal never
    // arrives. Zero margin either way — whoever adds a tool to this step adds a STEP instead.
    const propose = buildTemplate(template!, t).steps.find((s) => s.id === 'propose_appointment');
    expect(propose?.max_iters).toBe(MAX_ITERS_CAP);
  });

  it('writes back on WhatsApp through the conversation, never to a number in the document', () => {
    const notify = buildTemplate(template!, t).steps[0];
    expect(notify.channel).toBe('whatsapp');
    expect(notify.to).toEqual({
      query: 'whatsapp_inbox.conversations.list',
      params: { f_wa_contact_id: 'input.from' },
      field: 'contact_phone',
    });
    // The acknowledgement is the one sentence every shop wants in its own words, so it is a blank.
    expect(template!.blanks.length).toBeGreaterThan(0);
    expect(String(notify.vars?.text ?? '')).not.toBe('');
  });

  /**
   * The list is `flows/appointment-from-whatsapp.grants.json` of `whatsapp_inbox@SOURCE.commit`,
   * written out here because the two repositories cannot read each other at CI time. If the card
   * ever derives one grant more, or one fewer, than the automation the module publishes, this is
   * where it is caught — and a grant is the difference between an automation that books and one
   * that writes to a customer without being allowed to.
   *
   * Eleven, not twelve: `appointments.appointments.conflicting` fell out with whatsapp_inbox#55.
   * `availability.check` already refuses an overlap with the booking gate's own authority, and the
   * reads it does on the way run as the SYSTEM (`preload_reads`), which no grant governs.
   */
  it('asks for the eleven permissions the module’s own grants file lists, and no twelfth', () => {
    expect(
      templateGrants(template!, t)
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
    ).toEqual(
      [
        'command appointments.appointments.create',
        'command appointments.availability.check',
        'command appointments.availability.day_opening',
        'command appointments.availability.slots',
        'command customers.create',
        'notify whatsapp',
        'query customers.list',
        'query services.services.list',
        'query staff.members.list',
        'query staff.schedules.list_for_member',
        'recipient_query whatsapp_inbox.conversations.list#contact_phone',
      ].sort(),
    );
  });

  /**
   * **Verbatim means verbatim, and this is where it is measured.** The whole document this card
   * builds — trigger, steps, tools, prompts, the acknowledgement — in BOTH languages, hashed in
   * the canonical form of {@link digest}, against the hashes of the source files at
   * {@link SOURCE.commit}. The grants test above cannot see a prompt reworded, a `max_iters`
   * nudged or a tool moved between steps; this can. A mismatch is one of two things — a mirror
   * that drifted from its source, or a re-sync that forgot to move the pin — and both are the bug.
   */
  it('is, hashed, the very document the module publishes — in English and in Spanish', () => {
    expect(digest(buildTemplate(template!, t)), 'en').toBe(SOURCE.digest.en);
    expect(digest(buildTemplate(template!, tEs)), 'es').toBe(SOURCE.digest.es);
  });

  it('names the five modules it needs, so a hub without one of them never shows it', () => {
    expect([...new Set(template!.witnesses.map((w) => w.module))].sort()).toEqual([
      'appointments',
      'customers',
      'services',
      'staff',
      'whatsapp_inbox',
    ]);
  });

  it('tells the model which tools it may use, and offers no tool it has no permission for', () => {
    const granted = new Set(templateGrants(template!, t).map((g) => `${g.kind} ${g.value}`));
    for (const step of buildTemplate(template!, t).steps) {
      if (step.kind !== 'ai') continue;
      expect(step.prompt, step.id).toBeTruthy();
      expect((step.tools?.queries?.length ?? 0) + (step.tools?.commands?.length ?? 0)).toBeGreaterThan(0);
      for (const query of step.tools?.queries ?? []) expect(granted.has(`query ${query}`), query).toBe(true);
      for (const command of step.tools?.commands ?? []) expect(granted.has(`command ${command}`), command).toBe(true);
    }
  });
});

/**
 * **The mirror against its source, whenever the workspace has the source** (flows#52).
 *
 * Nothing in this repository can see `whatsapp_inbox` at CI time, so the pins above are what CI
 * runs. But this module is developed inside the monorepo workspace, beside the module it mirrors,
 * and there the real document is one directory away. This reads it — when it is there, and when it
 * is at least as new as the commit the mirror claims to copy — and compares the lot: both
 * documents, and the grants file.
 *
 * Skipped LOUDLY otherwise: on a bare checkout there is nothing to read, and a neighbour OLDER than
 * the pin would report a drift that is its own, not ours (the fleet's checkouts run behind).
 * `whatsapp_inbox/tests/flow_templates.test.py` applies the same rule when it reads ITS neighbours.
 * When the source moves past the pin — whatsapp_inbox#58 and #61 are next in line for this very
 * document — this is the test that goes red on this machine before the drift ships.
 */
describe('the mirror against the whatsapp_inbox checkout beside this module (flows#52)', () => {
  const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment');
  const source = sourceCheckout();
  const where = source
    ? `read from ${source}`
    : 'SKIPPED: no checkout at or past the pin beside this module';

  it.skipIf(!source)(`says exactly what the module’s own files say (${where})`, () => {
    const read = (file: string): Record<string, unknown> =>
      JSON.parse(readFileSync(join(source!, file), 'utf8')) as Record<string, unknown>;
    expect(digest(buildTemplate(template!, t)), 'en').toBe(digest(read(SOURCE.files.en)));
    expect(digest(buildTemplate(template!, tEs)), 'es').toBe(digest(read(SOURCE.files.es)));
    const published = (read(SOURCE.files.grants) as { grants: { kind: string; value: string }[] })
      .grants.map((g) => `${g.kind} ${g.value}`)
      .sort();
    expect(
      templateGrants(template!, t)
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
    ).toEqual(published);
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

  it('drops the cards whose modules are missing, and keeps the rest', () => {
    const known = without('tasks');
    const shown = SECTORS.flatMap((sector) => availableTemplates(sector, known)).map((tpl) => tpl.id);
    expect(shown).not.toContain('no-show-followup');
    expect(shown).toContain('whatsapp-appointment');
  });

  it('hides the WhatsApp card on a hub that has WhatsApp but no diary', () => {
    // The case that made hiding the answer: every module of the card but one.
    const shown = availableTemplates('beauty', without('appointments')).map((tpl) => tpl.id);
    expect(shown).not.toContain('whatsapp-appointment');
  });

  it('offers everything while the hub has not answered yet', () => {
    // «Not asked yet» is not a refusal. Hiding on an unanswered probe would empty the gallery for
    // the first second of every visit and then fill it back in, which reads as a broken screen.
    const shown = SECTORS.flatMap((sector) => availableTemplates(sector, {})).map((tpl) => tpl.id);
    expect(shown.sort()).toEqual(TEMPLATES.map((tpl) => tpl.id).sort());
  });

  it('says which modules the hidden cards needed, each named once', () => {
    const missing = unavailableModules(without('tasks', 'appointments'));
    expect(missing).toContain('tasks');
    expect(missing).toContain('appointments');
    // Deduped: nine cards need `tasks`, and «Tasks, Tasks, Tasks» is not a sentence.
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
