import { html, type TemplateResult } from 'lit-html';
import deferredPromise from 'p-defer';
import { mountShadowTemplate } from '~shared/utils/mount';
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
      },
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
  const { promise: onModalClose, resolve } = deferredPromise<T | undefined>();
  const modalCtx = { onModalClose } as ModalContext<T>; // Will init other properties below.

  mountShadowTemplate(
    document.body,
    ({ refresh, unmount, shadowRoot }) => {
      modalCtx.closeModal = (data?: T) => {
        unmount();
        resolve(data);
      };

      const onBackdropClick = () => options.closeOnBackdropClick && modalCtx.closeModal();
      const onEscape = () => !options.noCloseOnEscape && modalCtx.closeModal();

      modalCtx.refreshModal = (content: TemplateResult, refocus = false) => {
        refresh(modalTemplate(content, onBackdropClick, onEscape));
        if (refocus) {
          requestAnimationFrame(() => {
            (shadowRoot?.querySelector('input, select, textarea') as HTMLElement)?.focus();
          });
        }
      };

      return modalTemplate(renderContent(modalCtx), onBackdropClick, onEscape);
    },
    { mode: 'open', styles: modalCss },
  );

  return modalCtx;
}

export type * from './modal.interfaces';
