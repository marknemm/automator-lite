import type { Nullish } from 'utility-types';
import type { LoadSparkModelOptions, SparkModel, SparkModelCtor, SparkModelEmitEventType, SparkModelEventHandler, SparkModelEventType, SparkModelId, SparkModelState, SparkStateEventHandler, StateOf } from '~shared/models/spark-model.js';
import { SparkReactiveStateManager } from './spark-reactive-state-manager.js';
import { SparkStateManager } from './spark-state-manager.js';

/**
 * Stores and retrieves {@link SparkModel} instances.
 *
 * @param TModel - The type of {@link SparkModel} to store.
 */
export class SparkStore<
  TModel extends SparkModel<TState>,
  TState extends SparkModelState = StateOf<TModel>,
> {

  /**
   * A map of singleton instances of {@link SparkStore} classes.
   */
  static readonly #instances = new Map<
    typeof SparkModel,
    SparkStore<SparkModel>
  >();

  /**
   * A container for registered persistence callbacks.
   */
  readonly #eventCbs: { [K in SparkModelEventType]: Set<SparkModelEventHandler<K>> } = {

    /**
     * A {@link Set} of registered create callbacks for {@link SparkModel} instances.
     */
    create: new Set<SparkModelEventHandler<'create'>>(),

    /**
     * A {@link Set} of registered delete callbacks for {@link SparkModel} instances.
     */
    delete: new Set<SparkModelEventHandler<'delete'>>(),

    /**
     * A {@link Set} of registered persist callbacks for {@link SparkModel} instances.
     */
    persist: new Set<SparkModelEventHandler<'persist'>>(),

    /**
     * A {@link Set} of registered save callbacks for {@link SparkModel} instances.
     */
    save: new Set<SparkModelEventHandler<'save'>>(),

    /**
     * A {@link Set} of registered update callbacks for {@link SparkModel} instances.
     */
    update: new Set<SparkModelEventHandler<'update'>>(),

  };

  /**
   * A map of loaded {@link SparkModel} instances.
   */
  readonly #loadedModels = new Map<SparkModelId, TModel>();

  /**
   * The constructor of the {@link SparkModel} associated with this {@link SparkStore}.
   */
  readonly #ModelCtor: SparkModelCtor<TModel>;

  /**
   * The {@link SparkStateManager} responsible for persisting this {@link SparkModel}'s state.
   */
  readonly #stateManager: SparkStateManager<TState>;

  /**
   * Creates a new {@link SparkStore} instance.
   *
   * @throws If instantiated directly.
   * Direct instantiation is not allowed; use {@link getInstance} instead.
   */
  protected constructor(ModelCtor: typeof SparkModel) {
    this.#ModelCtor = ModelCtor as SparkModelCtor<TModel>;
    this.#stateManager = SparkStateManager.getRegisteredManager<TModel>(ModelCtor)!;

    if (!this.#stateManager) {
      throw new Error(
        `${this.constructor.name}: No SparkStateManager registered for model type: ${ModelCtor.name}.`
        + ' Did you forget to add the @model decorator to the model class?'
      );
    }

    if (this.#stateManager instanceof SparkReactiveStateManager) {
      this.#stateManager.listen();
    }
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
  initModel(state: Partial<TState>): TModel {
    const ModelCtor = this.#ModelCtor as SparkModelCtor<TModel>;
    const model = new ModelCtor(state);
    return model.reset();
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
  async delete(model: TModel | SparkModelId | Nullish): Promise<boolean> {
    model = this.toLoadedModel(model);
    if (!model) return false;

    const deleted = await this.#stateManager.delete(model.state);
    if (deleted) {
      this.#loadedModels.delete(model.id);

      // Emit default delete event if listenDelete is not overridden.
      this.#emit('delete', model, undefined);
    }

    return deleted;
  }

  #emit<TEvent extends SparkModelEmitEventType>(
    eventType: TEvent,
    model: TModel | Nullish,
    state: Partial<StateOf<TModel>> | undefined,
    oldState?: Partial<StateOf<TModel>>,
  ): void {
    if (!model) return;
    if (['create', 'delete', 'update'].indexOf(eventType) === -1) {
      throw new Error(`SparkPersistEventManager.emit: Unsupported event emit type: ${eventType}`);
    }

    let cbs: SparkModelEventHandler<'persist', TModel>[] = Array.from(
      this.#eventCbs[eventType] as Set<SparkModelEventHandler<'persist', TModel>>
    );

    // Create and update are subsets of save.
    if (eventType !== 'delete') {
      cbs = cbs.concat(Array.from(
        this.#eventCbs['save'] as Set<SparkModelEventHandler<'persist', TModel>>
      ));
    }

    // All actions are subsets of persist.
    cbs = cbs.concat(Array.from(
      this.#eventCbs['persist'] as Set<SparkModelEventHandler<'persist', TModel>>
    ));
    for (const cb of cbs) {
      cb(model, state, oldState);
    }
  }

  /**
   * Loads this {@link SparkModel} instance from the state storage.
   *
   * @param id The unique identifier of the {@link SparkModel} to load.
   *
   * @returns A {@link Promise} that resolves to this {@link SparkModel} instance if found, or `undefined` if not found.
   *
   * @final Override {@link loadModel} to define how the model is loaded.
   */
  async load(
    id: SparkModelId | TState | Nullish,
    noCache: boolean = false
  ): Promise<TModel | undefined> {
    id = this.toModelId(id);
    if (!id) return undefined;

    // Check cache first - only one instance of each Model should exist in memory.
    if (!noCache && this.#loadedModels.has(id)) {
      return this.#loadedModels.get(id);
    }

    // Load the raw state from storage.
    const state = await this.#stateManager.load(id);
    if (!state) return undefined;

    // If already loaded, update the existing instance; otherwise, create a new one.
    if (this.#loadedModels.has(id)) {
      this.#emit('update', this.#loadedModels.get(id)!, state);
    } else {
      const model = new this.#ModelCtor(state);
      this.#loadedModels.set(model.id, model);
    }

    return this.#loadedModels.get(id);
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
    const loadedModels: TModel[] = [];
    const states = await this.#stateManager.loadMany(opts);

    for (const state of states) {
      const stateId = this.toModelId(state);
      const model = (stateId && this.#loadedModels.has(stateId))
        ? this.#loadedModels.get(stateId)!
        : new this.#ModelCtor(state);

      if (!this.#loadedModels.has(model.id)) {
        this.#loadedModels.set(model.id, model);
      } else if (opts.noCache) {
        this.#emit('update', this.#loadedModels.get(model.id)!, state);
      }
      loadedModels.push(this.#loadedModels.get(model.id)!);
    }

    return loadedModels;
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
    cb: SparkModelEventHandler<TEvent, TModel>
  ): () => void {
    if (!this.#eventCbs[eventType]) {
      throw new Error(`SparkPersistEventManager.on: Unsupported event type: ${eventType}`);
    }

    // If using a reactive state manager, delegate to it.
    if (this.#stateManager instanceof SparkReactiveStateManager) {
      return this.#stateManager.on(eventType, ((state: Partial<TState>, oldState?: Partial<TState>) => {
        const model = this.toLoadedModel(state);
        if (!model) return;
        (cb as SparkModelEventHandler<'persist', TModel>)(model, state, oldState);
      }) as SparkStateEventHandler<TEvent, TState>);
    }

    // Otherwise, register directly with default listeners internal to this store.
    if (!this.#eventCbs[eventType].has(cb as SparkModelEventHandler<TEvent>)) {
      this.#eventCbs[eventType].add(cb as SparkModelEventHandler<TEvent>);
    }

    return () => this.#eventCbs[eventType].delete(cb as SparkModelEventHandler<TEvent>);
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
    const creating = !model.saved;

    // Merge any given data into the Model and refresh update timestamp before saving.
    const state = model.toSaveData();
    state.updateTimestamp = Date.now();

    // Actually perform the save operation defined by subclass and update raw saved state data.
    const savedState = await this.#stateManager.save(state);
    this.#loadedModels.set(model.id, model);

    // Emit default create or update event if listenCreate/listenUpdate are not overridden.
    this.#emit(creating ? 'create' : 'update', model, savedState);

    return model;
  }

  /**
   * Converts the given input to a {@link SparkModel} instance if possible.
   *
   * @param from The input to convert, which can be a {@link SparkModelId},
   * {@link SparkModelState}, {@link SparkModel}, or `null`/`undefined`.
   * @returns The corresponding {@link SparkModel} instance, or `undefined` if not found.
   */
  protected toLoadedModel(
    from: SparkModelId | Partial<TState> | TModel | Nullish
  ): TModel | undefined {
    from = this.toModelId(from);
    return (from)
      ? this.#loadedModels.get(from)
      : undefined;
  }

  /**
   * Converts the given input to a {@link SparkModelId} if possible.
   *
   * @param from The input to convert, which can be a {@link SparkModelId},
   * {@link SparkModelState}, {@link SparkModel}, or `null`/`undefined`.
   * @returns The corresponding {@link SparkModelId}, or `undefined` if not found.
   */
  protected toModelId(
    from: SparkModelId | Partial<TState> | TModel | Nullish
  ): SparkModelId | undefined {
    if ((from as TModel).id != null) {
      return `${(from as TModel).id}`;
    }

    return (from && typeof from === 'object')
      ? `${from.createTimestamp}`
      : from ?? undefined;
  }

}
