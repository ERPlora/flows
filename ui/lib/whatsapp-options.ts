/**
 * **Options the customer TAPS, as the screen edits them** (flows#75, kernel half in hub#1633).
 *
 * A `notify` step used to be able to SAY things and not to ASK them: an automation offering three
 * slots wrote them into the copy and begged for a number back — «contesta 1, 2 o 3» — and what came
 * back was free text a `condition` cannot tell from «las 2» or «el 2 mejor». Since hub#1633 the step
 * carries `interactive` and the tap comes home as `event.reply_id`.
 *
 * Two rules decide everything in this file, and both come from `architecture/hub/flows.md` §5.3:
 *
 * - **Meta's shape IS the shape on the wire.** `interactive` travels from the document to the SaaS
 *   proxy UNTRANSLATED, so what is stored is Meta's own object (`{type, header?, body, footer?,
 *   action}`). This module reads it into three flat things the owner can edit and MERGES them back
 *   over the object that was there — it does not invent a second vocabulary that would have to grow
 *   every time Meta adds a field. That merge is not a detail (flows#91): a message composed
 *   somewhere else — a module template, a recipe, the API — carries a `header`, a `footer` and
 *   groups with a title that this screen has no box for, and rebuilding the object from the form
 *   deleted them in silence on a save asked for to change ONE label. **Saving can never lose a key
 *   it does not understand**, and that holds at EVERY level: the message, the `action`, a section
 *   (title included, with one group as with five), a row, a reply and Meta's envelope around it.
 *   The only keys that go are the ones belonging to the shape the owner switched AWAY from.
 * - **The limits are the SaaS's to enforce**, before the paid call, answering `too_many_options`,
 *   `duplicate_option_id` and `invalid_option`. {@link tapOptionProblems} does not re-implement
 *   them: it WARNS with the same names, so the owner finds out while typing rather than after a
 *   send they paid for.
 *
 * And one that is this file's own: options and copy are **two messages and one send**. The hub
 * refuses a step carrying both (`conflicting_message_type`) at SAVE, so {@link setTapOptions} is
 * the single door that switches between them — a screen that left `vars.text` behind would build
 * a document the hub had already said no to.
 */
import { patchStep, removeStepKeys } from './flow-doc';
import type { FlowDoc, Step } from './flow-doc';

/** Meta's cap on a `button` message. Warned about, never enforced here — see the file docblock. */
export const MAX_BUTTONS = 3;

/**
 * Meta's cap on a `list` message: **ten rows IN TOTAL**, however many sections they sit in. The
 * editor keeps one section for that reason — two sections of six each look legal and are not.
 */
export const MAX_LIST_ROWS = 10;

export const TAP_KINDS = ['button', 'list'] as const;
export type TapKind = (typeof TAP_KINDS)[number];

export interface TapOption {
  id: string;
  /** Composed like any other copy: a literal, or `{{steps.x.y}}` the run fills in. */
  title: unknown;
  /** `list` only. Meta has no description on a button. */
  description?: unknown;
  /**
   * `list` only, and only when there is MORE THAN ONE group: which one this row came from, so
   * writing it back can put it there again (flows#91). There is no control for it — the screen
   * edits a flat list of rows on purpose, ten rows being ten rows wherever they sit. It is
   * carried, not edited.
   *
   * A message with a SINGLE group is deliberately not tagged, and that is not the same as losing
   * its title: {@link toSections} keeps the group whole when nothing is tagged. Tagging it too
   * would be the same fix written twice — and it WAS, until a mutation run found both copies alive
   * because each one hid the other.
   */
  group?: number;
  /**
   * What THIS option carried that the screen has no box for: the row's own keys on a `list`, the
   * reply's on a `button`. Carried, not edited — and only present when there was something, so an
   * ordinary option is still written as the two or three keys Meta defines.
   */
  rest?: Record<string, unknown>;
  /**
   * `button` only: what Meta's envelope around the reply carried besides `type` and `reply`. It
   * belongs to the button shape, so a change of kind leaves it behind — same as `action.button`.
   */
  frame?: Record<string, unknown>;
}

