import type { Nullish } from 'utility-types';
import { log } from '~shared/utils/logger.js';
import { loadState, onStateChange, saveState, type AutoRecordState } from '~shared/utils/state.js';
import type { LoadSparkModelOptions, SparkModelId, SparkStateCreateEmitter, SparkStateDeleteEmitter, SparkStateUpdateEmitter } from './spark-model.interfaces.js';
import { SparkReactiveStateManager } from './spark-reactive-state-manager.js';
import { isEqual } from 'lodash-es';

/**
 * The {@link SparkReactiveStateManager} for managing {@link AutoRecord} persistence.
 *
 * @extends SparkReactiveStateManager<AutoRecordState>
 */
export class AutoRecordStateManager extends SparkReactiveStateManager<AutoRecordState> {

  /**
   * Deletes this {@link AutoRecord} from state storage.
   * If the record does not exist, nothing happens.
   *
   * @returns A {@link Promise} that resolves to `true` if the record was deleted,
   * or `false` if it was not found.
   */
  override async delete(
    state: Partial<AutoRecordState>
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
   * @param id The unique identifier of the {@link AutoRecord} to load.
   * Can be a string representing the timestamp or a partial {@link AutoRecordState}.
   * If `null` or `undefined`, no action is taken.
   * @returns A promise that resolves to the loaded {@link AutoRecord} instance, or `undefined` if not found.
   */
  override async load(
    id: SparkModelId | Partial<AutoRecordState> | Nullish,
  ): Promise<AutoRecordState | undefined> {
    if (!id) return undefined; // No-op if no id is provided.

    // If id is a string, treat it as a timestamp.
    const createTimestamp = (typeof id === 'string')
      ? parseInt(id, 10)
      : id.createTimestamp;

    return (await this.loadMany({
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
  override async loadMany({
    filter,
    sort = (a, b) => a?.name?.localeCompare(b?.name) ?? 0,
  }: LoadSparkModelOptions<AutoRecordState> = {}): Promise<AutoRecordState[]> {
    let records = await loadState('records');
    if (filter) records = records.filter(filter);
    log.debug('AutoRecordStateManager.loadMany - loaded records:', records);
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
  override async save(
    saveData: AutoRecordState
  ): Promise<AutoRecordState> {
    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      record.createTimestamp === saveData.createTimestamp
    );

    // Either add new record or update existing one.
    log.debug('AutoRecordStateManager.save - saving record:', saveData);
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

  protected override async listenCreate(
    emit: SparkStateCreateEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const createdRecords = newRecords.filter(
        newRecord => !oldRecords.some(
          oldRecord => oldRecord.createTimestamp === newRecord.createTimestamp
        )
      );

      for (const record of createdRecords) {
        emit(record);
      }
    }, 'records');
  }

  protected override listenDelete(
    emit: SparkStateDeleteEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const deletedRecords = oldRecords.filter(
        oldRecord => !newRecords.some(
          newRecord => newRecord.createTimestamp === oldRecord.createTimestamp
        )
      );

      for (const record of deletedRecords) {
        emit(record);
      }
    }, 'records');
  }

  protected override listenUpdate(
    emit: SparkStateUpdateEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const updatedRecords = newRecords.filter(
        newRecord => {
          const oldRecord = oldRecords.find(
            oldRec => oldRec.createTimestamp === newRecord.createTimestamp
          );
          return oldRecord && !isEqual(oldRecord, newRecord);
        }
      );

      for (const newRecord of updatedRecords) {
        const oldRecord = oldRecords.find(
          oldRec => oldRec.createTimestamp === newRecord.createTimestamp
        )!;
        emit(newRecord, oldRecord);
      }
    }, 'records');
  }

}
