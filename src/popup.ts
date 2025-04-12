// This script runs in the context of the extension popup.

import { AutoRecord, loadRecords } from './models/auto-record.js';
import { saveState, onStateChange } from './utils/state.js';

document.addEventListener('DOMContentLoaded', async () => {

  await saveState({ addActive: false });

  const addButton = document.getElementById('mn-add-action') as HTMLButtonElement;
  const list = document.getElementById('mn-actions') as HTMLUListElement;

  addButton?.addEventListener('click', async () => {
    await saveState({ addActive: true });
    window.close();
  });

  await refreshList();

  // Listen for changes in the records state and refresh the list accordingly.
  onStateChange(async () => {
    await refreshList();
  }, 'records');

  /**
   * Refreshes the list of click targets in the popup.
   */
  async function refreshList() {
    list.innerHTML = ''; // Clear the list before populating it.

    const records = await loadRecords();
    records.forEach(record => {
      const li = genListItem(record);
      list.appendChild(li);
    });

    if (records.length === 0) {
      const li = genNotFound();
      list.appendChild(li);
    }
  }

  /**
   * Generates a list item for a {@link AutoRecord}.
   *
   * @param record - The {@link AutoRecord} to generate the list item for.
   * @returns The generated {@link HTMLLIElement}.
   */
  function genListItem(record: AutoRecord): HTMLLIElement {
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.setAttribute('data-target', record.name);
    deleteButton.setAttribute('title', 'Delete');
    deleteButton.innerHTML = '&#10006;'; // Unicode for multiplication sign
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm('Are you sure you want to delete this record?')) return;
      await record.delete();
    });

    const li = document.createElement('li');
    li.classList.add('target');
    li.innerHTML = `<span class="record-name">${record.name}</span>`;
    li.appendChild(deleteButton);
    return li;
  }

  /**
   * Generates a list item indicating that no click targets were found.
   *
   * @returns The generated {@link HTMLLIElement} indicating no click targets were found.
   */
  function genNotFound(): HTMLLIElement {
    const li = document.createElement('li');
    li.classList.add('not-found');
    li.innerHTML = `<span>No click targets found.</span>`;
    return li;
  }

});
