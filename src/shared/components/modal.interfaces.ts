import type { TemplateResult } from 'lit';
import type { MountPoint, Template } from '~shared/utils/mount.interfaces.js';
import type { Modal } from './modal.js';

declare global {
  interface HTMLElementTagNameMap {
    'spark-modal': Modal;
  }
}

/**
 * Options for configuring the modal behavior.
 *
 * @param D - The type of data that can be passed to the modal when it is opened.
 * Can be used during rendering to provide initial values or context.
 * @param R - The type of result that can be passed back when the modal is closed.
 */
export interface ModalOptions<D = unknown, R = D> {

  /**
   * Specifies the types of user actions that can be used to close the <dialog> element.
   * This attribute distinguishes three methods by which a dialog might be closed
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#closedby
   * @default 'none'
   */
  closedBy?: 'any' | 'closerequest' | 'none';

  /**
   * The content {@link Template} to be rendered inside the modal.
   */
  content?: Template | ((ctx: ModalContext<R>) => TemplateResult);

  /**
   * The initial data to be passed to the modal when it is opened.
   */
  data?: D;

  /**
   * The CSS height of the modal.
   * This can be a CSS length value like `400px`, `50%`, etc.
   *
   * @default 'fit-content'
   */
  height?: string;

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
   * @return `false` to prevent the modal from closing, or `true` | `void` to allow it to close.
   */
  onClose?: (data?: R) => boolean | void;

  /**
   * The CSS width of the modal.
   * This can be a CSS length value like `400px`, `50%`, etc.
   *
   * @default '400px'
   */
  width?: string;

}

/**
 * {@link ModalOptions} for a specific instance of a modal that has `static` content.
 *
 * @template D - The type of data that can be passed to the modal when it is opened.
 * @template R - The type of result that can be passed back when the modal is closed.
 */
export type InstanceModalOptions<D = unknown, R = D> = Omit<ModalOptions<D, R>, 'content'>;

/**
 * Contextual data for controlling the modal.
 * Also, extends the Promise interface to allow for awaiting the modal result.
 *
 * @param R - The type of the result that can be passed back when the modal is closed.
 */
export interface ModalContext<R = unknown> extends Promise<R | undefined> {

  /**
   * Function to close the modal and execute the `close` custom event callback.
   *
   * @param data - Optional data to pass to the `close` callback.
   */
  close: (result?: R) => void;

  /**
   * Function to refresh the modal content with a new template.
   *
   * @param template - The new {@link TemplateResult} to render inside the modal.
   */
  refresh: (template: TemplateResult) => void;

  /**
   * Resizes the modal to the specified CSS {@link width} and {@link height}.
   *
   * @param width - The new CSS width of the modal.
   * @param height - The new CSS height of the modal.
   */
  resize: (width: string, height: string) => void;

}
