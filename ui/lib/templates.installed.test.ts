import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  templateById,
  buildTemplate,
  templateInstallation,
  templateCommands,
  templateGrants,
} from './templates';
import { moduleTemplates } from './module-templates';
import { dailyCron } from './plain-language';
import type { FlowDoc } from './flow-doc';
import en from '../../locales/en.json';

/** The translator, reduced to the lookup a document needs. */
const t = (key: string): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return typeof cur === 'string' ? cur : key;
};

const tpl = (id: string) => templateById(id)!;

/**
 * **A card as an installed app serves it** (flows#101).
 *
 * The two cases at the bottom of this file need a card that DOES several things and that asks for
 * more than it does. That used to be the `whatsapp-appointment` hand copy; it is gone, and the
 * recipe it copied is served by `whatsapp_inbox` itself. The grants below are the ones that
 * module publishes in `flows/appointment-from-whatsapp.grants.json`, trimmed to the four KINDS
 * that make the point — a card is identified by what it can DO, never by what it may read.
 */
const servedCard = () =>
  moduleTemplates(
    [
      {
        module: 'whatsapp_inbox',
        family: 'appointment-from-whatsapp',
        documents: {
          en: {
            schema_version: 1,
            name: 'WhatsApp → appointment',
            triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
            steps: [
              { id: 'find', kind: 'command', command: 'customers.create', params: {} },
              { id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} },
            ],
          },
        },
        grants: [
          { kind: 'notify', value: 'whatsapp' },
          { kind: 'recipient_query', value: 'whatsapp_inbox.conversations.list#contact_phone' },
          { kind: 'query', value: 'customers.list' },
          { kind: 'command', value: 'customers.create' },
          { kind: 'command', value: 'appointments.appointments.create' },
        ],
      },
    ],
    'en',
  )[0];

/**
 * A flow as the hub hands it back, built from a template's own document.
 *
 * `enabled: 'absent'` builds the row an OLDER hub sends: no `enabled` key at all. That is a third
 * thing, distinct from `true` and from `false`, and it has to be buildable here — a helper that
 * collapses it to `true` makes the case unreachable and leaves «treat a missing field as off»
 * untested, which is the shape of bug that would silently unbadge the whole fleet on the floor.
 */
const flowOf = (
  id: string,
  over: { id?: string; name?: string; enabled?: boolean | 'absent'; commands?: readonly string[] } = {},
) => {
  const enabled = over.enabled ?? true;
  return {
    id: over.id ?? 'f1',
    name: over.name ?? `${id} flow`,
    ...(enabled === 'absent' ? {} : { enabled }),
    definition: buildTemplate(tpl(id), t) as unknown as Record<string, unknown>,
    commands: over.commands,
  };
};

/**
 * A flow of this hub that comes round on a schedule, with the cron and the permissions given.
 *
 * Built by hand rather than from a card, because the whole point of the calendar half of this is
 * the flow whose cron the owner has since changed: a helper that could only produce the card's own
 * `0 18 * * 5` would make the case this issue exists for unreachable.
 */
const scheduledFlow = (
  cron: string,
  commands: readonly string[],
  id = 'f1',
  enabled = true,
): {
  id: string;
  name: string;
  enabled: boolean;
  definition: Record<string, unknown>;
  commands: readonly string[];
} => ({
  id,
  name: 'A weekly look at the numbers',
  enabled,
  definition: {
    ...(buildTemplate(tpl('friday-week-review'), t) as unknown as Record<string, unknown>),
    triggers: [{ kind: 'cron', cron }],
  },
  commands,
});

/**
 * The Friday review **as the editor leaves it after one touch of the time box**.
 *
 * The card's blank invites «The day and the time», and the only control the editor has for a cron
 * is an `<input type="time">`: `readDailyCron('0 18 * * 5')` is `null`, so the box is drawn EMPTY,
 * and its `@change` writes `dailyCron(value)`, which is always `M H * * *`. The weekly schedule is
 * flattened to a daily one the first time she touches it — silently, and whether or not this
 * gallery exists.
 *
 * Written with the editor's own `dailyCron` on purpose: this stays a faithful fixture even if the
 * time box is one day taught to keep the weekday.
 */
