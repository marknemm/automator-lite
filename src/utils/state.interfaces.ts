import type { AutoRecordState } from '../models/auto-record.interfaces';

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
   * The auto-records state.
   */
  records: AutoRecordState[];

}

export type { AutoRecordState as RecordState }
