import type { AutoRecordAction, KeyboardAction, MouseAction } from '~shared/models/auto-record.interfaces.js';
import AutoRecord from '~shared/models/auto-record.js';
import { bindTopWindow, isTopWindow, requestTopWindow } from '~shared/utils/window.js';

/**
 * A utility class for parsing and managing user actions during an active recording session.
 */
export class ActionParser {

  /**
   * The default key that stops the recording when pressed in combination with the
   * {@link ActionParser.DEFAULT_STOP_MODIFIER DEFAULT_STOP_MODIFIER}.
   */
  static readonly DEFAULT_STOP_KEY = 'Enter';

  /**
   * The default modifier that stops the recording when pressed in combination with
   * the {@link ActionParser.DEFAULT_STOP_KEY DEFAULT_STOP_KEY} and `Ctrl`.
   */
  static readonly DEFAULT_STOP_MODIFIER = 'Shift';

  /**
   * The message type for staging a record action in the top window.
   * Used to communicate between embedded iframes and the top window.
   */
  static readonly #STAGE_RECORD_ACTION = 'mnStageRecordAction';

  static #instance: ActionParser | undefined;

  /**
   * The key that stops the recording when pressed in combination with the
   * {@link ActionParser.DEFAULT_STOP_MODIFIER DEFAULT_STOP_MODIFIER}.
   */
  stopKey: string = ActionParser.DEFAULT_STOP_KEY;

  /**
   * The modifier that stops the recording when pressed in combination with the
   * {@link ActionParser.DEFAULT_STOP_KEY DEFAULT_STOP_KEY}.
   */
  stopModifier: string = ActionParser.DEFAULT_STOP_MODIFIER;

  /**
   * List of {@link AutoRecordAction}s that are being recorded during the current active session.
   */
  #stagedActions: AutoRecordAction[] = [];

  /**
   * List of {@link AutoRecordAction}s that are being committed to an {@link AutoRecord}.
   */
  #commitActions: AutoRecordAction[] = [];

  /**
   * Constructs a new {@link ActionParser} instance.
   * This should only be called by {@link ActionParser.init}.
   */
  protected constructor() {
    // Only top window should be building the auto record.
    bindTopWindow(ActionParser.#STAGE_RECORD_ACTION, (event) =>
      this.stageAction(event.data.payload)
    );
  }

  static init(): ActionParser {
    ActionParser.#instance ??= new ActionParser();
    return ActionParser.#instance;
  }

  get stagedActions(): ReadonlyArray<AutoRecordAction> {
    return this.#stagedActions;
  }

  get commitActions(): ReadonlyArray<AutoRecordAction> {
    return this.#commitActions;
  }

  /**
   * Stages an action collected during an active recording session
   * for later committing to an {@link AutoRecord}.
   *
   * @param action The {@link AutoRecordAction} to stage.
   * @returns A {@link Promise} that resolves when the action is staged.
   */
  async stageAction(action: AutoRecordAction): Promise<void> {
    isTopWindow() // Only stage actions in the top window.
      ? this.#stagedActions.push(action)
      : await requestTopWindow(ActionParser.#STAGE_RECORD_ACTION, action);
  }

  /**
   * Commits the staged actions to a new {@link AutoRecord}.
   * This will also open the configuration modal for the user to finalize the record.
   *
   * @returns A {@link Promise} that resolves to a newly saved {@link AutoRecord} if the
   * recording was saved, or `undefined` if record configuration is cancelled.
   */
  async commitStagedActions(): Promise<AutoRecord | undefined> {
    this.#commitActions = [];

    for (const action of this.stagedActions) {
      switch (action.actionType) {
        case 'Mouse':    this.#commitMouseAction(action as MouseAction); break;
        case 'Keyboard': this.#commitKeyboardAction(action as KeyboardAction); break;
        case 'Script':   this.#commitScriptAction(action); break;
        default: throw new Error(`Unsupported action type: ${action.actionType}`);
      }
    }
    this.#commitActions.pop(); // Remove stop action.
    this.#stagedActions = []; // Clear staged actions after committing.

    if (this.#commitActions.length === 0) return; // No actions to commit.
    return new AutoRecord(this.#commitActions).configure();
  }

  #commitMouseAction(action: MouseAction): void {
    const { mouseEventType } = action;

    switch (mouseEventType) {
      case 'click':       this.#commitClickAction(action); break;
      case 'dblclick':    this.#commitDoubleClickAction(action); break;
      case 'contextmenu': this.#commitContextMenuAction(action); break;
      case 'mousedown':   // Atomic
      case 'mouseup':     // Atomic
      default:            this.#commitActions.push(action);
    }
  }

  /**
   * Commits a click action to the staged actions.
   * This is used to handle click actions and deduplicate them if necessary.
   *
   * @param action The {@link MouseAction} representing the click action.
   */
  #commitClickAction(action: MouseAction): void {
    const { selector, textContent } = action;

    if (this.#commitActions.length > 1) {
      const secondPrevAction = this.#commitActions[this.#commitActions.length - 2] as MouseAction;
      const prevAction = this.#commitActions[this.#commitActions.length - 1] as MouseAction;
      const hasMouseDownUp = secondPrevAction.mouseEventType === 'mousedown'
                          && prevAction.mouseEventType === 'mouseup';

      if (hasMouseDownUp) {
        const hasTargetMatch = secondPrevAction.selector === selector
                            && secondPrevAction.textContent === textContent;
        const mouseDownUpDuration = prevAction.timestamp - secondPrevAction.timestamp;

        // Check if this is a click action.
        if (!hasTargetMatch || mouseDownUpDuration > 200) {
          return; // Not a click - target is different or duration is too long.
        }

        // This is a click, so remove mouse down and up actions.
        this.#commitActions.pop();
        this.#commitActions.pop();
      }
    }

    this.#commitActions.push(action); // Add the click action.
  }

  /**
   * Commits a double click action to the staged actions.
   * This is used to handle double click actions.
   *
   * @param action The {@link MouseAction} representing the double click action.
   */
  #commitDoubleClickAction(action: MouseAction): void {
    if (this.#commitActions.length > 1) {
      const secondPrevAction = this.#commitActions[this.#commitActions.length - 2] as MouseAction;
      const prevAction = this.#commitActions[this.#commitActions.length - 1] as MouseAction;
      const hasDoubleClick = secondPrevAction.mouseEventType === 'click'
                          && prevAction.mouseEventType === 'click';

      if (hasDoubleClick) {
        this.#commitActions.pop(); // Remove the previous click action.
        this.#commitActions.pop(); // Remove the second previous click action.
      }
    }

    this.#commitActions.push(action); // Add the double click action.
  }

