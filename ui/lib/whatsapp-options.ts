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
 *   action}`). This module reads it into three flat things the owner can edit and writes it back —
 *   it does not invent a second vocabulary that would have to grow every time Meta adds a field.
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
      options.push({ id: typeof reply.id === 'string' ? reply.id : '', title: copy(reply.title) });
    }
  } else {
    const sections = Array.isArray(action.sections) ? action.sections : [];
    for (const section of sections) {
      const rows = Array.isArray(obj(section)?.rows) ? (obj(section)!.rows as unknown[]) : [];
      for (const raw of rows) {
        const row = obj(raw);
        if (!row) continue;
        const option: TapOption = {
          id: typeof row.id === 'string' ? row.id : '',
          title: copy(row.title),
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

/** Meta's own object, as the hub forwards it verbatim. */
export function toInteractive(options: TapOptions): Record<string, unknown> {
  const body = { text: options.body };
  if (options.kind === 'button') {
    return {
      type: 'button',
      body,
      action: {
        buttons: options.options.map((o) => ({
          type: 'reply',
          reply: { id: o.id, title: o.title },
        })),
      },
    };
  }
  return {
    type: 'list',
    body,
    action: {
      button: options.openLabel,
      sections: [
        {
          rows: options.options.map((o) => ({
            id: o.id,
            title: o.title,
            ...(textOf(o.description) ? { description: o.description } : {}),
          })),
        },
      ],
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
  return removeStepKeys(patchStep(doc, index, { interactive: toInteractive(options) }), index, [
    'template',
    'vars',
  ]);
}
