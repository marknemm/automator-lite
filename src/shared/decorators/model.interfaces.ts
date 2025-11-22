import type SparkModel from '~shared/models/spark-model.js';
import { StateOf } from '~shared/models/spark-model.js';
import type { SparkStateManager } from '~shared/models/spark-state-manager.js';

export type SparkModelConfig<TModel extends SparkModel> = {
  stateManager: typeof SparkStateManager<StateOf<TModel>>;
};
