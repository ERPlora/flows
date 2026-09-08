/**
 * **How old the hub under this module is**, read the way the hub itself reads a floor (flows#111).
 *
 * Mirror of `crates/runtime/src/core_version.rs::version_triple` — the same function the runtime
 * applies to a module's `compatibility.min_erplora_version` before it refuses to load it. Written
 * again here rather than guessed at, because the two are answering the same question about the
 * same string and a second opinion about what `1.1.16-dev.305` means is how a card ends up offered
 * on a hub that refuses what it installs.
 *
 * 🔴 **This is the last resort, not the first.** A capability is asked for by NAME wherever the
 * hub declares one — `GET /api/hub/flows/schema` is read for its step keys, and every fact in
 * {@link SchemaFacts} but one comes from the shape it serves. A version number is what is left
 * when there is nothing to name: the pin a `query` grant carries (hub#1662) does not appear
 * anywhere in that schema, because a pin lives in `_flow_grants` and not in the document. Measured
 * on the served schema of `origin/develop`: no `grant`, no `pin` and no `payload` anywhere in it,
 * and `schema_version` is `const 1` on `v1.1.15`, `v1.1.16` and `develop` alike — so neither the
 * shape nor the version of the contract can answer it, and the number is the only witness.
 */

/**
 * A version as three comparable numbers, or `null` when this is not a version.
 *
 * The hub's rules, kept one for one:
 *
 * - A prerelease or build suffix is **dropped**: `1.2.3-rc1` floors at `1.2.3`. The `:dev` channel
 *   is `1.1.16-dev.305+gabc1234` and a source build is `<newest tag>-source`, so refusing those
 *   would make every non-release build unreadable.
 * - A missing component reads as **zero**: `2` is `2.0.0`. This compares a FLOOR, so being generous
 *   about the shape is right.
 * - A fourth component or a non-numeric one is not a version anybody released, and answers `null`
 *   rather than a guess.
 */
export function versionTriple(value: unknown): [number, number, number] | null {
  if (typeof value !== 'string') return null;
  const core = value.trim().split(/[-+]/)[0];
  const parts = core.split('.');
  if (parts.length > 3) return null;
  const numbers: number[] = [];
  for (const part of [parts[0], parts[1] ?? '0', parts[2] ?? '0']) {
    if (!/^\d+$/.test(part)) return null;
    numbers.push(Number(part));
  }
  return [numbers[0], numbers[1], numbers[2]];
}

/**
 * Is this core AT LEAST `floor`? **Fail-closed on both sides.**
 *
 * A version the module cannot read is not «probably fine», and neither is a floor it cannot read:
 * both answer `false`. What hangs on the answer is a permission that fixes who an automation may
 * read about, and `PUT …/grants` is all-or-nothing — offering the limit to a hub that refuses it
 * does not cost the limit, it costs every permission on the screen and the recipe dies at its
 * first step. Not offering the card costs an automation the owner can install after the update.
 */
export function coreAtLeast(version: unknown, floor: string): boolean {
  const have = versionTriple(version);
  const want = versionTriple(floor);
  if (!have || !want) return false;
  for (let i = 0; i < 3; i += 1) {
    if (have[i] !== want[i]) return have[i] > want[i];
  }
  return true;
}
