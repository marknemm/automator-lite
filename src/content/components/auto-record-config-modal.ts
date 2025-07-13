import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '~shared/components/field-help.js';
import { Modal } from '~shared/components/modal.js';
import { autoFocus } from '~shared/directives/auto-focus.js';
import { type AutoRecord } from '~shared/models/auto-record.js';

import styles from './auto-record-config-modal.scss?inline';

/**
 * A {@link Modal} component for configuring an auto-record.
 *
 * @element `mn-auto-record-config-modal`
 * @extends Modal<AutoRecord>
 */
@customElement('mn-auto-record-config-modal')
export class AutoRecordConfigModal extends Modal<AutoRecord> {

  static styles = [unsafeCSS(styles)];

  @state()
  private accessor errMsg = '';

  protected override renderContent(): TemplateResult {
    return html`
      <div class="modal-header">
        <h2 class="modal-title">
          Automator Lite<br>Record Configuration
        </h2>
        <button
          class="close-button"
          @click="${() => this.close()}"
          title="Close"
          type="button"
        >
          &#10006;
        </button>
      </div>
      <form @submit="${(event: SubmitEvent) => this.#submit(event)}">
        <div class="modal-body">
          <div class="modal-error">
            ${this.errMsg}
          </div>

          <label for="record-config-record-name">
            Record Name:
            <mn-field-help>A name for this record.</mn-field-help>
          </label>
          <input
            ${autoFocus()}
            type="text"
            id="record-config-record-name"
            name="recordName"
            required
            value="${this.data!.name}"
          />

          <label for="record-config-record-auto-run">
            Auto Run:
            <mn-field-help>Automatically run this record when the page loads.</mn-field-help>
          </label>
          <input
            type="checkbox"
            id="record-config-record-auto-run"
            name="autoRun"
            ?checked="${this.data!.autoRun ?? true}"
          />

          <label for="record-config-record-interval">
            Repeat Interval:
            <mn-field-help>The record will repeat at this interval (milliseconds) if non-zero.</mn-field-help>
          </label>
          <input
            type="number"
            id="record-config-record-interval"
            name="recordInterval"
            placeholder="Enter record interval"
            min="0"
            value="${this.data!.frequency ?? 0}"
          />
        </div>
        <div class="modal-footer">
          <button
            id="record-config-modal-cancel"
            class="modal-cancel"
            @click="${() => this.close()}"
            title="Cancel"
            type="button"
          >
            &#10006;
          </button>

          <button
            id="record-config-modal-confirm"
            class="modal-confirm"
            title="Confirm"
            type="submit"
          >
            &#10004;
          </button>
        </div>
      </form>
    `;
  }

  #submit(event: SubmitEvent): void {
    event.preventDefault(); // Do not refresh the page on form submission
    this.errMsg = ''; // Reset error message

    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return; // Ensure the form is valid before proceeding
    const formData = new FormData(form);

    try {
      this.data!.name = formData.get('recordName')?.toString().trim() ?? '';
      this.data!.autoRun = formData.has('autoRun');
      this.data!.frequency = parseInt(formData.get('recordInterval')?.toString() ?? '0', 10);
      this.close(this.data!); // Close the modal and resolve with the updated record
    } catch (error) {
      console.error(error);
      this.errMsg = 'Error saving record, please try again.';
    }
  }
}
