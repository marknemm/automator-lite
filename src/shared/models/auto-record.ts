import deepFreeze from 'deep-freeze';
import type { DeepReadonly, Nullish } from 'utility-types';
import { AutoRecordConfigModal } from '~content/components/auto-record-config-modal.js';
import { loadState, saveState } from '~shared/utils/state.js';
import type { AutoRecordAction, AutoRecordState, AutoRecordUid, ConfigureRecordOptions, LoadRecordOptions } from './auto-record.interfaces.js';

/**
 * Represents an {@link AutoRecord} that contains actions that are replayable on a webpage.
 *
 * @implements {AutoRecordState}
 */
export class AutoRecord implements AutoRecordState {

  readonly createTimestamp: number;

  #actions: AutoRecordAction[] = [];
  #autoRun = false;
  #frequency: number | Nullish;
  #frozenState: DeepReadonly<Partial<AutoRecordState>>;
  #name = '';
  #paused = false;
  #state: Partial<AutoRecordState>;
  #updateTimestamp: number;

  /**
   * Creates a new {@link AutoRecord} instance from raw {@link AutoRecordState} data.
   *
   * @param state The raw {@link AutoRecordState} data.
   */
  constructor(state: Partial<AutoRecordState> | AutoRecordAction[]) {
    state = state instanceof Array
      ? { actions: state }
      : state;
    this.#state = state;
    this.#frozenState = deepFreeze(state);
    this.createTimestamp = state.createTimestamp ?? new Date().getTime();
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
    this.reset(state);
  }

