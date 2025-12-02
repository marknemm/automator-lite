import type { LoadSparkModelOptions, SparkModel, SparkState, SparkStateIdentifier, StateOf } from './spark-model.js';

/**
 * The abstract base {@link SparkStatePersister} for managing {@link SparkModel} state persistence.
 *
 * @template TState The type of {@link SparkState} managed by this {@link SparkStatePersister}.
 */
export abstract class SparkStatePersister<
  TState extends SparkState = SparkState
> {

  /**
   * A map of registered {@link SparkStatePersister} instances for each {@link SparkModel} type.
   */
  static readonly #registeredPersisters = new Map<typeof SparkModel, SparkStatePersister>();

  /**
   * Registers a {@link SparkStatePersister} for a given {@link SparkModel} type.
   *
   * `Note`: This method is typically called by a [model](../decorators/model.ts) decorator.
   *
   * @param ModelCtor The constructor of the {@link SparkModel} type.
   * @param PersisterCtor The constructor of the {@link SparkStatePersister} to register.
   */
  static registerPersister<
    TModel extends SparkModel,
    TStatePersister extends SparkStatePersister<StateOf<TModel>>
  >(
    ModelCtor: typeof SparkModel,
    PersisterCtor: new () => TStatePersister,
  ): void {
    SparkStatePersister.#registeredPersisters.set(ModelCtor, new PersisterCtor());
  }

  /**
   * Retrieves the registered {@link SparkStatePersister} for a given {@link SparkModel} type.
   *
   * @param ModelCtor The constructor of the {@link SparkModel} type.
   * @returns The registered {@link SparkStatePersister} instance, or `undefined` if not found.
   */
  static getRegisteredPersister<TModel extends SparkModel>(
    ModelCtor: typeof SparkModel,
  ): SparkStatePersister<StateOf<TModel>> | undefined {
    return SparkStatePersister.#registeredPersisters.get(ModelCtor) as SparkStatePersister<StateOf<TModel>> | undefined;
  }

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