export interface TapOptions {
  kind: TapKind;
  body: unknown;
  /** `list` only: the label of the button that OPENS the list (Meta's `action.button`). */
  openLabel: unknown;
  options: TapOption[];
}

export interface TapProblem {
  key: string;
  params?: Record<string, unknown>;
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** A composed value stays whole; anything else reads as «nothing typed here yet». */
function copy(value: unknown): unknown {
  return typeof value === 'string' ? value : '';
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * What this step already carries, or `null` when it is an ordinary text message.
 *
 * `null` is also the answer for an `interactive` that is not an object at all: the hub refuses to
 * save one, so the honest thing on screen is the text mode the owner can actually fix, not a form
 * pre-filled from a shape nobody wrote.
 */
export function readTapOptions(step: Step): TapOptions | null {
  const interactive = obj(step.interactive);
  if (!interactive) return null;
  const kind: TapKind = interactive.type === 'list' ? 'list' : 'button';
  const action = obj(interactive.action) ?? {};
  const options: TapOption[] = [];
  if (kind === 'button') {
    const buttons = Array.isArray(action.buttons) ? action.buttons : [];
    for (const button of buttons) {
      const reply = obj(obj(button)?.reply);
      if (!reply) continue;
      const rest = carried(reply, REPLY_KEYS);
      const frame = carried(button, BUTTON_KEYS);
      options.push({
        id: typeof reply.id === 'string' ? reply.id : '',
        title: copy(reply.title),
        ...(rest ? { rest } : {}),
        ...(frame ? { frame } : {}),
      });
    }
  } else {
    const sections = Array.isArray(action.sections) ? action.sections : [];
    // Only when there is more than one: a single section is what this screen writes, and tagging
    // its rows would put a key in every ordinary document to say «the one group». A single section
    // that DOES carry a title is not a second case — {@link toSections} keeps it whole.
    const grouped = sections.length > 1;
    for (const [at, section] of sections.entries()) {
      const rows = Array.isArray(obj(section)?.rows) ? (obj(section)!.rows as unknown[]) : [];
      for (const raw of rows) {
        const row = obj(raw);
        if (!row) continue;
        const rest = carried(row, ROW_KEYS);
        const option: TapOption = {
          id: typeof row.id === 'string' ? row.id : '',
          title: copy(row.title),
          ...(grouped ? { group: at } : {}),
          ...(rest ? { rest } : {}),
        };
        // Absent, never empty: a description Meta never received is not the same as one the owner
        // deliberately cleared, and writing `""` back would send a blank second line.
        if (typeof row.description === 'string' && row.description !== '') {
          option.description = row.description;
        }
        options.push(option);
      }
    }
  }
  return {
    kind,
    body: copy(obj(interactive.body)?.text),
    openLabel: kind === 'list' ? copy(action.button) : '',
    options,
  };
}

/**
 * A row of a `list`, as Meta reads it — the option's own keys first, so the three the screen edits
 * always win. `description` is modelled, so an empty one means «she took it away»: it is NOT
 * brought back from what the row used to carry.
 */
function toRow(option: TapOption): Record<string, unknown> {
  return {
    ...option.rest,
    id: option.id,
    title: option.title,
    ...(textOf(option.description) ? { description: option.description } : {}),
  };
}

/** A button, as Meta reads it: its envelope, and the reply the owner actually edits. */
function toButton(option: TapOption): Record<string, unknown> {
  return {
    ...option.frame,
    type: 'reply',
    reply: { ...option.rest, id: option.id, title: option.title },
  };
}

/**
 * Everything an object carried EXCEPT the keys named — the one tool this file preserves with.
 *
 * Used two ways, and both matter. On an `action` it DROPS the keys of the other shape, because
 * keeping the unknown is not keeping the wrong: `sections` on a `type: button` message is a key
 * Meta never defined there, and it is the proxy that pays for finding out. On a row, a reply or a
 * section it names the keys the screen DOES model, so what is left is exactly what has to survive.
 */
function without(source: unknown, drop: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj(source) ?? {})) {
    if (!drop.includes(key)) out[key] = value;
  }
  return out;
}

