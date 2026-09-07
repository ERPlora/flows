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
  carriedPins,
  missingModules,
  moduleName,
  templateGrants,
  templateById,
  unavailableModules,
  flowsOnSameTrigger,
  templatesOf,
} from './templates';
import { conditionResult } from './simulate';
import { schemaFacts } from './ai-draft';
import type { SchemaFacts } from './ai-draft';
import type { FlowDoc } from './flow-doc';
import { MAX_ITERS_CAP, grantAllowsCall, grantPin, isSpineKind, readDoc } from './flow-doc';
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
/** A hub on a current core, for the tests that are not about the kernel floor (flows#92). */
const CURRENT_CORE = schemaFacts({
  $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
});

const t = (key: string): string => lookup(en, key) ?? key;

/** The same, in Spanish: a mirror is verbatim in BOTH languages or it is not a mirror. */
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
    // event card it is also the same message answered twice. It stays the rule, with ONE exception
    // and only because it cannot fire twice: the unattended WhatsApp card wakes on words
    // (`text: neq ''`) and on a TAP (`text: eq ''` + `reply_id: neq ''`), and no message can
    // satisfy both. Disjoint by construction, not by luck — and the invariant is asserted where
    // the document is AUTHORED, not here: `whatsapp_inbox/tests/flow_templates.test.py` judges the
    // UNION of the triggers and refuses the overlap that reads as disjoint. Here it is the digest
    // guard that holds the line: a mirror whose triggers overlap stops matching the source.
    const TWO_WAYS_IN = new Set(['whatsapp-appointment-unattended']);
    for (const template of TEMPLATES) {
      const doc = buildTemplate(template, t);
      expect(doc.schema_version).toBe(1);
      expect(doc.triggers, template.id).toHaveLength(TWO_WAYS_IN.has(template.id) ? 2 : 1);
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

  // The third column is the trigger's `filter`, spelled out rather than allowed for: the
  // comparison below stays a whole-object `toEqual`, so a clause that appears on any of these
  // cards without being written here is still a failure. `undefined` means «this card filters
  // nothing», which is an assertion too — three of the four run on every event of their kind.
  it.each([
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
  ])('%s starts on %s', (id, event, filter) => {
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
 * **The automation the WhatsApp module ships, offered where people look for it** (flows#52).
 *
 * `whatsapp_inbox` has carried `flows/appointment-from-whatsapp.{es,en}.flow.json` since it
 * learned to book — the case the product is sold on — and nobody installed it: the hub reads no
 * `*.flow.json` anywhere (`grep '\.flow\.json' hub/crates` = 0), so the only thing that ever
 * created it was the module's own end-to-end test. A shop that connects its number and opens
 * Automations found «somebody writes on WhatsApp → make a task» and nothing else.
 *
 * The card below is that document, in this catalogue, so it can be picked. What it is NOT is a
 * second design: the trigger, the four steps and the eleven permissions are pinned here against
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
 * locale files, set `commit` to the source commit **on `main`**, and recompute the two digests
 * from the source files with the SAME canonical form `digest()` below uses. On `main`, and not
 * the PR branch head: `merge-pr.sh` squashes the source PR, so the branch head is gone the moment
 * it lands and only the squash commit exists (whatsapp_inbox#69 → `89f8d02`, #75 → `ba2f293`). A
 * mirror opened while the source is still a branch is re-pinned once the source lands — the last
 * test of this file names the sha to set, and goes red until it is set.
 *
 *     git -C ../whatsapp_inbox show <commit>:flows/appointment-from-whatsapp.en.flow.json \
 *       | node -e 'const s=v=>Array.isArray(v)?v.map(s):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,s(v[k])])):v;
 *         const {name,...d}=JSON.parse(require("node:fs").readFileSync(0,"utf8"));
 *         console.log(require("node:crypto").createHash("sha256").update(JSON.stringify(s(d))).digest("hex"))'
 *
 * (`node:` on purpose, and not only for style: `erplora test` reads every bare name handed to
 * `require` under `ui/` — comments included — as a package the module needs, and the plain
 * `fs` / `crypto` forms in this very comment had the gate declare all 27 TypeScript tests
 * unrunnable. The `node:` form is skipped by that scanner.)
 */
interface MirrorSource {
  /** The `TEMPLATES` id this pin belongs to — one card mirrors exactly one published family. */
  template: string;
  module: string;
  commit: string;
  files: { en: string; es: string; grants: string };
  digest: { en: string; es: string };
}

/**
 * **Every family the module publishes, and the card that mirrors it.** One entry per family, and
 * the list is what the «no family without a card» test below counts against the source checkout —
 * so adding a family to `whatsapp_inbox/flows/` without adding its card here goes RED instead of
 * shipping a module whose automation no hub can install.
 */
const SOURCES: readonly MirrorSource[] = [
  {
    template: 'whatsapp-appointment',
    module: 'whatsapp_inbox',
    // whatsapp_inbox #67: a «no» from the salon used to end the run where it stood, so the
    // customer who had been promised an answer never got one. The proposing step now says
    // `on_reject: "continue"`, and a step after it writes what she actually receives — the booking
    // words when nothing was refused, and a real «that time cannot be, tell me another» when it
    // was. Before it, PR #75 (#61) taught the proposing step to CANCEL as well as book, PR #69
    // (first half of #58) added `confirm_to_customer`, and PR #63 (#55) made the two model steps
    // one.
    //
    // Re-pinned from the branch head (`67c163c`) to the squash the day wi#85 landed on `main`,
    // which is the drill the last test of this file enforces: it went red naming this very sha,
    // and the two digests below did not move — the documents are the same, only the commit that
    // carries them is new. The source could only merge once hub#1622 was in `develop`: an `ai`
    // step carrying `on_reject` is refused whole (`flow.invalid_definition`) by any hub without it.
    //
    // Moved again by whatsapp_inbox#90 (squashed as `c4b5368`), and this time the digests DID
    // move: the trigger grew two clauses so the automation stops answering the owner's own echo
    // and the 180 days of backlog Meta hands over on connection. This is the other half of the
    // drill — the neighbour test above went red on the digests, not the pin, because the source
    // documents changed rather than merely moving commit.
    //
    // And moved again by whatsapp_inbox#82 (squashed as `0f8eb60`), digests with it: point 5 of
    // CANCELLING now orders the `customer_id` the first point already looked up by phone, because
    // from appointments 1.1.72 (appointments#140) a cancellation on the customer channel without
    // it is refused whole with `invalid_payload`. Until this landed the gallery kept handing out
    // the version that cannot cancel (flows#64) — and NOTHING here went red, which is why the
    // third pin test below now exists.
    // And moved by whatsapp_inbox#74 (squashed as `33e7c0f`): the proposing step gained MOVING —
    // in THIS family only. It had book and cancel and
    // no way to change an appointment's hour, so «can you change it to Thursday?» fell into the
    // «anything else» branch — or was read as a new booking and the customer ended up with two.
    // Moving is `appointments.appointments.reschedule`, ONE call and never cancel-then-book, and
    // the id always comes out of `list_for_customer` because that command carries no `channel` and
    // no `customer_id` (appointments 1.1.72), so nothing below it can tell whose appointment it is.
    // The grants list grows by one (13 → 14) and `reply_to_customer` learns to say that a refused
    // MOVE leaves the appointment she already had exactly where it was.
    //
    // Its twin below did NOT gain it, and that asymmetry is the whole point: `reschedule` cannot
    // be bound to the customer asking (no `channel`, no `customer_id`, and the handler never looks
    // at whose appointment it is), so the move only ships where a PERSON approves the write.
    //
    // Re-pinned from the branch head (`5cdfb79`) to that squash the day whatsapp_inbox#102 landed,
    // which is the drill this file enforces: the mirror was opened while its source was still a
    // branch, `merge-pr.sh` squashed it, and the first pin test went red naming the sha to set.
    // The four digests did NOT move — the documents are the same, only the commit that carries
    // them is new.
    //
    // 🪤 And the sha to set is the one that CARRIES the documents, not the tip: that red names
    // `main` as fetched, which the day of this re-pin was `0fd8a74` — a `chore(release)` bump that
    // touches no template. Pinned there, the two tests below would still pass (a descendant that
    // did not touch the files hashes the same), and the pin would stop saying WHICH change it
    // mirrors, which is the one job it has. `git log -1 <file>` on the source's `main` is the
    // answer, and it is what the third test names in its own remedy.
    commit: '6737f5a5e649ed6561e26a453f91858e5db0d93d',
    files: {
      en: 'flows/appointment-from-whatsapp.en.flow.json',
      es: 'flows/appointment-from-whatsapp.es.flow.json',
      grants: 'flows/appointment-from-whatsapp.grants.json',
    },
    digest: {
      en: '4f2407b2267d31ea1d0c791a571769d6181f560c88d9e4c50d32644d02f0c369',
      es: '6314b92900d7d37781e7fd20e6f2bcda53881796d7e537a7db6fbc9d00c7e319',
    },
  },
  {
    template: 'whatsapp-appointment-unattended',
    module: 'whatsapp_inbox',
    // whatsapp_inbox PR #77 (second half of #58), squash-merged as `a44a3f1`: the unattended
    // family — the same four steps with both model steps on `auto`, so the appointment is booked
    // inside the turn instead of waiting in the approval tray. It carries the review's own commit
    // (`hour_choice_problems`, `silence_problems` hardened), which is what keeps «you never choose
    // the hour» in the prompt this mirror copies.
    //
    // Re-pinned from the branch head to the squash the day wi#77 landed, which is the drill the
    // last test of this file enforces: it went red naming this very sha, and the two digests below
    // did not move — the documents are the same, only the commit that carries them is new.
    //
    // Moved again by whatsapp_inbox#90 (`c4b5368`), with the digests: this family books without
    // asking anybody, so the echo and the backlog it used to answer went straight into the diary
    // as appointments. Its trigger now carries the same two clauses as the twin's.
    //
    // And by whatsapp_inbox#82 (`0f8eb60`), the same identified cancellation as the twin — with
    // nobody watching, here it mattered more: the customer was told nothing and no salon saw the
    // refusal.
    //
    // 🔴 whatsapp_inbox#74 did NOT touch this family, and the pin stays where it was to say so:
    // the twin above learned to MOVE an appointment and this one deliberately did not, so it keeps
    // thirteen permissions against the twin's fourteen. `appointments.appointments.reschedule`
    // carries no `channel` and no `customer_id` (`additionalProperties: false` over
    // `appointment_id`, `start_datetime`, `duration_minutes`) and its handler never checks whose
    // appointment it is, so nothing downstream can refuse a stranger's. Cancelling CAN be bound
    // that way — which is why whatsapp_inbox#100 can pin `payload` in its grant once hub#1632
    // ships, and why the same trick has nothing to bite on here. With `policy: "auto"` there is no
    // person in the loop either, so the family answers «somebody from the salon will get back to
    // you». It reopens with appointments#142 first, then whatsapp_inbox#103.
    //
    // And moved by whatsapp_inbox#101 (squashed as `8460f33`), with both digests — flows#92. The
    // customer stopped having to TYPE the slot: the document gained a second trigger for the tap,
    // the booking step DECLARES the slots it found (`output`) and a guarded `notify` sends them as
    // a list she taps. The permissions did not move (`grants.json` is still on `a44a3f1`), which
    // is the shape of this change: a different way of asking, not a wider one.
    //
    // 🔴 This is the pin whose drift the gallery was living with for a day: the source landed and
    // the card kept handing out «reply with the service, the day and the hour». The guard below
    // named it, in red, with this very sha — which is the one job it has.
    commit: '8460f33a3db9196ff8e2138c3d51df7dcc190111',
    files: {
      en: 'flows/appointment-from-whatsapp-unattended.en.flow.json',
      es: 'flows/appointment-from-whatsapp-unattended.es.flow.json',
      grants: 'flows/appointment-from-whatsapp-unattended.grants.json',
    },
    digest: {
      en: '25f539ad1d30a480112a0bba0e867a0794fafcae178f962f3a91796a60ba87d3',
      es: 'd7a9aed8d4e51f22f7dc96c10981dbc59eb3c31c233a1de5b3dfd8ec4da28c3f',
    },
  },
  {
    template: 'whatsapp-reservation',
    module: 'whatsapp_inbox',
    // whatsapp_inbox#60, squash-merged as `6a8e1d7`: the same recipe one module over, writing into
    // `reservations` instead of `appointments`. A restaurant that connected its number was offered
    // the two cards of a hairdresser and nothing it could use, and the module's own battery went
    // green over it — every rule there judges the documents that EXIST, and the missing one is not
    // a document anything can miss. `shipped_recipe_problems` is the guard that closed it there;
    // the last test of this file is the one that closes it HERE, and it is what went red naming
    // these two families the day the source landed.
    //
    // 🔴 Four steps and NOT five: there is no `know_the_customer`. `customer_id` is optional on a
    // reservation, so the booking step looks the guest up with `customers.list` and, when the
    // restaurant does not have them, books on the name and phone they gave and creates NOBODY —
    // one write and one permission fewer than the salon's twin (nine grants against fourteen).
    //
    // 🔴 And it hands NO tool that could touch a table that already exists.
    // `reservations.reservations.set_status` and `.update` take `{reservation_id, …}` with
    // `additionalProperties: false`, no `channel` and no `customer_id`, and the handler only
    // validates the state machine — never whose row it is. With
    // `reservations.reservations.list` filtering `guest_phone` with `like`, any id is one query
    // away, so a model answering a phone number could move a stranger's table. Both families
    // answer «somebody from the restaurant will take care of it» instead, and the module's battery
    // pins that with `unowned_table_problems`. It reopens with ERPlora/reservations#50 — the twin
    // of appointments#140, and the same shape as appointments#142 for `reschedule`.
    commit: '6737f5a5e649ed6561e26a453f91858e5db0d93d',
    files: {
      en: 'flows/reservation-from-whatsapp.en.flow.json',
      es: 'flows/reservation-from-whatsapp.es.flow.json',
      grants: 'flows/reservation-from-whatsapp.grants.json',
    },
    digest: {
      en: '607670f78eda3396b25b28b72702916bf732fa026454502957b5fe50144a1a46',
      es: 'ceb3f5ab6669efa2b6de866e0e76467da6ce374b5a93a460699094f906e9c5df',
    },
  },
  {
    template: 'whatsapp-reservation-unattended',
    module: 'whatsapp_inbox',
    // The unattended half of the same source commit: three steps, the booking one on `auto`, and
    // no `reply_to_customer` because with no approval in the middle there is no outcome to put
    // into words — the booking step writes the guest's message itself, in the same reply.
    //
    // What keeps it shippable is a paragraph of prompt, pinned in both languages by the module's
    // `hour_choice_problems`: the model never chooses the hour NOR the party size. Its own
    // sentence, not the salon's — «You never choose the hour or how many people are coming. They
    // do.» — because the harm has one more field here: an hour nobody asked for seats people while
    // the kitchen is shut, and a party size nobody said seats four at a table for two.
    commit: '6737f5a5e649ed6561e26a453f91858e5db0d93d',
    files: {
      en: 'flows/reservation-from-whatsapp-unattended.en.flow.json',
      es: 'flows/reservation-from-whatsapp-unattended.es.flow.json',
      grants: 'flows/reservation-from-whatsapp-unattended.grants.json',
    },
    digest: {
      en: '9b69f8cfc1346522bccca9a3e1981b2055378963cf5973825acba0a8730c7907',
      es: '2060f14bdd40ac51db49ecc97b9fee5002e3d14a883190e04d26f2ab3ea0e19c',
    },
  },
] as const;

/** The family this file was written around, and the one most of the tests below name. */
const SOURCE = SOURCES[0];

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
 * The `whatsapp_inbox` checkout beside this module to judge the mirror by: of every checkout in
 * the workspace at or past {@link SOURCE.commit} — the canonical one and the fleet's worktrees
 * alike — the one whose HEAD is NEWEST. A worktree where somebody is already moving the document
 * (whatsapp_inbox#58's second half, #61) is exactly the one that should be heard, and it is newer
 * than a canonical checkout that merely reached the pin. A checkout OLDER than the pin is not a
 * source to judge by — it would report a drift that is its own — and neither is a directory that
 * is not a git checkout at all. Ties go to the canonical checkout.
 */
function sourceCheckout(source: MirrorSource = SOURCE): string | null {
  const modules = resolve(__dirname, '../../..');
  let entries: string[];
  try {
    entries = readdirSync(modules);
  } catch {
    return null;
  }
  const candidates = entries
    .filter((d) => d === source.module || d.startsWith(`${source.module}-`))
    .sort((a, b) => (a === source.module ? -1 : b === source.module ? 1 : a.localeCompare(b)));
  let best: { dir: string; at: number } | null = null;
  for (const entry of candidates) {
    const dir = join(modules, entry);
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'module.json'), 'utf8')) as { id?: string };
      if (manifest.id !== source.module || !existsSync(join(dir, source.files.en))) continue;
      execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', source.commit, 'HEAD'], {
        stdio: 'ignore',
      });
      const at = Number(
        execFileSync('git', ['-C', dir, 'log', '-1', '--format=%ct', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim(),
      );
      if (!best || at > best.at) best = { dir, at };
    } catch {
      // No manifest, no template, or a checkout older than the pin: keep looking.
    }
  }
  return best?.dir ?? null;
}

/**
 * **The source's `origin/main`, which is where the PUBLISHED document lives.** {@link
 * sourceCheckout} answers with a working tree, and a working tree is whatever branch somebody left
 * it on: the fleet keeps a dozen `whatsapp_inbox-*` worktrees beside this module, so «the newest
 * HEAD at or past the pin» can be a branch that predates a fix already on `main` — on flows#64 it
 * was, and it agreed with a stale mirror. It also disappears the moment the pin moves ahead of
 * every local checkout, taking its test with it, silently, as a skip.
 *
 * A ref does neither. This returns the canonical checkout's `refs/remotes/origin/main` as last
 * fetched, and a `git` bound to it — `null` where there is no canonical checkout at all (CI, until
 * module-toolkit#211 brings the source repo to the runner). `git fetch` is not something a test
 * does, so on a stale checkout this reports late; it never reports a drift that is not there.
 */
function sourceMain(
  module: string,
): { sha: string; git: (...args: string[]) => string | null } | null {
  const canonical = join(resolve(__dirname, '../../..'), module);
  const git = (...args: string[]): string | null => {
    try {
      return execFileSync('git', ['-C', canonical, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  };
  if (!existsSync(join(canonical, 'module.json'))) return null;
  const sha = git('rev-parse', 'refs/remotes/origin/main');
  return sha === null ? null : { sha, git };
}
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

describe('WhatsApp → appointment, the card the WhatsApp module has always shipped (flows#52)', () => {
  const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment');

  it('is in the gallery at all — until flows#52 the only way in was the module’s own test', () => {
    expect(template, 'no `whatsapp-appointment` template in the catalogue').toBeTruthy();
  });

  it('starts on what a customer wrote just now — not the owner’s echo, not the backlog', () => {
    const trigger = buildTemplate(template!, t).triggers[0];
    // `hub.whatsapp.message_received` is the runtime's own event (`crates/server/src/inbound_poll.rs`),
    // which is what the module's published template waits for. An empty body is a sticker or an
    // image: there is nothing for a model to read, and answering it costs money.
    //
    // The other two clauses are whatsapp_inbox#90. The poller asks for `?direction=all&source=all`,
    // so the same event also carries what the OWNER writes from her own WhatsApp Business app
    // (echoed back, it had the salon confirming an appointment to itself) and the 180 days of
    // history Meta delivers when the number is first connected (everyone who wrote in March got
    // confirmed today). Pinned whole and not clause by clause on purpose: this is the shape the
    // module publishes, and the digests further down hash the same document — a clause dropped
    // here is a clause the gallery would install without it.
    //
    // `neq` rather than `eq`/`in`: `direction` and `source` only exist on the event from hub#1621,
    // which no published hub tag carries, and in the kernel an absent path is `null`, so the
    // affirmative form matches nothing at all on a hub at the module's declared floor — silently.
    // whatsapp_inbox#95 flips both the day that floor rises.
    expect(trigger).toEqual({
      kind: 'event',
      event: 'hub.whatsapp.message_received',
      filter: {
        'event.text': { neq: '' },
        'event.direction': { neq: 'outbound' },
        'event.source': { neq: 'history' },
      },
      input: {
        from: 'event.from',
        text: 'event.text',
        wa_message_id: 'event.wa_message_id',
        received_at: 'event.received_at',
      },
    });
  });

  it('acknowledges, knows the customer, finds the slot AND proposes in ONE turn, then tells them', () => {
    const steps = buildTemplate(template!, t).steps;
    // «Find what is free» and «propose» are ONE model step: they used to be two (a step that only
    // asked, `auto`, and one that wrote from its report), the workaround for a hub that refused a
    // read inside a `manual` step — hub#1595 made the read legal and whatsapp_inbox#55 collapsed
    // them. The fourth step is whatsapp_inbox#67's: the one that knows how the salon DECIDED and
    // writes what the customer actually reads — it is what makes the fifth (whatsapp_inbox#58's
    // first half, the only thing that ever speaks to her) say something on a «no» too.
    //
    // The two `query` steps are whatsapp_inbox#103's: the customer is looked up DETERMINISTICALLY,
    // by the phone the message came from, because a model holding `customers.list` can search the
    // address book by NAME and read out a stranger's diary. Twice, and not once, because
    // `know_the_customer` may CREATE her in between: the first read answers «is she on file», the
    // second carries the id that exists afterwards.
    expect(steps.map((s) => [s.id, s.kind])).toEqual([
      ['acknowledge', 'notify'],
      ['find_customer', 'query'],
      ['know_the_customer', 'ai'],
      ['resolve_customer', 'query'],
      ['propose_appointment', 'ai'],
      ['reply_to_customer', 'ai'],
      ['confirm_to_customer', 'notify'],
    ]);
    // Every model step waits for a person: the first two WRITE (a customer card, a booking), and
    // the third carries no tools at all, so `manual` costs it nothing — there is never a proposal
    // to approve. The `query` steps carry no policy: they are the document's own read, not a
    // model's, so there is nothing for anybody to approve.
    expect(steps.map((s) => s.policy)).toEqual([
      undefined,
      undefined,
      'manual',
      undefined,
      'manual',
      'manual',
      undefined,
    ]);
  });

  it('carries on when the salon says NO, instead of ending the run at the rejection', () => {
    // whatsapp_inbox#67. The kernel's default for a model's proposal is `cancel`: the run stops
    // AT the refusal and every step after it — including the only one that ever speaks to the
    // customer — never runs. She had been promised «we will confirm as soon as the salon opens»,
    // and then nothing came. Without this key the card below is decoration.
    const propose = buildTemplate(template!, t).steps.find((s) => s.id === 'propose_appointment');
    expect(propose?.on_reject).toBe('continue');
  });

  it('lets one step, and only one, write what the customer reads — with no tools of its own', () => {
    const steps = buildTemplate(template!, t).steps;
    const reply = steps.find((s) => s.id === 'reply_to_customer');
    // It has to know how it ended AND what was written for her: the outcome alone cannot name the
    // day, the hour and the professional, and the words alone describe an appointment she may not
    // have. Both, or the message is wrong on one branch or the other.
    expect(reply?.prompt).toContain('{{steps.propose_appointment.status}}');
    expect(reply?.prompt).toContain('{{steps.propose_appointment.text}}');
    // NO tools, on purpose: it cannot book, cancel or look anything up, so there is nothing here
    // for the salon to approve and nothing a customer's message could talk it into doing. One
    // turn is all it gets — it is composing a message, not working anything out.
    expect(reply?.tools).toBeUndefined();
    expect(reply?.max_iters).toBe(1);
  });

  it('confirms to the customer with the deciding step’s own words, through the same conversation', () => {
    const steps = buildTemplate(template!, t).steps;
    const confirm = steps.find((s) => s.id === 'confirm_to_customer');
    // The text comes from the step that knows how the salon decided — NOT straight from the one
    // that booked, which cannot know it was turned down and would cheerfully send «you are booked
    // for Thursday at five» after the salon refused Thursday at five. Not a template of ours: the
    // salon pays for one WhatsApp, and the customer reads what the assistant wrote for her.
    expect(confirm?.vars?.text).toBe('{{steps.reply_to_customer.text}}');
    // Same recipient resolution as the acknowledgement: the conversation, never a typed number —
    // so the two notifies cost ONE recipient grant and ONE channel grant, not two of each.
    expect(confirm?.channel).toBe('whatsapp');
    expect(confirm?.to).toEqual(steps[0].to);
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
   * Fourteen: eleven, plus the two whatsapp_inbox#61 needs to CANCEL — reading what a customer
   * already has, and cancelling it — plus the one whatsapp_inbox#74 needs to MOVE one. Moving
   * needs no fifteenth: it reuses the same `list_for_customer` read to know WHICH appointment it
   * is moving, and the availability trio to know where to move it to. (It was twelve before
   * whatsapp_inbox#55 dropped
   * `appointments.appointments.conflicting`: `availability.check` already refuses an overlap with
   * the booking gate's own authority, and the reads it does on the way run as the SYSTEM
   * (`preload_reads`), which no grant governs.)
   */
  it('asks for the fourteen permissions the module’s own grants file lists, and no fifteenth', () => {
    expect(
      templateGrants(template!, t)
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
    ).toEqual(
      [
        'command appointments.appointments.cancel',
        'command appointments.appointments.create',
        'command appointments.appointments.reschedule',
        'command appointments.availability.check',
        'command appointments.availability.day_opening',
        'command appointments.availability.slots',
        'command customers.create',
        'notify whatsapp',
        'query appointments.appointments.list_for_customer',
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
    const ai = buildTemplate(template!, t).steps.filter((s) => s.kind === 'ai');
    for (const step of ai) {
      expect(step.prompt, step.id).toBeTruthy();
      for (const query of step.tools?.queries ?? []) expect(granted.has(`query ${query}`), query).toBe(true);
      for (const command of step.tools?.commands ?? []) expect(granted.has(`command ${command}`), command).toBe(true);
    }
    // WHICH steps carry tools is the shape itself, not an accident, so it is named here rather
    // than left to «at least one»: the two that act have them, and `reply_to_customer` has none
    // BECAUSE it only writes prose (whatsapp_inbox#67). Stripping the tools off a step that acts
    // would leave a model asked to book with nothing to book with — and, under the old «every ai
    // step has at least one tool» wording, that failure only surfaced if it stripped the LAST one.
    expect(
      ai.filter((s) => (s.tools?.queries?.length ?? 0) + (s.tools?.commands?.length ?? 0) > 0).map((s) => s.id),
    ).toEqual(['know_the_customer', 'propose_appointment']);
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
/**
 * **The unattended twin** (whatsapp_inbox#58).
 *
 * The digests above already prove this card IS the document the module publishes, byte for byte.
 * What they cannot do is say WHY it is different from its twin — and the difference is one word
 * repeated twice (`auto`), which is exactly the kind of thing a careless re-sync flips back. These
 * name it, so a mirror that quietly becomes a second copy of the attended family goes red here and
 * not only in a hash nobody can read.
 */
describe('WhatsApp → appointment BOOKED, the family that runs with nobody watching (whatsapp_inbox#58)', () => {
  const template = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment-unattended');
  const attended = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment');

  it('is in the gallery at all — which is the whole bug: it was published and unreachable', () => {
    expect(template, 'no `whatsapp-appointment-unattended` template in the catalogue').toBeTruthy();
  });

  it('books inside the turn: BOTH model steps are `auto`, and there is no approval step', () => {
    const steps = buildTemplate(template!, t).steps;
    // The two `query` steps are whatsapp_inbox#103's, and this is the family it was opened
    // against: with nobody reading the model's work before the customer does, a `customers.list`
    // in its hands turned «what has María got booked?» into a stranger's diary sent over WhatsApp.
    // The lookup is the document's now, keyed on the number the message came from.
    // The last two are whatsapp_inbox#101's: the model DECLARES the slots it found and the guard
    // only sends the list when there is something in it.
    expect(steps.map((s) => [s.id, s.kind])).toEqual([
      ['acknowledge', 'notify'],
      ['find_customer', 'query'],
      ['know_the_customer', 'ai'],
      ['resolve_customer', 'query'],
      ['book_appointment', 'ai'],
      ['confirm_to_customer', 'notify'],
      ['any_slot_to_offer', 'condition'],
      ['offer_slots', 'notify'],
    ]);
    // The one word this family is: `manual` parks the write in `_flow_approvals` and ends the turn,
    // which is the tray this salon has nobody to empty. The `query` steps have no policy at all —
    // a deterministic read the document mapped is nobody's proposal to approve.
    expect(steps.map((s) => s.policy)).toEqual([
      undefined,
      undefined,
      'auto',
      undefined,
      'auto',
      undefined,
      undefined,
      undefined,
    ]);
    // And the kernel's explicit pause (hub#950) is not smuggled back in by another name.
    expect(steps.some((s) => s.kind === 'approval')).toBe(false);
  });

  it('tells the customer what they HAVE, in the words of the step that booked it', () => {
    const steps = buildTemplate(template!, t).steps;
    const confirm = steps.find((s) => s.id === 'confirm_to_customer');
    // With no approval in the middle this notify is the customer's ONLY notice that the
    // appointment exists. It has to quote the step that booked — a text of ours would announce a
    // booking that may not have happened.
    expect(confirm?.vars?.text).toBe('{{steps.book_appointment.text}}');
    expect(confirm?.to).toEqual(steps[0].to);
  });

  /**
   * **Thirteen against the twin's fourteen, and the missing one is MOVING** (whatsapp_inbox#74).
   *
   * Running unattended is a reason to skip the tray, never a reason to want more authority — and
   * here it is a reason to want LESS. `appointments.appointments.reschedule` cannot be scoped to
   * the customer who is writing: it takes no `channel` and no `customer_id`, and its handler
   * checks state, notice, hours, blocks and overlap — never whose appointment it is. The grants
   * this card already holds reach any of them (`customers.list` searches by name,
   * `list_for_customer` takes any `customer_id`), so with `policy: "auto"` the only thing between
   * a customer and a stranger's hour would be a paragraph of prompt (hub#1623: not a control).
   *
   * Asserted as «the twin's set MINUS the move» and not as a literal list, so the day the twin
   * gains a permission this card gains it too — the one asymmetry that is deliberate is named
   * here, and any other one is a red. It goes back to being identical when appointments#142 gives
   * `reschedule` its `channel` + `customer_id` and whatsapp_inbox#103 re-adds the branch.
   */
  it('asks for its attended twin’s permissions MINUS the move it must not have', () => {
    const mine = templateGrants(template!, t).map((g) => `${g.kind} ${g.value}`).sort();
    const theirs = templateGrants(attended!, t).map((g) => `${g.kind} ${g.value}`).sort();
    expect(mine).not.toContain('command appointments.appointments.reschedule');
    expect(theirs).toContain('command appointments.appointments.reschedule');
    expect(mine).toEqual(theirs.filter((g) => g !== 'command appointments.appointments.reschedule'));
    expect(mine).toHaveLength(13);
    expect(theirs).toHaveLength(14);
  });

  it('needs the same five modules, so a hub short of one never sees it', () => {
    expect([...new Set(template!.witnesses.map((w) => w.module))].sort()).toEqual([
      'appointments',
      'customers',
      'services',
      'staff',
      'whatsapp_inbox',
    ]);
  });

  it('offers no tool it has no permission for', () => {
    const granted = new Set(templateGrants(template!, t).map((g) => `${g.kind} ${g.value}`));
    for (const step of buildTemplate(template!, t).steps) {
      if (step.kind !== 'ai') continue;
      expect(step.prompt, step.id).toBeTruthy();
      for (const query of step.tools?.queries ?? []) expect(granted.has(`query ${query}`), query).toBe(true);
      for (const command of step.tools?.commands ?? []) expect(granted.has(`command ${command}`), command).toBe(true);
    }
  });

  it('says on the card itself that nobody reviews it — in English and in Spanish', () => {
    // The gallery is where the owner CHOOSES between the two, and the choice is «does a person say
    // yes first?». A summary that does not answer that makes the two cards look like the same
    // automation twice. Asserted on the meaning, not the prose: each locale must say, in its own
    // words, that it books on its own, and must not promise a review.
    for (const [lang, translate] of [['en', t], ['es', tEs]] as const) {
      const summary = translate(template!.summaryKey!);
      const plain = translate(template!.plainKey!);
      expect(summary, `${lang}: the summary is still the i18n key`).not.toBe(template!.summaryKey);
      const promise = lang === 'en' ? /no review|on its own|nobody/i : /sin revisión|ella sola|nadie/i;
      expect(summary + plain, `${lang}: the card does not say nobody reviews it`).toMatch(promise);
    }
  });

  it('waits on the SAME trigger as its twin — which is why a hub must run one, not both', () => {
    // Not a detail: two enabled flows on one event book every incoming message twice. This is the
    // fact `sharesTriggerWith` below turns into a warning the owner sees BEFORE creating it.
    const mine = buildTemplate(template!, t).triggers[0];
    const theirs = buildTemplate(attended!, t).triggers[0];
    expect(mine.event).toBe(theirs.event);
    expect(mine.filter).toEqual(theirs.filter);
  });
});

describe.each(SOURCES)(
  'the $template mirror against the whatsapp_inbox checkout beside this module (flows#52)',
  (mirror: MirrorSource) => {
    const template = TEMPLATES.find((tpl) => tpl.id === mirror.template);
    const source = sourceCheckout(mirror);
    const where = source
      ? `read from ${source}`
      : 'SKIPPED: no checkout at or past the pin beside this module';

    /**
     * The pinned hashes, checked without needing a neighbour at all — this is what CI runs. The
     * grants test cannot see a prompt reworded, a `max_iters` nudged or a tool moved between
     * steps; this can. A mismatch is a mirror that drifted or a re-sync that forgot the pin.
     */
    it('is, hashed, the very document the module publishes — in English and in Spanish', () => {
      expect(digest(buildTemplate(template!, t)), 'en').toBe(mirror.digest.en);
      expect(digest(buildTemplate(template!, tEs)), 'es').toBe(mirror.digest.es);
    });

    it.skipIf(!source)(`says exactly what the module’s own files say (${where})`, () => {
      const read = (file: string): Record<string, unknown> =>
        JSON.parse(readFileSync(join(source!, file), 'utf8')) as Record<string, unknown>;
      expect(digest(buildTemplate(template!, t)), 'en').toBe(digest(read(mirror.files.en)));
      expect(digest(buildTemplate(template!, tEs)), 'es').toBe(digest(read(mirror.files.es)));
      const published = (read(mirror.files.grants) as { grants: { kind: string; value: string }[] })
        .grants.map((g) => `${g.kind} ${g.value}`)
        .sort();
      expect(
        templateGrants(template!, t)
          .map((g) => `${g.kind} ${g.value}`)
          .sort(),
      ).toEqual(published);
    });
  },
);

/**
 * **The pin has to be a commit of the source's `main` — and twice in one batch it was not.**
 *
 * A mirror PR is written while the source PR is still a branch, so the honest pin at that moment is
 * the branch head. Then `merge-pr.sh` squashes the source: `main` gets a brand-new commit and the
 * branch head is gone (whatsapp_inbox#69 → `89f8d02`, whatsapp_inbox#75 → `ba2f293`). The digests
 * above stay true — the content is the same — but `SOURCE.commit` now names a commit no checkout on
 * `main` will ever contain: the neighbour test above keeps passing while a fleet worktree at the old
 * branch lingers, and quietly degrades to «skipped» the day that worktree is removed. Nothing said
 * «re-pin», and somebody had to remember it — twice.
 *
 * This says it. It reads `origin/main` of the canonical checkout as last fetched (`git fetch` is not
 * something a test does): the pin is in it → fine; the pin is NOT in it but the documents there
 * hash to what this mirror pins → the source LANDED and the pin was squashed away → red, naming the
 * sha to set; neither → the source is not on `main` yet, skipped out loud. Skipped too where there
 * is no canonical checkout (CI, until module-toolkit#211 brings the source repo to the runner).
 */
describe.each(SOURCES)(
  'the $template pin names a commit of whatsapp_inbox main (whatsapp_inbox#61, twice)',
  (mirror: MirrorSource) => {
  const on = sourceMain(mirror.module);
  const git = on?.git ?? ((): string | null => null);
  const main = on?.sha ?? null;
  const pinned =
    main !== null && git('merge-base', '--is-ancestor', mirror.commit, 'refs/remotes/origin/main') !== null;
  const landed =
    main !== null &&
    !pinned &&
    (['en', 'es'] as const).every((lang) => {
      const body = git('show', `refs/remotes/origin/main:${mirror.files[lang]}`);
      return body !== null && digest(JSON.parse(body) as Record<string, unknown>) === mirror.digest[lang];
    });
  const state =
    main === null
      ? 'SKIPPED: no canonical checkout with origin/main beside this module'
      : pinned
        ? `in origin/main as fetched, ${main.slice(0, 7)}`
        : landed
          ? 'the source LANDED and the pin was squashed away'
          : 'SKIPPED: the source is not on main yet';

  it.skipIf(main === null || (!pinned && !landed))(`is a commit of origin/main (${state})`, () => {
    expect(
      pinned,
      `The pin of ${mirror.template}, ${mirror.commit.slice(0, 7)}, is not in whatsapp_inbox ` +
        `origin/main, but the documents there hash to exactly what this mirror pins: the source PR ` +
        `was squash-merged and its branch head is gone. Set its \`commit\` to ${main} — the ` +
        `digests do not change.`,
    ).toBe(true);
  });

  /**
   * **…and it has to be the commit that actually CARRIES these documents.** The test above only
   * asks whether the pin is an ancestor of `main`, and once a commit lands that stays true for
   * ever — so a re-sync that updated the digests and forgot the `commit` kept a green suite while
   * the pin named a commit whose documents were the OLD ones. Measured on whatsapp_inbox#90: with
   * the cards and both digests correct and the pin left at the previous sha, all 74 tests here
   * passed. Nothing else can catch it — the neighbour test reads the checkout's WORKING TREE, not
   * the pinned commit, so it agrees with a pin that is years stale.
   *
   * That matters because the `commit` is the only thing that says WHICH version of the source a
   * reader should diff against when the two drift (whatsapp_inbox#73). A pin that points at the
   * wrong document sends them to compare against something that was never mirrored.
   */
  it.skipIf(main === null || !pinned)(`names the commit those digests were taken from (${state})`, () => {
    for (const lang of ['en', 'es'] as const) {
      const body = git('show', `${mirror.commit}:${mirror.files[lang]}`);
      expect(body, `${mirror.files[lang]} is not in ${mirror.commit.slice(0, 7)}`).not.toBeNull();
      expect(
        digest(JSON.parse(body!) as Record<string, unknown>),
        `${mirror.template} pins ${mirror.commit.slice(0, 7)}, but the ${lang} document AT that ` +
          `commit is not the one these digests describe: the digests were re-taken and the ` +
          `\`commit\` was left behind. Set it to the commit the documents actually come from.`,
      ).toBe(mirror.digest[lang]);
    }
  });

  /**
   * **…and the source must not have MOVED PAST it.** The two tests above both judge the mirror
   * against the commit it names, so once that commit is on `main` they stay green for ever — which
   * is the hole whatsapp_inbox#97 fell through. Its squash (`0f8eb60`) rewrote all four documents,
   * the pin at `c4b5368` was still an ancestor of `main`, and the documents AT `c4b5368` still
   * hashed to what the cards carry, so all 76 tests here passed while the gallery handed out a
   * cancellation `appointments` rejects with `invalid_payload` (flows#64).
   *
   * The neighbour test far above is not that alarm either, twice over: it reads the WORKING TREE of
   * whichever checkout beside this module has the newest HEAD, and the fleet keeps a dozen
   * `whatsapp_inbox-*` worktrees — on flows#64 it picked one whose branch predates the fix and
   * agreed with the stale mirror. This reads `refs/remotes/origin/main`, which is the one place the
   * PUBLISHED document lives, and names both the sha and the digests to set.
   *
   * Only when the pin is already on `main`, and that is the whole point of the condition: a mirror
   * written while its source is still a branch legitimately carries documents `main` has never
   * seen, and that case is the two tests above (`landed` → re-pin; neither → skipped out loud).
   * Skipped where there is no canonical checkout at all (CI, until module-toolkit#211). `git fetch`
   * is not something a test does, so a stale checkout reports what was last fetched — late, never
   * a false red.
   */
  it.skipIf(main === null || !pinned)(`is what whatsapp_inbox publishes TODAY, not a document it has moved past (${state})`, () => {
    const template = TEMPLATES.find((tpl) => tpl.id === mirror.template);
    /** The commit the published document actually comes from — the sha to re-pin to, not the tip. */
    const carrier = (file: string): string =>
      git('log', '-1', '--format=%H', 'refs/remotes/origin/main', '--', file) ?? main!;
    for (const lang of ['en', 'es'] as const) {
      const body = git('show', `refs/remotes/origin/main:${mirror.files[lang]}`);
      expect(body, `${mirror.files[lang]} is not in whatsapp_inbox origin/main`).not.toBeNull();
      const published = digest(JSON.parse(body!) as Record<string, unknown>);
      expect(
        published,
        `${mirror.template}: the ${lang} document whatsapp_inbox publishes on origin/main is NOT ` +
          `the one this card carries. The source moved past the pin (${mirror.commit.slice(0, 7)}) ` +
          `and the gallery is handing out the old automation — re-sync the card and the ${lang} ` +
          `locale file from the source, set \`commit\` to ${carrier(mirror.files[lang])}, and set ` +
          `the ${lang} digest to ${published}.`,
      ).toBe(mirror.digest[lang]);
    }
    // The grants file the same way: it moves on its own (whatsapp_inbox#55 dropped one, #61 added
    // two), and a card that keeps asking for a permission the source has stopped publishing is an
    // automation the hub refuses to create — or, the other way round, one that books without being
    // allowed to.
    const grants = git('show', `refs/remotes/origin/main:${mirror.files.grants}`);
    expect(grants, `${mirror.files.grants} is not in whatsapp_inbox origin/main`).not.toBeNull();
    expect(
      templateGrants(template!, t)
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
      `${mirror.template}: the permissions this card derives are not the ones whatsapp_inbox ` +
        `publishes on origin/main (${carrier(mirror.files.grants).slice(0, 7)}).`,
    ).toEqual(
      (JSON.parse(grants!) as { grants: { kind: string; value: string }[] }).grants
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
    );
  });

  /**
   * **…and the pin has to be the commit that CARRIES the documents, not just any commit that has
   * them** (whatsapp_inbox#102's re-pin).
   *
   * The three tests above are all satisfied by a DESCENDANT of the right commit: `main`'s tip
   * hashes the same documents as the squash that wrote them, so a pin moved to the tip passes
   * every one of them. Measured on the re-pin of whatsapp_inbox#102 — pinned at
   * `0fd8a74` (`chore(release): v2.1.40`, which touches no template) the suite was 77 green.
   *
   * That is not cosmetic. The `commit` has ONE job: say which change of the source this card
   * mirrors, so a reader who finds the two drifting knows what to diff against (whatsapp_inbox#73)
   * — and the release bump the fleet pushes minutes after every merge is the sha most likely to be
   * grabbed by mistake, because it is what the FIRST test names in its remedy (it can only offer
   * the tip it fetched). `git log -1 <file>` is the answer, and this is the test that insists on it.
   *
   * Judged per FILE and satisfied by any of them: the two documents and the grants file move in
   * different commits (the unattended grants last moved in `a44a3f1`, its documents in `0f8eb60`),
   * so demanding one single carrier for all three would be a red the day only one of them changes.
   */
  it.skipIf(main === null || !pinned)(`is the commit that carries them, not a later one (${state})`, () => {
    const carrier = (file: string): string | null =>
      git('log', '-1', '--format=%H', 'refs/remotes/origin/main', '--', file);
    const carriers = [mirror.files.en, mirror.files.es, mirror.files.grants].map(carrier);
    expect(
      carriers,
      `${mirror.template} pins ${mirror.commit.slice(0, 7)}, which is not the commit any of its ` +
        `three files last moved in (${carriers
          .map((c) => (c === null ? '—' : c.slice(0, 7)))
          .join(', ')}). A pin on a later commit — a \`chore(release)\` bump, or the tip the first ` +
        `test names — passes every other check here and stops saying WHICH change it mirrors.`,
    ).toContain(mirror.commit);
  });

  },
);

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

/**
 * **A family the module publishes and nobody mirrors is a family no hub can install**
 * (whatsapp_inbox#58).
 *
 * This gallery is, today, the ONLY door into a hub for an automation a module ships:
 * `erplora pack` leaves `flows/` out of the zip (module-toolkit#209) and the hub reads no
 * `.flow.json` from an installed module (hub#1611). Both open. So a family added to
 * `whatsapp_inbox/flows/` without a card here is written, reviewed, merged, published — and
 * unreachable. It happened with `appointment-from-whatsapp-unattended`: the module PR was green in
 * both repositories, and the salon still could not turn the unattended mode on.
 *
 * Nothing caught it, and that is the point. The tests above pin the ONE family they name, each
 * against its own digests; none of them ever asks the source «is that all of them?». This does:
 * it lists what the neighbour actually publishes and demands a mirror for every one.
 *
 * When either of those two issues closes and a module's flows reach a hub on their own, this test
 * stops being the safety net and becomes a consistency check — still worth keeping, because the
 * gallery is where an owner MEETS an automation, and a family only the installer knows about is
 * one nobody turns on.
 */
describe('every family whatsapp_inbox publishes has a card in this gallery (whatsapp_inbox#58)', () => {
  // Off `origin/main` and not off a neighbouring working tree: PUBLISHED is what this test is
  // about, and a family still on a branch is not published yet. The working-tree version of this
  // read also went quiet — a skip, and a green run — the moment a re-pin outran every local
  // checkout, which is exactly when a new family is most likely to be arriving (flows#64).
  const on = sourceMain(SOURCE.module);
  const where = on
    ? `read from origin/main as fetched, ${on.sha.slice(0, 7)}`
    : 'SKIPPED: no canonical checkout beside this module';

  it.skipIf(!on)(`leaves no published family without a mirror (${where})`, () => {
    const families = (on!.git('ls-tree', '--name-only', 'refs/remotes/origin/main', 'flows/') ?? '')
      .split('\n')
      .map((f) => f.replace('flows/', ''))
      .filter((f) => f.endsWith('.en.flow.json'))
      .sort();
    // The control that stops a green from meaning «the directory was empty»: whatever else is
    // true, the neighbour publishes at least the family this file was written around.
    expect(families, 'no `*.en.flow.json` beside the module — this test proved nothing').toContain(
      SOURCE.files.en.replace('flows/', ''),
    );
    const mirrored = new Set(SOURCES.map((s) => s.files.en.replace('flows/', '')));
    expect(
      families.filter((f) => !mirrored.has(f)),
      'published by whatsapp_inbox and mirrored by no card: an owner cannot install it',
    ).toEqual([]);
  });

  /**
   * **The pin and the card say the same thing about what is mirrored** (flows#98).
   *
   * `mergeTemplates` retires a hand copy by reading `mirrors` off the card in production, and this
   * list of pins is what keeps those copies honest against the source. Two places naming the same
   * pairing is exactly the arrangement this issue is about, so they are checked against each other:
   * a card that loses its `mirrors` stops being retired and quietly comes back as a second copy on
   * every hub that serves the family — with all four pin tests still green.
   */
  it('marks in PRODUCTION the very family each pin mirrors', () => {
    for (const s of SOURCES) {
      const card = TEMPLATES.find((tpl) => tpl.id === s.template);
      // The PAIRING, and only the pairing: `mirrors` also carries the limits staged for the served
      // twin (flows#103), which say nothing about which family is mirrored and have their own two
      // guards. Anything else new in there would still have to pass the type — the field is a
      // closed object literal — so nothing is let through by narrowing the comparison here.
      const pairing = card?.mirrors && { module: card.mirrors.module, family: card.mirrors.family };
      expect(pairing, `${s.template} is pinned to a published family but is not marked as a copy of it`)
        .toEqual({ module: s.module, family: s.files.en.replace('flows/', '').replace('.en.flow.json', '') });
    }
    // And nothing is marked as a copy of something no pin watches: a mirror nobody checks against
    // the source is the drift this catalogue has already shipped twice.
    for (const tpl of TEMPLATES.filter((c) => c.mirrors)) {
      expect(
        SOURCES.find((s) => s.template === tpl.id),
        `${tpl.id} says it mirrors ${tpl.mirrors?.family} and no pin watches that family`,
      ).toBeTruthy();
    }
  });

  it('has a real card behind every pin, and one card per pin', () => {
    // The other half: a pin may not name a card that does not exist, and two pins may not point at
    // the same card — either way the loop above would «cover» a family it never checked.
    for (const s of SOURCES) {
      expect(
        TEMPLATES.find((tpl) => tpl.id === s.template),
        `pin for ${s.files.en} names a card that is not in the catalogue: ${s.template}`,
      ).toBeTruthy();
    }
    const ids = SOURCES.map((s) => s.template);
    expect(new Set(ids).size, 'two pins share one card').toBe(ids.length);
  });
});

/**
 * **Two automations on one event fire twice** (whatsapp_inbox#58).
 *
 * The unattended family and its attended twin wait on the SAME event with the SAME filter, so a
 * hub that runs both books every incoming message twice — two appointments, two WhatsApps, one
 * customer who now has to cancel one of them. Nothing in the kernel prevents it, and nothing
 * should: two flows on one event is a normal thing to want (log every message AND act on it). What
 * was missing is that the owner is never TOLD, and the only warning lived in a README they do not
 * read.
 *
 * So the gallery asks before it creates the second one, which is what Zapier does with a duplicate
 * Zap and what Power Automate does with a duplicate flow — warn, name the one already there, and
 * let the owner decide. Blocking would be wrong: it is their hub.
 *
 * This is the pure half — the decision, with no component and no network around it.
 */
describe('the gallery can see that a card would double up on a trigger (whatsapp_inbox#58)', () => {
  const unattended = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment-unattended')!;
  const attended = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment')!;
  const asFlow = (name: string, template: (typeof TEMPLATES)[number]) => ({
    name,
    definition: buildTemplate(template, t) as unknown as Record<string, unknown>,
  });

  it('names the flow already waiting on that event', () => {
    expect(flowsOnSameTrigger(unattended, t, [asFlow('WhatsApp → appointment proposal', attended)])).toEqual([
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

  it('warns in both directions: the attended card collides with the unattended one too', () => {
    expect(flowsOnSameTrigger(attended, t, [asFlow('WhatsApp → cita reservada', unattended)])).toEqual([
      'WhatsApp → cita reservada',
    ]);
  });

  it('sees a flow the owner has since edited, as long as the event is the same', () => {
    // The match is the EVENT, not the document: an owner who renamed the flow and reworded a
    // prompt still has an automation that fires on every message. Comparing documents would miss
    // exactly the flow that has been in production longest.
    const edited = {
      name: 'My WhatsApp thing',
      definition: { schema_version: 1, triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }], steps: [] },
    };
    expect(flowsOnSameTrigger(unattended, t, [edited])).toEqual(['My WhatsApp thing']);
  });

  it('does not name a flow that is PAUSED — a flow that is off does not fire', () => {
    // The warning is about double-firing, and a paused twin books nothing. The real switch-over is
    // exactly this: the salon turns the attended flow off to move to the unattended one, and a
    // warning that keeps naming it tells them to do what they have just done — the warning that
    // teaches an owner to click through warnings. A flow handed back WITHOUT `enabled` still counts:
    // not knowing is not the same as knowing it is off.
    const twin = asFlow('WhatsApp → appointment proposal', attended);
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

// ── The limit travels with the card (flows#80) ────────────────────────────────────────────────

describe('a card installs the permission it PROMISED, not the wide one next to it', () => {
  const grantFor = (id: string, command: string) => {
    const template = templateById(id);
    return templateGrants(template!, t).find((g) => g.kind === 'command' && g.value === command);
  };

  it('carries a card’s declared limit onto the permission it derives', () => {
    const grant = grantFor('whatsapp-appointment-unattended', 'appointments.appointments.cancel');
    expect(grant, 'the card asks to cancel appointments').toBeTruthy();
    expect(grantPin(grant!)).toEqual({ channel: 'customer' });
  });

  // 🔴 THE assertion this issue exists for, and it is about the call the recipe must NOT be able
  // to make. Asserting only that its own call gets through would pass just as well with no limit
  // at all — which is the state flows#80 reported.
  it('refuses a cancellation asked for on the salon’s behalf', () => {
    const grant = grantFor('whatsapp-appointment-unattended', 'appointments.appointments.cancel')!;
    // What the recipe is for: the customer who wrote in, cancelling her own hour.
    expect(grantAllowsCall(grant, { appointment_id: 'a1', channel: 'customer' })).toBe(true);
    // What a stranger's message must never talk the model into.
    expect(grantAllowsCall(grant, { appointment_id: 'a1', channel: 'staff' })).toBe(false);
    // And the same refusal by omission — `channel` defaults to `staff` in the command's schema.
    expect(grantAllowsCall(grant, { appointment_id: 'a1' })).toBe(false);
  });

  /**
   * **The attended twin, and the SAME two limits** (flows#99, whatsapp_inbox#107).
   *
   * The tray is not a permission boundary. What waits there is a draft written FOR THE CUSTOMER —
   * «I have cancelled your Thursday, see you next week» — and not the detail of the call underneath
   * it, so the person approving reads a sentence and authorises an operation they were never shown.
   * A cancellation on the salon's behalf skips the ownership check, the notice period and
   * `allow_customer_cancellation`; a move on the salon's behalf skips the ownership check too. Both
   * are one `channel` away, and `channel` DEFAULTS to `staff` in either command's schema.
   *
   * Pinned here and not only in the module: while hub#1654 is open the sidecar's `payload` never
   * leaves the hub, and this copy is what the gallery installs — either as the card itself, or
   * through `withCopiedPins` onto the served twin.
   */
  const ATTENDED_PINNED: [string, Record<string, unknown>][] = [
    ['appointments.appointments.cancel', { appointment_id: 'a1' }],
    ['appointments.appointments.reschedule', { appointment_id: 'a1', start_datetime: '2026-09-10T10:00:00Z' }],
  ];

  it.each(ATTENDED_PINNED)('carries the customer limit onto %s', (command) => {
    const grant = grantFor('whatsapp-appointment', command);
    expect(grant, `the attended card asks for ${command}`).toBeTruthy();
    expect(grantPin(grant!)).toEqual({ channel: 'customer' });
  });

  // 🔴 The half that proves the limit is a CONTAINMENT and not decoration: asserting only that the
  // recipe's own call gets through passes just as well with no pin at all.
  it.each(ATTENDED_PINNED)('refuses %s asked for on the salon’s behalf', (command, call) => {
    const grant = grantFor('whatsapp-appointment', command)!;
    expect(grantAllowsCall(grant, { ...call, channel: 'customer', customer_id: 'c1' })).toBe(true);
    expect(grantAllowsCall(grant, { ...call, channel: 'staff' })).toBe(false);
    // The same refusal by omission — which is the shape a model actually sends when nothing asked
    // it for a channel, and the reason a `default: "staff"` schema needs the pin to hold.
    expect(grantAllowsCall(grant, call)).toBe(false);
  });

  it('narrows nothing else on the attended card', () => {
    const pinned = templateGrants(templateById('whatsapp-appointment')!, t)
      .filter((g) => Object.keys(grantPin(g)).length > 0)
      .map((g) => `${g.kind} ${g.value}`);
    expect(pinned).toEqual(ATTENDED_PINNED.map(([command]) => `command ${command}`));
  });

  // The other side of the same coin: nothing else on the card silently narrows. A pin that spread
  // would break the recipe rather than contain it.
  it('leaves every other permission of that card exactly as wide as it was', () => {
    const pinned = templateGrants(templateById('whatsapp-appointment-unattended')!, t).filter(
      (g) => Object.keys(grantPin(g)).length > 0,
    );
    expect(pinned.map((g) => `${g.kind} ${g.value}`)).toEqual([
      'command appointments.appointments.cancel',
    ]);
  });

  // A universal rule for the catalogue, not a check on one card: a pin naming a command the card
  // never runs would sit in the source reading like a containment and fix NOTHING, because there
  // is no grant for it to land on.
  it('never declares a limit for a command its own document does not run', () => {
    for (const template of TEMPLATES) {
      const derived = new Set(
        templateGrants(template, t)
          .filter((g) => g.kind === 'command')
          .map((g) => g.value),
      );
      for (const command of Object.keys(template.grantPins ?? {})) {
        expect(derived, `${template.id} pins \`${command}\`, which it never runs`).toContain(
          command,
        );
      }
    }
  });

  // The other half of the rule above, and the reason there are two fields (flows#103). A limit
  // STAGED for the served twin is one this copy cannot apply to itself; the day the copy grows the
  // operation, the entry has to move to `grantPins` — where the rule above starts watching it —
  // rather than sit here leaving the copy's own permission wide.
  it('stages for the twin only the limits its own document cannot carry', () => {
    for (const template of TEMPLATES) {
      const derived = new Set(
        templateGrants(template, t)
          .filter((g) => g.kind === 'command')
          .map((g) => g.value),
      );
      for (const command of Object.keys(template.mirrors?.pins ?? {})) {
        expect(
          derived,
          `${template.id} stages \`${command}\` for its twin, but its own document runs it — ` +
            'that limit belongs in `grantPins`',
        ).not.toContain(command);
      }
    }
  });

  // Both halves at once, anchored from the fields rather than from the documents: one limit, one
  // home. Written twice, an edit to either copy is a containment that silently disagrees with
  // itself — and `carriedPins` would apply whichever the spread happened to put last.
  it('never says the same limit in both places', () => {
    for (const template of TEMPLATES) {
      const own = Object.keys(template.grantPins ?? {});
      const staged = Object.keys(template.mirrors?.pins ?? {});
      expect(own.filter((command) => staged.includes(command)), template.id).toEqual([]);
      // …and everything the merge applies comes from exactly those two.
      expect(Object.keys(carriedPins(template)).sort()).toEqual([...own, ...staged].sort());
    }
  });

  // The hub refuses a pin on any kind but `command` (`flow.invalid_grant_payload`), and `PUT
  // …/grants` is all-or-nothing: one bad row does not fail that row, it loses the whole screen's
  // worth of permissions.
  it('never declares a limit the hub would refuse the whole screen for', () => {
    for (const template of TEMPLATES) {
      for (const grant of templateGrants(template, t)) {
        if (Object.keys(grantPin(grant)).length) expect(grant.kind).toBe('command');
      }
    }
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

  /** A hub whose flow schema declares exactly these step keys. */
  const hubDeclaring = (...keys: string[]) =>
    schemaFacts({
      $defs: { step: { properties: Object.fromEntries(keys.map((k) => [k, { type: 'object' }])) } },
    });

  const beautyOn = (facts?: SchemaFacts): string[] =>
    availableTemplates('beauty', everything, facts).map((tpl) => tpl.id);

  it('offers it on a hub that declares both keys', () => {
    expect(beautyOn(hubDeclaring('interactive', 'output'))).toContain(
      'whatsapp-appointment-unattended',
    );
  });

  it('hides it on a hub that declares neither, which is every hub on v1.1.15', () => {
    expect(beautyOn(hubDeclaring())).not.toContain('whatsapp-appointment-unattended');
  });

  it('hides it on a hub that declares only half of what the document carries', () => {
    // A build between the two kernel merges. Fail-closed means BOTH or nothing.
    expect(beautyOn(hubDeclaring('interactive'))).not.toContain('whatsapp-appointment-unattended');
    expect(beautyOn(hubDeclaring('output'))).not.toContain('whatsapp-appointment-unattended');
  });

  it('hides it while the hub has not answered yet: this probe is fail-closed', () => {
    // The opposite of the module probe, and on purpose: an unanswered module probe costs a card
    // that appears a second late; an unanswered kernel probe would cost an automation that
    // installs and then refuses to parse.
    expect(beautyOn()).not.toContain('whatsapp-appointment-unattended');
  });

  it('keeps offering every OTHER card of the sector on that same old hub', () => {
    const shown = beautyOn(hubDeclaring());
    const others = templatesOf('beauty')
      .map((tpl) => tpl.id)
      .filter((id) => id !== 'whatsapp-appointment-unattended');
    expect(shown.sort()).toEqual(others.sort());
    expect(shown.length).toBeGreaterThan(0);
  });
});
