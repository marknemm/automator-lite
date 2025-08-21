import { DecoratorController, type LitMethodDecorator } from '~shared/controllers/decorator-controller.js';

/**
 * A decorator to observe mutation events on specific element(s) within a `LitElement`.
 *
 * Binds to a callback method that will be invoked by the {@link MutationObserver}.
 * The bound callback method can take up to two arguments:
 *
 * - `records`: An array of {@link MutationRecord} objects, each representing a mutation event.
 * - `observer`: The {@link MutationObserver} instance that triggered the callback.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/MutationObserver#parameters
 *
 * `Note`: The internal {@link MutationObserver} will automatically observe and disconnect based on the
 * lifecycle of the `LitElement`.
 *
 * @param options - The {@link MutationObserverInit} options for the {@link MutationObserver} instance.
 * @param selectors - The CSS selector(s) used to query the LitElement's DOM for the element(s) to observe.
 * @returns A {@link LitMethodDecorator}.
 */
export function observeMutation(
  options: MutationObserverInit,
  ...selectors: string[]
): LitMethodDecorator<MutationCallback> {
  let mutationObs: MutationObserver;

  return DecoratorController.bind({

    hostFirstUpdated({ component, propKey }) {
      const mutationCb = (component as any)[propKey].bind(component);
      if (typeof mutationCb !== 'function') {
        throw new Error(`observeMutation decorator must be placed on a function, and ${String(propKey)} is not a function`);
      }

      mutationObs = new MutationObserver(mutationCb);

      selectors.forEach(selector => {
        const mutationElem = component.shadowRoot?.querySelector(selector);
        if (!(mutationElem instanceof Element)) {
          throw new Error(`Mutation element not found for selector: ${selector}`);
        }

        mutationObs.observe(mutationElem, options);
      });
    },

    hostDisconnected() {
      mutationObs?.disconnect();
    },

  });
}
