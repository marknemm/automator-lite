import { LitElement } from 'lit';

export function cleanup(cleanupCb: string) {
  return function (target: LitElement, propertyKey: string) {
    const origDisconnectedCallback = target.disconnectedCallback.bind(target);
    target.disconnectedCallback = function () {
      if (typeof origDisconnectedCallback === 'function') {
        origDisconnectedCallback.apply(this);
      }

      const prop = (this as any)[propertyKey];
      if (prop && typeof prop[cleanupCb] === 'function') {
        console.log('invoking cleanup for property:', propertyKey);
        prop[cleanupCb]();
      }
    };
  };
}
