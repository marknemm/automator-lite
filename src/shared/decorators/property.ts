import type { SparkComponent } from '~shared/components/spark-component.js';
import type { SparkPropertyDeclaration } from './property.interfaces.js';
import { DecoratorController, type LitAccessorDecorator } from '~shared/controllers/decorator-controller.js';
import { property as litProperty } from 'lit/decorators.js';

/**
 * A decorator to define a reactive property within a {@link SparkComponent}.
 *
 * Extends Lit's {@link litProperty @property} decorator with an optional {@link SparkPropertyDeclaration.updated updated} callback property.
 * If {@link SparkPropertyDeclaration.updated updated} is provided, the component's {@link SparkComponent.onUpdated onUpdated} method will be called
 * when the property changes, triggering any callbacks registered for that property.
 *
 * @param options - The {@link SparkPropertyDeclaration}, extending Lit's {@link PropertyDeclaration}.
 * @returns A {@link LitAccessorDecorator}.
 *
 * @template S The type of the `SparkComponent` containing the decorator; defaults to `SparkComponent`.
 */
export function property<
  S extends SparkComponent = SparkComponent,
>(
  options?: SparkPropertyDeclaration<S>
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

  }, litProperty(options)); // Extends Lit's native @property decorator
}

export type * from './property.interfaces.js';
