/**
 * Types for `@erplora/outfitkit/define`, which the package does NOT ship (flows#107).
 *
 * Every other subpath of `@erplora/outfitkit` declares its `types` in `exports`; `./define` is the
 * one that is a bare string (`"./define": "./dist/define.js"`), and there is no `dist/define.d.ts`
 * to point at. So the ONE import that all nine components of this module share resolves to `any`,
 * and with it `define(tag, ctor)` stops being checked at all — a component registered under a tag
 * that does not match its own `ok-`/`erp-` name would typecheck green.
 *
 * 🔴 This file is a MIRROR, not the fix. The real one is OutfitKit emitting the declaration
 * alongside its other subpaths — ERPlora/outfitkit#130. When that ships, DELETE this file: an ambient module declaration silently wins over a real one, so leaving it
 * behind would pin the signature to whatever was true today.
 *
 * The signature mirrors `outfitkit/dist/define.js` verbatim: a guarded `customElements.define`
 * that does nothing when the tag is already registered.
 */
declare module '@erplora/outfitkit/define' {
  export function define(tag: string, ctor: CustomElementConstructor): void;
}
