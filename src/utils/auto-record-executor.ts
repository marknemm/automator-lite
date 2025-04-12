import { type AutoRecord, type AutoRecordUid } from '../models/auto-record';

/**
 * A map to keep track of scheduled auto-records.
 * The key is the {@link AutoRecordUid}, and the value is the interval ID.
 */
const recordScheduleRegistry = new Map<AutoRecordUid, number>();

const defaultDispatchOpts = {
  bubbles: true,
  cancelable: true,
};

/**
 * Schedules a given {@link AutoRecord} instance for execution.
 * This function will clear any existing interval for the same record before scheduling a new one.
 *
 * @param autoRecord - The {@link AutoRecord} instance to schedule.
 * @returns The interval ID of the scheduled action.
 * @see {@link unscheduleRecord} for unscheduling a record.
 */
export function scheduleRecord(autoRecord: AutoRecord): number {
  unscheduleRecord(autoRecord); // Clear any existing interval for this record.

  // Schedule the auto-record action with a repeat interval.
  const intervalId = setInterval(async () => {
    console.log(`Performing action: ${autoRecord.action} \nOn record: ${autoRecord.uid}`);
    await execRecord(autoRecord);
  }, autoRecord.frequency ?? 5000);

  // Store the interval ID in the registry
  recordScheduleRegistry.set(autoRecord.uid, intervalId);
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
export function unscheduleRecord(autoRecord: AutoRecord): boolean {
  if (!recordScheduleRegistry.has(autoRecord.uid)) {
    return false; // No action was taken, as the record was not scheduled.
  }

  // Clear the interval for the scheduled record.
  clearInterval(recordScheduleRegistry.get(autoRecord.uid)!);
  recordScheduleRegistry.delete(autoRecord.uid);
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
      JSON.stringify(record, null, 2)
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
