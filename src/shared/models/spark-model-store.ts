import type { DeepReadonly, Nullish } from 'utility-types';
import type { SparkPersistenceAction, SparkModel, SparkModelState, SparkModelId, LoadSparkModelOptions, StateOf } from '~shared/models/spark-model.js';

/**
 * An abstract base class for storing and retrieving {@link SparkModel} instances.
 *
 * @param TModel - The type of {@link SparkModel} to store.
 * @param TState - The {@link SparkModel}'s associated {@link SparkModelState} type (defaults to correct type).
 */
export abstract class SparkModelStore<
  TModel extends SparkModel<TState> = SparkModel,
  TState extends SparkModelState = StateOf<TModel>,
> {

  /**
   * A flag that guards the construction of {@link SparkModelStore} singleton instances.
   *
   * Ensures that construction only happens as a result of calls to {@link SparkModelStore.getInstance}.
   */
  static #constructing = false;

  /**
   * A map of singleton instances of {@link SparkModelStore} classes.
   */
  static readonly #instances = new WeakMap<
    new (...args: any[]) => SparkModelStore,
    SparkModelStore<SparkModel>
  >();

  /**
   * A map of loaded {@link SparkModel} instances.
   */
  readonly #loadedModels = new Map<SparkModelId, TModel>();

  /**
   * A {@link WeakMap} of registered create callbacks for {@link SparkModel} instances.
   */
  readonly #createCbs = new WeakMap<TModel, ((state?: TState) => void)[]>();

  /**
   * A {@link WeakMap} of registered delete callbacks for {@link SparkModel} instances.
   */
  readonly #deleteCbs = new WeakMap<TModel, ((state?: TState) => void)[]>();

  /**
   * A {@link WeakMap} of registered persist callbacks for {@link SparkModel} instances.
   */
  readonly #persistCbs = new WeakMap<TModel, ((state?: TState) => void)[]>();

  /**
   * A {@link WeakMap} of registered save callbacks for {@link SparkModel} instances.
   */
  readonly #saveCbs = new WeakMap<TModel, ((state?: TState) => void)[]>();

  /**
   * A {@link WeakMap} of registered update callbacks for {@link SparkModel} instances.
   */
  readonly #updateCbs = new WeakMap<TModel, ((state?: TState) => void)[]>();

  #defaultCreateHandler: ((model: SparkModel) => void) | undefined;
  #defaultDeleteHandler: ((model: SparkModel) => void) | undefined;
  #defaultPersistHandler: ((model: SparkModel) => void) | undefined;
  #defaultSaveHandler: ((model: SparkModel) => void) | undefined;
  #defaultUpdateHandler: ((model: SparkModel) => void) | undefined;

  /**
   * Creates a new {@link SparkModelStore} instance.
   *
   * @throws If instantiated directly.
   * Direct instantiation is not allowed; use {@link getInstance} instead.
   */
  constructor() {
    if (!SparkModelStore.#constructing) {
      throw new Error(`
        ${this.constructor.name}: direct instantiation is not allowed.
        Use ${this.constructor.name}.getInstance().
      `);
    }
  }

  /**
   * Initializes or gets the singleton instance of this {@link SparkModelStore} implementation.
   *
   * @param args Optional constructor arguments for the {@link SparkModelStore}.
   * @returns The singleton instance of the {@link SparkModelStore} implementation.
   *
   * @template T - The type of the {@link SparkModelStore} implementation.
   */
  static getInstance<T extends SparkModelStore>(
    this: new (...args: ConstructorParameters<typeof SparkModelStore>) => T,
    ...args: ConstructorParameters<typeof SparkModelStore>
  ): T {
    if (!SparkModelStore.#instances.has(this)) {
      try {
        SparkModelStore.#constructing = true;
        const instance = new this(...args);
        instance.listenCreate(model => instance.#createCbs.get(model)?.forEach(cb => cb()));
        instance.listenDelete(model => instance.#deleteCbs.get(model)?.forEach(cb => cb()));
        instance.listenPersist(model => instance.#persistCbs.get(model)?.forEach(cb => cb()));
        instance.listenSave((model) => instance.#saveCbs.get(model)?.forEach(cb => cb()));
        instance.listenUpdate(model => instance.#updateCbs.get(model)?.forEach(cb => cb()));
        SparkModelStore.#instances.set(this, instance);
      } finally {
        SparkModelStore.#constructing = false;
      }
    }

    return SparkModelStore.#instances.get(this)! as T;
  }

  get constructing(): boolean {
    return SparkModelStore.#constructing;
  }

  /**
   * The constructor for the {@link SparkModel} associated with this store.
   */
  protected abstract get ModelCtor(): new (...args: any[]) => TModel;

  /**
   * Initializes a new {@link SparkModel} instance with the given state.
   *
   * `Note`: This method does not save the model; it only initializes it.
   *
   * @param state The initial state for the {@link SparkModel}.
   * @returns The initialized {@link SparkModel} instance.
   */
  init(state: Partial<TState>): TModel {
    try {
      SparkModelStore.#constructing = true;
      const model = new this.ModelCtor(this, state);
      return model.reset();
    } finally {
      SparkModelStore.#constructing = false;
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
  async delete(model: TModel | SparkModelId | Nullish): Promise<boolean> {
    model = this.toLoadedModel(model);
    if (!model) return false;

    const deleted = await this.deleteState(model.state);
    if (deleted) {
      this.#loadedModels.delete(model.id);
      this.#defaultDeleteHandler?.(model);
    }

    return deleted;
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
  protected abstract deleteState(
    state: DeepReadonly<Partial<TState>>
  ): Promise<boolean>;

  protected listenCreate(
    afterCreate: (model: TModel) => void
  ): void {
    this.#defaultCreateHandler = afterCreate as ((model: SparkModel) => void);
  }

  /**
   * Listens for delete events and triggers registered callbacks.
   *
   * `Note`: Can be `overridden` by subclasses for more comprehensive delete detection.
   * Defaults to detecting delete when {@link delete} is called.
   *
   * @param afterDelete The callback to invoke after a {@link SparkModel} delete is detected.
   * Triggers all callbacks registered via {@link on}`('delete', ...)` for the model.
   */
  protected listenDelete(
    afterDelete: (model: TModel) => void
  ): void {
    this.#defaultDeleteHandler = afterDelete as ((model: SparkModel) => void);
  }

  protected listenPersist(
    afterPersist: (model: TModel) => void
  ): void {
    this.#defaultPersistHandler = afterPersist as ((model: SparkModel) => void);
  }

  /**
   * Listens for save events and triggers registered callbacks.
   *
   * `Note`: Can be `overridden` by subclasses for more comprehensive save detection.
   * Defaults to detecting save when {@link save} is called.
   *
   * @param afterSave The callback to invoke after a {@link SparkModel} save is detected.
   * Triggers all callbacks registered via {@link on}`('save', ...)` for the model.
   */
  protected listenSave(
    afterSave: (model: TModel) => void
  ): void {
    this.#defaultSaveHandler = afterSave as ((model: SparkModel) => void);
  }

  protected listenUpdate(
    afterUpdate: (model: TModel) => void
  ): void {
    this.#defaultUpdateHandler = afterUpdate as ((model: SparkModel) => void);
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
    id: SparkModelId | TState | Nullish
  ): Promise<TModel | undefined> {
    id = this.toModelId(id);
    if (!id) return undefined;

    // Check cache first - only one instance of each Model should exist in memory.
    if (this.#loadedModels.has(id)) {
      return this.#loadedModels.get(id);
    }

    const state = await this.loadState(id);
    if (state) {
      const model = new this.ModelCtor(this, state);
      this.#loadedModels.set(model.id, model);
      return model;
    }
    return undefined;
  }

  /**
   * Loads a {@link SparkModel} instance from the state storage.
   *
   * @param id The unique identifier of the {@link SparkModel} to load.
   * @return A {@link Promise} that resolves to the loaded {@link SparkModel} instance, or `undefined` if not found.
   */
  protected abstract loadState(
    id: SparkModelId
  ): Promise<TState | undefined>;

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
    opts: LoadSparkModelOptions<TState> = {}
  ): Promise<TModel[]> {
    const loadedModels: TModel[] = [];
    const states = await this.loadManyStates(opts);

    for (const state of states) {
      const stateId = this.toModelId(state);
      const model = (stateId && this.#loadedModels.has(stateId))
        ? this.#loadedModels.get(stateId)!
        : new this.ModelCtor(this, state);

      if (!this.#loadedModels.has(model.id)) {
        this.#loadedModels.set(model.id, model);
      }
      loadedModels.push(this.#loadedModels.get(model.id)!);
    }

    return loadedModels;
  }

  /**
   * Loads many {@link SparkModel} instances from the state storage.
   *
   * @param opts - {@link LoadSparkModelOptions} for configuring how to load models.
   * @returns A {@link Promise} that resolves to an array of loaded {@link SparkModel} instances.
   */
  protected abstract loadManyStates(
    opts?: LoadSparkModelOptions<TState>
  ): Promise<TState[]>;

  /**
   * Unregisters a previously registered persistence callback for the given {@link SparkModel}.
   *
   * @param action The {@link SparkPersistenceAction} to stop monitoring.
   * @param model The {@link SparkModel} instance or {@link SparkModelId} of the instance
   * to stop monitoring for persistence actions.
   * @param saveCb The callback function to unregister.
   */
  off(
    action: SparkPersistenceAction,
    model: SparkModelId | TModel | Nullish,
    saveCb: (state?: TState) => void
  ): void {
    model = this.toLoadedModel(model);
    if (!model) return;

    switch (action) {
      case 'create':
        if (this.#createCbs.has(model)) {
          const cbs = this.#createCbs.get(model)!.filter(cb => cb !== saveCb);
          this.#createCbs.set(model, cbs);
        }
        break;

      case 'delete':
        if (this.#deleteCbs.has(model)) {
          const cbs = this.#deleteCbs.get(model)!.filter(cb => cb !== saveCb);
          this.#deleteCbs.set(model, cbs);
        }
        break;

      case 'persist':
        if (this.#persistCbs.has(model)) {
          const cbs = this.#persistCbs.get(model)!.filter(cb => cb !== saveCb);
          this.#persistCbs.set(model, cbs);
        }
        break;

      case 'save':
        if (this.#saveCbs.has(model)) {
          const cbs = this.#saveCbs.get(model)!.filter(cb => cb !== saveCb);
          this.#saveCbs.set(model, cbs);
        }
        break;

      case 'update':
        if (this.#updateCbs.has(model)) {
          const cbs = this.#updateCbs.get(model)!.filter(cb => cb !== saveCb);
          this.#updateCbs.set(model, cbs);
        }
        break;

      default:
        throw new Error(`SparkModelStore.off: Unsupported action type: ${action}`);
    }
  }

  /**
   * Registers a callback to be invoked whenever the given {@link SparkModel} is changed.
   *
   * `Note`: {@link off} should be used to unregister the callback when no longer needed.
   * Also, the callbacks will be automatically garbage collected when the model is no longer referenced (deleted).
   *
   * @param action The {@link SparkPersistenceAction} to monitor.
   * @param model The {@link SparkModel} instance or {@link SparkModelId} of the instance
   * to monitor for persistence actions.
   * @param saveCb The callback function to invoke on change.
   */
  on(
    action: SparkPersistenceAction,
    model: TModel | SparkModelId | Nullish,
    saveCb: (state?: TState) => void
  ): void {
    model = this.toLoadedModel(model);
    if (!model) return;

    switch (action) {
      case 'create':
        if (!this.#createCbs.has(model)) {
          this.#createCbs.set(model, []);
        }
        this.#createCbs.get(model)!.push(saveCb as any);
        break;

      case 'delete':
        if (!this.#deleteCbs.has(model)) {
          this.#deleteCbs.set(model, []);
        }
        this.#deleteCbs.get(model)!.push(saveCb as any);
        break;

      case 'persist':
        if (!this.#persistCbs.has(model)) {
          this.#persistCbs.set(model, []);
        }
        this.#persistCbs.get(model)!.push(saveCb as any);
        break;

      case 'save':
        if (!this.#saveCbs.has(model)) {
          this.#saveCbs.set(model, []);
        }
        this.#saveCbs.get(model)!.push(saveCb as any);
        break;

      case 'update':
        if (!this.#updateCbs.has(model)) {
          this.#updateCbs.set(model, []);
        }
        this.#updateCbs.get(model)!.push(saveCb as any);
        break;

      default:
        throw new Error(`SparkModelStore.on: Unsupported action type: ${action}`);
    }
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
    // Merge any given data into the Model and refresh update timestamp before saving.
    const state = model.toSaveData();
    state.updateTimestamp = Date.now();

    // Actually perform the save operation defined by subclass and update raw saved state data.
    const savedState = await this.saveState(state);
    this.#loadedModels.set(model.id, model);
    this.#defaultSaveHandler?.(model);

    return model;
  }

  /**
   * Saves the given {@link SparkModel} to permanent storage.
   * This will update the saved {@link SparkModelState} if it exists, or create a new one if it doesn't.
   *
   * `Note`: This method actually performs the save operation and must be implemented by subclasses.
   *
   * @param model The {@link SparkModel} instance to save.
   * @returns The saved {@link SparkModel} instance.
   */
  protected abstract saveState(state: TState): Promise<TState>;

  /**
   * Converts the given input to a {@link SparkModel} instance if possible.
   *
   * @param from The input to convert, which can be a {@link SparkModelId},
   * {@link SparkModelState}, {@link SparkModel}, or `null`/`undefined`.
   * @returns The corresponding {@link SparkModel} instance, or `undefined` if not found.
   */
  protected toLoadedModel(
    from: SparkModelId | TState | TModel | Nullish
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
    from: SparkModelId | TState | TModel | Nullish
  ): SparkModelId | undefined {
    if ((from as TModel).id != null) {
      return `${(from as TModel).id}`;
    }

    return (from && typeof from === 'object')
      ? `${from.createTimestamp}`
      : from ?? undefined;
  }

}
