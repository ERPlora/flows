import { describe, it, expect } from 'vitest';
import { TEMPLATES, templateById, buildTemplate, templateInstallation, templateCommands } from './templates';
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

/** A flow as the hub hands it back, built from a template's own document. */
const flowOf = (
  id: string,
  over: { id?: string; name?: string; enabled?: boolean; commands?: readonly string[] } = {},
) => ({
  id: over.id ?? 'f1',
  name: over.name ?? `${id} flow`,
  enabled: over.enabled ?? true,
  definition: buildTemplate(tpl(id), t) as unknown as Record<string, unknown>,
  commands: over.commands,
});

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

  it('says nothing about a template that does not start on an event', () => {
    // A cron card cannot be identified this way: what a flow listens to is an event name, and two
    // flows on «every Friday at 18:00» are not the same automation. Out of scope on purpose
    // (flows#67), and silence is the honest answer — never a wrong badge.
    const template = tpl('friday-week-review');
    const flow = {
      id: 'f9',
      name: 'Friday review',
      enabled: true,
      definition: buildTemplate(template, t) as unknown as Record<string, unknown>,
      commands: ['tasks.tasks.create'],
    };
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
});
