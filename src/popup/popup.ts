// This script runs in the context of the extension popup.

import { Task } from '@lit/task';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AutoRecord, loadRecords } from '~shared/models/auto-record.js';
import { onStateChange } from '~shared/utils/state.js';
import './components/auto-record-list.js';
// import { renderAddActionSheet } from './components/add-action-sheet.js';

import styles from './popup.scss?inline';

@customElement('mn-popup')
export class Popup extends LitElement {

  static styles = [unsafeCSS(styles)];

  #loadRecordsTask = new Task(this, {
    task: loadRecords,
  });

  connectedCallback(): void {
    super.connectedCallback();
    sendContentMessage({ type: 'addActive', payload: false }); // Reset the addActive state to false.

    // Initialize the auto-record list, and refresh upon changes in the records state.
    this.#loadRecordsTask.run();
    onStateChange(async () => this.#loadRecordsTask.run(), 'records');
  }

  /**
   * Configures a record by opening the configuration modal.
   *
   * @param record - The {@link AutoRecord} to configure.
   */
  #configureRecord(record: AutoRecord): void {
    sendContentMessage({ type: 'configureRecord', payload: record.recordState });
    window.close();
  }

  /**
   * Deletes a record from the list.
   *
   * @param record - The {@link AutoRecord} to delete.
   * @returns A {@link Promise} that resolves when the record is deleted.
   */
  async #deleteRecord(record: AutoRecord): Promise<void> {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    await record.delete();
  }

  /**
   * Toggles the pause state of a record.
   *
   * @param record - The {@link AutoRecord} to toggle the pause state for.
   * @returns A {@link Promise} that resolves when the pause state is toggled.
   */
  async #toggleRecordPause(record: AutoRecord): Promise<void> {
    record.paused = !record.paused;
    await record.save();
  }

  /**
   * Starts the process of adding a new record.
   */
  #addRecord(): void {
    // renderAddActionSheet((action) => {
    //   console.log('Selected action:', action);
    // });
    sendContentMessage({ type: 'addActive', payload: true });
    window.close();
  }

  protected render(): TemplateResult {
    return html`
      <h1 class="main-title">
        &#129302;<span>Automator Lite</span>&#129302;
      </h1>

      <div class="popup-body">
        <div class="description">
          Automate your web experience with ease. <br>
          Record and replay actions on any webpage. <br>
        </div>

        <div class="auto-record-list-container">
          <div class="auto-record-list-header">
            <h2 class="subtitle">
              Recorded Actions
            </h2>

            <button
              type="button"
              class="add-button"
              title="Add a new action record"
              @click=${() => this.#addRecord()}
            >
              &#43;
            </button>
          </div>

          ${this.#renderRecordsList()}
        </div>

        <!-- add-action-sheet.ts -->
      </div>
    `;
  }

  #renderRecordsList(): TemplateResult {
    const autoRecordListTmpl = html`
      <mn-auto-record-list
        .items=${this.#loadRecordsTask.value ?? []}
        .onConfigure=${(record: AutoRecord) => this.#configureRecord(record)}
        .onDelete=${(record: AutoRecord) => this.#deleteRecord(record)}
        .onTogglePause=${(record: AutoRecord) => this.#toggleRecordPause(record)}
      ></mn-auto-record-list>
    `;

    return this.#loadRecordsTask.render({
      initial: () => html`<div class="loading">Loading records...</div>`,
      pending: () => this.#loadRecordsTask.value
        ? autoRecordListTmpl
        : html`<div class="loading">Loading records...</div>`,
      complete: () => autoRecordListTmpl,
      error: (error) => {
        console.error('Error loading records:', error);
        return html`<div class="error">Error loading records.</div>`;
      },
    });
  }

}

/**
 * Sends a message to the content script.
 *
 * @param message The message to send to the content script.
 */
function sendContentMessage(message: any): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}
