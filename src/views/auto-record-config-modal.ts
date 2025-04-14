import { html, render, type TemplateResult } from 'lit-html';
import { AutoRecord } from '../models/auto-record';

const modalTemplate = (
  record: AutoRecord,
  onConfirm: (record: AutoRecord) => void,
  onCancel: () => void,
  error = ''
): TemplateResult => html`
  <style>
    .mn-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .mn-modal-content {
      background-color: #fff;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: fadeIn 0.3s ease-in-out;
    }

    .mn-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #ddd;
    }

    .mn-modal-title {
      font-size: 18px;
      font-weight: bold;
    }

    .mn-modal-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
    }

    .mn-modal-body {
      padding: 16px;
    }

    .mn-modal-error {
      color: red;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .mn-modal-error:empty {
      display: none;
    }

    .mn-modal-body form label {
      display: block;
      margin-bottom: 4px;
      font-weight: bold;
    }

    .mn-modal-body form input {
      width: calc(100% - 8px);
      padding: 8px;
      margin-bottom: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .mn-modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
      border-top: 1px solid #ddd;
    }

    .mn-modal-cancel,
    .mn-modal-confirm {
      background-color: #0078d4;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      margin-left: 8px;
    }

    .mn-modal-cancel {
      background-color: #d9534f;
    }

    .mn-modal-cancel:hover,
    .mn-modal-confirm:hover {
      opacity: 0.9;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  </style>

  <div id="mn-record-config-modal" class="mn-modal">
    <div class="mn-modal-content">
      <div class="mn-modal-header">
        <span class="mn-modal-title">
          Automator Record Configuration
        </span>
        <button
          id="mn-record-config-modal-close"
          class="mn-modal-close"
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
        const nameInput = document.getElementById('mn-record-config-record-name') as HTMLInputElement;
        record.name = nameInput.value.trim();
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

    render(modalTemplate(record, onConfirm, onCancel), document.body);
  });
}
