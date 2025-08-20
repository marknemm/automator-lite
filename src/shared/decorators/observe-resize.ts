import type { LitElement, PropertyValues } from 'lit';

/**
 * A decorator to observe resize events on a specific element within a {@link LitElement}.
 * Binds to a callback method that will be invoked by the {@link ResizeObserver}.
 * 
 * `Note`: The internal {@link ResizeObserver} will automatically observe and disconnect based on the
 * lifecycle of the {@link LitElement}.
 *
 * @param selector - The CSS selector for the element to observe.
 * @returns A method decorator.
 */
export function observeResize(selector: string) {
  return function (target: LitElement, propertyKey: string) {
    let resizeObs!: ResizeObserver;

    // Overload firstUpdated lifecycle method to init ResizeObserver.
    const origFirstUpdated = target['firstUpdated'].bind(target);
    target['firstUpdated'] = function (changedProperties: PropertyValues) {
      if (typeof origFirstUpdated === 'function') {
        origFirstUpdated.apply(this, [changedProperties]);
      }

      const resizeElem = this.shadowRoot?.querySelector(selector);
      if (!(resizeElem instanceof Element)) {
        throw new Error(`Resize element not found for selector: ${selector}`);
      }

      const resizeCb = (this as any)[propertyKey];
      if (typeof resizeCb !== 'function') {
        throw new Error(`observeResize decorator must be placed on a function, and ${propertyKey} is not a function`);
      }

      resizeObs = new ResizeObserver(resizeCb.bind(this, resizeElem));
      resizeObs.observe(resizeElem);
    };

    // Overload disconnectedCallback lifecycle method to cleanup ResizeObserver.
    const origDisconnectedCallback = target.disconnectedCallback.bind(target);
    target.disconnectedCallback = function () {
      if (typeof origDisconnectedCallback === 'function') {
        origDisconnectedCallback.apply(this);
      }

      resizeObs?.disconnect();
    };
  };
}