  get actions(): AutoRecordAction[] { return this.#actions; }
  set actions(actions: AutoRecordAction[] | Nullish) { this.#actions = actions ?? []; }

  get autoRun(): boolean { return this.#autoRun; }
  set autoRun(autoRun: boolean | Nullish) { this.#autoRun = autoRun ?? false; }

  get frequency(): number | Nullish { return this.#frequency; }
  set frequency(frequency: number | Nullish) {
    this.#frequency = (typeof frequency === 'number')
      ? Math.max(0, frequency)
      : frequency;
  }

  get name(): string { return this.#name; }
  set name(name: string | Nullish) { this.#name = name?.trim() ?? ''; }

  get paused(): boolean { return this.#paused ?? false; }
  set paused(paused: boolean | Nullish) { this.#paused = paused ?? false; }

  /**
   * The raw {@link AutoRecordState} data.
   *
   * Will become desynchronized from any unsaved changes to this {@link AutoRecord}'s properties.
   * This is by design, since the state data is meant to reflect the saved state of the record.
   *
   * @return The raw {@link AutoRecordState} data.
   */
  get state(): DeepReadonly<Partial<AutoRecordState>> {
    return this.#frozenState;
  }

  /**
   * The unique identifier for this {@link AutoRecord}.
   */
  get uid(): AutoRecordUid { return `${this.createTimestamp}`; }

  get updateTimestamp(): number { return this.#updateTimestamp; }

  /**
   * Loads an {@link AutoRecord} instance from the state storage by its unique identifier.
   *
   * @param uid The unique identifier of the {@link AutoRecord} to load.
   * Can be a string representing the timestamp or a partial {@link AutoRecordState}.
   * If `null` or `undefined`, no action is taken.
   * @returns A promise that resolves to the loaded {@link AutoRecord} instance, or `undefined` if not found.
   */
  static async load(
    uid: AutoRecordUid | Partial<AutoRecordState> | Nullish,
  ): Promise<AutoRecord | undefined> {
    if (!uid) return undefined; // No-op if no uid is provided.

    // If uid is a string, treat it as a timestamp.
    const createTimestamp = (typeof uid === 'string')
      ? parseInt(uid, 10)
      : uid.createTimestamp;

    return (await this.loadMany({
      filter: record => record.createTimestamp === createTimestamp,
    }))[0];
  }

  /**
   * Loads many {@link AutoRecord} instances from the state storage.
   *
   * @param options - {@link LoadRecordOptions} for configuring how to load records.
   * @param options.filter - A filter function to apply to the records. Defaults to no filtering.
   * @param options.sort - A sort function to apply to the records. Defaults to sorting by name.
   * @returns A promise that resolves to an array of loaded {@link AutoRecord} instances.
   */
  static async loadMany({
    filter,
    sort = (a, b) => a.name.localeCompare(b.name),
  }: LoadRecordOptions = {}): Promise<AutoRecord[]> {
    let records = await loadState('records');
    if (filter) records = records.filter(filter);
    return records
      .sort(sort)
      .map(recordState => new AutoRecord(recordState));
  }

  /**
   * Configures and saves a given new or existing {@link AutoRecord} instance.
   *
   * @param recordState The state of the {@link AutoRecord} to configure.
   * If `null` or `undefined`, will perform no action.
   * @param options - Options for configuring the record.
   * @param options.omitSave - If `true`, the record will not be saved after configuration. Defaults to `false`.
   * @returns A {@link Promise} that resolves to the configured and saved {@link AutoRecord} instance.
   * If the user cancels the configuration, it resolves to `undefined`.
   */
  static async configure(
    recordState: Partial<AutoRecordState> | AutoRecordAction[] | Nullish,
    { omitSave = false }: ConfigureRecordOptions = {},
  ): Promise<AutoRecord | undefined> {
    if (!recordState) return; // No-op if no record state is provided.

    // Ensure the recordState is an instance of AutoRecord for better type safety.
    const record = (recordState instanceof AutoRecord)
      ? recordState
      : new AutoRecord(recordState);

    return record.configure({ omitSave });
  }

  /**
   * Configures and saves the given {@link AutoRecord} by opening the configuration modal.
   *
   * @param record - The {@link AutoRecord} to save.
   * @param options - Options for configuring the record.
   * @param options.omitSave - If `true`, the record will not be saved after configuration. Defaults to `false`.
   * @returns A {@link Promise} that resolves to this {@link AutoRecord} instance after configuration.
   * If the user cancels the configuration, it resolves to `undefined`.
   */
  async configure(
    { omitSave = false }: ConfigureRecordOptions = {}
  ): Promise<AutoRecord | undefined> {
    const configResult = await AutoRecordConfigModal.open({
      mountPoint: document.body,
      closedBy: 'any',
      data: this,
    }).onModalClose;

    return (!omitSave && configResult)
      ? await this.save() // Save the record if the user confirmed the configuration.
      : configResult;
  }

  /**
   * Saves the current state of this {@link AutoRecord} to state storage.
   * This will update the record in the state storage, or create a new one if it doesn't exist.
   *
   * @returns A {@link Promise} that resolves to this {@link AutoRecord} instance after saving.
   */
  async save(): Promise<this> {
    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      record.createTimestamp === this.createTimestamp
    );

    this.#updateTimestamp = Date.now();

    // Either add new record or update existing one.
    const state = await saveState({
      records: recordStateIdx === -1
        ? records.concat(this.#toSaveData())
        : records.slice(0, recordStateIdx)
          .concat(this.#toSaveData())
          .concat(records.slice(recordStateIdx + 1)),
    });

    // Update the local copy of the record state save data.
    this.#state = state.records.find(record =>
      record.createTimestamp === this.createTimestamp
    ) as AutoRecordState;
    this.#frozenState = deepFreeze(this.#state);

    return this;
  }

  /**
   * Deletes this {@link AutoRecord} from state storage.
   * If the record does not exist, nothing happens.
   *
   * @returns A {@link Promise} that resolves to `true` if the record was deleted,
   * or `false` if it was not found.
   */
  async delete(): Promise<boolean> {
    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      record.createTimestamp === this.createTimestamp
    );

    if (recordStateIdx === -1) {
      return false; // Record not found.
    }

    records.splice(recordStateIdx, 1);
    await saveState({ records });
    return true; // Record deleted successfully.
  }

  /**
   * Resets this {@link AutoRecord} instance to its initial state.
   *
   * @param state The {@link AutoRecordState} to reset this {@link AutoRecord} to.
   * If not provided, resets to the initial state of the record.
   */
  reset(state: Partial<AutoRecordState> = this.#state): void {
    this.actions = state.actions;
    this.autoRun = state.autoRun;
    this.frequency = state.frequency;
    this.name = state.name;
    this.paused = state.paused;
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
  }

  /**
   * Converts this {@link AutoRecord} instance to a format suitable for saving.
   *
   * @returns The {@link AutoRecordState} data to be saved.
   */
  #toSaveData(): AutoRecordState {
    const saveData: any = { ...this };
    let proto: any = Object.getPrototypeOf(this);

    while (proto && proto !== Object.prototype) {
      const descriptors = Object.getOwnPropertyDescriptors(proto);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (typeof descriptor.get === 'function' && !(key in saveData)) {
          try {
            saveData[key] = this[key as keyof this]; // Invokes the getter
          } catch (error) {
            saveData[key] = undefined; // Handle any errors gracefully
            console.error(`Error getting property ${key}:`, error);
          }
        }
      }
      proto = Object.getPrototypeOf(proto);
    }

    return saveData;
  }

}

export type * from './auto-record.interfaces.js';
export default AutoRecord;
