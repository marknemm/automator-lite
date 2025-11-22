import type { SparkModel } from '~shared/models/spark-model.js';
import { SparkStateManager } from '~shared/models/spark-state-manager.js';
import { SparkModelConfig } from './model.interfaces.js';

/**
 * Decorator to mark a class as a {@link SparkModel}.
 *
 * @param config The {@link SparkModelConfig} for the {@link SparkModel}.
 * @returns ClassDecorator
 */
export function model<T extends SparkModel>(config: SparkModelConfig<T>): ClassDecorator {
  return function(constructor: (new (...args: any[]) => T)) {
    SparkStateManager.registerManager(constructor as typeof SparkModel, config.stateManager as any);

    return constructor;
  } as ClassDecorator;
}

export type * from './model.interfaces.js';
export default model;
