import { DecoratorController, type LitMethodDecorator } from '~shared/controllers/decorator-controller.js';

/**
 * A decorator to observe resize events on specific element(s) within a `LitElement`.
 *
 * Binds to a callback method that will be invoked by the {@link ResizeObserver}.
 * The bound callback method can take up to two arguments:
 *
 * - `entries`: An array of {@link ResizeObserverEntry} objects, each representing a resized element.
 * - `observer`: The {@link ResizeObserver} instance that triggered the callback.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver#parameters
 *
 * `Note`: The internal {@link ResizeObserver} will automatically observe and disconnect based on the
 * lifecycle of the `LitElement`.
 *
 * @param selectors - The CSS selector(s) used to query the LitElement's DOM for the element(s) to observe.
 * @returns A {@link LitMethodDecorator}.
 */
export function observeResize(...selectors: string[]): LitMethodDecorator<ResizeObserverCallback> {
  let resizeObs: ResizeObserver;

  return DecoratorController.bind({

    hostFirstUpdated({ component, propKey }) {
      const resizeCb = (component as any)[propKey].bind(component);
      if (typeof resizeCb !== 'function') {
        throw new Error(`observeResize decorator must be placed on a function, and ${String(propKey)} is not a function`);
      }

      resizeObs = new ResizeObserver(resizeCb);

      selectors.forEach(selector => {
        const resizeElem = component.shadowRoot?.querySelector(selector);
        if (!(resizeElem instanceof Element)) {
          throw new Error(`Resize element not found for selector: ${selector}`);
        }

        resizeObs.observe(resizeElem);
      });
    },

    hostDisconnected() {
      resizeObs?.disconnect();
    },

  });
}
