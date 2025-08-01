// This script runs in the context of the extension popup.

import { Task } from '@lit/task';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AutoRecord, type AutoRecordType } from '~shared/models/auto-record.js';
import { sendMessage } from '~shared/utils/messaging.js';
import { onStateChange } from '~shared/utils/state.js';
import './components/add-action-sheet.js';
import './components/auto-record-list.js';

import './popup-global.scss';
import styles from './popup.scss?inline';

/**
 * The main popup component for the Automator Lite extension.
 *
 * @element `mn-popup`
 * @extends LitElement
 */
@customElement('mn-popup')
export class Popup extends LitElement {

  static styles = [unsafeCSS(styles)];

  #loadRecordsTask = new Task(this, { task: () => AutoRecord.loadMany() });

  @state()
  private accessor addActionSheetOpened = false;

  override connectedCallback(): void {
    super.connectedCallback();
    sendMessage({
      route: 'stopRecording',
      contexts: ['content'],
    });

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
    sendMessage({
      route: 'configureRecord',
      contexts: ['content'],
      topFrameOnly: true, // Only show config dialog in the top content window.
      payload: record.state,
    });
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
   * Opens the action sheet for adding a new action.
   */
  #openActionSheet(): void {
    this.addActionSheetOpened = true;
  }

  /**
   * Closes the action sheet.
   */
  #closeActionSheet(): void {
    this.addActionSheetOpened = false;
  }

  /**
   * Handles the selection of an action from the action sheet.
   *
   * @param action - The action that was selected.
   */
  #onAddActionSelect(action: AutoRecordType): void {
    if (action === 'Recording') {
      sendMessage({
        route: 'startRecording',
        contexts: ['content'],
      });
    }
    window.close();
  }

  protected override render(): TemplateResult {
    return html`
      <h1 class="main-title">
        <span>Autom&#129302;tor L<span class="lightbulb-i">i</span>te</span>
      </h1>

      <div class="popup-body">
        <div class="description">
          Automate your web experience with ease. <br>
          Record and replay actions on any webpage. <br>
        </div>

        <div class="auto-record-list-container">
          <div class="auto-record-list-header">
            <h2 class="subtitle">
              Automation Records
            </h2>

            <button
              type="button"
              class="add-button"
              title="Add a new automation record"
              @click=${() => this.#openActionSheet()}
            >
              &#43;
            </button>
          </div>

          <mn-auto-record-list
            .task=${this.#loadRecordsTask}
            .onConfigure=${(record: AutoRecord) => this.#configureRecord(record)}
            .onDelete=${(record: AutoRecord) => this.#deleteRecord(record)}
            .onTogglePause=${(record: AutoRecord) => this.#toggleRecordPause(record)}
          ></mn-auto-record-list>

          <mn-add-action-sheet
            .opened=${this.addActionSheetOpened}
            .onOpenChange=${() => this.#closeActionSheet()}
            .onAddActionSelect=${(action: AutoRecordType) => this.#onAddActionSelect(action)}
          ></mn-add-action-sheet>
        </div>
      </div>
    `;
  }

}