/** The keys this screen models, per shape. Everything else is carried untouched. */
const ROW_KEYS = ['id', 'title', 'description'] as const;
const REPLY_KEYS = ['id', 'title'] as const;
const BUTTON_KEYS = ['type', 'reply'] as const;
const SECTION_KEYS = ['rows'] as const;

/** Whatever is left over, or nothing at all — an empty object would be a key on every option. */
function carried(source: unknown, modelled: readonly string[]): Record<string, unknown> | undefined {
  const rest = without(source, modelled);
  return Object.keys(rest).length ? rest : undefined;
}

/**
 * The rows back in the groups they came from, titles and all — see {@link TapOption.group}.
 *
 * A row the owner ADDED has no group and lands in the last one that still has rows, which is where
 * it is on screen: at the end. A group she emptied is dropped rather than sent empty.
 */
function toSections(options: TapOption[], original: unknown): Record<string, unknown>[] {
  const sections = Array.isArray(original) ? original : [];
  // ONE section, and it keeps whatever the first one carried: Meta paints a `title` on a single
  // section just the same, so «only one group» is no reason to write it nameless (flows#91).
  const flat = (): Record<string, unknown>[] => [
    { ...without(sections[0], SECTION_KEYS), rows: options.map(toRow) },
  ];
  const groups = options.map((o) => (typeof o.group === 'number' ? o.group : -1));
  const last = Math.max(-1, ...groups);
  if (last < 0) return flat();
  const out: Record<string, unknown>[] = [];
  for (const [at, section] of sections.entries()) {
    const rows = options.filter((_, i) => (groups[i] < 0 ? last : groups[i]) === at).map(toRow);
    if (rows.length) out.push({ ...(obj(section) ?? {}), rows });
  }
  return out.length ? out : flat();
}

/**
 * Meta's own object, as the hub forwards it verbatim — **merged over the one that was already
 * there**, never rebuilt from the form (flows#91).
 *
 * @param original what the step carries today, when it carries anything. Its `header`, its
 * `footer` and any key Meta ships next survive an edit this screen cannot even show.
 */
export function toInteractive(
  options: TapOptions,
  original?: Record<string, unknown> | null,
): Record<string, unknown> {
  const base = original ?? {};
  const action = obj(base.action) ?? {};
  const body = { ...(obj(base.body) ?? {}), text: options.body };
  if (options.kind === 'button') {
    return {
      ...base,
      type: 'button',
      body,
      action: {
        ...without(action, ['button', 'sections']),
        buttons: options.options.map(toButton),
      },
    };
  }
  return {
    ...base,
    type: 'list',
    body,
    action: {
      ...without(action, ['buttons']),
      button: options.openLabel,
      sections: toSections(options.options, action.sections),
    },
  };
}

/** What the mode looks like the moment it is switched on: one empty option, never zero. */
export function blankTapOptions(kind: TapKind): TapOptions {
  return { kind, body: '', openLabel: '', options: [{ id: '', title: '' }] };
}

/**
 * Everything the SaaS would refuse, named the way it names it — **as a warning, not a block**.
 *
 * Blocking here would be a second table of Meta's limits, ageing on its own: the proxy is where
 * that knowledge lives and where it is kept up to date. What the screen owes the owner is finding
 * out BEFORE the send is paid for, which is what these sentences do.
 */
