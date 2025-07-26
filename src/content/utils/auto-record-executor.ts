import type { Nullish } from 'utility-types';
import { deepQuerySelectorAll } from '~content/utils/deep-query.js';
import { AutoRecord, type AutoRecordAction, type AutoRecordKeyboardAction, type AutoRecordMouseAction, type AutoRecordScriptAction, type AutoRecordUid } from '~shared/models/auto-record.js';
import { sendMessage } from '~shared/utils/messaging.js';
import { loadState, onStateChange, type AutoRecordState, type StateChange } from '~shared/utils/state.js';
import { isSamePathname, isTopWindow } from '~shared/utils/window.js';

/**
 * Executes and schedules auto-records in the current document.
 */
export class AutoRecordExecutor {

  /**
   * Default options for dispatching {@link MouseEvent}s and {@link KeyboardEvent}s.
   */
  static readonly DEFAULT_DISPATCH_OPTS = Object.freeze({
    bubbles: true,
    cancelable: true,
  });

  /**
   * The singleton instance of the {@link AutoRecordExecutor}.
   */
  static #instance: AutoRecordExecutor | undefined;

  /**
   * A map to keep track of scheduled auto-records.
   * The key is the {@link AutoRecordUid}, and the value is the interval ID.
   */
  readonly #recordScheduleRegistry = new Map<AutoRecordUid, number>();

  /**
   * Constructs a new {@link AutoRecordExecutor} instance.
   * See {@link AutoRecordExecutor.init} for initializing the singleton instance.
   *
   * @param records An array of {@link AutoRecord} instances to schedule for execution.
   */
  protected constructor(records: AutoRecord[]) {
    if (!isTopWindow()) return; // Only the top window should handle scheduling.

    // Schedule all records for execution.
    for (const record of records) {
      if (record.autoRun) {
        (record.frequency)
          ? this.scheduleRecord(record)
          : setTimeout(() => this.execRecord(record), 1000);
      }
    }

    // Listen for 'records' state changes and schedule / unschedule records accordingly.
    onStateChange((change: StateChange) => {
      const { oldState: oldValue, newState: newValue } = change;
      const oldRecords = oldValue.records.map((record) => new AutoRecord(record));
      const newRecords = newValue.records.map((record) => new AutoRecord(record));

      // Unschedule all previously scheduled records.
      for (const oldRecord of oldRecords) {
        this.unscheduleRecord(oldRecord);
      }

      // Schedule all new records.
      for (const newRecord of newRecords) {
        this.scheduleRecord(newRecord);
      }
    }, 'allPaused', 'records');
  }

