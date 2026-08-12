import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-empty-state';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import '../erp-flows-editor/erp-flows-editor';
import '../erp-flows-gallery/erp-flows-gallery';
import '../erp-flows-guide/erp-flows-guide';
import { readDoc, SCHEMA_VERSION } from '../../lib/flow-doc';
import { describeTrigger } from '../../lib/plain-language';
import { catalogEntry } from '../../lib/trigger-catalog';
import { CAPABILITY_DENIED, errorCode, resolveClient } from '../../lib/hub-flows';
import type { Flow, ModuleClient } from '../../lib/hub-flows';
// The module's i18n catalogue (ADR-0055): esbuild inlines these JSONs into the bundle and the
// active language comes from the shell (`erplora.locale`, `erplora:locale-changed`).
import esLocale from '../../../locales/es.json';
import enLocale from '../../../locales/en.json';

const CATALOG: Record<string, unknown> = { es: esLocale, en: enLocale };

/** What the whole screen is showing, and why. */
type Gate = 'loading' | 'ready' | 'unsupported' | 'denied' | 'not_admin' | 'error';

/**
 * **The automations screen** — the one component `module.json` mounts.
 *
 * It owns three things and delegates the rest: the door into the kernel, the list, and which of
 * the two the person is looking at.
 *
 * The door is the interesting part. Three things have to line up before this module can touch a
 * flow, and each one fails differently, so each one gets its own sentence:
 *
 * - the hub's core has to HAVE the flows surface (hub#714) — otherwise there is nothing to talk to;
 * - the owner has to have granted this module `manage_flows` — `capability_denied`, and the answer
 *   is «go to Settings → Permissions», not «error»;
 * - the person has to hold an owner/admin session — a cashier gets `403`, and telling them to
 *   check their permissions would send them somewhere they cannot go.
 *
 * And the contract itself is ASKED, never bundled: `GET /api/hub/flows/schema` (hub#716) says
 * which document version this core enforces. A module updates on its own clock, so a bundled copy
 * is a photo of whichever hub it was built against — wrong for somebody by construction.
 */
