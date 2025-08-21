import { DecoratorController, type LitMemberDecorator } from '~shared/controllers/decorator-controller.js';

/**
 * A decorator to cleanup resources when a `LitElement` is disconnected.
 *
 * Can be bound to any instance property.
 *
 * @template T The type of the bound property; enforces type safety for `cleanupCb`. Defaults to `unknown`.
 *
 * @param cleanupCb - The name of the cleanup method to call on the property when the `LitElement` is disconnected.
 * @returns A {@link LitMemberDecorator}.
 */
export function cleanup<T = unknown>(
  cleanupCb: keyof T
): LitMemberDecorator<T> {
  return DecoratorController.bind({

    hostDisconnected({ component, propKey }) {
      const prop = (component as any)[propKey];
      if (typeof prop?.[cleanupCb] !== 'function') {
        throw new Error(`cleanup method '${String(cleanupCb)}' not found on property ${String(propKey)}`);
      }
      prop[cleanupCb]();
    },

  });
}
