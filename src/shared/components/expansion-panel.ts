import { html, PropertyValues, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { observeResize } from '~shared/decorators/observe-resize.js';
import sparkButton from '~shared/directives/spark-button.js';
import { ExpansionPanelToggleEvent } from './expansion-panel.events.js';
import styles from './expansion-panel.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * A simple expansion panel component that can be toggled open or closed.
 *
 * @element `spark-expansion-panel`
 * @extends LitElement
 * @slot `title` - Named slot for the title of the panel.
 * @slot - The default slot for embedding the content of the panel.
 */
@customElement('spark-expansion-panel')
export class ExpansionPanel extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * Auto-incrementing ID for each panel instance.
   */
  private static AUTO_INC_ID = 0;

  /**
   * The CSS ID for the panel.
   *
   * @default `expansion-panel-${AUTO_INC_ID}`
   */
  @property({ type: String, reflect: true })
  accessor id = `expansion-panel-${ExpansionPanel.AUTO_INC_ID++}`;

  /**
   * Indicates and controls the expanded state of the panel.
   *
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  accessor expanded = false;

  /**
   * The maximum height of the content area based on its scroll height and the {@link expanded} state.
   */
  @state()
  private accessor contentHeight = '0';

  /**
   * The inner content container element.
   */
  @query('.content-inner')
  private accessor contentInner!: HTMLElement;

  /**
   * Toggles the {@link expanded} state of the panel and dispatches an {@link ExpansionPanelToggleEvent}.
   */
  toggle(): void {
    this.expanded = !this.expanded;
    this.dispatchEvent(new ExpansionPanelToggleEvent(this.expanded));
  }

  protected override update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has('expanded')) {
      this.recalcHeight();
    }
  }

  /**
   * Recalculates the height of the content area based on its scroll height and the {@link expanded} state.
   *
   * The {@link observeResize} decorator also automatically invokes this method when the content is resized.
   */
  @observeResize('.content-inner')
  private recalcHeight(): void {
    this.contentHeight = this.expanded && this.contentInner
      ? `${this.contentInner.scrollHeight}px`
      : '0';
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
        style="height: ${this.contentHeight};"
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
  protected renderHeader(): TemplateResult | string {
    return html`<slot name="header">Toggle</slot>`;
  }

  /**
   * Renders the content of the panel.
   * Can be overridden to customize the content rendering in subclasses.
   *
   * @returns A {@link TemplateResult} for the content of the panel.
   */
  protected renderContent(): TemplateResult | string {
    return html`<slot></slot>`;
  }
}

export * from './expansion-panel.events.js';
