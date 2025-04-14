import { html, render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { type AutoRecord } from '../models/auto-record';

/**
 * Generates the template for the list of auto-records.
 *
 * @param records - The list of {@link AutoRecord} objects to be displayed.
 * @param onDelete - The function to be called when a record's delete button is pressed.
 * @returns A {@link TemplateResult} representing the list of auto-records.
 */
const autoRecordListTemplate = (
  records: AutoRecord[],
  onDelete: (record: AutoRecord) => Promise<void>
) =>
  records?.length
   ? repeat(records, (record) => record.uid, (record) => html`
      <li class="mn-auto-record-list-item">
        <span class="record-name">
          ${record.name}
        </span>
        <button
          class="delete-button"
          @click=${async () => await onDelete(record)}
          data-target="${record.uid}"
          title="Delete"
        >
          &#10006;
        </button>
      </li>
    `)
    : html`
      <li class="mn-auto-record-list-item not-found">
        No records found.
      </li>
    `;

/**
 * Renders the list of auto-records.
 *
 * @param records - The list of {@link AutoRecord} objects to be displayed.
 * @param onDelete - The function to be called when a record's delete button is pressed.
 */
export function renderAutoRecordList(
  records: AutoRecord[],
  onDelete: (record: AutoRecord) => Promise<void>
): void {
  const container = document.getElementById('mn-auto-records-list');
  if (!container) throw new Error('#mn-auto-records-list not found');

  render(autoRecordListTemplate(records, onDelete), container);
}