const flattenedWeekReview = (over: Record<string, unknown> = {}) => ({
  id: 'f5',
  name: 'Friday evening, look at the week',
  enabled: true,
  definition: {
    ...(buildTemplate(tpl('friday-week-review'), t) as unknown as Record<string, unknown>),
    triggers: [{ kind: 'cron', cron: dailyCron('18:00') }],
  },
  commands: ['tasks.tasks.create'],
  ...over,
});

/** The morning diary check, exactly as its own card builds it. */
const morningCheck = (over: Record<string, unknown> = {}) => ({
  id: 'f6',
  name: 'Every morning, go through tomorrow’s diary',
  enabled: true,
  definition: buildTemplate(tpl('morning-agenda-check'), t) as unknown as Record<string, unknown>,
  commands: ['tasks.tasks.create'],
  ...over,
});

/** A document the kernel runs on demand — no event, no schedule. */
const manualFlowDoc: FlowDoc = {
  ...buildTemplate(tpl('friday-week-review'), t),
  triggers: [{ kind: 'manual' }],
};
/** The same object as it reaches `Flow.definition`, which crossed a wire and is a bag of unknowns. */
const manualDoc = manualFlowDoc as unknown as Record<string, unknown>;

/**
 * **«Do I already have this one?», asked of the hub's own flows** (flows#60).
 *
 * The same predicate `queries/automations_status.sql` answers for a module that cannot hold
 * `manage_flows`, computed here from the list this gallery already loads — because the gallery
 * needs the FLOW, not three counters: its whole point is to hand the owner the automation they
 * already have instead of creating a second one.
 */
