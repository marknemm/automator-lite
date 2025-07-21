import { cloneDeep } from 'lodash-es';
import type { DeepReadonly, Nullish } from 'utility-types';
import { loadState, saveState } from '~shared/utils/state.js';
import type { AutoRecordAction, AutoRecordState, AutoRecordUid, LoadRecordOptions } from './auto-record.interfaces.js';

/**
 * Represents an {@link AutoRecord} that contains actions that are replayable on a webpage.
 * @implements {AutoRecordState}
 */
export class AutoRecord implements AutoRecordState {

  readonly createTimestamp: number;

  #actions: AutoRecordAction[] = [];
  #autoRun = false;
  #frequency: number | Nullish;
  #name = '';
  #paused: boolean | Nullish;
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

    this.createTimestamp = state.createTimestamp ?? Date.now();

    this.actions = state.actions;
    this.autoRun = state.autoRun;
    this.frequency = state.frequency;
    this.name = state.name;
    this.paused = state.paused;
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
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
   * The unique identifier for this {@link AutoRecord}.
   */
  get uid(): AutoRecordUid { return `${this.createTimestamp}`; }

  get updateTimestamp(): number { return this.#updateTimestamp; }

  /**
   * The raw {@link AutoRecordState} data.
   *
   * Will become desynchronized from any unsaved changes to this {@link AutoRecord}'s properties.
   * This is by design, since the state data is meant to reflect the saved state of the record.
   *
   * @return The raw {@link AutoRecordState} data.
   */
  state(): DeepReadonly<Partial<AutoRecordState>> {
    return cloneDeep(this.#state);
  }

  /**
   * Saves the current state of this {@link AutoRecord} to state storage.
   * This will update the record in the state storage, or create a new one if it doesn't exist.
   *
   * @returns A {@link Promise} that resolves when the record is saved.
   */
  async save(): Promise<this> {
    const { records } = await loadState();
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
    const { records } = await loadState();
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

/**
 * Loads all {@link AutoRecord} instances from the state storage.
 *
 * @param options - {@link LoadRecordOptions} for configuring how to load records.
 * @param options.filter - A filter function to apply to the records. Defaults to no filtering.
 * @param options.sort - A sort function to apply to the records. Defaults to sorting by name.
 * @returns A promise that resolves to an array of loaded {@link AutoRecord} instances.
 */
export async function loadRecords({
  filter,
  sort = (a, b) => a.name.localeCompare(b.name),
}: LoadRecordOptions = {}): Promise<AutoRecord[]> {
  let { records } = await loadState();
  if (filter) records = records.filter(filter);
  return records
    .sort(sort)
    .map(recordState => new AutoRecord(recordState));
}

export type * from './auto-record.interfaces.js';
