import { describe, it, expect } from 'vitest';
import { coreAtLeast, versionTriple } from './core-version';

/**
 * The mirror of `crates/runtime/src/core_version.rs::version_triple`, so a floor this module
 * applies and a floor the hub applies cannot disagree about the same string.
 *
 * The hub's rules, kept one for one: a prerelease/build suffix is DROPPED (`1.2.3-rc1` floors at
 * `1.2.3`), a missing component reads as zero (`2` is `2.0.0`), and anything else — a fourth
 * component, a non-numeric one — is not a version anybody released and answers «unreadable».
 */
describe('a core version, read the way the hub reads it', () => {
  it('reads the three numbers', () => {
    expect(versionTriple('1.1.17')).toEqual([1, 1, 17]);
  });

  it('drops a prerelease or build suffix, so a dev build floors at its base', () => {
    // The `:dev` channel is `1.1.16-dev.305+gabc1234`, and `main` between releases carries one too.
    expect(versionTriple('1.1.16-dev.305+gabc1234')).toEqual([1, 1, 16]);
    expect(versionTriple('1.1.17-rc1')).toEqual([1, 1, 17]);
    expect(versionTriple('1.1.17+build.9')).toEqual([1, 1, 17]);
  });

  it('reads a missing component as zero', () => {
    expect(versionTriple('2')).toEqual([2, 0, 0]);
    expect(versionTriple('2.3')).toEqual([2, 3, 0]);
  });

  it('refuses what is not a version, instead of guessing at it', () => {
    for (const bad of ['', '   ', 'x', '1.2.3.4', '1.x.3', '-rc1', '1..3', '1.-2.3']) {
      expect(versionTriple(bad), bad).toBeNull();
    }
  });

  it('refuses anything that is not a string at all', () => {
    for (const bad of [undefined, null, 17, {}, ['1.1.17']]) {
      expect(versionTriple(bad), JSON.stringify(bad) ?? 'undefined').toBeNull();
    }
  });
});

/**
 * A floor is asked in one direction only — «is this hub AT LEAST that?» — and it is **fail-closed**
 * on both sides: a version this module cannot read, and a floor it cannot read, both answer no.
 *
 * That asymmetry is the whole point. What sits behind this question is a permission that fixes who
 * an automation may read about, and `PUT …/grants` is all-or-nothing: offering the limit to a hub
 * that refuses it does not cost the limit, it costs every permission on the screen. Not offering
 * the card costs the owner an automation they can install after the next update.
 */
describe('is this core at least the floor', () => {
  it('says yes at the floor and above it', () => {
    expect(coreAtLeast('1.1.17', '1.1.17')).toBe(true);
    expect(coreAtLeast('1.1.18', '1.1.17')).toBe(true);
    expect(coreAtLeast('1.2.0', '1.1.17')).toBe(true);
    expect(coreAtLeast('2.0.0', '1.1.17')).toBe(true);
  });

  it('says no below it, including the release just under', () => {
    expect(coreAtLeast('1.1.16', '1.1.17')).toBe(false);
    expect(coreAtLeast('1.1.15', '1.1.17')).toBe(false);
    expect(coreAtLeast('1.0.99', '1.1.17')).toBe(false);
    expect(coreAtLeast('0.9.9', '1.1.17')).toBe(false);
  });

  it('compares the numbers, never the text', () => {
    // `'1.1.9' > '1.1.17'` as strings, which is how a floor written with `>=` on the raw string
    // lets every hub of the 1.1.9 fleet through a 1.1.17 gate.
    expect(coreAtLeast('1.1.9', '1.1.17')).toBe(false);
    expect(coreAtLeast('1.1.170', '1.1.17')).toBe(true);
  });

  it('says no when the hub did not say which version it is', () => {
    expect(coreAtLeast('', '1.1.17')).toBe(false);
    expect(coreAtLeast(undefined, '1.1.17')).toBe(false);
    expect(coreAtLeast('not-a-version', '1.1.17')).toBe(false);
  });

  it('says no when the floor itself is unreadable, rather than letting everything through', () => {
    expect(coreAtLeast('9.9.9', 'nonsense')).toBe(false);
  });
});
