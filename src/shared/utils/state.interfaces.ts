import type { AutoRecordState } from '~shared/models/auto-record.interfaces.js';

/**
 * The global state of the extension.
 * This state is stored in `Chrome storage` and is used to manage the extension's behavior.
 */
export interface State {

  /**
   * Whether the add record button is active.
   */
  addActive: boolean;

  /**
   * Whether all records are paused.
   */
  allPaused: boolean;

  /**
   * The auto-records state.
   */
  records: AutoRecordState[];

}

/**
 * The state change event.
 */
export interface StateChange {

  /**
   * The old value of the {@link State}.
   */
  oldState: State;

  /**
   * The new value of the {@link State}.
   */
  newState: State;

}

export type { AutoRecordState };
