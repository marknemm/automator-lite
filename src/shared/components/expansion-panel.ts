import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import sparkButton from '~shared/directives/spark-button.js';

import styles from './expansion-panel.scss?inline';

/**
 * A simple expansion panel component that can be toggled open or closed.
 *
 * @element `spark-expansion-panel`
 * @extends LitElement
 * @slot `title` - Named slot for the title of the panel.
 * @slot - The default slot for embedding the content of the panel.
 */
@customElement('spark-expansion-panel')
export class ExpansionPanel extends LitElement {

  static styles = [unsafeCSS(styles)];

  /**
   * Auto-incrementing ID for each panel instance.
   */
  private static AUTO_INC_ID = 0;

  /**
   * The CSS ID for the panel.
   *
   * @default `expansion-panel${AUTO_INC_ID}`
   */
  @property({ type: String, reflect: true })
  accessor id = `expansion-panel-${ExpansionPanel.AUTO_INC_ID++}`;

  /**
   * The maximum height of the content area based on its scroll height and the {@link expanded} state.
   */
  @state()
  private accessor contentMaxHeight = '0';

  /**
   * Indicates and controls the expanded state of the panel.
   *
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  accessor expanded = false;

  /**
   * Callback function that is called when the {@link expanded} state changes via user interaction.
   * Will not be called when the {@link expanded} property is changed directly.
   */
  @property({ attribute: false })
  accessor onToggle: (expanded: boolean) => void = () => {};

  /**
   * Toggles the {@link expanded} state of the panel.
   */
  toggle(): void {
    this.expanded = !this.expanded;
    this.onToggle(this.expanded);
    this.dispatchEvent(new CustomEvent('toggle', {
      bubbles: true,
      composed: true,
      detail: { expanded: this.expanded },
    }));
  }

  protected override updated(changedProperties: Map<string, unknown>): void {
    // Re-calculate the max-height when expanded.
    if (changedProperties.has('expanded')) {
      this.contentMaxHeight = this.expanded
        ? `${this.shadowRoot?.querySelector('.content')?.scrollHeight ?? 0}px`
        : '0';
    }
  }

  /** @final Override {@link renderHeader} and/or {@link renderContent} instead. */
  protected override render(): TemplateResult {
    return html`
      <button
        ${sparkButton()}
        id="${this.id}-toggle"
        class="toggle"
        @click="${() => this.toggle()}"
        aria-expanded="${this.expanded}"
        aria-controls="${this.id}-content"
        aria-label="${this.expanded ? 'Collapse panel' : 'Expand panel'}"
      >
        ${this.renderHeader()}
        <span class="arrow">▶</span>
      </button>
      <div
        id="${this.id}-content"
        class="content"
        style="max-height: ${this.contentMaxHeight};"
        role="region"
        aria-labelledby="${this.id}-toggle"
        aria-hidden="${!this.expanded}"
        ?inert="${!this.expanded}"
      >
        <div class="content-inner">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  /**
   * Renders the header of the panel.
   * Can be overridden to customize the header rendering in subclasses.
   *
   * @returns A {@link TemplateResult} for the header of the panel.
   */
  protected renderHeader(): TemplateResult {
    return html`<slot name="header">Toggle</slot>`;
  }

  /**
   * Renders the content of the panel.
   * Can be overridden to customize the content rendering in subclasses.
   *
   * @returns A {@link TemplateResult} for the content of the panel.
   */
  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }
}
