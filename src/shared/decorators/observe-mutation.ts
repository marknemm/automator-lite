import { type LitElement } from 'lit';
import { DecoratorController, type LitMethodDecorator } from '~shared/controllers/decorator-controller.js';
import type { ObserveMutationMethod, WithObserveMutation } from './observe-mutation.interfaces.js';

/**
 * A decorator to observe mutation events on specific element(s) within a {@link LitElement}.
 *
 * Binds to a callback method that will be invoked by the {@link MutationObserver}.
 * The bound callback method can take up to two arguments:
 *
 * - `records`: An array of {@link MutationRecord} objects, each representing a mutation event.
 * - `observer`: The {@link MutationObserver} instance that triggered the callback.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/MutationObserver#parameters
 *
 * `Note`: The internal {@link MutationObserver} will automatically observe and disconnect based on the
 * lifecycle of the {@link LitElement}.
 *
 * @param options - The {@link MutationObserverInit} options for the {@link MutationObserver} instance.
 * @param selectors - The CSS selector(s) used to query the LitElement's DOM for the element(s) to observe.
 * @returns A {@link LitMethodDecorator}.
 *
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export function observeMutation<E extends WithObserveMutation<LitElement> = LitElement>(
  options: MutationObserverInit,
  ...selectors: string[]
): LitMethodDecorator<E, ObserveMutationMethod> {
  return DecoratorController.bind({

    hostFirstUpdated({ component, propKey }) {
      const mutationCb = component[propKey];
      if (typeof mutationCb !== 'function') {
        throw new Error(`observeMutation decorator must be placed on a method, and '${String(propKey)}' is not a method`);
      }

      const mutationObs = new MutationObserver(mutationCb.bind(component));
      component._mutationObservers ??= [];
      component._mutationObservers.push(mutationObs);

      selectors.forEach(selector => {
        const mutationElem = component.shadowRoot?.querySelector(selector);
        if (!(mutationElem instanceof Element)) {
          throw new Error(`Mutation element not found for selector: ${selector}`);
        }

        mutationObs.observe(mutationElem, options);
      });
    },

    hostDisconnected({ component }) {
      for (const obs of (component._mutationObservers ?? [])) {
        obs.disconnect();
      }
      delete component._mutationObservers;
    },

  });
}

export type * from './observe-mutation.interfaces.js';
