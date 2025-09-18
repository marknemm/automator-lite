import type { Nullish } from 'utility-types';
import { deepQuerySelectorAll } from '~content/utils/deep-query.js';
import { AutoRecord, type AutoRecordAction, type AutoRecordUid, type KeyboardAction, type MouseAction, type ScriptAction } from '~shared/models/auto-record.js';
import { sendExtension } from '~shared/utils/extension-messaging.js';
import { onStateChange, type AutoRecordState } from '~shared/utils/state.js';
import { getBaseURL, isSameBaseUrl, isTopWindow } from '~shared/utils/window.js';

/**
 * Executes and schedules {@link AutoRecord} instances in the current document.
 */
export class RecordExecutor {

  /**
   * Default options for dispatching {@link MouseEvent}s and {@link KeyboardEvent}s.
   */
  static readonly DEFAULT_DISPATCH_OPTS = Object.freeze({
    bubbles: true,
    cancelable: true,
  });

  /**
   * The singleton instance of the {@link RecordExecutor}.
   */
  static #instance: RecordExecutor | undefined;

  /**
   * A map to keep track of scheduled auto-records.
   * The key is the {@link AutoRecordUid}, and the value is the interval ID.
   */
  readonly #recordScheduleRegistry = new Map<AutoRecordUid, number>();

  /**
   * Constructs a new {@link RecordExecutor} instance.
   * See {@link RecordExecutor.init} for initializing the singleton instance.
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
    onStateChange((change) => {
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
    }, 'records');
  }

  /**
   * Initializes a singleton {@link RecordExecutor} to handle existing records.
   * Will load all records and schedule them for execution.
   *
   * @return A {@link Promise} that resolves to the {@link RecordExecutor} instance when initialized.
   */
  static async init(): Promise<RecordExecutor> {
    // Return existing singleton if exists.
    if (RecordExecutor.#instance) return RecordExecutor.#instance;

    // Only load records for scheduling in the top window.
    const records = isTopWindow()
      ? await AutoRecord.loadMany()
      : [];

    await chrome.userScripts.configureWorld({
      // csp: '',
      messaging: true,
    });

    RecordExecutor.#instance = new RecordExecutor(records);
    return RecordExecutor.#instance;
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
      if (record.paused) return; // Do not execute if paused.

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
    if (!isSameBaseUrl(action.frameHref)) {
      await sendExtension({
        route: 'executeRecordAction',
        contexts: ['content'],
        frameLocations: getBaseURL(action.frameHref),
        payload: action,
      });
      return; // Do not execute in current frame.
    }

    // Execute the action based on its type.
    switch (action.actionType) {
      case 'Mouse':    await this.#execMouseAction(action as MouseAction);       break;
      case 'Keyboard': await this.#execKeyboardAction(action as KeyboardAction); break;
      case 'Script':   await this.#execScriptAction(action as ScriptAction);     break;
      default:         throw new Error(`Unsupported action type: ${action.actionType}`);
    }
  }

  /**
   * Executes a mouse action by dispatching a {@link MouseEvent}.
   *
   * @param action - The {@link MouseAction} to execute.
   */
  #execMouseAction(action: MouseAction): void {
    const mouseEvent = new MouseEvent(action.eventType, {
      ...RecordExecutor.DEFAULT_DISPATCH_OPTS,
      ...action,
    });

    const potentialTargets = deepQuerySelectorAll(action.selector);
    const target = (potentialTargets.length === 1)
      ? potentialTargets[0]
      : potentialTargets.find((el) =>
             el.textContent?.trim() === action.textContent
          || el.title?.trim() === action.textContent
          || el.innerHTML?.trim() === action.textContent
        );

    target
      ? target.dispatchEvent(mouseEvent)
      : console.warn(`Could not find Mouse Event target: ${action.selector}`);
  }

  /**
   * Executes a keyboard action by dispatching a {@link KeyboardEvent}.
   *
   * @param action - The {@link KeyboardAction} to execute.
   */
  #execKeyboardAction(action: KeyboardAction): void {
    const target = document.activeElement || document.body;

    const eventOptions: KeyboardEventInit = {
      ...RecordExecutor.DEFAULT_DISPATCH_OPTS,
      key: action.key,
      shiftKey: action.modifierKeys?.shift ?? false,
      ctrlKey: action.modifierKeys?.ctrl ?? false,
      altKey: action.modifierKeys?.alt ?? false,
      metaKey: action.modifierKeys?.meta ?? false,
    };

    const keydownEvent = new KeyboardEvent(action.eventType, eventOptions);
    target.dispatchEvent(keydownEvent);
  }

  /**
   * Executes a script action by injecting a script element into the DOM.
   *
   * @param action - The {@link ScriptAction} to execute.
   * @return A {@link Promise} that resolves when the script is finished executing.
   */
  async #execScriptAction(action: ScriptAction): Promise<void> {
    const script = (await chrome.userScripts.getScripts({ ids: [action.name] }))[0];

    if (!script) {
      await chrome.userScripts.register([{
        allFrames: true,
        id: action.name,
        js: [{ code: action.compiledCode }],
        matches: [action.frameHref],
        world: 'MAIN',
      }]);
    } else {
      await chrome.userScripts.update([{
        ...script,
        js: [{ code: action.compiledCode }],
        matches: [action.frameHref],
      }]);
    }
  }

}

export default RecordExecutor;
