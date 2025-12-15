import type { TemplateResult } from 'lit';
import type { Nullish } from 'utility-types';
import type { MountPoint, Template } from '~shared/utils/mount.interfaces.js';

/**
 * Options for configuring the toast behavior.
 *
 * @param D - The type of data that can be passed to the toast when it is opened.
 * Can be used during rendering to provide initial values or context.
 * @param R - The type of result that can be passed back when the toast is closed.
 */
export interface ToastOptions<D = unknown, R = D> {

  /**
   * The content {@link Template} to be rendered inside the toast.
   */
  content?: Template | ((ctx: ToastContext<R>) => TemplateResult);

  /**
   * The initial data to be passed to the toast when it is opened.
   */
  data?: D;

  /**
   * The duration in milliseconds for which the toast should be displayed
   * before automatically closing.
   *
   * Set to `null` or `0` to disable auto-dismissal.
   *
   * @default 3000
   */
  duration?: number | Nullish;

  /**
   * The CSS height of the toast.
   * This can be a CSS length value like `400px`, `50%`, etc.
   *
   * @default 'fit-content'
   */
  height?: string;

  /**
   * The mount point for the toast.
   *
   * If not specified, the toast will be mounted to the `body` element.
   */
  mountPoint?: MountPoint;

  /**
   * Optional callback function to be called when the toast is dismissed.
   * This can be used to pass data back to the caller.
   *
   * @param data - Optional data to pass back when the toast is dismissed.
   * @return `false` to prevent the toast from dismissing, or `true` | `void` to allow it to dismiss.
   */
  onDismiss?: (data?: R) => boolean | void;

  /**
   * The position on the screen where the toast should appear.
   *
   * @default 'top-right'
   */
  position?: ToastPosition;

  /**
   * The CSS width of the toast.
   * This can be a CSS length value like `250px`, `10%`, etc.
   *
   * @default '250px'
   */
  width?: string;

}

/**
 * Contextual data for controlling the toast.
 * Also, extends the Promise interface to allow for awaiting the toast result.
 *
 * @param R - The type of the result that can be passed back when the toast is closed.
 */
export interface ToastContext<R = unknown> extends Promise<R | undefined> {

  /**
   * Function to dismiss the toast and execute the `dismiss` custom event callback.
   *
   * @param data - Optional data to pass to the `dismiss` callback.
   */
  dismiss: (result?: R) => void;

  /**
   * Function to refresh the toast content with a new template.
   *
   * @param template - The new {@link TemplateResult} to render inside the toast.
   */
  refresh: (template: TemplateResult) => void;

  /**
   * Resizes the toast to the specified CSS {@link width} and {@link height}.
   *
   * @param width - The new CSS width of the toast.
   * @param height - The new CSS height of the toast.
   */
  resize: (width: string, height: string) => void;

}

/**
 * Positions where the toast can appear on the screen.
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
