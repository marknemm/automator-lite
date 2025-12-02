import type { SparkState } from './spark-model.interfaces.js';

/**
 * Options for the extension.
 *
 * @extends SparkState
 */
export interface ExtensionOptionsState extends SparkState {

  /**
   * The key that stops the recording when pressed in combination with the stop modifier.
   */
  stopRecordingKey: string;

  /**
   * The modifiers that stop the recording when pressed in combination with the stop key.
   */
  stopRecordingModifier: string;

}
