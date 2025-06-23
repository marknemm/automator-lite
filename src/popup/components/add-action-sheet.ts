import { html, TemplateResult } from 'lit-html';
import { buttonListTemplate } from '~shared/components/button-list';
import { renderSheet } from '~shared/components/sheet';
import { AutoRecordAction } from '~shared/models/auto-record';

/**
 * Generates the template for a single auto-record list item.
 *
 * @returns A {@link TemplateResult} representing the list item.
 */
const addActionSheetTemplate = (
  onAddActionSelect: (action: AutoRecordAction) => void,
): TemplateResult => html`
  <div class="mn-action-sheet">
    ${buttonListTemplate([
      {
        uid: 'Click',
        action: () => onAddActionSelect('Click'),
      },
      {
        uid: 'Script',
        action: () => onAddActionSelect('Script'),
      },
    ])}
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
