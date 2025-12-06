import type { LoadSparkModelOptions, SparkState, SparkStateIdentifier } from './spark-model.js';

/**
 * The abstract base {@link SparkStatePersister} for managing {@link SparkModel} state persistence.
 *
 * @template TState The type of {@link SparkState} managed by this {@link SparkStatePersister}.
 */
export abstract class SparkStatePersister<
  TState extends SparkState = SparkState
> {

  /**
   * Deletes a {@link SparkState} instance from permanent storage.
   *
   * @param id The {@link SparkStateIdentifier} of the {@link SparkState} to delete.
   * @returns A {@link Promise} that resolves to `true` if the instance was deleted, or `false` otherwise
   * (such as in the case where the model state was not found in storage).
   */
  abstract delete(
    id: SparkStateIdentifier<TState>
  ): Promise<boolean>;

  /**
   * Loads a {@link SparkState} instance from the state storage.
   *
   * @param id The {@link SparkStateIdentifier} of the {@link SparkState} to load.
   * @return A {@link Promise} that resolves to the loaded {@link SparkState} instance, or `undefined` if not found.
   */
  abstract load(
    id: SparkStateIdentifier<TState>
  ): Promise<TState | undefined>;

  /**
   * Loads many {@link SparkState} instances from the state storage.
   *
   * @param opts - {@link LoadSparkModelOptions} for configuring how to load models.
   * @returns A {@link Promise} that resolves to an array of loaded {@link SparkState} instances.
   */
  abstract loadMany(
    opts?: LoadSparkModelOptions<TState>
  ): Promise<TState[]>;

  /**
   * Saves the given {@link SparkModel} to permanent storage.
   * This will update the saved {@link SparkState} if it exists, or create a new one if it doesn't.
   *
   * `Note`: This method actually performs the save operation and must be implemented by subclasses.
   *
   * @param model The {@link SparkModel} instance to save.
   * @returns The saved {@link SparkModel} instance.
   */
  abstract save(
    state: TState
  ): Promise<TState>;

}
