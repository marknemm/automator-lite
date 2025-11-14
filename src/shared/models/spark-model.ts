import deepFreeze from 'deep-freeze';
import { detailedDiff, type DetailedDiff } from 'deep-object-diff';
import { omitBy, toPlainObject } from 'lodash-es';
import type { DeepPartial, DeepReadonly } from 'utility-types';
import { deepMerge, DeepMergeOptions } from '~shared/utils/object.js';
import { SparkModelStore } from './spark-model-store.js';
import type { SparkModelId, SparkModelState, SparkPersistenceAction } from './spark-model.interfaces.js';

/**
 * An abstract base class for Create, Read, Update, Delete (`CRUD`) models.
 *
 * @param TState - The type of the raw save {@link SparkModelState} object for the {@link SparkModel}.
 *
 * @implements {SparkModelState}
 */
export abstract class SparkModel<
  TState extends SparkModelState = any,
> implements SparkModelState {

  /**
   * A branding property to associate the model with its state type.
   *
   * Used internally for type inference without deep type expansion via inference.
   */
  declare readonly _stateBrand: TState;

  /**
   * The frozen raw saved {@link SparkModelState} data for this {@link SparkModel}.
   *
   * Will become desynchronized from any unsaved changes to this {@link SparkModel}'s properties.
   * This is by design, since the {@link SparkModelState} data is meant to reflect the saved {@link SparkModelState} of the {@link SparkModel}.
   */
  #frozenState: DeepReadonly<Partial<TState>>;

  /**
   * The raw saved {@link SparkModelState} data for this {@link SparkModel}.
   *
   * Only used internally to reset the model to its saved state.
   *
   * Will become desynchronized from any unsaved changes to this {@link SparkModel}'s properties.
   * This is by design, since the {@link SparkModelState} data is meant to reflect the saved {@link SparkModelState} of the {@link SparkModel}.
   */
  #state: Partial<TState>;

  #store: SparkModelStore<this>;

  constructor(
    store: SparkModelStore,
    state: Partial<TState> = {}
  ) {
    this.#store = store as SparkModelStore<this>;
    if (!this.store.constructing) {
      throw new Error(
        `SparkModel instances must be created via their corresponding SparkModelStore (${this.store.constructor.name}).`
      );
    }

    // If state is new and hasn't been saved, will need to init timestamp.
    state.createTimestamp ??= Date.now();

    this.#frozenState = deepFreeze(state) as any;
    this.#state = state;

    // Listen for save events to update internal state.
    this.on('save', (savedState) => {
      this.#state = savedState || {};
      this.#frozenState = deepFreeze(this.#state) as any;
    });
  }

  get createTimestamp(): number {
    return this.#state.createTimestamp!;
  }

  /**
   * Whether this {@link SparkModel} has ever been saved.
   */
  get saved(): boolean {
    return this.updateTimestamp !== undefined;
  }

  /**
   * The raw `readonly` saved {@link SparkModelState} data for this {@link SparkModel}.
   *
   * Will become desynchronized from any unsaved changes to this {@link SparkModel}'s properties.
   * This is by design, since the {@link SparkModelState} data is meant to reflect the saved {@link SparkModelState} of the {@link SparkModel}.
   */
  get state(): DeepReadonly<Partial<TState>> {
    return this.#frozenState;
  }

  /**
   * The {@link SparkModelStore} for managing persistence data for this {@link SparkModel}.
   */
  get store(): SparkModelStore<this> {
    return this.#store;
  }

  /**
   * The unique identifier for this {@link SparkModel} instance.
   *
   * If the {@link SparkModelState} contains an `id` property, it is used as the identifier.
   * Otherwise, {@link createTimestamp} is used as a string.
   */
  get id(): SparkModelId {
    return `${(this.#state as any)['id']}` || `${this.createTimestamp}`;
  }

  get updateTimestamp(): number | undefined {
    return this.#state.updateTimestamp;
  }

  /**
   * Deletes this {@link SparkModel} instance from permanent storage.
   *
   * @returns A promise that resolves to `true` if the instance was deleted, or `false` otherwise
   * (such as in the case where the model was not found in storage).
   *
   * @final Override {@link SparkModelState.delete} to define how the model is deleted.
   * This is a convenience method that calls the store's delete method, and should not contain custom delete logic.
   */
  delete(): Promise<boolean> {
    return this.store.delete(this);
  }

  /**
   * Computes the detailed difference between the saved state and the current state of this {@link SparkModel}.
   *
   * @returns A {@link DetailedDiff} object representing the differences.
   * @see https://www.npmjs.com/package/deep-object-diff
   */
  diff(): DetailedDiff {
    return detailedDiff(this.#state, this.toSaveData());
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
   * Merges the given data into this {@link SparkModel} object.
   * Ignores functions and `undefined` values in the merge data.
   *
   * @param data The partial data to merge into this {@link SparkModel}.
   * @param opts Optional {@link DeepMergeOptions} to customize the merge behavior.
   * @returns The updated {@link SparkModel} object with merged data.
   *
   * @param T The type of the model object.
   */
  merge(data: DeepPartial<TState>, opts: DeepMergeOptions = {}): this {
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
   * Unregisters a previously registered persistence callback for `this` {@link SparkModel} instance.
   *
   * @param persistAction The {@link SparkPersistenceAction} to stop monitoring.
   * @param persistCb The callback function to unregister.
   *
   * @final Override {@link SparkModelStore.off} to define how the model persistence callbacks are unregistered.
   * This is a convenience method that calls the store's off method, and should not contain custom logic.
   */
  off(
    persistAction: SparkPersistenceAction,
    persistCb: (state?: TState) => void
  ): void {
    this.store.off(persistAction, this, persistCb);
  }

  /**
   * Registers a callback to be invoked whenever `this` {@link SparkModel} instance changes.
   *
   * @param persistAction The {@link SparkPersistenceAction} to monitor.
   * @param persistCb The callback function to be invoked on persistence change.
   *
   * @final Override {@link SparkModelStore.on} to define how the model persistence callbacks are registered.
   * This is a convenience method that calls the store's on method, and should not contain custom logic.
   */
  on(
    persistAction: SparkPersistenceAction,
    persistCb: (state?: TState) => void
  ): void {
    this.store.on(persistAction, this, persistCb);
  }

  /**
   * Resets `this` {@link SparkModel} instance to its initial state.
   *
   * @param mergeData The {@link SparkModelState} Partial containing explicit reset data.
   * Will {@link merge} the provided data into the initial state. Useful for retaining some properties.
   * @return `this` {@link SparkModel} instance with the reset state applied.
   */
  reset(mergeData?: DeepPartial<TState>): this {
    console.log('Resetting model to saved state:', this.#state);
    this.set(this.#state as TState);
    console.log('Model after reset:', this);
    if (mergeData) this.merge(mergeData);
    return this;
  }

  /**
   * Saves `this` {@link SparkModel} instance to permanent storage.
   *
   * @param mergeData Optional partial {@link SparkModelState} data to {@link merge} with the current state before saving.
   * Any data not specified in {@link mergeData} will be saved as-is.
   * @returns A {@link Promise} that resolves to `this` {@link SparkModel} instance when the save is complete.
   *
   * @final Override {@link SparkModelStore.save} to define how the model is saved.
   * This is a convenience method that calls the store's save method, and should not contain custom save logic.
   */
  save(mergeData?: DeepPartial<TState>): Promise<this> {
    if (mergeData) this.merge(mergeData);
    return this.store.save(this) as Promise<this>;
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
    debugger;
    deepMerge(this, data, {
      arrayBehavior: 'replace',
      filter: (key, dest, src) => (typeof src[key] !== 'function'),
      includeUndefined: true,
      removeMissingKeys: true,
    });

    return this;
  }

  /**
   * Converts this {@link SparkModel} instance to serializable {@link SparkModelState} data, which is suitable for saving.
   *
   * @returns The {@link SparkModelState} data to be saved.
   */
  toSaveData(): TState {
    const plainObj = toPlainObject(this);
    return omitBy(plainObj, (val) => typeof val === 'function') as TState;
  }

}

export type * from './spark-model.interfaces.js';
