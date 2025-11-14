import type { Nullish } from 'utility-types';
import { SparkModelStore } from '~shared/models/spark-model-store.js';
import { loadState, saveState, type AutoRecordState } from '~shared/utils/state.js';
import { AutoRecord, type AutoRecordUid } from './auto-record.js';
import type { LoadSparkModelOptions } from './spark-model.interfaces.js';

/**
 * The {@link SparkModelStore} for managing {@link AutoRecord} persistence.
 *
 * @extends SparkModelStore<AutoRecord>
 */
export class AutoRecordStore extends SparkModelStore<AutoRecord> {

  protected override get ModelCtor(): typeof AutoRecord {
    return AutoRecord;
  }

  /**
   * Deletes this {@link AutoRecord} from state storage.
   * If the record does not exist, nothing happens.
   *
   * @returns A {@link Promise} that resolves to `true` if the record was deleted,
   * or `false` if it was not found.
   */
  protected override async deleteState(
    state: AutoRecordState
  ): Promise<boolean> {
    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      record.createTimestamp === state.createTimestamp
    );

    // Record not found?
    if (recordStateIdx === -1) return false;

    records.splice(recordStateIdx, 1);
    await saveState({ records });
    return true; // Record deleted successfully.
  }

  /**
   * Loads an {@link AutoRecord} instance from the state storage by its unique identifier.
   *
   * @param uid The unique identifier of the {@link AutoRecord} to load.
   * Can be a string representing the timestamp or a partial {@link AutoRecordState}.
   * If `null` or `undefined`, no action is taken.
   * @returns A promise that resolves to the loaded {@link AutoRecord} instance, or `undefined` if not found.
   */
  protected override async loadState(
    uid: AutoRecordUid | Partial<AutoRecordState> | Nullish,
  ): Promise<AutoRecordState | undefined> {
    if (!uid) return undefined; // No-op if no uid is provided.

    // If uid is a string, treat it as a timestamp.
    const createTimestamp = (typeof uid === 'string')
      ? parseInt(uid, 10)
      : uid.createTimestamp;

    return (await this.loadManyStates({
      filter: record => record.createTimestamp === createTimestamp,
    }))[0];
  }

  /**
   * Loads many {@link AutoRecord} instances from the state storage.
   *
   * @param options - {@link LoadSparkModelOptions} for configuring how to load records.
   * @param options.filter - A filter function to apply to the records. Defaults to no filtering.
   * @param options.sort - A sort function to apply to the records. Defaults to sorting by `name`.
   * @returns A promise that resolves to an array of loaded {@link AutoRecord} instances.
   */
  protected override async loadManyStates({
    filter,
    sort = (a, b) => a?.name?.localeCompare(b?.name) ?? 0,
  }: LoadSparkModelOptions<AutoRecordState> = {}): Promise<AutoRecordState[]> {
    let records = await loadState('records');
    if (filter) records = records.filter(filter);
    return records.sort(sort);
  }

  /**
   * Saves the current state of this {@link AutoRecord} to state storage.
   * This will update the record in the state storage, or create a new one if it doesn't exist.
   *
   * @param mergeData - Optional partial {@link AutoRecordState} data to {@link merge} with the
   * record before saving. Will leave unspecified properties unchanged and save them as-is.
   * @returns A {@link Promise} that resolves to this {@link AutoRecord} instance after saving.
   */
  protected override async saveState(
    saveData: AutoRecordState
  ): Promise<AutoRecordState> {
    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      record.createTimestamp === saveData.createTimestamp
    );

    // Either add new record or update existing one.
    console.log('Saving record state:', saveData);
    const state = await saveState({
      records: (recordStateIdx === -1)
        ? records.concat(saveData)
        : records.slice(0, recordStateIdx)
          .concat(saveData)
          .concat(records.slice(recordStateIdx + 1)),
    });

    return state.records.find(record =>
      record.createTimestamp === saveData.createTimestamp
    )!;
  }

}
