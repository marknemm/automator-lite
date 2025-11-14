import type { SparkModelState } from './spark-model.interfaces.js';

/**
 * Options for the extension.
 *
 * @extends SparkModelState
 */
export interface ExtensionOptionsState extends SparkModelState {

  /**
   * The key that stops the recording when pressed in combination with the stop modifier.
   */
  stopRecordingKey: string;

  /**
   * The modifiers that stop the recording when pressed in combination with the stop key.
   */
  stopRecordingModifier: string;

}
