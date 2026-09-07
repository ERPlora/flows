import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  templateById,
  buildTemplate,
  templateInstallation,
  templateCommands,
  templateGrants,
} from './templates';
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

/** A document the kernel runs on demand — no event, no schedule. */
const manualDoc = {
  ...(buildTemplate(tpl('friday-week-review'), t) as unknown as Record<string, unknown>),
  triggers: [{ kind: 'manual' }],
};

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

  it('does not let one calendar card answer for the other', () => {
    // Both create a task, so what is done cannot tell them apart: the weekly review comes round
    // every Friday and the diary check every morning. Badging the morning card because the hub
    // runs the Friday one is the wrong badge this issue is not allowed to buy.
    const weekly = scheduledFlow('0 18 * * 5', ['tasks.tasks.create']);
    expect(templateInstallation(tpl('morning-agenda-check'), t, [weekly])).toEqual({
      state: 'absent',
    });
    const daily = scheduledFlow('0 9 * * *', ['tasks.tasks.create'], 'f2');
    expect(templateInstallation(tpl('friday-week-review'), t, [daily])).toEqual({
      state: 'absent',
    });
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

  it('does not read a schedule that comes round less often than the card', () => {
    // `0 18 15 * *` is the 15th of the month and `0 18 * 6 5` the Fridays of June. Neither comes
    // round every week, so neither is the weekly review nor the morning check — reading only the
    // clock fields would flatten all three into one and badge a card off an automation that runs
    // eleven times a year.
    const monthly = scheduledFlow('0 18 15 * *', ['tasks.tasks.create']);
    const yearly = scheduledFlow('0 18 * 6 5', ['tasks.tasks.create'], 'f2');
    for (const id of ['friday-week-review', 'morning-agenda-check']) {
      expect(templateInstallation(tpl(id), t, [monthly]), `${id} vs monthly`).toEqual({
        state: 'absent',
      });
      expect(templateInstallation(tpl(id), t, [yearly]), `${id} vs yearly`).toEqual({
        state: 'absent',
      });
    }
  });

  it('does not answer for a card whose trigger is neither an event nor a schedule', () => {
    // `manual` and `at` are trigger kinds the kernel runs and this catalogue does not use. Nothing
    // recognises them, and `absent` stays the honest answer until something does.
    const template = { ...tpl('friday-week-review'), build: () => manualDoc };
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
    // ask for the same thirteen.
    expect(templateCommands(tpl('whatsapp-appointment'), t).length).toBeGreaterThan(1);
  });

  it('does not take what a card may READ for something it can DO', () => {
    // The WhatsApp cards ask for four kinds of grant — `notify`, `recipient_query`, `query` and
    // `command`. Only the last is what the automation DOES, and only the last identifies it: a hub
    // whose flow merely holds the appointment LOOKUP has not built this automation.
    const template = tpl('whatsapp-appointment');
    const grants = templateGrants(template, t);
    const reads = grants.filter((grant) => grant.kind !== 'command').map((grant) => grant.value);
    expect(reads.length, 'this card must carry non-command grants or the case proves nothing').toBeGreaterThan(0);

    const commands = templateCommands(template, t);
    expect(commands.filter((value) => reads.includes(value))).toEqual([]);
    expect(commands.length).toBeLessThan(grants.length);
  });
});
