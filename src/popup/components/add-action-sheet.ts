import { html, render, TemplateResult } from 'lit-html';
import { buttonListTemplate } from '~shared/components/button-list';
import { AutoRecord, AutoRecordAction } from '~shared/models/auto-record';

/**
 * Generates the template for a single auto-record list item.
 *
 * @returns A {@link TemplateResult} representing the list item.
 */
const addActionSheetTemplate = (
  onAddActionSelect: (action: AutoRecordAction) => void,
): TemplateResult => html`
  <div class="mn-action-sheet">

  </div>
`;

/**
 * Renders the list of add actions for new records.
 *
 * @param records - The list of {@link AutoRecord} objects to be displayed.
 * @param onConfigure - The function to be called when a record is clicked.
 * @param onDelete - The function to be called when a record's delete button is pressed.
 * @param onTogglePause - The function to be called when a record's play / pause button is pressed.
 */
export function renderAddActionsList(
  records: AutoRecord[],
  onConfigure: (record: AutoRecord) => void,
  onDelete: (record: AutoRecord) => Promise<void>,
  onTogglePause: (record: AutoRecord) => Promise<void>,
): void {
}
