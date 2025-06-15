import { html, render, type TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import type { ButtonListItem } from './button-list.interfaces';
import './button-list.scss';

/**
 * Generates a template for a list of buttons.
 *
 * @param items - An array of {@link ButtonListItem} objects to be displayed as buttons.
 * @param notFoundMessage - A message to display when no items are found.
 * Can be a string or a {@link TemplateResult}.
 * Defaults to 'No items found.'.
 * @returns A {@link TemplateResult} representing the list of buttons.
 */
export const buttonListTemplate = (
  items: ButtonListItem[],
  notFoundMessage: TemplateResult | string = 'No items found.',
): TemplateResult => html`
  <ul class="mn-button-list">
    ${items?.length
      ? repeat(items, (item) => item.uid, (item) => html`
        <li class="mn-button-list-item">
          <button
            type="button"
            ?disabled=${item.disabled}
            @click=${async () => await item.action()}
          >
            ${item.contents
              ? item.contents
              : item.uid}
          </button>
        </li>
      `)
      : html`
        <li class="mn-button-list-item mn-not-found">
          ${notFoundMessage}
        </li>
      `}
  </ul>
`;

export function renderButtonList(
  containerId: string,
  items: ButtonListItem[],
  notFoundMessage?: TemplateResult | string,
): void {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} not found`);

  const template = buttonListTemplate(items, notFoundMessage);
  render(template, container);
}

export type * from './button-list.interfaces';
