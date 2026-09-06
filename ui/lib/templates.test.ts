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
  flowsOnSameTrigger,
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
    // whatsapp_inbox PR #75 (#61), squash-merged as `ba2f293`: the proposing step decides FIRST
    // what the message is asking for and can now CANCEL as well as book — two tools and two grants
    // more. Before it, PR #69 (first half of #58) added `confirm_to_customer`, and PR #63 (#55)
    // made the two model steps one.
    commit: 'ba2f293e9b16aeff3c329f54e01764398e17a602',
    files: {
      en: 'flows/appointment-from-whatsapp.en.flow.json',
      es: 'flows/appointment-from-whatsapp.es.flow.json',
      grants: 'flows/appointment-from-whatsapp.grants.json',
    },
    digest: {
      en: 'aaf15be0a201432c680ca7a21de4971219dc5ea5909b49558ca182388943748e',
      es: '96289feba45cd0c323db1722d13b27d7454efa478006ae724a63453631e08aa6',
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
    commit: 'a44a3f18923d6654a59feaec7b856f63b64a742b',
    files: {
      en: 'flows/appointment-from-whatsapp-unattended.en.flow.json',
      es: 'flows/appointment-from-whatsapp-unattended.es.flow.json',
      grants: 'flows/appointment-from-whatsapp-unattended.grants.json',
    },
    digest: {
      en: '260623dea8602894db61df1124b28bf30f9c8ecafbfb2c07d1269a7980c9cf04',
      es: '06b9deb64378e9dfed91588a29351b8a3d07bed0173e562d789379675ce3c76e',
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

  it('acknowledges, knows the customer, finds the slot AND proposes in ONE turn, then tells them', () => {
    const steps = buildTemplate(template!, t).steps;
    // «Find what is free» and «propose» are ONE model step: they used to be two (a step that only
    // asked, `auto`, and one that wrote from its report), the workaround for a hub that refused a
    // read inside a `manual` step — hub#1595 made the read legal and whatsapp_inbox#55 collapsed
    // them. The fourth step is whatsapp_inbox#58's first half: once the booking goes through, the
    // customer hears about it, on WhatsApp, in the words the model wrote for them.
    expect(steps.map((s) => [s.id, s.kind])).toEqual([
      ['acknowledge', 'notify'],
      ['know_the_customer', 'ai'],
      ['propose_appointment', 'ai'],
      ['confirm_to_customer', 'notify'],
    ]);
    // Both model steps WRITE (a customer card, a booking), so both wait for a person.
    expect(steps.map((s) => s.policy)).toEqual([undefined, 'manual', 'manual', undefined]);
  });

  it('confirms to the customer with the proposing step’s own words, through the same conversation', () => {
    const steps = buildTemplate(template!, t).steps;
    const confirm = steps.find((s) => s.id === 'confirm_to_customer');
    // The text is the model's reply from the step that booked — which is why that step's prompt
    // ends with «everything you write back is sent to them, word for word». Not a template of ours,
    // not a second model call: the salon pays for one WhatsApp, and the customer reads what the
    // assistant decided, after a person approved it.
    expect(confirm?.vars?.text).toBe('{{steps.propose_appointment.text}}');
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
   * Thirteen: eleven, plus the two whatsapp_inbox#61 needs to CANCEL — reading what a customer
   * already has, and cancelling it. (It was twelve before whatsapp_inbox#55 dropped
   * `appointments.appointments.conflicting`: `availability.check` already refuses an overlap with
   * the booking gate's own authority, and the reads it does on the way run as the SYSTEM
   * (`preload_reads`), which no grant governs.)
   */
  it('asks for the thirteen permissions the module’s own grants file lists, and no fourteenth', () => {
    expect(
      templateGrants(template!, t)
        .map((g) => `${g.kind} ${g.value}`)
        .sort(),
    ).toEqual(
      [
        'command appointments.appointments.cancel',
        'command appointments.appointments.create',
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
    expect(steps.map((s) => [s.id, s.kind])).toEqual([
      ['acknowledge', 'notify'],
      ['know_the_customer', 'ai'],
      ['book_appointment', 'ai'],
      ['confirm_to_customer', 'notify'],
    ]);
    // The one word this family is: `manual` parks the write in `_flow_approvals` and ends the turn,
    // which is the tray this salon has nobody to empty.
    expect(steps.map((s) => s.policy)).toEqual([undefined, 'auto', 'auto', undefined]);
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

  it('asks for the same thirteen permissions as its attended twin, and not one more', () => {
    // Running unattended is a reason to skip the tray, never a reason to want more authority.
    const mine = templateGrants(template!, t).map((g) => `${g.kind} ${g.value}`).sort();
    const theirs = templateGrants(attended!, t).map((g) => `${g.kind} ${g.value}`).sort();
    expect(mine).toEqual(theirs);
    expect(mine).toHaveLength(13);
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
      const summary = translate(template!.summaryKey);
      const plain = translate(template!.plainKey);
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
  const canonical = join(resolve(__dirname, '../../..'), mirror.module);
  const git = (...args: string[]): string | null => {
    try {
      return execFileSync('git', ['-C', canonical, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  };
  const main = existsSync(join(canonical, 'module.json'))
    ? git('rev-parse', 'refs/remotes/origin/main')
    : null;
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
  const source = sourceCheckout();
  const where = source ? `read from ${source}` : 'SKIPPED: no checkout at or past the pin beside this module';

  it.skipIf(!source)(`leaves no published family without a mirror (${where})`, () => {
    const families = readdirSync(join(source!, 'flows'))
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
