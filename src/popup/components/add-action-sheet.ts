import { html, TemplateResult } from 'lit';
import '~shared/components/button-list.js';
import { renderSheet } from '~shared/components/sheet.js';
import { AutoRecordAction } from '~shared/models/auto-record.js';

/**
 * Generates the template for a single auto-record list item.
 *
 * @returns A {@link TemplateResult} representing the list item.
 */
const addActionSheetTemplate = (
  onAddActionSelect: (action: AutoRecordAction) => void,
): TemplateResult => html`
  <div class="action-sheet">
    <mn-button-list
      .items="${[
        {
          uid: 'Click',
          action: () => onAddActionSelect('Click'),
        },
        {
          uid: 'Script',
          action: () => onAddActionSelect('Script'),
        },
      ]}"
      notFoundMessage="No actions available."
    ></mn-button-list>
  </div>
`;

/**
 * Renders the "Add Action" sheet with a list of available actions.
 *
 * @param onAddActionSelect - Callback function to handle action selection.
 */
export function renderAddActionSheet(
  onAddActionSelect: (action: AutoRecordAction) => void,
): void {
  renderSheet(
    'mn-add-action-sheet-container',
    addActionSheetTemplate(onAddActionSelect),
    'Add Action',
  );
}
