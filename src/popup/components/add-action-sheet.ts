// import { html, render, TemplateResult } from 'lit-html';
// import { repeat } from 'lit-html/directives/repeat.js';
// import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
// import { AutoRecordAction, type AutoRecord } from '~shared/models/auto-record';

// /**
//  * Generates the template for the list of auto-records.
//  *
//  * @param records - The list of {@link AutoRecord} objects to be displayed.
//  * @param onConfigure - The function to be called when a record is clicked.
//  * @param onDelete - The function to be called when a record's delete button is pressed.
//  * @param onTogglePause - The function to be called when a record's play / pause button is pressed.
//  * @returns A {@link TemplateResult} representing the list of auto-records.
//  */
// const addActionListTemplate = (
//   records: AutoRecord[],
//   onAddActionSelect: (action: AutoRecordAction) => void,
// ): TemplateResult =>
//   records?.length
//    ? repeat(records, (record) => record.uid, (record) => html`
//       <li
//         class="mn-add-action-list-item"
//         @click=${async () => await onAddActionSelect(record)}
//       >
//         <button
//           type="button"
//           @click=${async () => await onAddActionSelect(record)}
//         >
//           <span class="record-name" title="${record.selector}">
//             ${record.name}
//           </span>
//           <span class="mn-record-controls">
//             <button
//               class="mn-round-button ${record.paused ? 'mn-play-button' : 'mn-pause-button'}"
//               data-target="${record.uid}"
//               title="${record.paused ? 'Play' : 'Pause'}"
//               @click=${async (event: MouseEvent) => {
//                 event.stopPropagation();
//                 await onTogglePause(record);
//               }}
//             >
//               ${unsafeHTML(record.paused ? '&#9654;' : '&#9208;')}
//             </button>
//             <button
//               class="mn-round-button mn-delete-button"
//               data-target="${record.uid}"
//               title="Delete"
//               @click=${async (event: MouseEvent) => {
//                 event.stopPropagation();
//                 await onDelete(record);
//               }}
//             >
//               &#10006;
//             </button>
//           </span>
//         </button>
//       </li>
//     `) as TemplateResult
//     : html`
//       <li class="mn-auto-record-list-item not-found">
//         No records found.
//       </li>
//     `;

// /**
//  * Renders the list of add actions for new records.
//  *
//  * @param records - The list of {@link AutoRecord} objects to be displayed.
//  * @param onConfigure - The function to be called when a record is clicked.
//  * @param onDelete - The function to be called when a record's delete button is pressed.
//  * @param onTogglePause - The function to be called when a record's play / pause button is pressed.
//  */
// export function renderAddActionsList(
//   records: AutoRecord[],
//   onConfigure: (record: AutoRecord) => void,
//   onDelete: (record: AutoRecord) => Promise<void>,
//   onTogglePause: (record: AutoRecord) => Promise<void>,
// ): void {
//   const container = document.getElementById('mn-auto-records-list');
//   if (!container) throw new Error('#mn-auto-records-list not found');

//   render(autoRecordListTemplate(records, onConfigure, onDelete, onTogglePause), container);
// }
