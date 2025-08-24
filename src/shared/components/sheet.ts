import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sparkButton from '~shared/directives/spark-button.js';
import styles from './sheet.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * A modal-like component that slides in from the edge of its container.
 *
 * @element `spark-sheet`
 * @slot `title` - A named slot for inserting the title of the sheet.
 * @slot The default slot for inserting content into the sheet.
 * @extends SparkComponent
 */
@customElement('spark-sheet')
export class Sheet extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * The open state of the sheet.
   */
  @property({ type: Boolean, reflect: true })
  accessor opened = false;

  /**
   * The role of the sheet, used for accessibility.
   * @default 'dialog'
   */
  @property({ type: String, reflect: true })
  accessor role = 'dialog';

  /**
   * Callback function that is called when the open state changes via
   * the {@link open} or {@link close} methods.
   *
   * Will not be called when the `opened` property is changed directly.
   *
   * @param opened - The new open state of the sheet.
   */
  @property({ attribute: false })
  accessor onOpenChange: (opened: boolean) => void = () => {};

  /**
   * The side from which the sheet will slide in.
   * Can be `bottom`, `top`, `left`, or `right`.
   *
   * @default 'bottom'
   */
  @property({ type: String, reflect: true })
  accessor side: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

  /**
   * Opens the sheet.
   */
  open(): void {
    this.opened = true;
    this.onOpenChange(this.opened);
  }

  /**
   * Closes the sheet.
   */
  close(): void {
    this.opened = false;
    this.onOpenChange(this.opened);
  }

  /** @final Override {@link renderHeader} and/or {@link renderContent} instead. */
  protected override render(): TemplateResult {
    return html`
      <div class="panel">
        <div class="header">
          ${this.renderHeader()}
        </div>
        <div class="content">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  /**
   * Renders the header of the sheet.
   * This method can be overridden to derive a specific sheet component with a custom header.
   *
   * @returns The header {@link TemplateResult} to be rendered inside the sheet.
   */
  protected renderHeader(): TemplateResult {
    return html`
      <div class="title-container">
        ${this.renderTitle()}
      </div>
      <button
        ${sparkButton()}
        icon="close"
        color="danger"
        title="Close"
        type="button"
        @click=${() => this.close()}
      ></button>
    `;
  }

  /**
   * Renders the title of the sheet.
   * This method can be overridden to derive a specific sheet component with a custom title.
   *
   * @returns The title {@link TemplateResult} to be rendered inside the sheet header.
   */
  protected renderTitle(): TemplateResult {
    return html`<slot name="title"></slot>`;
  }

  /**
   * Renders the content of the sheet.
   * This method can be overridden to derive a specific sheet component with fixed content.
   *
   * @returns The content {@link TemplateResult} to be rendered inside the sheet.
   */
  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }

}
