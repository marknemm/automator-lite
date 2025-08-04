import type { Nullish } from 'utility-types';
import { RecordingInfoPanel } from '~content/components/recording-info-panel.js';
import type { AutoRecordAction, AutoRecordKeyboardAction, AutoRecordMouseAction, KeyboardEventType, MouseEventType } from '~shared/models/auto-record.interfaces.js';
import { AutoRecord } from '~shared/models/auto-record.js';
import { sendMessage } from '~shared/utils/messaging.js';
import { type MountContext } from '~shared/utils/mount.js';
import { bindTopWindow, isTopWindow, requestTopWindow } from '~shared/utils/window.js';
import { deriveElementSelector } from './element-analysis.js';

/**
 * Context for managing the recording state and interactions.
 */
export class RecordingContext {

  /**
   * The default key that stops the recording when pressed in combination with the
   * {@link RecordingContext.DEFAULT_STOP_MODIFIERS DEFAULT_STOP_MODIFIERS}.
   */
  static readonly DEFAULT_STOP_KEY = 'Enter';

  /**
   * The default modifiers that stop the recording when pressed in combination with
   * the {@link RecordingContext.DEFAULT_STOP_KEY DEFAULT_STOP_KEY}.
   */
  static readonly DEFAULT_STOP_MODIFIERS = ['Ctrl', 'Shift'];

  /**
   * The message type for staging a record action in the top window.
   * Used to communicate between embedded iframes and the top window.
   */
  static readonly #STAGE_RECORD_ACTION = 'mnStageRecordAction';

  /**
   * The singleton instance of the {@link RecordingContext}.
   * This is initialized by {@link RecordingContext.init}.
   */
  static #instance: RecordingContext | undefined;

  /**
   * Indicates whether the recording is currently active.
   */
  #active = false;

  /**
   * List of {@link AutoRecordAction}s that are being recorded during the current active session.
   */
  #stagedActions: AutoRecordAction[] = [];

  /**
   * This is the {@link HTMLElement} that will be highlighted when the user hovers over.
   * If the user clicks on it, it will have a {@link AutoRecord} created for it.
   */
  #hoverElement: HTMLElement | Nullish;

  /**
   * The mount context for the {@link RecordingInfoPanel}.
   * This is used to control the panel's lifecycle and interactions.
   */
  #recordingInfoMountCtx: MountContext | Nullish;

  /**
   * Constructs a new {@link RecordingContext} instance.
   * This should only be called by {@link RecordingContext.init}.
   */
  protected constructor() {
    // Only top window should be building the auto record.
    bindTopWindow(RecordingContext.#STAGE_RECORD_ACTION, (event) =>
      this.#stageAction(event.data.payload)
    );
  }

  /**
   * Initializes the per-frame singleton recording context.
   *
   * Call {@link RecordingContext.start} on the result to begin recording actions.
   *
   * @return A new instance of {@link RecordingContext}.
   */
  static init(): RecordingContext {
    RecordingContext.#instance ??= new RecordingContext();
    return RecordingContext.#instance;
  }

