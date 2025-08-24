import type { LitElement } from 'lit';
import type { OptionalParameters } from '~shared/utils/types.js';

/**
 * A component that has {@link ResizeObserver} instances registered via decorator.
 */
export type WithObserveResize<E extends LitElement = any> = E & {

  /**
   * The array of {@link ResizeObserver} instances registered on the component.
   */
  _resizeObservers?: ResizeObserver[];

};

/**
 * A method that can be decorated with the `observeResize` decorator.
 */
export type ObserveResizeMethod = OptionalParameters<ResizeObserverCallback>;