export function tapOptionProblems(options: TapOptions): TapProblem[] {
  const out: TapProblem[] = [];
  const max = options.kind === 'button' ? MAX_BUTTONS : MAX_LIST_ROWS;
  if (options.options.length > max) out.push({ key: 'ui.tapTooMany', params: { max } });
  if (!textOf(options.body)) out.push({ key: 'ui.tapBodyBlank' });
  if (options.kind === 'list' && !textOf(options.openLabel)) out.push({ key: 'ui.tapOpenLabelBlank' });

  const seen = new Set<string>();
  let blank = false;
  for (const option of options.options) {
    const id = option.id.trim();
    if (!id || !textOf(option.title)) blank = true;
    if (!id) continue;
    // Named, because «one of them is repeated» sends the owner to read all ten looking for it.
    if (seen.has(id) && !out.some((p) => p.key === 'ui.tapDuplicateId' && p.params?.id === id)) {
      out.push({ key: 'ui.tapDuplicateId', params: { id } });
    }
    seen.add(id);
  }
  if (blank) out.push({ key: 'ui.tapOptionBlank' });
  return out;
}

/**
 * The one door between «a message with copy» and «a message with options».
 *
 * It is one function rather than two patches on purpose: the hub answers
 * `conflicting_message_type` for a step carrying `interactive` next to `template` or `vars`, so
 * turning the mode on has to TAKE the copy away in the same edit that adds the options. Anything
 * else lets the owner build, and look at, a document that cannot be saved.
 */
export function setTapOptions(doc: FlowDoc, index: number, options: TapOptions | null): FlowDoc {
  if (!options) return removeStepKeys(doc, index, ['interactive']);
  const interactive = toInteractive(options, obj(doc.steps[index]?.interactive));
  return removeStepKeys(patchStep(doc, index, { interactive }), index, ['template', 'vars']);
}

/**
 * **The mode switch itself — the copy travels with it** (flows#90).
 *
 * Turning the options on has to take `vars` away (see {@link setTapOptions}), and the screen has
 * no undo: `setDoc` is an assignment, so a sentence dropped here is a sentence typed again. It is
 * the SAME sentence either side — the line that sits above the options is the message — so the
 * owner has no reason to know it changed shelf, and every editor that switches a message's type
 * (Twilio Studio, ManyChat, Zapier) carries the body across for exactly that reason.
 *
 * Deliberately NOT symmetric with an empty value: coming back with nothing written adds no `vars`
 * at all, because `{text: ''}` is a key the document never had, not «the copy came back».
 *
 * @param remembered the `interactive` the step had before it was switched to plain text (flows#95).
 * It cannot wait in the document —the hub answers `conflicting_message_type` for a step carrying
 * both, and its parser refuses a step key it does not know— so the SCREEN holds it while the mode
 * is off. Without it, «me lo pienso y lo devuelvo» handed back one empty button and threw away the
 * header, the footer, the list shape and the titles of the groups.
 */
export function setTapMode(
  doc: FlowDoc,
  index: number,
  wants: boolean,
  remembered?: Record<string, unknown> | null,
): FlowDoc {
  const step = doc.steps[index];
  if (!step) return doc;
  if (!wants) {
    const off = setTapOptions(doc, index, null);
    const body = readTapOptions(step)?.body;
    if (!textOf(body)) return off;
    return patchStep(off, index, { vars: { ...(obj(step.vars) ?? {}), text: body } });
  }
  // The remembered message goes back on the step BEFORE the options are applied, and that is the
  // whole of flows#95: {@link setTapOptions} fuses over what the step is carrying, and on the way
  // in it is carrying nothing — the way out had to take `interactive` off. Put it back first and
  // the merge that already keeps the header, the footer and the titled groups does the rest.
  const back = obj(remembered);
  const restored = back ? patchStep(doc, index, { interactive: back }) : doc;
  const had = readTapOptions(restored.steps[index]);
  // The sentence is whatever she has NOW: she may have rewritten it while it was plain copy.
  return setTapOptions(restored, index, {
    ...(had ?? blankTapOptions('button')),
    body: copy(obj(step.vars)?.text),
  });
}
