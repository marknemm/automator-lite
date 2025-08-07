import type { AutoRecordState } from '~shared/models/auto-record.interfaces.js';
import type { ExtensionOptionsState } from '~shared/models/extension-options.js';

/**
 * The global state of the extension.
 * This state is stored in `Chrome storage` and is used to manage the extension's behavior.
 */
export interface State {

  /**
   * The {@link AutoRecordState} list containing all saved records.
   */
  records: AutoRecordState[];

  /**
   * The {@link ExtensionOptionsState} containing options for the entire extension.
   */
  extensionOptions: ExtensionOptionsState;

}

export type StateProp = keyof State | undefined;

export type StateSlice<Prop> = Prop extends keyof State ? State[Prop] : State;

export type StateSubset<K extends readonly (keyof State)[]> = Pick<State, K[number]>;

/**
 * The state change event.
 */
export interface StateChange<T extends Partial<State> = State> {

  /**
   * The old value of the {@link State}.
   */
  oldState: T;

  /**
   * The new value of the {@link State}.
   */
  newState: T;

}

export type { AutoRecordState };
