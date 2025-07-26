import type { Nullish } from 'utility-types';

/**
 * The saved state of an {@link AutoRecord}.
 * This is the state that is stored in `Chrome storage`.
 */
export interface AutoRecordState {

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
   * The timestamp of when the record was created.
   */
  createTimestamp: number;

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

  /**
   * The timestamp of the last update to the record.
   */
  updateTimestamp: number;

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
   * The {@link Location} of the {@link Window} where the action was recorded.
   * Determines the context in which the action will be replayed.
   *
   * This can be from a top-level {@link Window} or an embedded {@link HTMLIFrameElement}.
   */
  frameLocation: Location;

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

  /**
   * The timestamp (ms since epoch) of when the action was recorded.
   */
  timestamp: number;

}

/**
 * An action that can be performed by an {@link AutoRecord} of type `Mouse`.
 *
 * @extends {AutoRecordAction}
 */
export interface AutoRecordMouseAction extends AutoRecordAction {

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
  mouseEventType: MouseEventType;

}

/**
 * An action that can be performed by an {@link AutoRecord} of type `Keyboard`.
 *
 * @extends {AutoRecordAction}
 */
export interface AutoRecordKeyboardAction extends AutoRecordAction {

  actionType: 'Keyboard'; // Ensures the type is always 'Keyboard' for this interface

  keyboardEventType: KeyboardEventType; // The type of keyboard event (e.g., 'keydown', 'keyup')

  /**
   * The key stroke(s) to be executed when the action is triggered.
   */
  keyStrokes: string[];

}

/**
 * An action that can be performed by an {@link AutoRecord} of type `Script`.
 * @extends {AutoRecordAction}
 */
export interface AutoRecordScriptAction extends AutoRecordAction {

  actionType: 'Script'; // Ensures the type is always 'Script' for this interface

  /**
   * The JS script source to be executed when the action is triggered.
   */
  src: string;

}

/**
 * Options for loading an {@link AutoRecord}.
 */
export interface LoadRecordOptions {

  /**
   * A filter function to determine which records to load.
   *
   * @param record The record to load.
   * @returns `true` if the record should be loaded, `false` otherwise.
   */
  filter?: (record: AutoRecordState) => boolean;

  /**
   * A function to sort the loaded records.
   *
   * @param a The first record to compare.
   * @param b The second record to compare.
   * @returns A negative number if `a` should come before `b`, a positive number if `a` should come after `b`, or `0` if they are equal.
   * @default `(a, b) => a.name.localeCompare(b.name)`.
   */
  sort?: (a: AutoRecordState, b: AutoRecordState) => number;

}

export interface ConfigureRecordOptions {

  /**
   * If `true`, the record will not be saved after configuration.
   *
   * @default `false`
   */
  omitSave?: boolean;

}

export type AutoRecordType = 'Recording' | 'Script';
export type AutoRecordActionType = 'Mouse' | 'Keyboard' | 'Script';
export type AutoRecordUid = string;
export type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';
export type MouseEventType = 'click' | 'dblclick' | 'contextmenu';
