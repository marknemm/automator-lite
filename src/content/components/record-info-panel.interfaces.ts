import type { Template } from '~shared/utils/mount.interfaces.js';

/**
 * Options for mounting the `RecordingInfoPanel`.
 */
export interface RecordInfoPanelOptions {

  /**
   * The key that stops the recording when pressed in combination with `Ctrl`.
   * @default 'Esc'
   */
  stopRecordingKey?: string;

  /**
   * The custom contents to be displayed inside the panel.
   */
  contents?: Template;

}
