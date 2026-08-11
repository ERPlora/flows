import { describe, it, expect } from 'vitest';
import { resolveClient, errorCode, CAPABILITY_DENIED, UNSUPPORTED_CORE } from './hub-flows';

describe('the door into the automation kernel', () => {
  it('uses the client the SHELL injected, because that is the one that names this module', () => {
    // `ModuleView.vue` sets `el.client = client.forModule('flows')` before appending the element.
    // That id comes from the loader, which is the only thing that truly knows which module is
    // being mounted, and it is what the runtime reads to demand `manage_flows`.
    const injected = { flows: {}, events: {} };
    expect(resolveClient({ client: injected } as never, {} as never)).toBe(injected);
  });

  it('scopes the global client itself when the shell did not inject one', () => {
    // The unscoped `globalThis.erplora` has NO `flows` getter at all. Naming ourselves is the
    // documented fallback, not a way around the gate: the runtime still demands the capability.
    const scoped = { flows: {}, events: {} };
    const asked: string[] = [];
    const global = {
      forModule: (id: string) => {
        asked.push(id);
        return scoped;
      },
    };
    expect(resolveClient({} as never, global as never)).toBe(scoped);
    expect(asked).toEqual(['flows']);
  });

  it('returns null rather than throwing when there is no SDK at all', () => {
    // `erplora dev`'s preview client has neither `forModule` nor `flows`. The editor has to say
    // so on screen; a thrown error inside `connectedCallback` renders a blank page.
    expect(resolveClient({} as never, {} as never)).toBeNull();
    expect(resolveClient({} as never, undefined)).toBeNull();
  });

  it('treats a client whose SDK predates the flows surface as «no door»', () => {
    // A hub older than hub#714 hands out a scoped client with no `flows` on it. That is a version
    // mismatch the editor must NAME, not a crash.
    const old = { forModule: () => ({}) };
    expect(resolveClient({} as never, old as never)).toBeNull();
  });
});

describe('reading a refusal', () => {
  it('finds the code the runtime sent, whatever wrapper it arrived in', () => {
    expect(errorCode({ code: CAPABILITY_DENIED })).toBe(CAPABILITY_DENIED);
    expect(errorCode(Object.assign(new Error('nope'), { code: 'flow.invalid_cron' }))).toBe(
      'flow.invalid_cron',
    );
    expect(errorCode(new Error('boom'))).toBe('');
    expect(errorCode(undefined)).toBe('');
  });

  it('has a name for «this hub is too old», which is not an error code the hub sends', () => {
    expect(UNSUPPORTED_CORE).toBe('flows.unsupported_core');
  });
});
