import type { Nullish } from 'utility-types';
import type { SparkState } from './spark-model.interfaces.js';

/**
 * The saved state of an {@link AutoRecord}.
 * This is the state that is stored in `Chrome storage`.
 *
 * @extends SparkState
 */
export interface AutoRecordState extends SparkState {

  /**
   * The actions to be performed by the record.
   */
  actions: AutoRecordAction[];

  /**
   * Whether the action should be performed automatically.
   *
   * If `true`, the action will be performed when the webpage loads.
   *
   * If `false`, the action must be manually triggered.
   */
  autoRun: boolean;

  /**
   * Whether the record is currently being executed.
   */
  executing?: boolean;

  /**
   * The frequency of the action.
   * This can be used to specify how often the action should be performed on repeat.
   *
   * If not specified, the action will be performed once.
   */
  frequency?: number | Nullish;

  /**
   * The name of the record.
   * This is a user-friendly name that can be used to identify the record.
   */
  name: string;

  /**
   * Whether the record is currently paused.
   */
  paused?: boolean;

}

/**
 * An generic action that can be performed by an {@link AutoRecord}.
 */
export interface AutoRecordAction {

  /**
   * The {@link AutoRecordActionType} of user interaction to perform.
   *
   * Can be one of:
   * - `Mouse`: A mouse action, such as a click or hover.
   * - `Keyboard`: A keyboard action, such as typing or pressing a key.
   * - `Script`: A script action, such as executing a JavaScript snippet.
   */
  actionType: AutoRecordActionType;

  /**
   * The `href` of the {@link Window} where the action was recorded.
   * Determines the context in which the action will be replayed.
   *
   * This can be from a top-level {@link Window} or an embedded {@link HTMLIFrameElement}.
   */
  frameHref: string;

  /**
   * The `href` of the top-level {@link Window} where the action was recorded.
   * This is used to locate the correct browser tab when executing the action from the background context.
   *
   * This is always that of a top-level {@link Window} and never an embedded {@link HTMLIFrameElement}.
   */
  tabHref: string;

  /**
   * The timestamp (ms since epoch) of when the action was recorded.
   */
  timestamp: number;

}

/**
 * An {@link AutoRecordAction} that requires user input (e.g. mouse or keyboard) to be performed.
 *
 * @extends AutoRecordAction
 */
export interface UserInputAction extends AutoRecordAction {

  /**
   * The type of user input event (e.g., 'keydown', 'keyup', 'click').
   */
  eventType: KeyboardEventType | MouseEventType;

  /**
   * The modifier keys to be used when executing the action.
   */
  modifierKeys?: {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
  };

  /**
   * The selectors of Shadow DOM elements that are ancestors of the target element.
   *
   * An empty array indicates that there are no Shadow DOM ancestors.
   */
  shadowAncestors: string[];

  /**
   * The CSS selector of the element that is targeted by the action.
   */
  selector: string;

  /**
   * The text content of the element that is targeted by the action.
   * This is used to identify the element in the DOM if the selector is non-unique.
   */
  textContent?: string;

}

/**
 * An {@link AutoRecordAction} that specifies how to replay a `Mouse` user input event.
 *
 * @extends UserInputAction
 */
export interface MouseAction extends UserInputAction {

  actionType: 'Mouse'; // Ensures the type is always 'Mouse' for this interface

  coordinates: {

    /**
     * The x coordinate of the mouse event relative to the entire page.
     */
    pageX: number;

    /**
     * The y coordinate of the mouse event relative to the entire page.
     */
    pageY: number;

    /**
     * The x coordinate of the mouse event relative to the viewport screen.
     */
    x: number;

    /**
     * The y coordinate of the mouse event relative to the viewport screen.
     */
    y: number;

  };

  /**
   * The mode of the mouse action.
   *
   * Can be one of:
   * - `click`: A single click action.
   * - `dblclick`: A double click action.
   * - `contextmenu`: A right click action.
   */
  eventType: MouseEventType;

}

/**
 * An {@link AutoRecordAction} that specifies how to replay a `Keyboard` user input event.
 *
 * @extends UserInputAction
 */
export interface KeyboardAction extends UserInputAction {

  actionType: 'Keyboard'; // Ensures the type is always 'Keyboard' for this interface

  /**
   * The type of keyboard event (e.g., 'keydown', 'keyup').
   */
  eventType: KeyboardEventType;

  /**
   * The key to be pressed or released.
   */
  key: string;

}

/**
 * An {@link AutoRecordAction} that specifies how to execute a manual script.
 *
 * @extends AutoRecordAction
 */
export interface ScriptAction extends AutoRecordAction {

  actionType: 'Script'; // Ensures the type is always 'Script' for this interface

  /**
   * The JS script source whose {@link compiledCode} will be executed when the action is triggered.
   */
  code: string;

  /**
   * The {@link code} compiled to ES5 JS to be executed when the action is triggered.
   */
  compiledCode: string;

  /**
   * The name of the script action.
   */
  name: string;

}

export interface ConfigureRecordOptions {

  /**
   * If `true`, the record will not be saved after configuration.
   *
   * @default `false`
   */
  omitSave?: boolean;

}

/**
 * The active recording type for this context.
 *
 * - `'Standard'`: Records all user interactions.
 * - `'Scripting'`: Records a manually entered JS script.
 */
export type RecordingType = 'Standard' | 'Scripting';
export type AutoRecordActionType = 'Mouse' | 'Keyboard' | 'Script';
export type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';
export type MouseEventType = 'click' | 'dblclick' | 'contextmenu' | 'mousedown' | 'mouseup';
