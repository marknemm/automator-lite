import { html, type TemplateResult } from 'lit-html';
import { createRef, ref, type Ref } from 'lit-html/directives/ref.js';
import { AutoRecord } from '../models/auto-record';
import { ModalContext, renderModal } from '../utils/modal';
import { fieldHelpTemplate } from '../partials/field-help';

const formRef: Ref<HTMLFormElement> = createRef();

/**
 * Template for the record configuration modal content.
 *
 * @param record - The {@link AutoRecord} to be configured.
 * @param onConfirm - Callback function to be called when the user confirms the configuration.
 * @param onCancel - Callback function to be called when the user cancels the configuration.
 * @param errMsg - Optional error message to display in the modal.
 * @returns A {@link TemplateResult} representing the modal content.
 */
const contentTemplate = (
  record: AutoRecord,
  onConfirm: (formData: FormData) => void,
  onCancel: () => void,
  errMsg = '',
): TemplateResult => html`
  <div class="mn-modal-header">
    <span class="mn-modal-title">
      Automator Record Configuration
    </span>
    <button
      id="mn-record-config-modal-close"
      class="mn-modal-close"
      @click="${{ handleEvent: () => onCancel() }}"
      title="Close"
      type="button"
    >
      &#10006;
    </button>
  </div>
  <form
    ${ref(formRef)}
    @submit="${{ handleEvent: (event: Event) => {
      event.preventDefault();
      if (formRef.value?.checkValidity()) {
        onConfirm(new FormData(formRef.value));
      }
    }}}"
  >
    <div class="mn-modal-body">
      <div class="mn-modal-error">
        ${errMsg}
      </div>

      <label for="mn-record-config-record-name">
        Record Name:
        ${fieldHelpTemplate('A unique name for this record. This helps in identifying the record later.')}
      </label>
      <input
        type="text"
        id="mn-record-config-record-name"
        name="recordName"
        placeholder="${record.selector}"
        value="${record.name}"
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
        value="${record.selector}"
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
        value="${record.queryIdx}"
      />

      <label for="mn-record-config-record-auto-run">
        Auto Run:
        ${fieldHelpTemplate('Automatically run this record when the page loads.')}
      </label>
      <input
        type="checkbox"
        id="mn-record-config-record-auto-run"
        name="autoRun"
        ?checked="${record.autoRun ?? true}"
      />

      <label for="mn-record-config-record-interval">
        Repeat Interval:
        ${fieldHelpTemplate('The interval in milliseconds between each record execution.')}
      </label>
      <input
        type="number"
        id="mn-record-config-record-interval"
        name="recordInterval"
        placeholder="Enter record interval"
        min="0"
        value="${record.frequency ?? 0}"
      />
    </div>
    <div class="mn-modal-footer">
      <button
        id="mn-record-config-modal-cancel"
        class="mn-modal-cancel"
        @click="${{ handleEvent: () => onCancel() }}"
        title="Cancel"
        type="button"
      >
        &#10006;
      </button>

      <button
        id="mn-record-config-modal-confirm"
        class="mn-modal-confirm"
        title="Confirm"
        type="submit"
      >
        &#10004;
      </button>
    </div>
  </form>
`;

/**
 * Opens the record configuration modal.
 *
 * @param record - The {@link AutoRecord} to be configured.
 * @returns A {@link Promise} that resolves to the configured {@link record} when the modal is closed.
 */
export function openRecordConfigModal(record: AutoRecord): ModalContext<AutoRecord> {
  return renderModal<AutoRecord>(({ closeModal, refreshModal }) => {
    const onConfirm = (formData: FormData) => {
      try {
        record.name = formData.get('recordName')?.toString().trim() ?? '';
        record.autoRun = formData.has('autoRun');
        record.frequency = parseInt(formData.get('recordInterval')?.toString() ?? '0', 10);
        closeModal(record); // Close the modal and resolve with the updated record
      } catch (error) {
        console.error(error);
        const errMsg = 'Error saving record, please try again.';
        const refreshContent = contentTemplate(record, onConfirm, closeModal, errMsg);
        refreshModal(refreshContent);
      }
    };

    return contentTemplate(record, onConfirm, closeModal);
  });
}
