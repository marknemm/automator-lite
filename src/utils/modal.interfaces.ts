import type { TemplateResult } from 'lit-html';

/**
 * Options for configuring the modal behavior.
 */
export interface ModalOptions {

  /**
   * Set to `true` to prevent the auto-focus behavior on the first input element in the modal.
   * @default false
   */
  noFocus?: boolean;

  /**
   * Set to `true` to prevent the modal from closing when the Escape key is pressed.
   * @default false
   */
  noCloseOnEscape?: boolean;

  /**
   * Set to `true` to close the modal when the backdrop is clicked.
   * @default false
   */
  closeOnBackdropClick?: boolean;

}

/**
 * Contextual data for controlling the modal.
 */
export interface ModalContext<T = unknown> {

  /**
   * The {@link ShadowRoot} element of the modal, which can be used to manipulate the modal's DOM.
   */
  modalRoot: ShadowRoot;

  /**
   * Function to close the modal and execute the onClose callback.
   *
   * @param data - Optional data to pass to the onClose callback.
   */
  closeModal: (data?: T) => void;

  /**
   * Function to refresh the modal content with a new template.
   *
   * @param template - The new {@link TemplateResult} to render inside the modal.
   * @param refocus - Optional flag to refocus the first input element after refreshing. Defaults to `false`.
   */
  refreshModal: (template: TemplateResult, refocus?: boolean) => void;

  /**
   * A `Promise` that resolves to the data passed to the {@link closeModal} function when the modal is closed.
   */
  onModalClose: Promise<T | undefined>;

}
