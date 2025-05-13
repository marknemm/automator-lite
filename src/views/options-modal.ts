import { html, type TemplateResult } from 'lit-html';
import { createRef, ref, type Ref } from 'lit-html/directives/ref.js';
import { ModalContext, renderModal } from '../utils/modal';

const formRef: Ref<HTMLFormElement> = createRef();

const contentTemplate = (
  settings: Record<string, any>,
  onConfirm: (formData: FormData) => void,
  onCancel: () => void,
  error = '',
): TemplateResult => html`
  <div class="mn-modal-header">
    <span class="mn-modal-title">
      Extension Settings
    </span>
    <button
      id="mn-options-modal-close"
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
        ${error}
      </div>

      <label for="mn-options-setting-theme">
        Theme:
      </label>
      <select id="mn-options-setting-theme" name="theme">
        <option value="light" ?selected="${settings.theme === 'light'}">Light</option>
        <option value="dark" ?selected="${settings.theme === 'dark'}">Dark</option>
      </select>

      <label for="mn-options-setting-interval">
        Default Interval (ms):
      </label>
      <input
        type="number"
        id="mn-options-setting-interval"
        name="defaultInterval"
        placeholder="Enter default interval"
        min="0"
        value="${settings.defaultInterval ?? 1000}"
      />

      <label for="mn-options-setting-enable-logs">
        Enable Logs:
      </label>
      <input
        type="checkbox"
        id="mn-options-setting-enable-logs"
        name="enableLogs"
        ?checked="${settings.enableLogs ?? false}"
      />
    </div>
    <div class="mn-modal-footer">
      <button
        id="mn-options-modal-cancel"
        class="mn-modal-cancel"
        @click="${{ handleEvent: () => onCancel() }}"
        title="Cancel"
        type="button"
      >
        &#10006;
      </button>

      <button
        id="mn-options-modal-confirm"
        class="mn-modal-confirm"
        title="Confirm"
        type="submit"
      >
        &#10004;
      </button>
    </div>
  </form>
`;

export function openOptionsModal(settings: Record<string, any>): ModalContext<Record<string, any>> | null {
  const modalContext = renderModal<Record<string, any>>(
    ({ closeModal, refreshModal }) => {
      const onConfirm = (formData: FormData) => {
        try {
          settings.theme = formData.get('theme') as string;
          settings.defaultInterval = parseInt(formData.get('defaultInterval') as string, 10) || 1000;
          settings.enableLogs = formData.get('enableLogs') === 'on';
          closeModal(settings);
        } catch (error) {
          const errMsg = 'Error saving settings, please try again.';
          console.error(errMsg, error);
          refreshModal(contentTemplate(settings, onConfirm, closeModal, errMsg));
        }
      };

      return contentTemplate(settings, onConfirm, closeModal);
    },
  );

  return modalContext;
}
