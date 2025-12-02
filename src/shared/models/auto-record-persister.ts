import { log } from '~shared/utils/logger.js';
import { loadState, saveState, type AutoRecordState } from '~shared/utils/state.js';
import type { LoadSparkModelOptions, SparkStateIdentifier } from './spark-model.interfaces.js';
import { SparkStatePersister } from './spark-state-persister.js';
import { isSameId, toModelId } from './spark-state-utils.js';

/**
 * The {@link SparkReactiveStateManager} for managing {@link AutoRecordState} persistence.
 *
 * @extends SparkReactiveStateManager<AutoRecordState>
 */
export class AutoRecordPersister extends SparkStatePersister<AutoRecordState> {

  /**
   * Deletes this {@link AutoRecord} from state storage.
   * If the record does not exist, nothing happens.
   *
   * @param id The {@link SparkStateIdentifier} of the {@link AutoRecord} to delete.
   *
   * @returns A {@link Promise} that resolves to `true` if the record was deleted,
   * or `false` if it was not found.
   */
  override async delete(
    id: SparkStateIdentifier<AutoRecordState>
  ): Promise<boolean> {
    const recordId = toModelId(id);
    if (!recordId) return false; // No-op if no id is provided or derivable.

    const records = await loadState('records');
    const recordStateIdx = records.findIndex(record =>
      isSameId(record, recordId)
    );

    // Record not found?
    if (recordStateIdx === -1) return false;

    log.debug('AutoRecordStateManager.delete - deleting record:', records[recordStateIdx]);
    records.splice(recordStateIdx, 1);
    await saveState({ records });
    return true; // Record deleted successfully.
  }

  /**
   * Loads an {@link AutoRecord} instance from the state storage by its unique identifier.
   *
   * @param id The {@link SparkStateIdentifier} of the {@link AutoRecord} to load.
   * Can be a string representing the timestamp or a partial {@link AutoRecordState}.
   * If `null` or `undefined`, no action is taken.
   *
   * @returns A promise that resolves to the loaded {@link AutoRecord} instance, or `undefined` if not found.
   */
  override async load(
    id: SparkStateIdentifier<AutoRecordState>,
  ): Promise<AutoRecordState | undefined> {
    const recordId = toModelId(id);
    if (!recordId) return undefined; // No-op if no id is provided or derivable.

    const record = (await this.loadMany({
      filter: record => isSameId(record, recordId),
    }))[0];

    log.debug('AutoRecordStateManager.load - loaded record:', record);
    return record;
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
    limit,
    offset = 0,
    sort = (a, b) => a?.name?.localeCompare(b?.name) ?? 0,
  }: LoadSparkModelOptions<AutoRecordState> = {}): Promise<AutoRecordState[]> {
    let records = await loadState('records');
    if (filter) records = records.filter(filter);
    if (limit || offset) records = records.slice(offset, offset + (limit ?? records.length));

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
      isSameId(record, saveData)
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
      isSameId(record, saveData)
    )!;
  }

}