  /**
   * Initializes a singleton {@link AutoRecordExecutor} to handle existing records.
   * Will load all records and schedule them for execution.
   *
   * @return A {@link Promise} that resolves to the {@link AutoRecordExecutor} instance when initialized.
   */
  static async init(): Promise<AutoRecordExecutor> {
    // Return existing singleton if exists.
    if (AutoRecordExecutor.#instance) return AutoRecordExecutor.#instance;

    // Only load records for scheduling in the top window.
    const records = isTopWindow()
      ? await AutoRecord.loadMany()
      : [];

    AutoRecordExecutor.#instance = new AutoRecordExecutor(records);
    return AutoRecordExecutor.#instance;
  }

  /**
   * Schedules a given {@link AutoRecord} instance for execution.
   * This function will clear any existing interval for the same record before scheduling a new one.
   *
   * @param record - The {@link AutoRecord} instance to schedule.
   * @returns The interval ID of the scheduled action.
   * @see {@link unscheduleRecord} for unscheduling a record.
   */
  scheduleRecord(record: AutoRecord): number {
    this.unscheduleRecord(record); // Clear any existing interval for this record.

    // If no repeat frequency, do not schedule.
    if (!record.frequency || record.frequency < 0) return 0;

    // Schedule the auto-record action with a repeat interval.
    const intervalId = setInterval(async () => {
      const { allPaused } = await loadState();
      if (allPaused || record.paused) return; // Do not execute if paused.

      await this.execRecord(record);
    }, record.frequency ?? 5000);

    // Store the interval ID in the registry
    this.#recordScheduleRegistry.set(record.uid, intervalId);
    return intervalId;
  }

  /**
   * Unschedules a previously scheduled {@link AutoRecord}.
   * If the record is not currently scheduled, nothing happens.
   *
   * @param record - The {@link AutoRecord} instance to unschedule.
   * @returns `true` if the record was unscheduled, `false` otherwise.
   * @see {@link scheduleRecord} for scheduling a record.
   */
  unscheduleRecord(record: AutoRecord | AutoRecordUid): boolean {
    const uid = record instanceof AutoRecord ? record.uid : record;

    if (!this.#recordScheduleRegistry.has(uid)) {
      return false; // No action was taken, as the record was not scheduled.
    }

    // Clear the interval for the scheduled record.
    clearInterval(this.#recordScheduleRegistry.get(uid)!);
    this.#recordScheduleRegistry.delete(uid);
    return true; // Successfully unscheduled the record.
  }

  /**
   * Executes a given {@link AutoRecord} instance.
   *
   * @param record - The {@link AutoRecord} instance to execute. If `null` or `undefined`, no action is taken.
   * @returns A {@link Promise} that resolves when the record is executed.
   * @throws If an {@link AutoRecord} action's {@link AutoRecordAction.actionType type} is unsupported
   * or a fatal error occurs during execution.
   */
  async execRecord(record: AutoRecord | AutoRecordState | Nullish): Promise<void> {
    if (!record) return; // If no record is provided, do nothing.

    // Wrap in AutoRecord for better type safety.
    if (!(record instanceof AutoRecord)) {
      record = new AutoRecord(record as AutoRecordState);
    }

    // Iterate through each action in the record and execute each one.
    for (const action of record.actions) {
      await this.execAction(action);
    }
  }

  /**
   * Executes a given {@link action} based on its {@link AutoRecordAction.actionType type}.
   *
   * @param action The {@link AutoRecordAction} to execute. If `null` or `undefined`, no action is taken.
   * @returns A {@link Promise} that resolves when the action is executed.
   * @throws If the {@link AutoRecordAction.actionType} is unsupported or a fatal error occurs during execution.
   */
  async execAction(action: AutoRecordAction | Nullish): Promise<void> {
    // If no action is provided do nothing.
    if (!action) return;

    // If the action is not in the current frame, send a message to execute it in the correct frame.
    if (!isSamePathname(action.frameLocation)) {
      await sendMessage({
        route: 'executeRecordAction',
        contexts: ['content'],
        frameLocation: action.frameLocation,
        payload: action,
      });
      return; // Do not execute in current frame.
    }

    // Execute the action based on its type.
    switch (action.actionType) {
      case 'Mouse':    await this.#execMouseAction(action as AutoRecordMouseAction); break;
      case 'Keyboard': await this.#execKeyboardAction(action as AutoRecordKeyboardAction); break;
      case 'Script':   await this.#execScriptAction(action as AutoRecordScriptAction); break;
      default:         throw new Error(`Unsupported action type: ${action.actionType}`);
    }
  }

  /**
   * Executes a mouse action by dispatching a {@link MouseEvent}.
   *
   * @param action - The {@link AutoRecordMouseAction} to execute.
   */
  #execMouseAction(action: AutoRecordMouseAction): void {
    const mouseEvent = new MouseEvent(action.mouseEventType, {
      ...AutoRecordExecutor.DEFAULT_DISPATCH_OPTS,
      ...action,
    });

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
  #execKeyboardAction(action: AutoRecordKeyboardAction): void {
    const target = document.activeElement || document.body;

    for (const keyStroke of action.keyStrokes) {
      const eventOptions: KeyboardEventInit = {
        ...AutoRecordExecutor.DEFAULT_DISPATCH_OPTS,
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
  #execScriptAction(action: AutoRecordScriptAction): void {
    const script = document.createElement('script');
    script.textContent = action.src;
    document.body.appendChild(script);
  }

}

export default AutoRecordExecutor;
