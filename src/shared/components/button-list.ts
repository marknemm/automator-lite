import { html, LitElement, PropertyValues, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ButtonListItem } from './button-list.interfaces.js';

import buttonListStyles from './button-list.scss?inline';

@customElement('mn-button-list')
export class ButtonList<D = unknown> extends LitElement {

  static styles = [unsafeCSS(buttonListStyles)];

  #items: ButtonListItem<D>[] = [];

  @property({ attribute: false })
  get items(): ButtonListItem<D>[] {
    return this.#items;
  }
  set items(value: ButtonListItem<D>[] | D[]) {
    const itemKeys = new Set(['uid', 'data', 'disabled']);

    this.#items = value.filter(Boolean).map((item) => {
      return (item instanceof Object && !Object.keys(item).some(key => !itemKeys.has(key)))
        ? item as ButtonListItem<D>
        : {
          uid: (item as any)[this.uidProperty] ?? JSON.stringify(item),
          data: item,
        } as ButtonListItem<D>;
    });
  }

  @property({ type: String })
  accessor uidProperty = 'uid';

  @property({ attribute: false })
  accessor renderItem: (item: ButtonListItem<D>) => TemplateResult = (item) => html`${item.uid}`;

  @property({ attribute: false })
  accessor onClick: (data: D) => void | Promise<void> = async () => {};

  @property({ type: String })
  accessor notFoundMessage = 'No items found.';

  protected update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has('uidProperty')) {
      // Re-apply mapping with new uidProperty
      this.items = this.#items.map(item => item.data!);
    }
  }

  protected render(): TemplateResult {
    return html`
      <ul class="button-list">
        ${this.items.length
          ? repeat(this.items, (item) => item.uid, (item) => html`
            <li class="button-list-item">
              <button
                type="button"
                ?disabled=${item.disabled}
                @click=${async () => await this.#onClick(item)}
              >
                ${this.renderItem(item)}
              </button>
            </li>
          `)
          : html`
            <li class="button-list-item not-found">
              ${this.notFoundMessage}
              <slot name="not-found"></slot>
            </li>
          `}
      </ul>
    `;
  }

  /**
   * Handles click events on button list items.
   * @param item The clicked button list item.
   * @returns A promise that resolves when the action is complete.
   */
  #onClick(item: ButtonListItem<D>): void | Promise<void> {
    if (item.data) {
      return this.onClick(item.data);
    }
  }
}

export type * from './button-list.interfaces.js';
