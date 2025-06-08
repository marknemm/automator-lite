import { html, render, type TemplateResult } from 'lit-html';
import deferredPromise from 'p-defer';
import { injectShadowStyles } from '~shared/utils/shadow-styles';
import type { ModalContext, ModalOptions } from './modal.interfaces';
import modalCss from './modal.shadow.scss';

/**
 * Template for the modal popup.
 *
 * @param content - The {@link TemplateResult} to be rendered inside the modal.
 * @param onBackdropClick - Callback function to be called when the backdrop is clicked.
 * @param onEscape - Callback function to be called when the Escape key is pressed.
 * @returns A {@link TemplateResult} representing the modal template.
 */
const modalTemplate = (
  content: TemplateResult,
  onBackdropClick: () => void,
  onEscape: () => void,
): TemplateResult => html`
  <div
    class="mn-modal-backdrop"
    @click="${{ handleEvent: onBackdropClick }}"
    @keydown="${{
      handleEvent: (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        onEscape();
      }
    }}"
  >
    <div
      class="mn-modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @click="${{ handleEvent: (event: Event) => event.stopPropagation() }}"
    >
      ${content}
    </div>
  </div>
`;

/**
 * Utility function to create and manage a modal popup.
 *
 * @param renderContent - A function that returns a {@link TemplateResult} to be rendered inside the modal.
 * The function receives a {@link ModalContext} as an argument.
 * @param options - The {@link ModalOptions} object to configure the modal behavior.
 * @returns The {@link ModalContext} containing contextual data for controlling the modal.
 */
export function renderModal<T>(
  renderContent: (modalContext: ModalContext<T>) => TemplateResult,
  options: ModalOptions = {},
): ModalContext<T> {
  let hostMount: HTMLElement = document.body;
  try { // If in same origin iframe, use the top document body.
    hostMount = window.top?.document.body || document.body;
  } catch { /* Ignore cross-origin iframe access error */ }

  const modalHost = document.createElement('div');
  modalHost.id = 'mn-modal-host';
  hostMount.appendChild(modalHost);
  const modalRoot: ShadowRoot = modalHost.attachShadow({ mode: 'open' });
  injectShadowStyles(modalRoot, modalCss);

  // Create a close function to remove the modal and execute the onClose callback.
  const { promise: onModalClose, resolve } = deferredPromise<T | undefined>();
  const closeModal = (data?: T) => {
    modalHost.remove();
    resolve(data);
  };

  const onBackdropClick = () => options.closeOnBackdropClick && closeModal();
  const onEscape = () => !options.noCloseOnEscape && closeModal();
  const refreshModal = (content: TemplateResult, refocus = false) => {
    render(modalTemplate(content, onBackdropClick, onEscape), modalRoot);
    if (refocus) {
      requestAnimationFrame(() => (modalRoot.querySelector('input, select, textarea') as HTMLElement)?.focus());
    }
  };

  const modalContent: ModalContext<T> = {
    modalRoot,
    closeModal,
    refreshModal,
    onModalClose,
  };

  refreshModal(renderContent(modalContent), !options.noFocus);
  return modalContent;
}

export type * from './modal.interfaces';
