import { cloneDeep } from 'lodash-es';
import type { DeepReadonly, Nullish } from 'utility-types';
import { loadState, saveState } from '~shared/utils/state.js';
import type { AutoRecordAction, AutoRecordState, AutoRecordUid } from './auto-record.interfaces.js';

/**
 * Represents a {@link AutoRecord} of a re-playable action on a webpage.
 * @implements {AutoRecordState}
 */
export class AutoRecord implements AutoRecordState {

  readonly createTimestamp: number;
  readonly queryIdx: number;
  readonly selector: string;

  #action: AutoRecordAction = 'Click';
  #autoRun = false;
  #frequency: number | Nullish;
  #keyStrokes: string[] = [];
  #name = '';
  #paused: boolean | Nullish;
  #recordState: Partial<AutoRecordState>;
  #script = '';
  #updateTimestamp: number;

  /**
   * Creates a new {@link AutoRecord} instance.
   *
   * @param recordState The raw {@link AutoRecordState} data.
   */
  constructor(recordState: Partial<AutoRecordState>) {
    if (!recordState.selector) {
      throw new Error('Selector is required');
    }

    this.#recordState = recordState;

    this.selector = recordState.selector.trim();
    this.queryIdx = Math.max(recordState.queryIdx ?? 0, 0);
    this.createTimestamp = recordState.createTimestamp ?? Date.now();

    this.action = recordState.action;
    this.autoRun = recordState.autoRun;
    this.frequency = recordState.frequency;
    this.keyStrokes = recordState.keyStrokes;
    this.name = recordState.name;
    this.paused = recordState.paused;
    this.script = recordState.script;
    this.#updateTimestamp = recordState.updateTimestamp ?? this.createTimestamp;
  }

  get action(): AutoRecordAction { return this.#action; }
  set action(action: AutoRecordAction | Nullish) { this.#action = action?.trim() as AutoRecordAction ?? 'Click'; }

  get autoRun(): boolean { return this.#autoRun; }
  set autoRun(autoRun: boolean | Nullish) { this.#autoRun = autoRun ?? false; }

  get frequency(): number | Nullish { return this.#frequency; }
  set frequency(frequency: number | Nullish) {
    this.#frequency = (typeof frequency === 'number')
      ? Math.max(0, frequency)
      : frequency;
  }

  get keyStrokes(): string[] { return this.#keyStrokes; }
  set keyStrokes(keyStrokes: string[] | Nullish) { this.#keyStrokes = keyStrokes ?? []; }

  get name(): string { return this.#name; }
  set name(name: string | Nullish) { this.#name = name?.trim() ?? ''; }

  get paused(): boolean { return this.#paused ?? false; }
  set paused(paused: boolean | Nullish) { this.#paused = paused ?? false; }

  /**
   * The raw {@link AutoRecordState} data.
   *
   * Will become desynchronized from any unsaved changes to this {@link AutoRecord}'s properties.
   * This is by design, since the state data is meant to reflect the saved state of the record.
   */
  get recordState(): DeepReadonly<Partial<AutoRecordState>> {
    return cloneDeep(this.#recordState);
  }

  get script(): string { return this.#script; }
  set script(script: string | Nullish) { this.#script = script ?? ''; }

  /**
   * The unique identifier for this {@link AutoRecord}.
   *
   * Format is: `<selector>::<createTimestamp>`.
   */
  get uid(): AutoRecordUid { return `${this.selector}::${this.createTimestamp}`; }

  get updateTimestamp(): number { return this.#updateTimestamp; }

  /**
   * Creates a brand-new {@link AutoRecord} instance with the given selector.
   * Populates the record with default values.
   *
   * Note that this does not save the record to state storage.
   * You must call {@link AutoRecord.save} to save the record.
   *
   * @param selector The CSS selector of the {@link HTMLElement} targeted by the new record.
   * @param queryIdx The index of the record in the list of query results for the selector.
   * @returns A new {@link AutoRecord} instance.
   */
  static create(selector: string, queryIdx: number): AutoRecord {
    return new AutoRecord({ selector, queryIdx });
  }

  /**
   * Saves the current state of this {@link AutoRecord} to state storage.
   * This will update the record in the state storage, or create a new one if it doesn't exist.
   *
   * @returns A {@link Promise} that resolves when the record is saved.
   */
  async save(): Promise<void> {
    const { records } = await loadState();
    const recordStateIdx = records.findIndex(record =>
      record.selector === this.selector
      && record.createTimestamp === this.createTimestamp,
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
    this.#recordState = state.records.find(record =>
      record.selector === this.selector
      && record.createTimestamp === this.createTimestamp,
    ) as AutoRecordState;
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
      record.selector === this.selector
      && record.createTimestamp === this.createTimestamp,
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
 * @returns A promise that resolves to an array of loaded {@link AutoRecord} instances.
 */
export async function loadRecords(): Promise<AutoRecord[]> {
  const { records } = await loadState();
  return records.map(recordState => new AutoRecord(recordState));
}

export type * from './auto-record.interfaces.js';