  /**
   * Commits a context menu action to the staged actions.
   * This is used to handle right-click context menu actions.
   *
   * @param action The {@link MouseAction} representing the context menu action.
   */
  #commitContextMenuAction(action: MouseAction): void {
    if (this.#commitActions.length > 0) {
      const secondPrevAction = this.#commitActions[this.#commitActions.length - 2] as MouseAction;
      const prevAction = this.#commitActions[this.#commitActions.length - 1] as MouseAction;
      const hasAtomicPrev = prevAction.mouseEventType === 'mousedown'
                         || prevAction.mouseEventType === 'mouseup';
      const hasMouseDownSecondPrev = secondPrevAction?.mouseEventType === 'mousedown';

      // Right click may only have previous mousedown if native handling is used.
      if (hasAtomicPrev)          this.#commitActions.pop(); // Remove prev mousedown/up.
      if (hasMouseDownSecondPrev) this.#commitActions.pop(); // Remove second prev mousedown.
    }

    this.#commitActions.push(action); // Add the context menu action.
  }

  #commitKeyboardAction(action: KeyboardAction): void {
    // Do not commit a modifier key if it is a modifier part of previous key.
    if (this.#isModifierForPrevKey(action)) return;

    // Remove all previous modifier keys that are part of the current key.
    while (this.#hasPrevModifierKey(action)) {
      this.#commitActions.pop();
    }

    this.#commitActions.push(action); // Commit the keyboard action.
  }

  /**
   * Checks if the given {@link action} is a keyup modifier key for the previous key.
   *
   * An example would be the following sequence:
   * - Key down: Control
   * - Key down: A
   * - Key up: A
   * - Key up: Control <-- Current Action
   *
   * @param action The {@link KeyboardAction} to check.
   * @returns `true` if the action is a modifier key for the previous key, `false` otherwise.
   */
  #isModifierForPrevKey(action: KeyboardAction): boolean {
    const { key, keyboardEventType } = action;
    const modifierKeyStrs = ['Alt', 'Control', 'Meta', 'Shift'];

    if (
      keyboardEventType !== 'keyup'
      || this.#commitActions.length === 0
      || !modifierKeyStrs.includes(key)
    ) return false;

    const {
      modifierKeys: prevModifierKeys,
      keyboardEventType: prevKeyboardEventType,
    } = this.#commitActions[this.#commitActions.length - 1] as KeyboardAction;

    const {
      alt: prevAlt,
      ctrl: prevCtrl,
      meta: prevMeta,
      shift: prevShift,
    } = prevModifierKeys ?? {};

    return prevKeyboardEventType === 'keyup' && !!(
      (key === 'Alt' && prevAlt)
      || (key === 'Control' && prevCtrl)
      || (key === 'Meta' && prevMeta)
      || (key === 'Shift' && prevShift)
    );
  }

  /**
   * Checks if the given {@link action} has a modifier key that
   * matches a previous committed action's key.
   *
   * An example would be the following sequence:
   * - Key down: Control
   * - Key down: A <-- Current Action
   * - Key up: A
   * - Key up: Control
   *
   * @param action The {@link KeyboardAction} to check.
   * @returns `true` if the action has a matching modifier key, `false` otherwise.
   */
  #hasPrevModifierKey(action: KeyboardAction): boolean {
    const { keyboardEventType, modifierKeys } = action;
    const { alt, ctrl, meta, shift } = modifierKeys ?? {};

    if (
      keyboardEventType !== 'keydown'
      || this.#commitActions.length === 0
      || (!alt && !ctrl && !meta && !shift)
    ) return false;

    const {
      key: prevKey,
      keyboardEventType: prevKeyboardEventType,
    } = this.#commitActions[this.#commitActions.length - 1] as KeyboardAction;

    return prevKeyboardEventType === 'keydown' && !!(
      (prevKey === 'Alt' && alt)
      || (prevKey === 'Control' && ctrl)
      || (prevKey === 'Meta' && meta)
      || (prevKey === 'Shift' && shift)
    );
  }

  #commitScriptAction(action: AutoRecordAction): void {
    this.#commitActions.push(action);
  }

}