describe('a template this hub already runs', () => {
  it('is «active» when a flow listens on its event and holds one of its commands', () => {
    const template = tpl('no-show-followup');
    const flow = flowOf('no-show-followup', { commands: ['tasks.tasks.create'] });
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'active', flow });
  });

  it('is «paused» when the only one it has is switched off', () => {
    const template = tpl('no-show-followup');
    const flow = flowOf('no-show-followup', { enabled: false, commands: ['tasks.tasks.create'] });
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'paused', flow });
  });

  it('prefers the running one when the hub has both', () => {
    const template = tpl('no-show-followup');
    const off = flowOf('no-show-followup', { id: 'f-off', enabled: false, commands: ['tasks.tasks.create'] });
    const on = flowOf('no-show-followup', { id: 'f-on', enabled: true, commands: ['tasks.tasks.create'] });
    // The owner is being sent to «the automation that answers this», and the one that answers is
    // the one that is on. Handing them the paused copy reads as «it is off» about a hub that is
    // acting on every no-show.
    expect(templateInstallation(template, t, [off, on]).flow).toBe(on);
  });

  it('still recognises the one an older hub sends with no «enabled» key at all', () => {
    // The floor, and the reason the predicate is `!== false` and not `=== true`. A hub that
    // predates the field sends the row WITHOUT it, and a missing field read as «off» is exactly how
    // wi#90 nearly switched an automation off across every hub on v1.1.15: exclude what you KNOW is
    // off, never demand proof of being on.
    const template = tpl('no-show-followup');
    const flow = flowOf('no-show-followup', { enabled: 'absent', commands: ['tasks.tasks.create'] });
    expect('enabled' in flow, 'the helper must build a row WITHOUT the key, not one holding undefined').toBe(false);
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'active', flow });
  });

  it('is «unfinished» when it was created and never granted anything', () => {
    // What the gallery itself leaves behind: every template is born paused and with no grants, and
    // the owner is handed to Permissions. Somebody who stops there has a flow that listens and can
    // do nothing — calling that absent would put the invitation back and buy the duplicate.
    const template = tpl('no-show-followup');
    const flow = flowOf('no-show-followup', { enabled: false, commands: [] });
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'unfinished', flow });
  });

  it('is «absent» when nothing listens on its event', () => {
    // The control: with the rule wired to «does this hub have any flow at all» this passes green
    // while claiming everything is installed, so the hub HAS a flow — just not on this event.
    const template = tpl('no-show-followup');
    const other = flowOf('welcome-new-customer', { commands: ['tasks.tasks.create'] });
    expect(templateInstallation(template, t, [other])).toEqual({ state: 'absent' });
  });

  it('is «absent» when the flow on that event does somebody else’s work', () => {
    // A flow listening on the same event with a command of its own is a different automation the
    // business wrote, finished and running. Reporting it as ours would badge a card whose
    // automation was never created — and would hide the invitation the owner still needs.
    const template = tpl('no-show-followup');
    const mine = flowOf('no-show-followup', { commands: ['inventory.stock.adjust'] });
    expect(templateInstallation(template, t, [mine])).toEqual({ state: 'absent' });
  });

  it('does not read a flow whose grants the hub has not answered for as unfinished', () => {
    // «Not asked yet» is not «holds nothing», exactly as `known[event] === undefined` is not a
    // refusal for the probe. Treating silence as unfinished would badge every card of a hub whose
    // grants endpoint is slow, and then unbadge them one round trip later.
    const template = tpl('no-show-followup');
    const flow = flowOf('no-show-followup', { commands: undefined });
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'absent' });
  });

  it('recognises a card that runs on a schedule, not on an event', () => {
    // The two calendar cards used to answer `absent` for ever, so the owner who set the Friday
    // review up three weeks ago came back, saw the same invitation, and ended up with two reviews
    // landing every Friday (flows#68).
    const template = tpl('friday-week-review');
    const flow = flowOf('friday-week-review', { commands: ['tasks.tasks.create'] });
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'active', flow });
  });

  it('still recognises it after the owner moves it to another day and another hour', () => {
    // «The day and the time» is what this card's blank INVITES her to change
    // (`tpl.weekReview.blankWhen`), so an identity that pinned either one would drop the badge for
    // precisely the owner who made the card her own — and hand her the duplicate back.
    const template = tpl('friday-week-review');
    const flow = scheduledFlow('30 20 * * 1', ['tasks.tasks.create']);
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'active', flow });
  });

  it('is «unfinished» when the scheduled flow was left with no permission at all', () => {
    // Same third state as an event card: the gallery creates every template paused and with no
    // grants, so somebody who stops on the way to Permissions has a flow that comes round on time
    // and can do nothing.
    const flow = scheduledFlow('0 18 * * 5', []);
    expect(templateInstallation(tpl('friday-week-review'), t, [flow])).toEqual({
      state: 'unfinished',
      flow,
    });
  });

  it('is «paused» when the only scheduled one it has is switched off', () => {
    const flow = scheduledFlow('0 18 * * 5', ['tasks.tasks.create'], 'f1', false);
    expect(templateInstallation(tpl('friday-week-review'), t, [flow])).toEqual({
      state: 'paused',
      flow,
    });
  });

  it('says nothing when the hub hands back a schedule it cannot read', () => {
    // A cron this gallery does not understand is not a match and must never be guessed into one:
    // silence leaves the card exactly as it was, a wrong badge sends the owner to somebody else's
    // automation.
    for (const cron of ['', '0 18 * * 5 7', 'every friday', '@weekly', 'a b * * 5']) {
      const flow = scheduledFlow(cron, ['tasks.tasks.create']);
      expect(templateInstallation(tpl('friday-week-review'), t, [flow]), cron).toEqual({
        state: 'absent',
      });
    }
  });

  it('knows its card whatever the schedule has become, as long as the task is still the card’s', () => {
    // The positive side of the same decision: the schedule is the coarse filter, not the identity,
    // so moving the review to the 15th of the month is still the review. It is the seeded task that
    // says which card this is — and it goes on saying it after any edit the time box can make.
    for (const cron of ['0 18 15 * *', '0 18 * 6 5', '30 20 * * 1', '0 9 * * *']) {
      const flow = scheduledFlow(cron, ['tasks.tasks.create']);
      expect(templateInstallation(tpl('friday-week-review'), t, [flow]), cron).toEqual({
        state: 'active',
        flow,
      });
      expect(templateInstallation(tpl('morning-agenda-check'), t, [flow]), `${cron} → morning`)
        .toEqual({ state: 'absent' });
    }
  });

  it('lets go of a card whose seeded task the owner rewrote herself', () => {
    // The cost of keying on what the card seeded, stated as a test so nobody is surprised by it:
    // an owner who rewrites the task loses the badge and is offered the card again. Silence and the
    // invitation she had before — never a badge pointing at somebody else's automation.
    const flow = scheduledFlow('0 18 * * 5', ['tasks.tasks.create']);
    (flow.definition.steps as { params: Record<string, unknown> }[])[0].params.title = 'My own thing';
    expect(templateInstallation(tpl('friday-week-review'), t, [flow])).toEqual({ state: 'absent' });
  });

  it('still knows its own card after the editor flattens the schedule to daily', () => {
    // 🔴 REGRESIÓN. The first version of this recognised a calendar card by its CADENCE, and the
    // editor destroys exactly that: one touch of the time box turns «every Friday at 18:00» into
    // «every day at 18:00». The card went back to `absent` and the gallery re-offered «Use this
    // one» — the duplicate flows#68 exists to prevent, handed back to the one owner who made the
    // card her own.
    const flow = flattenedWeekReview();
    expect(templateInstallation(tpl('friday-week-review'), t, [flow])).toEqual({
      state: 'active',
      flow,
    });
  });

  it('does not let a flattened week review answer for the morning diary card', () => {
    // 🔴 REGRESIÓN, the other half of the same defect: once flattened, the Friday review comes
    // round daily and creates a task, which is everything the morning card used to be recognised
    // by. It badged the morning card «Active» and «View it» opened somebody else's automation.
    expect(templateInstallation(tpl('morning-agenda-check'), t, [flattenedWeekReview()])).toEqual({
      state: 'absent',
    });
    // …and not the other way round either.
    expect(templateInstallation(tpl('friday-week-review'), t, [morningCheck()])).toEqual({
      state: 'absent',
    });
  });

  it('tells the two calendar cards apart when the hub runs both', () => {
    const flows = [flattenedWeekReview(), morningCheck()];
    expect(templateInstallation(tpl('friday-week-review'), t, flows).flow?.id).toBe('f5');
    expect(templateInstallation(tpl('morning-agenda-check'), t, flows).flow?.id).toBe('f6');
  });

  it('does not take a step that carries the card’s values into a different command', () => {
    // The values are what tells two cards apart; the command is what says this is the same KIND of
    // automation at all. A flow that writes the review's words through some other command is not
    // the review, however much of its text it happens to repeat.
    const flow = scheduledFlow('0 18 * * 5', ['tasks.tasks.create']);
    (flow.definition.steps as { command: string }[])[0].command = 'notes.notes.create';
    expect(templateInstallation(tpl('friday-week-review'), t, [flow])).toEqual({ state: 'absent' });
  });

  it('recognises nothing at all from a scheduled card that seeds no command', () => {
    // «Every seeded step is there» is vacuously true of a card that seeds none, which would make
    // every scheduled flow in the hub a candidate. Two things stop that, and the second is why the
    // explicit guard in `carriesSeededSteps` cannot be observed on its own: a card that seeds no
    // command step also DECLARES no command, because grants are read off the built document — so
    // the command half answers `absent` no matter what the candidate half said.
    const template = {
      ...tpl('friday-week-review'),
      build: (tr: (k: string) => string) => ({
        ...buildTemplate(tpl('friday-week-review'), tr),
        steps: [],
      }),
    };
    const flow = scheduledFlow('0 18 * * 5', ['tasks.tasks.create']);
    expect(templateCommands(template, t), 'a card with no steps declares no command').toEqual([]);
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'absent' });
  });

  it('compares a seeded value that is not a plain string by what it holds', () => {
    // Today every card seeds strings, so identity would compare them fine. The day one seeds a
    // structure — recipients, variables — comparing the objects themselves would never match and
    // that card could never be recognised.
    const withObject = (params: Record<string, unknown>) => ({
      ...tpl('friday-week-review'),
      build: (tr: (k: string) => string) => ({
        ...buildTemplate(tpl('friday-week-review'), tr),
        steps: [{ id: 's1', kind: 'command' as const, command: 'tasks.tasks.create', params }],
      }),
    });
    const template = withObject({ vars: { who: 'owner', when: ['fri'] } });
    const flow = {
      id: 'f8',
      name: 'Weekly',
      enabled: true,
      definition: buildTemplate(withObject({ vars: { who: 'owner', when: ['fri'] } }), t) as unknown as Record<string, unknown>,
      commands: ['tasks.tasks.create'],
    };
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'active', flow });

    const other = {
      ...flow,
      definition: buildTemplate(withObject({ vars: { who: 'owner', when: ['mon'] } }), t) as unknown as Record<string, unknown>,
    };
    expect(templateInstallation(template, t, [other])).toEqual({ state: 'absent' });
  });

  it('does not answer for a card whose trigger is neither an event nor a schedule', () => {
    // `manual` and `at` are trigger kinds the kernel runs and this catalogue does not use. Nothing
    // recognises them, and `absent` stays the honest answer until something does.
    const template = { ...tpl('friday-week-review'), build: () => manualFlowDoc };
    const flow = { id: 'f1', name: 'By hand', enabled: true, definition: manualDoc, commands: ['tasks.tasks.create'] };
    expect(templateInstallation(template, t, [flow])).toEqual({ state: 'absent' });
  });

  it('reads the commands off the document, so every card can be asked about', () => {
    // `templateCommands` is what decides which flows are even candidates. A template whose
    // commands came back empty would match nothing and could never be badged, so this pins that
    // every card in the catalogue with an event trigger has something to be recognised by.
    for (const template of TEMPLATES) {
      const commands = templateCommands(template, t);
      expect(commands.every((c) => typeof c === 'string' && c.length > 0), template.id).toBe(true);
    }
    expect(templateCommands(tpl('no-show-followup'), t)).toEqual(['tasks.tasks.create']);
    // The two WhatsApp appointment families are the reason this is a SET and not one name: they
    // ask for the same thirteen. They are served by the app now (flows#101), and a SERVED card has
    // to be readable by exactly the same door — it is the one this gallery mostly shows.
    expect(templateCommands(servedCard(), t).length).toBeGreaterThan(1);
  });

  it('does not take what a card may READ for something it can DO', () => {
    // The WhatsApp cards ask for four kinds of grant — `notify`, `recipient_query`, `query` and
    // `command`. Only the last is what the automation DOES, and only the last identifies it: a hub
    // whose flow merely holds the appointment LOOKUP has not built this automation.
    const template = servedCard();
    const grants = templateGrants(template, t);
    const reads = grants.filter((grant) => grant.kind !== 'command').map((grant) => grant.value);
    expect(reads.length, 'this card must carry non-command grants or the case proves nothing').toBeGreaterThan(0);

    const commands = templateCommands(template, t);
    expect(commands.filter((value) => reads.includes(value))).toEqual([]);
    expect(commands.length).toBeLessThan(grants.length);
  });
});
