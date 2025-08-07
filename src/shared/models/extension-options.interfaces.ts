/**
 * Options for the extension.
 */
export interface ExtensionOptionsState {

  /**
   * The timestamp when the options were created.
   */
  createTimestamp: number;

  /**
   * The key that stops the recording when pressed in combination with the stop modifier.
   */
  stopRecordingKey: string;

  /**
   * The modifiers that stop the recording when pressed in combination with the stop key.
   */
  stopRecordingModifier: string;

  /**
   * The timestamp of the last update to the options.
   */
  updateTimestamp: number;

}
