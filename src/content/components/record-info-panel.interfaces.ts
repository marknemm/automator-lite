import type { Template } from '~shared/utils/mount.interfaces.js';

/**
 * Options for mounting the `RecordingInfoPanel`.
 */
export interface RecordInfoPanelOptions {

  /**
   * The key(s) that stops the recording.
   */
  stopRecordingKeys: string[];

  /**
   * The custom contents to be displayed inside the panel.
   */
  contents?: Template;

}
