import { html, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './list-item.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * A list item component that can be used within a list.
 *
 * This component is designed to be used as a child of a `<spark-list>` element.
 * It provides a default `role` of `listitem` for accessibility purposes.
 *
 * @element `spark-list-item`
 * @slot The default slot for inserting content into the list item.
 * @extends SparkComponent
 */
@customElement('spark-list-item')
export class ListItem extends SparkComponent {

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
