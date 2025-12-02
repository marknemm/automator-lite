import { detailedDiff, type DetailedDiff } from 'deep-object-diff';
import type { DeepPartial, DeepReadonly } from 'utility-types';
import { deepMerge, DeepMergeOptions, serializeObject } from '~shared/utils/object.js';
import type { SparkModelEventHandler, SparkModelEventType, SparkModelId, SparkModelIdentifier, SparkState } from './spark-model.interfaces.js';
import { isSameId } from './spark-state-utils.js';
import { SparkStore } from './spark-store.js';

/**
 * An abstract base class for Create, Read, Update, Delete (`CRUD`) models.
 *
 * @param TState - The type of the raw save {@link SparkState} object for the {@link SparkModel}.
 *
 * @implements {SparkState}
 */
export abstract class SparkModel<
  TState extends SparkState = SparkState,
> implements SparkState {

  /**
   * A temporary counter for generating temporary IDs for unsaved models.
   *
   * `Note`: This is negative to avoid collision with real IDs.
   */
  static #tempIdCounter = 0;

  /**
   * A branding property to associate the model with its state type.
   *
   * Used internally for type inference without deep type expansion.
   */
  declare readonly _stateBrand: TState;

  /**
   * Whether this {@link SparkModel} has been deleted.
   */
  #deleted = false;

  /**
   * The unique identifier for this {@link SparkModel} instance.
   */
  #id: number;

  /**
   * The {@link SparkStore} instance that manages persistence for this {@link SparkModel} instance.
   */
  readonly #store: SparkStore<this>;

  /**
   * All callbacks for removing observers.
   */
  readonly #unregisterObserverCbs: (() => void)[] = [];

  /**
   * Creates a new {@link SparkModel} instance.
   *
   * @internal Use the static {@link SparkStore.newModel} method instead.
   */
  constructor(id: number = --SparkModel.#tempIdCounter) {
    this.#store = SparkStore.getInstance(this.constructor as any);

    if (!this.#store.privilegeActive) {
      throw new Error(
        'Direct construction of SparkModel instances is not allowed.\n' +
        'Use SparkStore.newModel() instead.'
      );
    }

    this.#id = id;
  }

  get createTimestamp(): number {
    return this.state.createTimestamp ?? -1;
  }

  /**
   * Whether this {@link SparkModel} has been deleted.
   */
  get deleted(): boolean {
    return this.#deleted;
  }

  get id(): SparkModelId {
    return this.#id;
  }

  /**
   * Whether this {@link SparkModel} has ever been saved.
   */
  get saved(): boolean {
    return this.createTimestamp >= 0;
  }

  /**
   * The raw `readonly` saved {@link SparkState} data for this {@link SparkModel}.
   *
   * Will become desynchronized from any unsaved changes to this {@link SparkModel}'s properties.
   * This is by design, since the {@link SparkState} data is meant to reflect the saved {@link SparkState} of the {@link SparkModel}.
   */
  get state(): Partial<DeepReadonly<TState>> {
    return this.#store.getCachedState(this.id) as DeepReadonly<TState>
        ?? { id: this.id, createTimestamp: -1, updateTimestamp: -1 };
  }

  get updateTimestamp(): number {
    return this.state.updateTimestamp ?? this.createTimestamp;
  }

  /**
   * Deletes this {@link SparkModel} instance from permanent storage.
   *
   * @returns A promise that resolves to `true` if the instance was deleted, or `false` otherwise
   * (such as in the case where the model was not found in storage).
   *
   * @final Override {@link SparkState.delete} to define how the model is deleted.
   * This is a convenience method that calls the store's delete method, and should not contain custom delete logic.
   */
  delete(): Promise<boolean> {
    return this.#store.delete(this);
  }

  /**
   * Computes the detailed difference between the saved state and the current state of this {@link SparkModel}.
   *
   * @returns A {@link DetailedDiff} object representing the differences.
   * @see https://www.npmjs.com/package/deep-object-diff
   */
  diff(): DetailedDiff {
    return detailedDiff(this.state, this.toSaveData());
  }

  /**
   * Determines if this {@link SparkModel} has unsaved changes compared to its saved state.
   *
   * @returns A boolean indicating whether the model has unsaved changes.
   */
  dirty(): boolean {
    if (!this.saved) return true;

    const diff = this.diff();
    return Object.keys(diff.added).length > 0
        || Object.keys(diff.deleted).length > 0
        || Object.keys(diff.updated).length > 0;
  }

  /**
   * Determines if this {@link SparkModel} instance corresponds to the given {@link SparkModelIdentifier}.
   * The identifier can be another model instance, a unique ID, or a partial state object.
   *
   * @param id The {@link SparkModelIdentifier} to check against.
   * @returns `true` if the identifier matches this model, `false` otherwise.
   */
  hasId(id: SparkModelIdentifier<this>): boolean {
    return isSameId(this, id);
  }

  /**
   * Merges the given data into this {@link SparkModel} object.
   * Ignores functions and `undefined` values in the merge data.
   *
   * @param data The partial data to merge into this {@link SparkModel}.
   * @param opts Optional {@link DeepMergeOptions} to customize the merge behavior.
   * @returns The updated {@link SparkModel} object with merged data.
   *
   * @param T The type of the model object.
   */
  merge(
    data: DeepPartial<TState> | Partial<TState>,
    opts: DeepMergeOptions = {}
  ): this {
    if (!data) return this;

    deepMerge(this, data, {
      ...opts,
      // Always exclude functions from being merged.
      filter: (key, dest, src) =>
        ( typeof src[key] !== 'function'
          && (!opts.filter || opts.filter(key, dest, src)) ),
    });

    return this;
  }

  /**
   * Registers a callback to be invoked whenever `this` {@link SparkModel} instance changes.
   *
   * @param persistAction The {@link SparkModelEventType} to monitor.
   * @param persistCb The callback function to be invoked on persistence change.
   *
   * @final Override {@link SparkStore.on} to define how the model persistence callbacks are registered.
   * This is a convenience method that calls the store's on method, and should not contain custom logic.
   */
  on<TEvent extends SparkModelEventType>(
    persistAction: TEvent,
    persistCb: SparkModelEventHandler<TEvent, this>
  ): () => void {
    // Create a wrapper callback to filter events for this instance.
    const wrappedCb: SparkModelEventHandler<'persist', this> = (model, state, oldState) => {
      if (!this.hasId(model)) return;
      (persistCb as SparkModelEventHandler<'persist', this>)(model, state, oldState);
    };

    // Register the callback.
    const unregisterCb = this.#store.on(persistAction, wrappedCb as SparkModelEventHandler<TEvent, this>);

    // Wrap the unregister callback to also remove it from our internal list on unregister.
    const wrappedUnregisterCb = () => {
      unregisterCb();
      this.#unregisterObserverCbs.splice(this.#unregisterObserverCbs.indexOf(wrappedUnregisterCb), 1);
    };
    this.#unregisterObserverCbs.push(wrappedUnregisterCb);

    // Auto-unregister all observer callbacks on delete to prevent memory leaks.
    if (this.#unregisterObserverCbs.length === 1) { // Only register once.
      // Defer to allow all observers to be invoked before unregistering.
      this.on('delete', () => setTimeout(() => this.unregisterAllObservers()));
    }

    return wrappedUnregisterCb;
  }

  /**
   * Resets `this` {@link SparkModel} instance to its initial state.
   *
   * @param mergeData The {@link SparkState} Partial containing explicit reset data.
   * Will {@link merge} the provided data into the initial state. Useful for retaining some properties.
   * @return `this` {@link SparkModel} instance with the reset state applied.
   */
  reset(mergeData?: DeepPartial<TState> | Partial<TState>): this {
    const initialState = this.#store.getCachedState(this.id);
    if (initialState) {
      this.set(initialState);
      this.#id = initialState.id;
    }
    if (mergeData) this.merge(mergeData);
    return this;
  }

  /**
   * Saves `this` {@link SparkModel} instance to permanent storage.
   *
   * @param mergeData Optional partial {@link SparkState} data to {@link merge} with the current state before saving.
   * Any data not specified in {@link mergeData} will be saved as-is.
   * @returns A {@link Promise} that resolves to `this` {@link SparkModel} instance when the save is complete.
   *
   * @final Override {@link SparkStore.save} to define how the model is saved.
   * This is a convenience method that calls the store's save method, and should not contain custom save logic.
   */
  save(mergeData?: DeepPartial<TState>): Promise<this> {
    if (mergeData) this.merge(mergeData);
    return this.#store.save(this) as Promise<this>;
  }

  /**
   * Sets the state of this {@link SparkModel} instance.
   *
   * @param data The new state data to set.
   * @returns This {@link SparkModel} instance with the updated state.
   */
  set(data: TState): this {
    if (!data) return this;

    // Total replacement of state, while avoiding functions and non-writable properties.
    deepMerge(this, data, {
      arrayBehavior: 'replace',
      filter: (key, dest, src) => (typeof src[key] !== 'function'),
      includeUndefined: true,
      removeMissingKeys: true,
    });

    return this;
  }

  /**
   * Converts this {@link SparkModel} instance to serializable {@link SparkState} data, which is suitable for saving.
   *
   * @returns The {@link SparkState} data to be saved.
   */
  toSaveData(): TState {
    return serializeObject(this) as TState;
  }

  /**
   * Unregisters all observers registered on this {@link SparkModel} instance
   * via the {@link SparkModel.on} method.
   */
  unregisterAllObservers(): void {
    this.#unregisterObserverCbs.forEach((unregister) => unregister());
  }

}

export * from '~shared/decorators/model.js';
export type * from './spark-model.interfaces.js';
export default SparkModel;
