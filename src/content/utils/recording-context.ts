import type { Nullish } from 'utility-types';
import { AutoRecordConfigModal } from '~content/components/auto-record-config-modal.js';
import { RecordingInfoPanel } from '~content/components/recording-info-panel.js';
import { ScriptingModal, ScriptingModalData } from '~content/components/scripting-modal.js';
import type { AutoRecordAction, AutoRecordState, KeyboardAction, KeyboardEventType, MouseAction, MouseEventType, RecordingType, ScriptAction } from '~shared/models/auto-record.interfaces.js';
import { AutoRecord } from '~shared/models/auto-record.js';
import { ExtensionOptions } from '~shared/models/extension-options.js';
import { SparkStore } from '~shared/models/spark-store.js';
import { sendExtension } from '~shared/utils/extension-messaging.js';
import { log } from '~shared/utils/logger.js';
import { type MountContext } from '~shared/utils/mount.js';
import { sendTopWindow } from '~shared/utils/window-messaging.js';
import { isTopWindow } from '~shared/utils/window.js';
import { ActionParser } from './action-parser.js';
import { deriveElementSelector } from './element-analysis.js';
import { ScriptCompiler } from './script-compiler.js';

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
   * The {@link ActionParser} instance used to stage actions during recording.
   */
  #actionParser!: ActionParser; // Initialized in `init()`.

  /**
   * The active {@link RecordingType} for this context.
   * @see {@link RecordingContext.activeRecordingType activeRecordingType}
   */
  #activeRecordingType: RecordingType | Nullish;

  /**
   * The {@link SparkStore} for saving configured records.
   */
  #autoRecordStore = SparkStore.getInstance(AutoRecord);

  /**
   * The {@link ExtensionOptions} for the current extension installation.
   */
  #extensionOptions!: ExtensionOptions; // Initialized in `init()`.

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
   * The {@link ScriptCompiler} instance used to compile user scripts.
   */
  #scriptCompiler!: ScriptCompiler; // Initialized in `init()`.

  /**
   * Constructs a new {@link RecordingContext} instance.
   *
   * This should only be called by {@link RecordingContext.init} to enforce singleton pattern.
   */
  protected constructor() {}

  /**
   * Initializes the per-frame singleton recording context.
   *
   * Call {@link RecordingContext.start} on the result to begin recording actions.
   *
   * @return A new instance of {@link RecordingContext}.
   */
  static async init(): Promise<RecordingContext> {
    RecordingContext.#instance ??= new RecordingContext();
    RecordingContext.#instance.#actionParser = ActionParser.init();
    RecordingContext.#instance.#extensionOptions = await ExtensionOptions.load();
    RecordingContext.#instance.#scriptCompiler = ScriptCompiler.init();
    return RecordingContext.#instance;
  }

  /**
   * Whether recording is currently active.
   */
  get active(): boolean { return !!this.#activeRecordingType; }

  /**
   * The active {@link RecordingType} for this context.
   *
   * - `'Standard'`: Records all user interactions.
   * - `'Scripting'`: Records a manually entered JS script.
   *
   * - `undefined`: No active recording, nor has it been started previously.
   * - `null`: Recording has been stopped.
   */
  get activeRecordingType(): RecordingType | Nullish {
    return this.#activeRecordingType;
  }

  /**
   * Configures and saves given {@link recordData}.
   *
   * @param recordData The {@link AutoRecordState} to configure and save.
   * @returns The saved {@link AutoRecord}, or `undefined` if cancelled.
   */
  async configureAndSave(
    recordData: AutoRecordState | AutoRecordAction[] | Nullish
  ): Promise<AutoRecord | undefined> {
    if (!recordData || (recordData instanceof Array && !recordData.length)) return; // No valid record to config.
    const saveState = await AutoRecordConfigModal.open(recordData);
    log.debug('Configured record state:', saveState);
    if (saveState) return this.#autoRecordStore.initModel(saveState).save();
  }

  /**
   * Starts the recording process.
   *
   * @param recordingType - The {@link RecordingType} to start. Defaults to `'Standard'`.
   */
  start(recordingType: RecordingType = 'Standard'): void {
    if (this.active) return; // Prevent starting if already active.
    this.#activeRecordingType = recordingType;

    switch(recordingType) {
      case 'Standard':
        this.#startStandardRecording();
        break;
      case 'Scripting':
        this.#startScripting();
        break;
    }
  }

  #startStandardRecording() {
    // Bind event listeners to the document for adding a new record.
    document.addEventListener('mouseover', this.#setHoverHighlight);
    document.addEventListener('mouseout', this.#unsetHoverHighlight);
    document.addEventListener('keydown', this.#keyboardEventHandler, true);
    document.addEventListener('keyup', this.#keyboardEventHandler, true);

    if (isTopWindow()) { // Prevent duplicate mounts from iframes.
      const { stopRecordingKey, stopRecordingModifier } = this.#extensionOptions;
      this.#recordingInfoMountCtx = RecordingInfoPanel.mount({
        stopRecordingKeys: ['Ctrl', stopRecordingModifier, stopRecordingKey],
      });
      if (!document.activeElement) {
        document.body.focus(); // Ensure the body is focused to capture key events.
      }
    }
  }

  async #startScripting() {
    if (isTopWindow()) {
      const code = await ScriptingModal.open();
      if (code) {
        this.#stageScriptAction(code);
      }
      await this.#triggerStopRecording();
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
    this.#activeRecordingType = null;
    this.#unsetHoverHighlight();

    document.removeEventListener('mouseover', this.#setHoverHighlight);
    document.removeEventListener('mouseout', this.#unsetHoverHighlight);
    document.removeEventListener('keydown', this.#keyboardEventHandler);
    document.removeEventListener('keyup', this.#keyboardEventHandler);

    if (isTopWindow()) {
      this.#recordingInfoMountCtx?.unmount();
      this.#recordingInfoMountCtx = null;
      const commitActions = this.#actionParser.commitStagedActions();
      this.configureAndSave(commitActions);
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
    this.#hoverElement.addEventListener('click', this.#mouseEventHandler);
    if (this.activeRecordingType === 'Standard') {
      this.#hoverElement.addEventListener('mousedown', this.#mouseEventHandler);
      this.#hoverElement.addEventListener('mouseup', this.#mouseEventHandler);
      this.#hoverElement.addEventListener('contextmenu', this.#mouseEventHandler);
      this.#hoverElement.addEventListener('dblclick', this.#mouseEventHandler);
    }
  };

  /**
   * Unsets the currently highlighted target element.
   */
  #unsetHoverHighlight = (): void => {
    if (this.#hoverElement) {
      this.#hoverElement.removeEventListener('click', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('mousedown', this.#mouseEventHandler);
      this.#hoverElement.removeEventListener('mouseup', this.#mouseEventHandler);
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
    switch (this.activeRecordingType) {
      case 'Standard':
        await this.#stageMouseAction(event);
        break;
      default: // Not recording, do nothing.
    }
  };

  /**
   * Stages a {@link MouseAction} that can later be committed to a saved {@link AutoRecord}.
   *
   * @param event The {@link MouseEvent} that the action will be based on.
   * @returns A {@link Promise} that resolves when the action is staged.
   */
  async #stageMouseAction(event: MouseEvent): Promise<void> {
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
      eventType: event.type as MouseEventType,
      frameHref: window.location.href,
      modifierKeys: {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      },
      selector,
      shadowAncestors: [],
      tabHref: await sendTopWindow('getHref') ?? '',
      textContent,
      timestamp: new Date().getTime(),
    };

    await this.#actionParser.stageAction(clickAction);
  }

  /**
   * Stages a {@link ScriptAction} that can later be committed to a saved {@link AutoRecord}.
   *
   * @param code - The script code to compile and stage.
   * @param frameHref - The href of the frame where the code will be executed.
   * @return A {@link Promise} that resolves when the action is staged.
   */
  async #stageScriptAction({ code, frameHref }: ScriptingModalData): Promise<void> {
    const compiledCode = this.#scriptCompiler.compile(code);

    const scriptAction: ScriptAction = {
      actionType: 'Script',
      code,
      compiledCode,
      frameHref,
      name: '', // Can be filled within AutoRecordConfigModal.
      tabHref: await sendTopWindow('getHref') ?? '',
      timestamp: new Date().getTime(),
    };

    await this.#actionParser.stageAction(scriptAction);
  }

  /**
   * Handles keyboard events to stage a {@link KeyboardAction}.
   *
   * @param event The {@link KeyboardEvent} that triggered the function.
   * @returns A {@link Promise} that resolves when the key action is staged.
   */
  #keyboardEventHandler = async (event: KeyboardEvent): Promise<void> => {
    const { stopRecordingKey, stopRecordingModifier } = this.#extensionOptions;
    const hasModifier = stopRecordingModifier === 'Shift' && event.shiftKey
                      || stopRecordingModifier === 'Alt' && event.altKey
                      || stopRecordingModifier === 'Meta' && event.metaKey;

    // Check to see if the user is trying to stop the recording.
    if (event.ctrlKey && hasModifier && event.key === stopRecordingKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await this.#triggerStopRecording();
    }

    // If scripting, then do not record keystrokes.
    if (this.activeRecordingType === 'Standard') {
      await this.#stageKeyboardAction(event);
    }
  };

  /**
   * Stages a {@link KeyboardAction} that can later be committed to a saved {@link AutoRecord}.
   *
   * @param event The {@link KeyboardEvent} that the action will be based on.
   * @returns A {@link Promise} that resolves when the action is staged.
   */
  async #stageKeyboardAction(event: KeyboardEvent): Promise<void> {
    const target = event.target as HTMLElement;
    const [selector, textContent] = deriveElementSelector(target, { interactiveElement: true });
    const keyAction: KeyboardAction = {
      actionType: 'Keyboard',
      eventType: event.type as KeyboardEventType,
      frameHref: window.location.href,
      key: event.key,
      modifierKeys: {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
      },
      selector,
      shadowAncestors: [],
      tabHref: await sendTopWindow('getHref') ?? '',
      textContent,
      timestamp: new Date().getTime(),
    };

    await this.#actionParser.stageAction(keyAction);
  }

  async #triggerStopRecording(): Promise<void> {
    // Send message to all frames to stop recording.
    await sendExtension({
      route: 'stopRecording',
      contexts: ['content'],
    });
  }

}

export default RecordingContext;
