import type { Nullish } from 'utility-types';
import { RecordingInfoPanel } from '~content/components/recording-info-panel.js';
import type { KeyboardAction, KeyboardEventType, MouseAction, MouseEventType } from '~shared/models/auto-record.interfaces.js';
import { AutoRecord } from '~shared/models/auto-record.js';
import { ExtensionOptions } from '~shared/models/extension-options.js';
import { sendMessage } from '~shared/utils/messaging.js';
import { type MountContext } from '~shared/utils/mount.js';
import { isTopWindow } from '~shared/utils/window.js';
import { ActionParser } from './action-parser.js';
import { deriveElementSelector } from './element-analysis.js';

/**
 * Context for managing the recording state and interactions.
 */
export class RecordingContext {

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
   * The {@link ActionParser} instance used to stage actions during recording.
   */
  #actionParser: ActionParser = undefined as any; // Initialized in `init()`.

  /**
   * Constructs a new {@link RecordingContext} instance.
   * This should only be called by {@link RecordingContext.init}.
   */
  protected constructor() {}

  /**
   * Initializes the per-frame singleton recording context.
   *
   * Call {@link RecordingContext.start} on the result to begin recording actions.
   *
   * @return A new instance of {@link RecordingContext}.
   */
  static init(): RecordingContext {
    RecordingContext.#instance ??= new RecordingContext();
    RecordingContext.#instance.#actionParser = ActionParser.init();
    return RecordingContext.#instance;
  }

  /**
   * Whether recording is currently active.
   */
  get active(): boolean { return this.#active; }

  /**
   * Starts the recording process.
   */
  async start(): Promise<void> {
    if (this.active) return; // Prevent starting if already active.
    this.#active = true;

    // Bind event listeners to the document for adding a new record.
    document.addEventListener('mouseover', this.#setHoverHighlight);
    document.addEventListener('mouseout', this.#unsetHoverHighlight);
    document.addEventListener('keydown', this.#keyboardEventHandler);
    document.addEventListener('keyup', this.#keyboardEventHandler);

    if (isTopWindow()) { // Prevent duplicate mounts from iframes.
      const { stopRecordingKey, stopRecordingModifier } = await ExtensionOptions.load();
      this.#recordingInfoMountCtx = RecordingInfoPanel.mount({
        stopRecordingKeys: ['Ctrl', stopRecordingModifier, stopRecordingKey],
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
    document.removeEventListener('keydown', this.#keyboardEventHandler);
    document.removeEventListener('keyup', this.#keyboardEventHandler);

    if (isTopWindow()) {
      this.#recordingInfoMountCtx?.unmount();
      this.#recordingInfoMountCtx = null;
      return this.#actionParser.commitStagedActions(); // Commit the staged actions to an AutoRecord.
    }
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
    this.#hoverElement = target;
    this.#hoverElement.addEventListener('mousedown', this.#mouseEventHandler);
    this.#hoverElement.addEventListener('mouseup', this.#mouseEventHandler);
    this.#hoverElement.addEventListener('click', this.#mouseEventHandler);
    this.#hoverElement.addEventListener('contextmenu', this.#mouseEventHandler);
    this.#hoverElement.addEventListener('dblclick', this.#mouseEventHandler);
  };

  /**
   * Unsets the currently highlighted target element.
   */
  #unsetHoverHighlight = (): void => {
    if (this.#hoverElement) {
      this.#hoverElement.removeEventListener('mousedown', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('mouseup', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('click', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('contextmenu', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('dblclick', this.#mouseEventHandler);
      this.#hoverElement.classList.remove('spark-highlight');
      this.#hoverElement = null;
    }
  };

  /**
   * Handles mouse events to stage a {@link MouseAction}.
   *
   * @param event - The {@link MouseEvent} that triggered the function.
   * @returns A {@link Promise} that resolves when the mouse action is staged.
   */
  #mouseEventHandler = async (event: MouseEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    const [selector, textContent] = deriveElementSelector(target, { interactiveElement: true });

    const clickAction: MouseAction = {
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
      timestamp: new Date().getTime(),
    };

    await this.#actionParser.stageAction(clickAction);
  };

  /**
   * Handles keyboard events to stage a {@link KeyboardAction}.
   *
   * @param event The {@link KeyboardEvent} that triggered the function.
   * @returns A {@link Promise} that resolves when the key action is staged.
   */
  #keyboardEventHandler = async (event: KeyboardEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    const [selector, textContent] = deriveElementSelector(target, { interactiveElement: true });
    const keyAction: KeyboardAction = {
      actionType: 'Keyboard',
      frameLocation: JSON.parse(JSON.stringify(window.location)),
      key: event.key,
      keyboardEventType: event.type as KeyboardEventType,
      modifierKeys: {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      },
      selector,
      shadowAncestors: [],
      textContent,
      timestamp: new Date().getTime(),
    };

    await this.#actionParser.stageAction(keyAction);

    // Check to see if the user is trying to stop the recording.
    const { stopRecordingKey, stopRecordingModifier } = await ExtensionOptions.load();
    const hasModifier = stopRecordingModifier === 'Shift' && event.shiftKey
                      || stopRecordingModifier === 'Alt' && event.altKey
                      || stopRecordingModifier === 'Meta' && event.metaKey;
    if (event.ctrlKey && hasModifier && event.key === stopRecordingKey) {
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
