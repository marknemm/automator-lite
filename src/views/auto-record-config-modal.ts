import { html, render, type TemplateResult } from 'lit-html';
import { AutoRecord } from '../models/auto-record';

const modalTemplate = (
  record: AutoRecord,
  onConfirm: (record: AutoRecord) => void,
  onCancel: () => void,
  error = ''
): TemplateResult => html`
  <div id="mn-record-config-modal" class="mn-modal">
    <div class="mn-modal-content">
      <div class="mn-modal-header">
        <span class="mn-modal-title">
          Automator Record Configuration
        </span>
        <button
          id="mn-record-config-modal-close"
          class="mn-modal-close"
          @click="${{ handleEvent: () => onCancel(), once: true }}"
          title="Close"
        >
          &#10006;
        </button>
      </div>
      <div class="mn-modal-body">
        <div class="mn-modal-error">
          ${error}
        </div>

        <form>
          <label for="mn-record-config-record-name">
            Record Name:
          </label>
          <input
            type="text"
            id="mn-record-config-record-name"
            name="recordName"
            placeholder="Enter record name"
            value="${record.name}"
          />

          <label for="mn-record-config-record-selector">
            Record Selector:
          </label>
          <input
            type="text"
            id="mn-record-config-record-selector"
            name="recordSelector"
            placeholder="Enter record selector"
            readonly
            value="${record.selector}"
          />

          <label for="mn-record-config-record-query-idx">
            Record Query Index:
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
          </label>
          <input
            type="checkbox"
            id="mn-record-config-record-auto-run"
            name="autoRun"
            ?checked="${record.autoRun ?? true}"
          />

          <label for="mn-record-config-record-interval">
            Repeat Interval (ms):
          </label>
          <input
            type="number"
            id="mn-record-config-record-interval"
            name="recordInterval"
            placeholder="Enter record interval"
            min="0"
            value="${record.frequency ?? 0}"
          />
        </form>
      </div>
      <div class="mn-modal-footer">
        <button
          id="mn-record-config-modal-cancel"
          class="mn-modal-cancel"
          @click="${{ handleEvent: () => onCancel(), once: true }}"
          title="Cancel"
        >
          &#10006;
        </button>

        <button
          id="mn-record-config-modal-confirm"
          class="mn-modal-confirm"
          @click="${{ handleEvent: async () => await onConfirm(record), once: true }}"
          title="Confirm"
        >
          &#10004;
        </button>
      </div>
    </div>
  </div>
`;

/**
 * Opens the record configuration modal.
 *
 * @param record - The {@link AutoRecord} to be configured.
 * @returns A {@link Promise} that resolves to the configured {@link record} when the modal is closed.
 */
export async function openRecordConfigModal(record: AutoRecord): Promise<AutoRecord | null> {
  return new Promise((resolve) => {
    const onConfirm = async () => {
      try {
        record.name = (document.getElementById('mn-record-config-record-name') as HTMLInputElement).value.trim();
        record.autoRun = (document.getElementById('mn-record-config-record-auto-run') as HTMLInputElement).checked;
        record.frequency = parseInt((document.getElementById('mn-record-config-record-interval') as HTMLInputElement).value, 10) || 0;
        render('', document.body); // Close the modal
        resolve(record);
      } catch (error) {
        const errMsg = 'Error saving record, please try again.';
        console.error(errMsg, error);
        render(modalTemplate(record, onConfirm, onCancel, errMsg), document.body);
      }
    };

    const onCancel = () => {
      render('', document.body); // Close the modal
      resolve(null); // Resolve with null to indicate cancellation
    };

    console.log('Opening record config modal', record);
    render(modalTemplate(record, onConfirm, onCancel), document.body);
  });
}
