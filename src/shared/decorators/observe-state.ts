import type { SparkComponent } from '~shared/components/spark-component.js';
import { DecoratorController, type LitMethodDecorator } from '~shared/controllers/decorator-controller.js';

/**
 * A decorator to observe state changes on a specific property decorated
 * with `@property` or `@state` within a {@link SparkComponent}.
 *
 * @param stateKey The key of the state to observe.
 * @returns A {@link LitMethodDecorator} that triggers the decorated method when the state changes.
 *
 * @template S The type of the {@link SparkComponent} containing the decorator; defaults to `SparkComponent`.
 */
export function observeState<S extends SparkComponent = SparkComponent>(
  stateKey: keyof S
): LitMethodDecorator<S> {
  return DecoratorController.bind({

    hostConnected: ({ component, propKey }) => {
      component.onUpdated(stateKey, () => {
        const method = component[propKey];
        if (typeof method !== 'function') {
          throw new Error(`Decorated member '${propKey.toString()}' is not a method`);
        }
        Reflect.apply(method, component, []);
      });
    },

  });
}
