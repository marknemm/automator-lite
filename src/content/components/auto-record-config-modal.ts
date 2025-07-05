import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '~shared/components/field-help.js';
import { Modal } from '~shared/components/modal.js';
import { AutoRecord } from '~shared/models/auto-record.js';

import styles from './auto-record-config-modal.scss?inline';

@customElement('mn-auto-record-config-modal')
export class AutoRecordConfigModal extends Modal<AutoRecord> {

  static styles = [Modal.styles, unsafeCSS(styles)].flat();

  @state()
  private accessor errMsg: string = '';

  protected renderContent(): TemplateResult {
    return html`
      <div class="modal-header">
        <span class="modal-title">
          Automator Record Configuration
        </span>
        <button
          id="record-config-modal-close"
          class="modal-close"
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
            <mn-field-help>A unique name for this record. This helps in identifying the record later.</mn-field-help>
          </label>
          <input
            type="text"
            id="record-config-record-name"
            name="recordName"
            placeholder="${this.data!.selector}"
            value="${this.data!.name}"
          />

          <label for="record-config-record-selector">
            Record Selector:
            <mn-field-help>The CSS selector used to identify the element(s) to be recorded. This should be unique to the element you want to target.</mn-field-help>
          </label>
          <input
            type="text"
            id="record-config-record-selector"
            name="recordSelector"
            placeholder="Enter record selector"
            readonly
            required
            value="${this.data!.selector}"
          />

          <label for="record-config-record-query-idx">
            Record Query Index:
            <mn-field-help>The index of the query to be recorded. This is used when the selector matches multiple elements.</mn-field-help>
          </label>
          <input
            type="number"
            id="record-config-record-query-idx"
            name="recordQueryIdx"
            placeholder="Enter query index"
            min="0"
            readonly
            value="${this.data!.queryIdx}"
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
