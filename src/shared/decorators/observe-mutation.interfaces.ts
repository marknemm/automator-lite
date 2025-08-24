import type { LitElement } from 'lit';
import type { OptionalParameters } from '~shared/utils/types.js';

/**
 * A component that has {@link MutationObserver} instances registered via decorator.
 */
export type WithObserveMutation<E extends LitElement = any> = E & {

  /**
   * The array of {@link MutationObserver} instances registered on the component.
   */
  _mutationObservers?: MutationObserver[];

};

/**
 * A method that can be decorated with the `observeMutation` decorator.
 */
export type ObserveMutationMethod = OptionalParameters<MutationCallback>;
