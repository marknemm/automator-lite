import type { SparkModel } from './spark-model.js';

/**
 * The raw saved state for `Spark Models`.
 */
export interface SparkModelState {

  /**
   * The timestamp when the {@link SparkModelState} was first created.
   */
  createTimestamp?: number;

  /**
   * The timestamp of the last update to the saved {@link SparkModelState} for this {@link SparkModel}.
   */
  updateTimestamp?: number;

}

/**
 * Options for loading a {@link SparkModel}.
 *
 * @template S - The type of the {@link SparkModelState} being loaded.
 */
export interface LoadSparkModelOptions<S extends SparkModelState = any> {

  /**
   * A filter function to determine which records to load.
   *
   * @param state The {@link SparkModelState} to load.
   * @returns `true` if the {@link SparkModelState} should be loaded, `false` otherwise.
   */
  filter?: (state: S) => boolean;

  /**
   * A function to sort the loaded models.
   *
   * @param a The first {@link SparkModelState} to compare.
   * @param b The second {@link SparkModelState} to compare.
   * @returns A negative number if `a` should come before `b`, a positive number if `a` should come after `b`, or `0` if they are equal.
   * @default `(a, b) => a.createTimestamp - b.createTimestamp`.
   */
  sort?: (a: S, b: S) => number;

}

/**
 * The unique identifier for a {@link SparkModel} instance.
 */
export type SparkModelId = string;

/**
 * The actions that can be performed for model persistence.
 */
export type SparkPersistenceAction = 'create' | 'delete' | 'persist' | 'save' | 'update';

/**
 * The type of state for a given {@link SparkModel}.
 */
export type StateOf<TModel extends SparkModel> = TModel['_stateBrand'];
