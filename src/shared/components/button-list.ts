import { html, type TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { host, MountOptions, type MountPoint, type MountResult, mountTemplate, Template } from '~shared/utils/mount';
import type { ButtonListItem } from './button-list.interfaces';

import buttonListStyles from './button-list.scss?inline';

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
  notFoundMessage: Template = 'No items found.',
): TemplateResult => html`
  <template ${host(buttonListStyles)} class="mn-button-list-host"></template>

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
  mountPoint: MountPoint,
  items: ButtonListItem[],
  notFoundMessage?: Template,
  mountOptions: MountOptions = {},
): MountResult {
  return mountTemplate({
    mountPoint,
    template: buttonListTemplate(items, notFoundMessage),
    ...mountOptions,
  });
}

export type * from './button-list.interfaces';
