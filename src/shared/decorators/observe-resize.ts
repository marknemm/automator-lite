import { type LitElement } from 'lit';
import { DecoratorController, type LitMethodDecorator } from '~shared/controllers/decorator-controller.js';
import type { ObserveResizeMethod, WithObserveResize } from './observe-resize.interfaces.js';

/**
 * A decorator to observe resize events on specific element(s) within a {@link LitElement}.
 *
 * Binds to a callback method that will be invoked by the {@link ResizeObserver}.
 * The bound callback method can take up to two arguments:
 *
 * - `entries`: An array of {@link ResizeObserverEntry} objects, each representing a resized element.
 * - `observer`: The {@link ResizeObserver} instance that triggered the callback.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver#parameters
 *
 * `Note`: The internal {@link ResizeObserver} will automatically observe and disconnect based on the
 * lifecycle of the {@link LitElement}.
 *
 * @param selectors - The CSS selector(s) used to query the LitElement's DOM for the element(s) to observe.
 * @returns A {@link LitMethodDecorator}.
 *
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export function observeResize<E extends WithObserveResize<LitElement> = LitElement>(
  ...selectors: string[]
): LitMethodDecorator<E, ObserveResizeMethod> {
  return DecoratorController.bind({

    hostFirstUpdated({ component, propKey }) {
      const resizeCb = component[propKey as keyof E];
      if (typeof resizeCb !== 'function') {
        throw new Error(`observeResize decorator must be placed on a method, and '${String(propKey)}' is not a method`);
      }

      const resizeObs = new ResizeObserver(resizeCb.bind(component));
      component._resizeObservers ??= [];
      component._resizeObservers.push(resizeObs);

      selectors.forEach(selector => {
        const resizeElem = component.shadowRoot?.querySelector(selector);
        if (!(resizeElem instanceof Element)) {
          throw new Error(`Resize element not found for selector: ${selector}`);
        }

        resizeObs.observe(resizeElem);
      });
    },

    hostDisconnected({ component }) {
      for (const obs of (component._resizeObservers ?? [])) {
        obs.disconnect();
      }
      delete component._resizeObservers;
    },

  });
}

export type * from './observe-resize.interfaces.js';
