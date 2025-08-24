import { Task } from '@lit/task/task.js';
import { html, type TemplateResult, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import styles from './data-list.scss?inline';
import { List } from './list.js';

/**
 * Base class for data-driven lists that manage loading and rendering of items.
 *
 * This class provides a structure for lists that can handle asynchronous data loading
 * and rendering of items, including initial, pending, complete, and error states.
 *
 * @template T The type of items in the list; defaults to `unknown`.
 * @extends List
 */
export abstract class DataListBase<T = unknown> extends List {

  static styles = [unsafeCSS(styles)];

  /**
   * The {@link Task} that manages the loading and rendering of items.
   */
  @property({ attribute: false })
  accessor task!: Task<unknown[], T[]>;

  /**
   * Renders the content of the data list.
   *
   * Prioritize overriding any of the following methods instead:
   * - {@link renderItems} - to customize how all loaded items are rendered.
   * - {@link renderItem} - to customize how each loaded item is rendered.
   * - {@link renderInitial} - to customize the initial state prior to first load.
   * - {@link renderPending} - to customize the pending (loading) state.
   * - {@link renderError} - to customize the error state.
   */
  protected override renderContent(): TemplateResult {
    return html`
      ${this.task.render({
        initial: () => this.renderInitial(),
        pending: () => this.renderPending(),
        complete: (items: T[]) => this.renderItems(items),
        error: (error: unknown) => this.renderError(error),
      })}
    `;
  }

  /**
   * Renders the initial state of the list, typically when no items are loaded yet.
   * This method can be overridden to provide specific content for the initial state.
   * Otherwise, it defaults to rendering a `<slot name="initial">` element that allows for custom content insertion.
   *
   * @returns A {@link TemplateResult} to render when the list is in its initial state.
   */
  protected renderInitial(): TemplateResult {
    return html`<slot name="initial"></slot>`;
  }

  /**
   * Renders the pending state of the list, typically when items are being loaded.
   * This method can be overridden to provide specific content for the pending state.
   * Otherwise, it defaults to rendering a `<slot name="pending">` element that allows for custom content insertion.
   *
   * @returns A {@link TemplateResult} to render when the list is in a pending state.
   */
  protected renderPending(): TemplateResult {
    return this.task.value
      ? this.renderItems(this.task.value)
      : html`<slot name="pending"></slot>`;
  }

  /**
   * Renders the list of items using the defined {@link renderItem} method.
   *
   * @param items The items to render.
   * @returns A {@link TemplateResult} containing the rendered items.
   */
  protected renderItems(items: T[]): TemplateResult {
    return items?.length
      ? repeat(
        items,
        (item: any) => this.uid(item),
        (item) => this.renderItem(item)
      ) as TemplateResult
      : this.renderEmpty();
  }

  /**
   * Gets the unique identifier for an item.
   * This method can be overridden to provide a custom unique identifier for items.
   * Otherwise, it defaults to using the `uid` property of the item or its stringified JSON representation.
   *
   * @param item The item to get the unique identifier for.
   * @returns The unique identifier for the item.
   */
  protected uid(item: T): string {
    return (item as any)['uid']
        ?? JSON.stringify(item);
  }

  /**
   * Renders a single item in the list.
   *
   * @param item The item to render.
   * @returns A {@link TemplateResult} containing the rendered item.
   */
  protected abstract renderItem(item: T): TemplateResult;

  /**
   * Renders the content to display when there are no items in the list.
   * This method can be overridden to provide specific content for the empty state.
   * Otherwise, it defaults to rendering a `<slot name="empty">` element that allows for custom content insertion.
   *
   * @returns A {@link TemplateResult} to render when there are no items in the list.
   */
  protected renderEmpty(): TemplateResult {
    return html`
      <slot name="empty">
        <div class="empty">No items found.</div>
      </slot>
    `;
  }

  /**
   * Renders the content to display when an error occurs while loading items.
   * This method can be overridden to provide specific content for the error state.
   * Otherwise, it defaults to rendering a `<slot name="error">` element that allows for custom content insertion.
   *
   * @param error The error that occurred.
   * @returns A {@link TemplateResult} to render when an error occurs.
   */
  protected renderError(error: unknown): TemplateResult {
    console.error('Error loading items:', error);
    return html`
      <slot name="error">
        <div class="error">
          <p>Error loading items: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      </slot>
    `;
  }

}

export default DataListBase;