export class ErpFlowsApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    .head .grow {
      flex: 1 1 auto;
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0 0.75rem 1rem;
    }
    .list {
      max-width: 44rem;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .flow {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .flow > button.open {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      text-align: left;
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0.7rem 0.75rem;
      /* A finger on the counter tablet, not a mouse. */
      min-height: 3.25rem;
    }
    .flow .name {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .flow .when {
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .flow .side {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding-right: 0.5rem;
    }
    .icon-btn {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 2.75rem;
      min-height: 2.75rem;
      border-radius: var(--ok-radius-sm, 10px);
    }
    .icon-btn:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.06));
    }
    .gate {
      max-width: 34rem;
      margin: 2rem auto;
    }
  `;

  /**
   * The client the SHELL injects (`ModuleView.vue`: `el.client = client.forModule('flows')`).
   * The id comes from the loader — the only thing that truly knows which module is being mounted.
   */
  @property({ attribute: false }) client: ModuleClient | null = null;

  @state() private gate: Gate = 'loading';

  @state() private flows: Flow[] = [];

  @state() private editing: Flow | null = null;

  @state() private isNew = false;

  /** Which tab the editor opens on. A flow straight out of the gallery opens on Permissions. */
  @state() private editorTab: 'editor' | 'permissions' | 'history' = 'editor';

  @state() private guideOpen = false;

  @state() private error = '';

  @state() private coreVersion = '';

  private readonly onLocaleChange = (): void => this.requestUpdate();

  /** The module catalogue, resolved against the shell's active language (ADR-0055). */
  private readonly t = (key: string, params?: Record<string, unknown>): string => {
    const client = this.client as (ModuleClient & { t?: unknown }) | null;
    if (typeof client?.t === 'function') return client.t(CATALOG, key, params);
    const global = (globalThis as { erplora?: { t?: unknown } }).erplora;
    if (typeof global?.t === 'function') {
      return (global.t as (c: unknown, k: string, p?: unknown) => string)(CATALOG, key, params);
    }
    return key;
  };

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    window.addEventListener('erplora:locale-changed', this.onLocaleChange);
    await this.open();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('erplora:locale-changed', this.onLocaleChange);
  }

  /** Resolves the door, checks the contract, loads the list. Every failure has its own screen. */
  private async open(): Promise<void> {
    const client = resolveClient(this, (globalThis as { erplora?: never }).erplora);
    if (!client) {
      this.gate = 'unsupported';
      return;
    }
    this.client = client;
    try {
      const schema = await client.flows.schema();
      this.coreVersion = schema?.core_version ?? '';
      if (schema && schema.schema_version !== SCHEMA_VERSION) {
        // Ahead of its hub, this editor would offer a step the hub refuses to save; behind it, it
        // would hide one that works. Saying which of the two is happening beats a save error.
        this.gate = 'unsupported';
        return;
      }
    } catch (e) {
      if (this.setGateFromError(e)) return;
    }
    await this.reload();
  }

  /** Turns a refusal into the screen that names it. Returns `true` when it handled the error. */
  private setGateFromError(e: unknown): boolean {
    const code = errorCode(e);
    if (code === CAPABILITY_DENIED) {
      this.gate = 'denied';
      return true;
    }
    if (code === 'forbidden' || code === 'unauthorized') {
      this.gate = 'not_admin';
      return true;
    }
    this.error = (e as Error)?.message || this.t('ui.errGeneric');
    this.gate = 'error';
    return true;
  }

  private async reload(): Promise<void> {
    if (!this.client) return;
    try {
      const flows = await this.client.flows.list();
      this.flows = Array.isArray(flows) ? flows : [];
      this.gate = 'ready';
    } catch (e) {
      this.setGateFromError(e);
    }
  }

  /**
   * Flips the switch, sending the WHOLE flow.
   *
   * `PUT /flows/{id}` revalidates the document and re-seeds the triggers, so a partial body would
   * not be «just the switch» — it would be a rewrite of the automation.
   */
  async setEnabled(flow: Flow, enabled: boolean): Promise<void> {
    if (!this.client) return;
    try {
      const saved = await this.client.flows.update(flow.id, {
        name: flow.name,
        enabled,
        definition: flow.definition,
      });
      this.flows = this.flows.map((f) => (f.id === flow.id ? { ...f, ...saved, enabled } : f));
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  private async remove(flow: Flow): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.flows.remove(flow.id);
      this.flows = this.flows.filter((f) => f.id !== flow.id);
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /** «Cuando se reserva una cita» — never the raw event name. */
  private startsWhen(flow: Flow): string {
    const doc = readDoc(flow.definition);
    const trigger = doc.triggers[0] ?? { kind: 'manual' as const };
    const entry = trigger.event ? catalogEntry(trigger.event) : undefined;
    return describeTrigger(trigger, this.t, entry ? this.t(entry.labelKey) : undefined);
  }

  private renderGate() {
    const map: Record<string, { icon: string; title: string; message: string }> = {
      unsupported: {
        icon: 'construct-outline',
        title: 'ui.unsupportedTitle',
        message: 'ui.unsupportedMessage',
      },
      denied: { icon: 'lock-closed-outline', title: 'ui.noAccessTitle', message: 'ui.noAccessMessage' },
      not_admin: {
        icon: 'person-outline',
        title: 'ui.notAdminTitle',
        message: 'ui.notAdminMessage',
      },
    };
    const gate = map[this.gate];
    if (!gate) {
      return html`<div class="gate">
        <ok-inline-feedback tone="danger" icon="alert-circle-outline"
          >${this.error || this.t('ui.errGeneric')}</ok-inline-feedback
        >
      </div>`;
    }
    return html`<div class="gate">
      <ok-empty-state
        icon=${gate.icon}
        heading=${this.t(gate.title)}
        message=${this.t(gate.message)}
      ></ok-empty-state>
    </div>`;
  }

  /**
   * The automations that already exist, above the gallery. Empty is not an error state any more
   * (flows#1): a hub with nothing automated yet simply has nothing to show HERE, and the gallery
   * underneath is the answer to «and now what».
   */
  private renderList() {
    if (!this.flows.length) return nothing;
    return html`<div class="list">
      <h3 class="section">${this.t('ui.tplYours')}</h3>
      ${this.flows.map(
        (flow) => html`<div class="flow" data-flow=${flow.id}>
          <button
            type="button"
            class="open"
            @click=${() => {
              this.editing = flow;
              this.isNew = false;
            }}
          >
            <span class="name">${flow.name || this.t('ui.unnamed')}</span>
            <span class="when">${this.startsWhen(flow)}</span>
          </button>
          <span class="side">
            <ok-status-pill
              tone=${flow.enabled ? 'success' : 'neutral'}
              label=${flow.enabled ? this.t('ui.active') : this.t('ui.paused')}
            ></ok-status-pill>
            <ion-toggle
              .checked=${flow.enabled}
              @ionChange=${(e: Event) =>
                void this.setEnabled(flow, !!(e.target as HTMLInputElement).checked)}
            ></ion-toggle>
            <button
              type="button"
              class="icon-btn"
              aria-label=${this.t('ui.delete')}
              @click=${() => void this.remove(flow)}
            >
              ×
            </button>
          </span>
        </div>`,
      )}
    </div>`;
  }

  private startNew(): void {
    this.editing = null;
    this.isNew = true;
    this.editorTab = 'editor';
  }

  /**
   * A template just became a flow: open it, **on the screen that makes it work**.
   *
   * A flow with no grants does nothing at all and says nothing about it. Landing the owner on the
   * step list would leave the one action they must take behind a tab they have no reason to open —
   * which is the exact place pm#134 reports people getting stuck.
   */
  private onTemplateUsed(e: CustomEvent<{ flow: Flow; needsGrants: boolean }>): void {
    this.editing = e.detail.flow;
    this.isNew = false;
    this.editorTab = e.detail.needsGrants ? 'permissions' : 'editor';
    void this.reload();
  }

  render() {
    if (this.gate === 'loading') {
      return html`<div class="body"><span>${this.t('ui.loading')}</span></div>`;
    }
    if (this.gate !== 'ready') return this.renderGate();

    if (this.editing || this.isNew) {
      return html`<erp-flows-editor
        .client=${this.client}
        .flow=${this.editing}
        .t=${this.t}
        .tab=${this.editorTab}
        @flows-back=${() => {
          this.editing = null;
          this.isNew = false;
          this.editorTab = 'editor';
          void this.reload();
        }}
        @flows-saved=${(e: CustomEvent<{ flow: Flow }>) => {
          this.editing = e.detail.flow;
          this.isNew = false;
        }}
      ></erp-flows-editor>`;
    }

    if (this.guideOpen) {
      return html`<div class="body">
        <erp-flows-guide
          .t=${this.t}
          @flows-guide-close=${() => {
            this.guideOpen = false;
          }}
        ></erp-flows-guide>
      </div>`;
    }

    return html`
      <div class="head">
        <span class="grow"></span>
        <ion-button size="small" fill="outline" data-act="new" @click=${() => this.startNew()}>
          ${this.t('ui.newAutomation')}
        </ion-button>
      </div>
      <div class="body">
        ${this.error
          ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
              >${this.error}</ok-inline-feedback
            >`
          : nothing}
        ${this.renderList()}
        <erp-flows-gallery
          .client=${this.client}
          .t=${this.t}
          @flows-template-used=${(e: Event) =>
            this.onTemplateUsed(e as CustomEvent<{ flow: Flow; needsGrants: boolean }>)}
          @flows-open-guide=${() => {
            this.guideOpen = true;
          }}
        ></erp-flows-gallery>
      </div>
    `;
  }
}

define('erp-flows-app', ErpFlowsApp);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-app': ErpFlowsApp;
  }
}
