import { AutoRecord, loadRecords, type AutoRecordUid } from '~shared/models/auto-record.js';
import { loadState, onStateChange, type StateChange } from '~shared/utils/state.js';

/**
 * A map to keep track of scheduled auto-records.
 * The key is the {@link AutoRecordUid}, and the value is the interval ID.
 */
const recordScheduleRegistry = new Map<AutoRecordUid, number>();

/**
 * Default options for dispatching {@link MouseEvent}s and {@link KeyboardEvent}s.
 */
const defaultDispatchOpts = { bubbles: true, cancelable: true };

/**
 * Initializes the executor for auto-records.
 * This function loads all records and schedules them for execution.
 *
 * @return A {@link Promise} that resolves when the initialization is complete.
 */
export async function initExecutor(): Promise<void> {
  const records = await loadRecords();

  // Schedule all records for execution.
  for (const record of records) {
    if (record.autoRun) {
      (record.frequency)
        ? scheduleRecord(record)
        : setTimeout(() => execRecord(record), 1000);
    }
  }

  // Listen for 'records' state changes and schedule / unschedule records accordingly.
  onStateChange((change: StateChange) => {
    const { oldState: oldValue, newState: newValue } = change;
    const oldRecords = oldValue.records.map((record) => new AutoRecord(record));
    const newRecords = newValue.records.map((record) => new AutoRecord(record));

    // Unschedule all previously scheduled records.
    for (const oldRecord of oldRecords) {
      unscheduleRecord(oldRecord);
    }

    // Schedule all new records.
    for (const newRecord of newRecords) {
      scheduleRecord(newRecord);
    }

  }, 'records', 'allPaused');
}

/**
 * Schedules a given {@link AutoRecord} instance for execution.
 * This function will clear any existing interval for the same record before scheduling a new one.
 *
 * @param record - The {@link AutoRecord} instance to schedule.
 * @returns The interval ID of the scheduled action.
 * @see {@link unscheduleRecord} for unscheduling a record.
 */
export function scheduleRecord(record: AutoRecord): number {
  unscheduleRecord(record); // Clear any existing interval for this record.

  if (!record.frequency || record.frequency < 0) return 0;

  // Schedule the auto-record action with a repeat interval.
  const intervalId = setInterval(async () => {
    const { allPaused } = await loadState();
    if (allPaused || record.paused) return; // Do not execute if paused.

    await execRecord(record);
  }, record.frequency ?? 5000);

  // Store the interval ID in the registry
  recordScheduleRegistry.set(record.uid, intervalId);
  return intervalId;
}

/**
 * Unschedules a previously scheduled {@link AutoRecord}.
 * If the record is not currently scheduled, nothing happens.
 *
 * @param autoRecord - The {@link AutoRecord} instance to unschedule.
 * @returns `true` if the record was unscheduled, `false` otherwise.
 * @see {@link scheduleRecord} for scheduling a record.
 */
export function unscheduleRecord(autoRecord: AutoRecord | AutoRecordUid): boolean {
  const uid = autoRecord instanceof AutoRecord ? autoRecord.uid : autoRecord;

  if (!recordScheduleRegistry.has(uid)) {
    return false; // No action was taken, as the record was not scheduled.
  }

  // Clear the interval for the scheduled record.
  clearInterval(recordScheduleRegistry.get(uid)!);
  recordScheduleRegistry.delete(uid);
  return true; // Successfully unscheduled the record.
}

/**
 * Executes a given {@link AutoRecord} instance.
 *
 * @param record - The {@link AutoRecord} instance to execute.
 * @returns A {@link Promise} that resolves when the record is executed.
 */
export async function execRecord(record: AutoRecord): Promise<void> {
  const queriedElements = document.querySelectorAll(record.selector);
  const element = queriedElements[record.queryIdx ?? 0];

  // Ensure we have a valid element to use as the target.
  if (record.action !== 'Script' && (!element || !(element instanceof HTMLElement))) {
    console.warn(
      `Target element not found for record: ${record.name}\n`,
      JSON.stringify(record, null, 2),
    );
    return; // Do NOT throw an error, just log a warning.
  }

  // Execute the action based on the record type.
  switch (record.action) {
    case 'Click':
      element.dispatchEvent(new MouseEvent('click', { ...defaultDispatchOpts }));
      break;
    case 'Double Click':
      element.dispatchEvent(new MouseEvent('dblclick', { ...defaultDispatchOpts }));
      break;
    case 'Type':
      for (const key of record.keyStrokes) {
        element.dispatchEvent(new KeyboardEvent('keydown', { ...defaultDispatchOpts, key }));
        element.dispatchEvent(new KeyboardEvent('keyup', { ...defaultDispatchOpts, key }));
      }
      break;
    case 'Script':
      const script = document.createElement('script');
      script.textContent = record.script;
      (element ?? document.body.lastChild).insertAdjacentElement('afterend', script);
      break;
    default:
      throw new Error(`Unsupported action: ${record.action}`);
  }
}
