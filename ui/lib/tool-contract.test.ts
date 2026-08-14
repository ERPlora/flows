import { describe, it, expect } from 'vitest';
import { contractProblems, schemaFacts, DRAFT_STEP_KINDS } from './ai-draft';
import { readDoc } from './flow-doc';
import manifest from '../../module.json';
import payloadSchema from '../../schemas/draft_propose.json';

/**
 * **The tool's DESCRIPTION has to carry the contract, because the schema alone did not.**
 *
 * Verified against a real hub on 2026-08-14: asked for an automation, the model called
 * `flows.drafts.propose` and invented its own document — `{trigger: …, actions: […]}` — twice in a
 * row, even though the JSON Schema it was handed as `fn.parameters` says `schema_version` /
 * `triggers` / `steps`. It learned the TOP level from the refusal («name, definition and notes are
 * required») and corrected that in one round; it never learned the inside of `definition`, because
 * a nested object schema is the part models skim.
 *
 * So the shape now also travels in the description, where it is prose and gets read — with a
 * WORKED EXAMPLE, which is the form that survives. This file is what keeps that example honest:
 * it is parsed back out of the manifest and put through the same judgement a real proposal gets.
 * A description that drifts from the contract is worse than no description, because it teaches the
 * model to produce something the hub refuses.
 */

const tool = (manifest as { commands: Record<string, { ai?: { description?: string } }> }).commands[
  'flows.drafts.propose'
];
const description = tool?.ai?.description ?? '';

/** The `definition` example embedded in the description, as JSON. */
function embeddedExample(): unknown {
  const start = description.indexOf('{"schema_version"');
  expect(start, 'the description must carry a worked `definition` example').toBeGreaterThan(-1);
  // Walk the braces so the example can contain nested objects without a regex guessing at them.
  let depth = 0;
  for (let i = start; i < description.length; i += 1) {
    if (description[i] === '{') depth += 1;
    if (description[i] === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(description.slice(start, i + 1));
    }
  }
  throw new Error('the example in the description is not balanced');
}

describe('the tool the assistant is handed', () => {
  it('exists, and is the one the module declares as an assistant tool', () => {
    expect(description).not.toBe('');
  });

  it('names the three keys of the document, so the model cannot fall back on `trigger`/`actions`', () => {
    for (const key of ['schema_version', 'triggers', 'steps']) {
      expect(description, `the description must name \`${key}\``).toContain(key);
    }
  });

  it('carries an example that is a document THIS module would accept', () => {
    const doc = readDoc(embeddedExample());
    expect(contractProblems(doc, schemaFacts(undefined))).toEqual([]);
  });

  it('carries an example whose steps are the kinds the assistant may propose', () => {
    const doc = readDoc(embeddedExample());
    expect(doc.steps.length).toBeGreaterThan(0);
    for (const step of doc.steps) {
      expect(DRAFT_STEP_KINDS as readonly string[]).toContain(step.kind);
    }
  });

  it('carries an example the payload schema itself accepts', () => {
    // Not a full JSON-Schema run — that is the runtime's job — but the two things that actually
    // went wrong: the arrays are arrays, and the version is the one the schema pins.
    const doc = embeddedExample() as Record<string, unknown>;
    const pinned = (payloadSchema as never as {
      properties: { definition: { properties: { schema_version: { const: number } } } };
    }).properties.definition.properties.schema_version.const;
    expect(doc.schema_version).toBe(pinned);
    expect(Array.isArray(doc.triggers)).toBe(true);
    expect(Array.isArray(doc.steps)).toBe(true);
  });

  it('warns the model off the shapes it actually produced', () => {
    // `trigger` and `action`/`actions` are not hypothetical: they are what came back, twice.
    expect(description).toMatch(/trigger.*action/s);
  });
});
