import { AutoRecord, loadRecords, type AutoRecordKeyboardAction, type AutoRecordMouseAction, type AutoRecordScriptAction, type AutoRecordUid } from '~shared/models/auto-record.js';
import { deepQuerySelectorAll } from '~shared/utils/deep-query.js';
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
  for (const action of record.actions) {
    try {
      switch (action.type) {
        case 'Mouse':
          await execMouseAction(action as AutoRecordMouseAction);
          break;
        case 'Keyboard':
          await execKeyboardAction(action as AutoRecordKeyboardAction);
          break;
        case 'Script':
          await execScriptAction(action as AutoRecordScriptAction);
          break;
        default:
          console.error(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action: ${action.type}`, error);
    }
  }
}

/**
 * Executes a mouse action by dispatching a {@link MouseEvent}.
 *
 * @param action - The {@link AutoRecordMouseAction} to execute.
 */
function execMouseAction(action: AutoRecordMouseAction): void {
  const mouseEvent = new MouseEvent(action.mode, { ...defaultDispatchOpts });

  const potentialTargets = deepQuerySelectorAll(action.selector);
  const target = potentialTargets.length === 1
    ? potentialTargets[0]
    : potentialTargets.find((el) => {
        return el.textContent?.trim() === action.textContent
            || el.title?.trim() === action.textContent;
      });

  target
    ? target.dispatchEvent(mouseEvent)
    : console.warn(`Could not find Mouse Event target: ${action.selector}`);
}

/**
 * Executes a keyboard action by dispatching a {@link KeyboardEvent}.
 *
 * @param action - The {@link AutoRecordKeyboardAction} to execute.
 */
function execKeyboardAction(action: AutoRecordKeyboardAction): void {
  const target = document.activeElement || document.body;

  for (const keyStroke of action.keyStrokes) {
    const eventOptions: KeyboardEventInit = {
      ...defaultDispatchOpts,
      key: keyStroke,
      code: keyStroke,
      shiftKey: action.modifierKeys?.shift ?? false,
      ctrlKey: action.modifierKeys?.ctrl ?? false,
      altKey: action.modifierKeys?.alt ?? false,
      metaKey: action.modifierKeys?.meta ?? false,
    };

    const keydownEvent = new KeyboardEvent('keydown', eventOptions);
    target.dispatchEvent(keydownEvent);

    const keyupEvent = new KeyboardEvent('keyup', eventOptions);
    target.dispatchEvent(keyupEvent);
  }
}

/**
 * Executes a script action by injecting a script element into the DOM.
 *
 * @param action - The {@link AutoRecordScriptAction} to execute.
 */
function execScriptAction(action: AutoRecordScriptAction): void {
  const script = document.createElement('script');
  script.textContent = action.src;
  document.body.appendChild(script);
}
