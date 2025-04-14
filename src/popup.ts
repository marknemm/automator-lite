// This script runs in the context of the extension popup.

import { AutoRecord, loadRecords } from './models/auto-record.js';
import { onStateChange, saveState } from './utils/state.js';
import { renderAutoRecordList } from './views/auto-record-list.js';

// Once the extension popup DOM is fully loaded, initialize the popup.
document.addEventListener('DOMContentLoaded', async () => {

  await saveState({ addActive: false }); // Reset the addActive state to false.

  // When the add button is clicked, set the state to addActive and close the popup.
  const addButton = document.getElementById('mn-add-auto-record') as HTMLButtonElement;
  addButton?.addEventListener('click', async () => {
    await saveState({ addActive: true });
    window.close();
  });

  // Initialize the auto-record list, and refresh upon changes in the records state.
  await refreshList();
  onStateChange(async () => await refreshList(), 'records');

});

/**
 * Refreshes the list of click targets in the popup.
 *
 * @returns A {@link Promise} that resolves when the list is refreshed.
 */
async function refreshList(): Promise<void> {
  const records = await loadRecords();
  renderAutoRecordList(records, deleteRecord);
}

/**
 * Deletes a record from the list.
 *
 * @param record - The {@link AutoRecord} to delete.
 * @returns A {@link Promise} that resolves when the record is deleted.
 */
async function deleteRecord(record: AutoRecord): Promise<void> {
  if (!window.confirm('Are you sure you want to delete this record?')) return;
  await record.delete();
  await refreshList();
}