  /**
   * Whether recording is currently active.
   */
  get active(): boolean { return this.#active; }

  /**
   * Starts the recording process.
   */
  start(): void {
    if (this.active) return; // Prevent starting if already active.
    this.#active = true;

    // Bind event listeners to the document for adding a new record.
    document.addEventListener('mouseover', this.#setHoverHighlight);
    document.addEventListener('mouseout', this.#unsetHoverHighlight);
    document.addEventListener('keydown', this.#keyDownListener);

    if (isTopWindow()) { // Prevent duplicate mounts from iframes.
      this.#recordingInfoMountCtx = RecordingInfoPanel.mount({
        stopRecordingKeys: [...RecordingContext.DEFAULT_STOP_MODIFIERS, RecordingContext.DEFAULT_STOP_KEY],
      });
      if (!document.activeElement) {
        document.body.focus(); // Ensure the body is focused to capture key events.
      }
    }
  }

  /**
   * Stops the recording process and commits the staged actions as a new {@link AutoRecord}.
   *
   * @returns A {@link Promise} that resolves to a newly saved {@link AutoRecord} if the
   * recording was successful, or `undefined` if record configuration is cancelled.
   */
  async stop(): Promise<AutoRecord | undefined> {
    if (!this.active) return; // Prevent stopping if not active.
    this.#active = false;
    this.#unsetHoverHighlight();

    document.removeEventListener('mouseover', this.#setHoverHighlight);
    document.removeEventListener('mouseout', this.#unsetHoverHighlight);
    document.removeEventListener('keydown', this.#keyDownListener);

    if (isTopWindow()) {
      this.#recordingInfoMountCtx?.unmount();
      this.#recordingInfoMountCtx = null;
      return this.#commitStagedActions(); // Commit the staged actions to an AutoRecord.
    }
  }

  /**
   * Stages an action collected during an active recording session
   * for later committing to an {@link AutoRecord}.
   *
   * @param action The {@link AutoRecordAction} to stage.
   * @returns A {@link Promise} that resolves when the action is staged.
   */
  async #stageAction(action: AutoRecordAction): Promise<void> {
    if (!this.active) return; // Ignore actions if not active.

    isTopWindow() // Only stage actions in the top window.
      ? this.#stagedActions.push(action)
      : await requestTopWindow(RecordingContext.#STAGE_RECORD_ACTION, action);
  }

  async #commitStagedActions(): Promise<AutoRecord | undefined> {
    const commitActions = this.#stagedActions;
    this.#stagedActions = [];

    // Trim off the set of actions used to stop the recording.
    console.log('Committing staged actions:', commitActions);
    const stopActionsCnt = RecordingContext.DEFAULT_STOP_MODIFIERS.length + 1;
    commitActions.splice(commitActions.length - stopActionsCnt, stopActionsCnt);
    if (commitActions.length === 0) return; // No actions to commit.

    return new AutoRecord(commitActions).configure();
  }

  /**
   * Sets the target element for adding a click target.
   * Highlights the target element and stores it for later use.
   *
   * @param event - The {@link MouseEvent} that triggered the function.
   */
  #setHoverHighlight = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target?.classList) return; // Ensure the target is an HTMLElement with classList.
    this.#unsetHoverHighlight(); // Unset the previous target element if it exists.

    target.classList.add('spark-highlight');
    target.addEventListener('click', this.#mouseEventHandler);
    this.#hoverElement = target;
  };

  /**
   * Unsets the currently highlighted target element.
   */
  #unsetHoverHighlight = (): void => {
    if (this.#hoverElement) {
      this.#hoverElement.removeEventListener('click', this.#mouseEventHandler);
      this.#hoverElement.classList.remove('spark-highlight');
      this.#hoverElement = null;
    }
  };

  /**
   * Adds a click target to the state.
   *
   * @param event - The {@link MouseEvent} that triggered the function.
   * @returns A {@link Promise} that resolves when the click target is added.
   */
  #mouseEventHandler = async (event: MouseEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    const [selector, textContent] = deriveElementSelector(target, { interactiveElement: true });

    const clickAction: AutoRecordMouseAction = {
      actionType: 'Mouse',
      coordinates: {
        pageX: event.pageX,
        pageY: event.pageY,
        x: event.x,
        y: event.y,
      },
      frameLocation: JSON.parse(JSON.stringify(window.location)),
      modifierKeys: {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      },
      mouseEventType: event.type as MouseEventType,
      selector,
      shadowAncestors: [],
      textContent,
      timestamp: Date.now(),
    };

    await this.#stageAction(clickAction);
  };

  /**
   * Key down event listener.
   *
   * @param event The {@link KeyboardEvent} that triggered the function.
   */
  #keyDownListener = async (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const [selector, textContent] = deriveElementSelector(target, { interactiveElement: true });
    const keyAction: AutoRecordKeyboardAction = {
      actionType: 'Keyboard',
      frameLocation: JSON.parse(JSON.stringify(window.location)),
      keyboardEventType: event.type as KeyboardEventType,
      keyStrokes: [event.key],
      modifierKeys: {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      },
      selector,
      shadowAncestors: [],
      textContent,
      timestamp: Date.now(),
    };

    await this.#stageAction(keyAction);

    // Check to see if the user is trying to stop the recording.
    if (event.ctrlKey && event.shiftKey && event.key === RecordingContext.DEFAULT_STOP_KEY) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await sendMessage({ // Notify all content scripts to stop recording.
        route: 'stopRecording',
        contexts: ['content'],
      });
    }
  };

}

export default RecordingContext;
