import { html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { renderButtonList } from '~shared/components/button-list';
import { type AutoRecord } from '~shared/models/auto-record';
import './auto-record-list.scss';

const autoRecordListItemTemplate = (
  record: AutoRecord,
  onDelete: (record: AutoRecord) => Promise<void>,
  onTogglePause: (record: AutoRecord) => Promise<void>,
) => html`
  <span class="record-name" title="${record.selector}">
    ${record.name || record.selector}
  </span>
  <span class="mn-record-controls">
    <button
      class="mn-round-button ${record.paused ? 'mn-play-button' : 'mn-pause-button'}"
      data-target="${record.uid}"
      title="${record.paused ? 'Play' : 'Pause'}"
      type="button"
      @click=${async (event: MouseEvent) => {
        event.stopPropagation();
        await onTogglePause(record);
      }}
    >
      ${unsafeHTML(record.paused ? '&#9654;' : '&#9208;')}
    </button>
    <button
      class="mn-round-button mn-delete-button"
      data-target="${record.uid}"
      title="Delete"
      type="button"
      @click=${async (event: MouseEvent) => {
        event.stopPropagation();
        await onDelete(record);
      }}
    >
      &#10006;
    </button>
  </span>
`;

/**
 * Renders the list of auto-records.
 *
 * @param records - The list of {@link AutoRecord} objects to be displayed.
 * @param onConfigure - The function to be called when a record is clicked.
 * @param onDelete - The function to be called when a record's delete button is pressed.
 * @param onTogglePause - The function to be called when a record's play / pause button is pressed.
 */
export function renderAutoRecordList(
  records: AutoRecord[],
  onConfigure: (record: AutoRecord) => void,
  onDelete: (record: AutoRecord) => Promise<void>,
  onTogglePause: (record: AutoRecord) => Promise<void>,
): void {
  renderButtonList(
    'mn-auto-records-list-container',
    records.map((record) => ({
      uid: record.uid,
      contents: autoRecordListItemTemplate(record, onDelete, onTogglePause),
      action: () => onConfigure(record),
    })),
    'No auto-records found.',
  );
}
