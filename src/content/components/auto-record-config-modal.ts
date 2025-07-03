import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fieldHelpTemplate } from '~shared/components/field-help.js';
import { Modal } from '~shared/components/modal.js';
import { AutoRecord } from '~shared/models/auto-record.js';

import styles from './auto-record-config-modal.scss?inline';

@customElement('mn-auto-record-config-modal')
export class AutoRecordConfigModal extends Modal<AutoRecord> {

  static styles = [Modal.styles, unsafeCSS(styles)].flat();

  @state()
  private errMsg: string = '';

  protected renderContent(): TemplateResult {
    return html`
      <div class="modal-header">
        <span class="modal-title">
          Automator Record Configuration
        </span>
        <button
          id="mn-record-config-modal-close"
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

          <label for="mn-record-config-record-name">
            Record Name:
            ${fieldHelpTemplate('A unique name for this record. This helps in identifying the record later.')}
          </label>
          <input
            type="text"
            id="mn-record-config-record-name"
            name="recordName"
            placeholder="${this.data!.selector}"
            value="${this.data!.name}"
          />

          <label for="mn-record-config-record-selector">
            Record Selector:
            ${fieldHelpTemplate('The CSS selector used to identify the element(s) to be recorded. This should be unique to the element you want to target.')}
          </label>
          <input
            type="text"
            id="mn-record-config-record-selector"
            name="recordSelector"
            placeholder="Enter record selector"
            readonly
            required
            value="${this.data!.selector}"
          />

          <label for="mn-record-config-record-query-idx">
            Record Query Index:
            ${fieldHelpTemplate('The index of the query to be recorded. This is used when the selector matches multiple elements.')}
          </label>
          <input
            type="number"
            id="mn-record-config-record-query-idx"
            name="recordQueryIdx"
            placeholder="Enter query index"
            min="0"
            readonly
            value="${this.data!.queryIdx}"
          />

          <label for="mn-record-config-record-auto-run">
            Auto Run:
            ${fieldHelpTemplate('Automatically run this record when the page loads.')}
          </label>
          <input
            type="checkbox"
            id="mn-record-config-record-auto-run"
            name="autoRun"
            ?checked="${this.data!.autoRun ?? true}"
          />

          <label for="mn-record-config-record-interval">
            Repeat Interval:
            ${fieldHelpTemplate('The record will repeat at this interval (milliseconds) if non-zero.')}
          </label>
          <input
            type="number"
            id="mn-record-config-record-interval"
            name="recordInterval"
            placeholder="Enter record interval"
            min="0"
            value="${this.data!.frequency ?? 0}"
          />
        </div>
        <div class="modal-footer">
          <button
            id="mn-record-config-modal-cancel"
            class="modal-cancel"
            @click="${() => this.close()}"
            title="Cancel"
            type="button"
          >
            &#10006;
          </button>

          <button
            id="mn-record-config-modal-confirm"
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
