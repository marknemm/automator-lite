import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './list.scss?inline';

/**
 * A simple list component that can be used to group items.
 *
 * This component is designed to contain `<mn-list-item>` elements as direct children.
 * It provides a default `role` of `list` for accessibility purposes.
 *
 * @element `mn-list`
 * @slot The default slot for inserting list items.
 * @extends LitElement
 */
@customElement('mn-list')
export class List extends LitElement {

  static styles = [unsafeCSS(styles)];

  /** @final Override {@link renderContent} instead. */
  protected override render(): TemplateResult {
    return html`
      <div role="list">
        ${this.renderContent()}
      </div>
    `;
  }

  /**
   * Renders the content of the list.
   * This method can be overridden to provide specific content for the list.
   * Otherwise, it defaults to rendering a `<slot>` element that allows for custom content insertion.
   *
   * @returns The content {@link TemplateResult} to be rendered inside the list.
   */
  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }

}
