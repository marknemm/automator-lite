import type { SparkModel, StateOf } from '~shared/models/spark-model.js';
import type { SparkStateObserver } from '~shared/models/spark-state-observer.js';
import type { SparkStatePersister } from '~shared/models/spark-state-persister.js';

/**
 * The configuration options for a {@link SparkModel}.
 *
 * @see [model](./model.ts) decorator.
 */
export type SparkModelConfig<TModel extends SparkModel> = {

  /**
   * The {@link SparkStateObserver} class responsible for observing changes in the {@link SparkModel}'s state.
   *
   * If not provided, a default {@link SparkStateObserver} implemented by the store will be used.
   */
  stateObserver?: new (...args: any[]) => SparkStateObserver<StateOf<TModel>>;

  /**
   * The {@link SparkStatePersister} class responsible for managing the persistence of the {@link SparkModel}'s state.
   */
  statePersister: new (...args: any[]) => SparkStatePersister<StateOf<TModel>>;

};
