import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ListItem } from './list-item.js';

import styles from './button-list-item.scss?inline';

/**
 * A button list item component that extends the functionality of a list item.
 *
 * @element `mn-button-list-item`
 * @slot The default slot for inserting content into the button list item.
 * @extends ListItem
 */
@customElement('mn-button-list-item')
export class ButtonListItem extends ListItem {

  static styles = [unsafeCSS(styles)];

  @property({ type: String, reflect: true })
  uid = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ attribute: false })
  onClick: (uid: string) => void | Promise<void> = () => {};

  /** @final Override the {@link renderContent} method instead. */
  protected override render(): TemplateResult {
    return html`
      <button
        type="button"
        @click=${() => this.onClick(this.uid)}
        ?disabled=${this.disabled}
      >
        ${this.renderContent()}
      </button>
    `;
  }

  /**
   * Renders the content of the button list item.
   * This method can be overridden to provide specific content for the button list item.
   * Otherwise, it defaults to rendering a `<slot>` element that allows for custom content insertion.
   *
   * @returns The content {@link TemplateResult} to be rendered inside the button list item.
   */
  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }

}
