import type { TemplateResult } from 'lit';
import type { MountPoint, Template } from '~shared/utils/mount.interfaces.js';

/**
 * Options for configuring the modal behavior.
 *
 * @param D - The type of data that can be passed to the modal when it is opened.
 * Can be used during rendering to provide initial values or context.
 * @param R - The type of result that can be passed back when the modal is closed.
 */
export interface ModalOptions<D = unknown, R = D> {

  /**
   * Set to `true` to close the modal when the backdrop is clicked.
   * @default false
   */
  closeOnBackdropClick?: boolean;

  /**
   * Set to `true` to close the modal when the Escape key is pressed.
   * @default false
   */
  closeOnEscape?: boolean;

  /**
   * The content to be rendered inside the modal.
   */
  content?: Template | ((ctx: ModalContext<R>) => TemplateResult);

  /**
   * The initial data to be passed to the modal when it is opened.
   */
  data?: D;

  /**
   * The mount point for the modal.
   *
   * If not specified, the modal will be mounted to the `body` element.
   */
  mountPoint?: MountPoint;

  /**
   * Optional callback function to be called when the modal is closed.
   * This can be used to pass data back to the caller.
   *
   * @param data - Optional data to pass back when the modal is closed.
   *
   * @return `false` to prevent the modal from closing, or `true` | `void` to allow it to close.
   */
  onClose?: (data?: R) => boolean | void;

}

/**
 * Contextual data for controlling the modal.
 *
 * @param R - The type of the result that can be passed back when the modal is closed.
 */
export interface ModalContext<R = unknown> {

  /**
   * Function to close the modal and execute the onClose callback.
   *
   * @param data - Optional data to pass to the onClose callback.
   */
  closeModal: (result?: R) => void;

  /**
   * Function to refresh the modal content with a new template.
   *
   * @param template - The new {@link TemplateResult} to render inside the modal.
   */
  refreshModal: (template: TemplateResult) => void;

  /**
   * A `Promise` that resolves to the data passed to the {@link closeModal} function when the modal is closed.
   */
  onModalClose: Promise<R | undefined>;

}
