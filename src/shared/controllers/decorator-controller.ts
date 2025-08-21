import { LitElement, type ReactiveController } from 'lit';
import type { DecoratedComponent, DecoratorBinding, DecoratorContext, DecoratorLifecycleHooks, LitMemberDecorator } from './decorator-controller.interfaces.js';

/**
 * A controller for enabling decorators on a {@link LitElement} component
 * to invoke logic during lifecycle events such as:
 *
 * - `connected` - Invoked when the element is connected to the DOM.
 * - `disconnected` - Invoked when the element is disconnected from the DOM.
 * - `update` - Invoked when the element is updated.
 * - `updated` - Invoked after the element is updated.
 *
 * @template E The type of the `LitElement` component containing the decorator.
 * Defaults to `LitElement`.
 *
 * @implements ReactiveController
 */
export class DecoratorController<E extends LitElement = LitElement> implements ReactiveController {

  /**
   * A flag indicating whether the element is on its first update.
   */
  #firstUpdate = true;

  /**
   * Constructor for the {@link DecoratorController}.
   * Protected to enforce use of the static {@link bind} method for initialization inside a decorator.
   *
   * @param component The instance of the {@link LitElement} component containing the decorator.
   */
  protected constructor(
    public readonly component: DecoratedComponent<E>
  ) {
    component.addController(this);
  }

  /**
   * The array of decorators bound to the {@link LitElement} component prototype.
   */
  get #decoratorBindings(): DecoratorBinding<E>[] {
    return this.component._sparkDecoratorBindings ?? [];
  }

  /**
   * Binds the decorator to the {@link LitElement} component.
   * Will run decorator {@link cb} logic whenever an instance of the component first connects.
   *
   * @param lifecycleHooks The {@link DecoratorLifecycleHooks} containing decorator logic
   * that will be invoked during the containing component's lifecycle method invocations.
   * @return A {@link LitMemberDecorator}.
   *
   * @template T The type of the decorated accessor or method.
   * Defaults to `unknown`.
   * Ignored if the decorated element is a plain property.
   * @template E The type of the `LitElement` component containing the decorator.
   * Defaults to `LitElement`.
   */
  static bind<
    T = unknown,
    E extends LitElement = LitElement,
  >(
    lifecycleHooks: DecoratorLifecycleHooks<E>
  ): LitMemberDecorator<T, E> {
    return (
      prototype: DecoratedComponent<E>,
      propKey: string | symbol,
      descriptor?: TypedPropertyDescriptor<T>
    ) => {
      const binding: DecoratorBinding<E> = { prototype, propKey, descriptor, lifecycleHooks };
      prototype._sparkDecoratorBindings?.push(binding);

      // Only initialize the cbs array and monkey patch the connectedCallback for first decorator.
      if (prototype._sparkDecoratorBindings) return;
      prototype._sparkDecoratorBindings = [binding];

      // Whenever a new instance of LitElement is created and connected, will setup the controller for decorators.
      const origConnectedCallback = prototype.connectedCallback;
      prototype.connectedCallback = function() {
        new DecoratorController<E>(this);
        origConnectedCallback?.call(this);
      };
    };
  }

  hostConnected(): void {
    for (const binding of this.#decoratorBindings) {
      const { lifecycleHooks } = binding;
      const ctx = this.#toDecoratorContext(binding);

      try {
        lifecycleHooks.hostConnected?.(ctx);
      } catch (error) {
        console.error('Error in hostConnected lifecycle hook:', error);
      }
    }
  }

  hostDisconnected(): void {
    try {
      for (const binding of this.#decoratorBindings) {
        const { lifecycleHooks } = binding;
        const ctx = this.#toDecoratorContext(binding);

        try {
          lifecycleHooks.hostDisconnected?.(ctx);
        } catch (error) {
          console.error('Error in hostDisconnected lifecycle hook:', error);
        }
      }
    } finally {
      this.component._sparkDecoratorBindings = []; // IMPORTANT: No memory leaks!
    }
  }

  hostUpdate(): void {
    for (const binding of this.#decoratorBindings) {
      const { lifecycleHooks } = binding;
      const ctx = this.#toDecoratorContext(binding);

      try {
        lifecycleHooks.hostUpdate?.(ctx);
      } catch (error) {
        console.error('Error in hostUpdate lifecycle hook:', error);
      }
    }
  }

  hostUpdated(): void {
    try {
      for (const binding of this.#decoratorBindings) {
        const { lifecycleHooks } = binding;
        const ctx = this.#toDecoratorContext(binding);

        if (this.#firstUpdate) {
          try {
            lifecycleHooks.hostFirstUpdated?.(ctx);
          } catch (error) {
            console.error('Error in hostFirstUpdated lifecycle hook:', error);
          }
        }

        try {
          lifecycleHooks.hostUpdated?.(ctx);
        } catch (error) {
          console.error('Error in hostUpdated lifecycle hook:', error);
        }
      }
    } finally {
      this.#firstUpdate = false; // IMPORTANT: Ensure hostFirstUpdated is only called once.
    }
  }

  /**
   * Converts a given {@link binding} to a {@link DecoratorContext} that will be provided to
   * bound {@link DecoratorLifecycleHooks} methods to run logic for the decorated element.
   *
   * @param binding The {@link DecoratorBinding} to convert.
   * @returns The corresponding {@link DecoratorContext}.
   */
  #toDecoratorContext(
    binding: DecoratorBinding<E>
  ): DecoratorContext<E> {
    return {
      component: this.component,
      prototype: binding.prototype,
      propKey: binding.propKey,
      descriptor: binding.descriptor,
    };
  }

}

export type * from './decorator-controller.interfaces.js';
