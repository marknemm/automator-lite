import { html, type TemplateResult } from 'lit-html';
import deferredPromise from 'p-defer';
import { mountTemplate, withStyles, type Template } from '~shared/utils/mount';
import type { ModalContext, ModalOptions } from './modal.interfaces';

import modalStyles from './modal.scss?inline';

/**
 * Template for the modal popup.
 *
 * @param content - The {@link TemplateResult} to be rendered inside the modal.
 * @param onBackdropClick - Callback function to be called when the backdrop is clicked.
 * @param onEscape - Callback function to be called when the Escape key is pressed.
 * @returns A {@link TemplateResult} representing the modal template.
 */
const modalTemplate = (
  content: Template,
  onBackdropClick: () => void,
  onEscape: () => void,
): TemplateResult => html`
  ${withStyles(modalStyles)}

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
  renderContent: (modalContext: ModalContext<T>) => Template,
  options: ModalOptions = {},
): ModalContext<T> {
  const { promise: onModalClose, resolve } = deferredPromise<T | undefined>();
  const modalCtx = { onModalClose } as ModalContext<T>; // Will init other properties below.

  mountTemplate({
    mountPoint: document.body,
    mountMode: 'append',
    shadowRootInit: { mode: 'open' },
    template: ({ refresh, unmount }) => {
      modalCtx.closeModal = (data?: T) => {
        unmount();
        resolve(data);
      };
      modalCtx.refreshModal = (content: TemplateResult) => refresh(
        modalTemplate(content, onBackdropClick, onEscape)
      );

      const onBackdropClick = () => options.closeOnBackdropClick && modalCtx.closeModal();
      const onEscape = () => !options.noCloseOnEscape && modalCtx.closeModal();

      return modalTemplate(renderContent(modalCtx), onBackdropClick, onEscape);
    },
    afterRender: ({ shadowRoot }) => (!options.noFocus && !shadowRoot?.contains(document.activeElement))
      ? (shadowRoot?.querySelector('input, select, textarea') as HTMLElement)?.focus()
      : undefined,
  });

  return modalCtx;
}

export type * from './modal.interfaces';
