import type { SparkModel } from '~shared/models/spark-model.js';
import { SparkStatePersister } from '~shared/models/spark-state-persister.js';
import { SparkModelConfig } from './model.interfaces.js';

/**
 * Decorator to mark a class as a {@link SparkModel}.
 *
 * @param config The {@link SparkModelConfig} for the {@link SparkModel}.
 * @returns A {@link ClassDecorator} to apply to the {@link SparkModel} class.
 */
export function model<T extends SparkModel>(
  config: SparkModelConfig<T>
): ClassDecorator {
  return function(constructor: (new (...args: any[]) => T)) {
    SparkStatePersister.registerPersister(constructor as typeof SparkModel, config.statePersister as any);

    return constructor;
  } as ClassDecorator;
}

export type * from './model.interfaces.js';
export default model;
