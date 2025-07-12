import { type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DataListBase } from './data-list-base.js';

/**
 * A data-driven list that manages loading and rendering of items.
 *
 * @param T The type of items in the list; Defaults to `unknown`.
 *
 * @element `mn-data-list`
 * @extends DataListBase
 */
@customElement('mn-data-list')
export class DataList<T = unknown> extends DataListBase<T> {

  static styles = DataListBase.styles;

  /**
   * The property used to uniquely identify each item in the list.
   * @default 'uid'
   */
  @property({ type: String, reflect: true })
  accessor uidProperty = 'uid';

  /**
   * A function that renders the content for each item in the list.
   *
   * @param item - The item to render.
   * @returns A {@link TemplateResult} representing the rendered item.
   */
  @property({ attribute: false })
  accessor item!: (item: T) => TemplateResult;

  protected override update(changedProperties: PropertyValues): void {
    super.update(changedProperties);

    // Rerender the list if the uidProperty changes.
    if (changedProperties.has('uidProperty')) {
      this.requestUpdate();
    }
  }

  protected override renderItem(item: T): TemplateResult {
    return this.item(item);
  }

  protected override uid(item: T): string {
    return (item as any)[this.uidProperty]
        ?? JSON.stringify(item);
  }
}
