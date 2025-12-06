import type { SparkModel } from '~shared/models/spark-model.js';
import type { SparkModelConfig } from './model.interfaces.js';

/**
 * Decorator to mark a class as a {@link SparkModel}.
 *
 * @param config The {@link SparkModelConfig} for the {@link SparkModel}.
 * @returns A {@link ClassDecorator} to apply to the {@link SparkModel} class.
 */
export function model<T extends SparkModel>(
  config: SparkModelConfig<T>
): ClassDecorator {
  return function(constructor: typeof SparkModel) {
    for (const [key, value] of Object.entries(config)) {
      (constructor.config as any)[key] = value;
    }
    return constructor;
  } as ClassDecorator;
}

export default model;
