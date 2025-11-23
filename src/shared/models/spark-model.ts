import { detailedDiff, type DetailedDiff } from 'deep-object-diff';
import { cloneDeep } from 'lodash-es';
import type { DeepPartial, DeepReadonly } from 'utility-types';
import { deepMerge, DeepMergeOptions, serializeObject } from '~shared/utils/object.js';
import type { SparkModelEventHandler, SparkModelEventType, SparkModelId, SparkModelState } from './spark-model.interfaces.js';
import { SparkStore } from './spark-store.js';

/**
 * An abstract base class for Create, Read, Update, Delete (`CRUD`) models.
 *
 * @param TState - The type of the raw save {@link SparkModelState} object for the {@link SparkModel}.
 *
 * @implements {SparkModelState}
 */
export abstract class SparkModel<
  TState extends SparkModelState = SparkModelState,
> implements SparkModelState {

  /**
   * A branding property to associate the model with its state type.
   *
   * Used internally for type inference without deep type expansion.
   */
  declare readonly _stateBrand: TState;

  /**
   * The raw saved {@link SparkModelState} data for this {@link SparkModel}.
   *
   * Only used internally to reset the model to its saved state.
   *
   * Will become desynchronized from any unsaved changes to this {@link SparkModel}'s properties.
   * This is by design, since the {@link SparkModelState} data is meant to reflect the saved {@link SparkModelState} of the {@link SparkModel}.
   */
  #state: Partial<TState>;

  /**
   * The {@link SparkStore} instance that manages persistence for this {@link SparkModel} instance.
   */
  readonly #store: SparkStore<this>;

  /**
   * All unregister callbacks for removing event listeners on delete.
   */
  readonly #unregisterCbs: (() => void)[] = [];

  protected constructor(state: Partial<TState> = {}) {
    this.#store = SparkStore.getInstance(this.constructor as any);

    state.createTimestamp ??= Date.now();
    this.#state = cloneDeep(state);

    // Keep the saved state in sync on save events detected by the store.
    this.on('save', (_, savedState) => {
      if ((this.#state.updateTimestamp ?? 0) < savedState!.updateTimestamp!) {
        this.#state = cloneDeep(savedState!);
      }
    });

    // Auto-unregister all callbacks on delete to prevent memory leaks.
    this.on('delete', () => {
      setTimeout(() => { // Defer so that delete callbacks can still run.
        this.#unregisterCbs.forEach((unregister) => unregister());
        this.#unregisterCbs.length = 0;
      });
    });
  }

  get createTimestamp(): number {
    return this.state.createTimestamp!;
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
  get state(): Partial<DeepReadonly<TState>> {
    return this.#state as Partial<DeepReadonly<TState>>;
  }

  /**
   * The unique identifier for this {@link SparkModel} instance.
   *
   * If the {@link SparkModelState} contains an `id` property, it is used as the identifier.
   * Otherwise, {@link createTimestamp} is used as a string.
   */
  get id(): SparkModelId {
    return `${(this.#state as any)['id'] || this.createTimestamp}`;
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
    return this.#store.delete(this);
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
      if (model !== this) return;
      (persistCb as SparkModelEventHandler<'persist', this>)(model, state, oldState);
    };

    // Register the callback.
    const unregisterCb = this.#store.on(persistAction, wrappedCb as SparkModelEventHandler<TEvent, this>);

    // Wrap the unregister callback to also remove it from our internal list on unregister.
    const wrappedUnregisterCb = () => {
      unregisterCb();
      this.#unregisterCbs.splice(this.#unregisterCbs.indexOf(wrappedUnregisterCb), 1);
    };
    this.#unregisterCbs.push(wrappedUnregisterCb);

    return wrappedUnregisterCb;
  }

  /**
   * Resets `this` {@link SparkModel} instance to its initial state.
   *
   * @param mergeData The {@link SparkModelState} Partial containing explicit reset data.
   * Will {@link merge} the provided data into the initial state. Useful for retaining some properties.
   * @return `this` {@link SparkModel} instance with the reset state applied.
   */
  reset(mergeData?: DeepPartial<TState>): this {
    this.set(this.#state as TState);
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
   * Converts this {@link SparkModel} instance to serializable {@link SparkModelState} data, which is suitable for saving.
   *
   * @returns The {@link SparkModelState} data to be saved.
   */
  toSaveData(): TState {
    return serializeObject(this) as TState;
  }

}

export * from '~shared/decorators/model.js';
export type * from './spark-model.interfaces.js';
export default SparkModel;
