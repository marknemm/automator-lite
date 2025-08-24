import type { SparkComponent } from '~shared/components/spark-component.js';
import { DecoratorController, type LitAccessorDecorator } from '~shared/controllers/decorator-controller.js';
import { state as litState } from 'lit/decorators.js';
import type { SparkStateDeclaration } from './state.interfaces.js';

/**
 * A decorator to define a reactive state within a {@link SparkComponent}.
 *
 * Extends Lit's {@link litState @state} decorator with an optional {@link SparkStateDeclaration.updated updated} callback property.
 * If {@link SparkStateDeclaration.updated updated} is provided, the component's {@link SparkComponent.onUpdated onUpdated} method will be called
 * when the state changes, triggering any callbacks registered for that state.
 *
 * @param options - The {@link SparkStateDeclaration}, extending Lit's {@link StateDeclaration}.
 * @returns A {@link LitAccessorDecorator}.
 *
 * @template S The type of the `SparkComponent` containing the decorator; defaults to `SparkComponent`.
 */
export function state<
  S extends SparkComponent = SparkComponent,
>(
  options?: SparkStateDeclaration<S>
): LitAccessorDecorator<S> {
  return DecoratorController.bind<S>({

    hostConnected: ({ component, propKey }) => {
      if (!options?.updated) return;
      const updatedCallback = (component as any)[options.updated];
      if (typeof updatedCallback !== 'function') {
        throw new Error(`updated callback '${String(options.updated)}' is not a method on component`);
      }
      component.onUpdated(propKey, () => updatedCallback.call(component));
    },

  }, litState(options)); // Extends Lit's native @state decorator
}

export type * from './state.interfaces.js';
