import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './list-item.scss?inline';

/**
 * A list item component that can be used within a list.
 *
 * This component is designed to be used as a child of a `<mn-list>` element.
 * It provides a default `role` of `listitem` for accessibility purposes.
 *
 * @element `mn-list-item`
 * @slot The default slot for inserting content into the list item.
 * @extends LitElement
 */
@customElement('mn-list-item')
export class ListItem extends LitElement {

  static styles = [unsafeCSS(styles)];

  /**
   * The role of the list item, used for accessibility.
   * @default 'listitem'
   */
  @property({ type: String, reflect: true })
  accessor role = 'listitem';

  protected override render(): TemplateResult {
    return html`<slot></slot>`;
  }

}
