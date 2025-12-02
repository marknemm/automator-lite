import type { LoadSparkModelOptions, SparkModel, SparkModelCtor, SparkModelEmitEventType, SparkModelEventHandler, SparkModelEventType, SparkModelId, SparkModelIdentifier, SparkState, SparkStateEventHandler, StateOf } from '~shared/models/spark-model.js';
import { SparkStateObserver } from './spark-state-observer.js';
import { SparkStatePersister } from './spark-state-persister.js';
import { toModelId } from './spark-state-utils.js';
import { DeepPartial } from 'utility-types';

/**
 * Stores and retrieves {@link SparkModel} instances.
 *
 * @param TModel - The type of {@link SparkModel} to store.
 */
export class SparkStore<
  TModel extends SparkModel<TState>,
  TState extends SparkState = StateOf<TModel>,
> {

  /**
   * A map of singleton instances of {@link SparkStore} classes.
   */
  static readonly #instances = new Map<typeof SparkModel, SparkStore<SparkModel>>();

  /**
   * A map of `singleton` loaded {@link SparkState} instances.
   */
  readonly #cachedStates = new Map<SparkModelId, TState>();

  /**
   * The constructor of the {@link SparkModel} associated with this {@link SparkStore}.
   */
  readonly #ModelCtor: SparkModelCtor<TModel>;

  /**
   * The state change listener for the associated {@link SparkModel}'s state.
   */
  readonly #stateObserver: SparkStateObserver<TState>;

  /**
   * The {@link SparkStatePersister} responsible for persisting this {@link SparkModel}'s state.
   */
  readonly #statePersister: SparkStatePersister<TState>;

  /**
   * Whether the store is currently in a privileged state, allowing direct construction of models
   * and direct manipulation of internal state.
   */
  #privilegeActive = false;

  /**
   * Creates a new {@link SparkStore} instance.
   *
   * @throws If instantiated directly.
   * Direct instantiation is not allowed; use {@link getInstance} instead.
   */
  protected constructor(ModelCtor: typeof SparkModel) {
    this.#ModelCtor = ModelCtor as SparkModelCtor<TModel>;
    this.#statePersister = SparkStatePersister.getRegisteredPersister<TModel>(ModelCtor)!;

    if (!this.#statePersister) {
      throw new Error(
        `${this.constructor.name}: No SparkStatePersister registered for model type: ${ModelCtor.name}.`
        + ' Did you forget to add the @model decorator to the model class?'
      );
    }

    this.#stateObserver = SparkStateObserver.getRegisteredObserver<TModel>(ModelCtor)!
                       ?? new DefaultStateObserver<TState>();
    this.#stateObserver.observe();
  }

  /**
   * Whether the store is currently in a privileged state, allowing direct construction of models
   * and direct manipulation of internal state.
   */
  get privilegeActive(): boolean {
    return this.#privilegeActive;
  }

  /**
   * Initializes or gets the singleton instance of this {@link SparkStore} for a given {@link SparkModel}.
   *
   * @param ModelCtor The constructor of the {@link SparkModel} to store.
   * @returns The singleton instance of the {@link SparkStore}.
   *
   * @template T - The type of the {@link SparkModel} to store.
   */
  static getInstance<T extends SparkModel>(
    ModelCtor: SparkModelCtor<T>,
  ): SparkStore<T> {
    if (!SparkStore.#instances.has(ModelCtor as typeof SparkModel)) {
      const instance = new this(ModelCtor as typeof SparkModel);
      SparkStore.#instances.set(ModelCtor as typeof SparkModel, instance);
    }

    return SparkStore.#instances.get(ModelCtor as typeof SparkModel)! as SparkStore<T>;
  }

  /**
   * Initializes a new {@link SparkModel} instance with the given state.
   *
   * `Note`: This method does not save the model; it only initializes it.
   *
   * @param state The initial state for the {@link SparkModel}.
   * @returns The initialized {@link SparkModel} instance.
   */
  newModel(state: DeepPartial<TState> | Partial<TState> = {}): TModel {
    const ModelCtor = this.#ModelCtor as SparkModelCtor<TModel>;
    try {
      this.#privilegeActive = true;
      const model = new ModelCtor(state.id);
      return model.reset(state);
    } finally {
      this.#privilegeActive = false;
    }
  }

  /**
   * Deletes the given {@link SparkModel} instance from permanent storage.
   *
   * @param model The {@link SparkModel} instance to delete.
   * @returns A promise that resolves to `true` if the instance was deleted, or `false` otherwise
   * (such as in the case where the model was not found in storage).
   *
   * @final Override {@link deleteState} to define how the model is deleted.
   */
  async delete(id: SparkModelIdentifier<TModel>): Promise<boolean> {
    id = toModelId(id);
    if (!id) return false; // Abort - cannot derive valid id for deletion.

    const deleted = await this.#statePersister.delete(id);
    if (deleted) this.#deleteCache(id);

    return deleted;
  }

  /**
   * Gets the cached {@link SparkState} for the given {@link SparkModel} identifier.
   *
   * @param id The {@link SparkModelIdentifier} of the {@link SparkModel}.
   * @returns The cached {@link SparkState}, or `undefined` if not found.
   */
  getCachedState(id: SparkModelIdentifier<TModel>): TState | undefined {
    id = toModelId(id);
    return id
      ? this.#cachedStates.get(id)
      : undefined; // Abort - cannot derive valid id.
  }

  /**
   * Loads this {@link SparkModel} instance from the state storage.
   *
   * @param id The {@link SparkModelIdentifier} of the {@link SparkModel} to load.
   * @param noCache Whether to bypass the {@link SparkState} cache when loading the model.
   *
   * @returns A {@link Promise} that resolves to this {@link SparkModel} instance if found, or `undefined` if not found.
   *
   * @final Override {@link loadModel} to define how the model is loaded.
   */
  async load(
    id: SparkModelIdentifier<TModel>,
    noCache: boolean = false
  ): Promise<TModel | undefined> {
    id = toModelId(id);
    if (!id) return undefined; // Abort - cannot derive valid id for loading.

    // Check state cache first, only singleton state should exist.
    if (!noCache && this.#cachedStates.has(id)) {
      const state = this.#cachedStates.get(id)!;
      const model = this.newModel(state);
      this.#saveCache(state, model);
      return model;
    }

    // Load the raw state from storage.
    const state = await this.#statePersister.load(id);
    if (!state) return undefined;

    // Create and cache the new model.
    const model = this.newModel(state);
    this.#saveCache(state, model);
    return model;
  }

  /**
   * Loads many {@link SparkModel} instances from the state storage.
   *
   * @param options - {@link LoadSparkModelOptions} for configuring how to load models.
   *
   * @returns A {@link Promise} that resolves to an array of loaded {@link SparkModel} instances.
   *
   * @final Override {@link loadManyStates} to define how the models' states are loaded.
   */
  async loadMany(
    opts: LoadSparkModelOptions<TState> = {},
  ): Promise<TModel[]> {
    const result: TModel[] = [];
    const states = await this.#statePersister.loadMany(opts);

    for (const state of states) {
      const model = this.newModel(state);
      this.#saveCache(state, model);
      result.push(model);
    }

    return result;
  }

  /**
   * Registers a callback to be invoked whenever the given {@link SparkModel} is persisted.
   *
   * `Note`: {@link off} should be used to unregister the callback when no longer needed to
   * prevent memory leaks.
   *
   * @param eventType The {@link SparkModelEventType} to monitor.
   * @param cb The {@link SparkModelEventHandler} to invoke on persistence change.
   *
   * @returns A function that can be called to unregister the callback.
   *
   * @template TEvent - The {@link SparkModelEventType}.
   */
  on<TEvent extends SparkModelEventType>(
    eventType: TEvent,
    cb: SparkModelEventHandler<TEvent, TModel>,
  ): () => void {
    return this.#stateObserver.on(eventType, (
      (state: Partial<TState> | undefined, oldState?: Partial<TState>) => {
        const model = this.newModel(state ?? oldState!);
        (eventType === 'delete')
          ? this.#deleteCache(model)
          : this.#saveCache(state!, model);
        cb(model, state as Partial<TState>, oldState as Partial<TState>);
      }
    ) as SparkStateEventHandler<TEvent, TState>);
  }

  /**
   * Saves the given {@link SparkModel} instance to permanent storage.
   *
   * @param model The {@link SparkModel} instance to save.
   * @returns A {@link Promise} that resolves to the saved {@link SparkModel} instance.
   *
   * @final Override {@link saveState} to define how the model state is saved.
   */
  async save(model: TModel): Promise<TModel> {
    // Get the state to save from the model, and set the update timestamp.
    const state = model.toSaveData();
    state.updateTimestamp = Date.now();
    if (state.createTimestamp < 0) {
      state.createTimestamp = state.updateTimestamp;
    }
    if (state.id < 0) {
      state.id = state.createTimestamp;
    }

    // Have state manager save the state and cache the model.
    const savedState = await this.#statePersister.save(state);
    this.#saveCache(savedState, model);

    return model;
  }

  /**
   * Checks if the given {@link SparkModel} instance has stale state compared to the loaded state.
   *
   * @param model The {@link SparkModelIdentifier} of the {@link SparkModel} instance to check.
   * @param state The {@link SparkState} to compare against.
   * @returns `true` if the state is stale, `false` otherwise.
   */
  #isStateStale(model: SparkModelIdentifier<TModel>, state: Partial<TState>): boolean {
    const modelId = toModelId(model);
    if (!modelId) return false; // Abort - cannot derive valid id.

    const loadedState = this.#cachedStates.get(modelId);
    return !loadedState
        || loadedState.updateTimestamp !== state.updateTimestamp;
  }

  /**
   * Saves to the internal state cache.
   *
   * @param state The {@link SparkState} to cache.
   * @param model The {@link SparkModel} associated with the state.
   *
   * @returns `true` if the cache was saved, `false` otherwise.
   */
  #saveCache(
    state: Partial<TState>,
    model: TModel
  ): boolean {
    const modelId = toModelId(state);
    if (!modelId) return false; // Abort - cannot derive valid id.

    const oldState = this.#cachedStates.get(modelId);
    this.#cachedStates.set(modelId, state as TState);

    // If using default observer, emit create/update events if state is stale.
    const defaultObserver = this.#stateObserver instanceof DefaultStateObserver;
    if (defaultObserver && this.#isStateStale(oldState, state)) {
      const persistType = model.createTimestamp === model.updateTimestamp ? 'create' : 'update';
      this.#stateObserver.emit(persistType, state, oldState);
    }

    return true;
  }

  /**
   * Deletes the cached state for the given identifier.
   *
   * @param id The {@link SparkModelIdentifier} of the state to delete from cache.
   *
   * @returns `true` if the cache entry was deleted, `false` otherwise.
   */
  #deleteCache(
    id: SparkModelIdentifier<TModel>
  ): boolean {
    id = toModelId(id);
    if (!id) return false; // Abort - cannot derive valid id.

    const oldState = this.#cachedStates.get(id);
    this.#cachedStates.delete(id);

    if (this.#stateObserver instanceof DefaultStateObserver) {
      this.#stateObserver.emit('delete', undefined, oldState);
    }
    return true;
  }

}

/**
 * A default no-op implementation of {@link SparkStateSubject} for state emit functionality.
 */
class DefaultStateObserver<
  TState extends SparkState
> extends SparkStateObserver<TState> {

  // No-op custom listeners -- only used for emitting events from store persist methods.
  protected override observeCreate(): () => void { return () => {}; }
  protected override observeDelete(): () => void { return () => {}; }
  protected override observeUpdate(): () => void { return () => {}; }

  override emit( // Expose emit as public
    eventType: SparkModelEmitEventType,
    state: Partial<TState> | undefined,
    oldState?: Partial<TState>
  ): void {
    super.emit(eventType, state, oldState);
  }

}
