import type { DeepReadonly, Nullish } from 'utility-types';
import type { LoadSparkModelOptions, SparkModel, SparkModelId, StateOf, SparkModelState } from './spark-model.js';

/**
 * The abstract base {@link SparkStateManager} for managing {@link SparkModel} state persistence.
 *
 * @template TState The type of {@link SparkModelState} managed by this {@link SparkStateManager}.
 */
export abstract class SparkStateManager<
  TState extends SparkModelState = SparkModelState
> {

  static readonly #registeredManagers = new Map<typeof SparkModel, SparkStateManager>();

  static registerManager<TModel extends SparkModel, TStateManager extends SparkStateManager<StateOf<TModel>>>(
    ModelCtor: typeof SparkModel,
    ManagerCtor: new () => TStateManager,
  ): void {
    SparkStateManager.#registeredManagers.set(ModelCtor, new ManagerCtor());
  }

  static getRegisteredManager<TModel extends SparkModel>(
    ModelCtor: typeof SparkModel,
  ): SparkStateManager<StateOf<TModel>> | undefined {
    return SparkStateManager.#registeredManagers.get(ModelCtor) as SparkStateManager<StateOf<TModel>> | undefined;
  }

  /**
   * Deletes this {@link SparkModel} instance from permanent storage.
   *
   * `Note`: This method actually performs the delete operation and must be implemented by subclasses.
   *
   * @param state The {@link SparkModelState} to delete.
   * @returns A {@link Promise} that resolves to `true` if the instance was deleted, or `false` otherwise
   * (such as in the case where the model was not found in storage).
   */
  abstract delete(
    state: Partial<DeepReadonly<TState>>
  ): Promise<boolean>;

  /**
   * Loads a {@link SparkModel} instance from the state storage.
   *
   * @param id The unique identifier of the {@link SparkModel} to load.
   * @return A {@link Promise} that resolves to the loaded {@link SparkModel} instance, or `undefined` if not found.
   */
  abstract load(
    id: SparkModelId | Nullish
  ): Promise<TState | undefined>;

  /**
   * Loads many {@link SparkModel} instances from the state storage.
   *
   * @param opts - {@link LoadSparkModelOptions} for configuring how to load models.
   * @returns A {@link Promise} that resolves to an array of loaded {@link SparkModel} instances.
   */
  abstract loadMany(
    opts?: LoadSparkModelOptions<TState>
  ): Promise<TState[]>;

  /**
   * Saves the given {@link SparkModel} to permanent storage.
   * This will update the saved {@link SparkModelState} if it exists, or create a new one if it doesn't.
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
