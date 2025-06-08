import type { Nullish } from 'utility-types';
import type { AutoRecord } from './auto-record.js';

/**
 * The saved state of an {@link AutoRecord}.
 * This is the state that is stored in `Chrome storage`.
 */
export interface AutoRecordState {

  /**
   * The action associated with the record.
   * This can be a user interaction (e.g., click, double-click) or a script action.
   */
  action: AutoRecordAction;

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
   * The keyboard key strokes to be executed when the action is triggered.
   * This is used for the `Type` {@link AutoRecordAction}.
   */
  keyStrokes?: string[];

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
   * The index of the record in the list of query results for the selector.
   * This is used to identify the specific instance of the element if there are multiple matches.
   * If not specified, the first match will be used.
   */
  queryIdx?: number;

  /**
   * The selector used to identify the target element for the record.
   * This is a CSS selector that can be used to select the element in the DOM.
   */
  selector: string;

  /**
   * The JS script to be executed when the action is triggered.
   * This is used for the `Script` {@link AutoRecordAction}.
   */
  script?: string;

  /**
   * The timestamp of the last update to the record.
   */
  updateTimestamp: number;

}

export type AutoRecordAction = 'Double Click' | 'Click' | 'Script' | 'Type';
export type AutoRecordUid = string;
