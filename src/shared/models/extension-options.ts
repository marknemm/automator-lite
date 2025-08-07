import deepFreeze from 'deep-freeze';
import type { DeepReadonly, Nullish } from 'utility-types';
import { loadState, saveState } from '~shared/utils/state.js';
import type { ExtensionOptionsState } from './extension-options.interfaces.js';

export class ExtensionOptions implements ExtensionOptionsState {

  static readonly DEFAULT_STOP_RECORDING_KEY = 'Enter';

  static readonly DEFAULT_STOP_RECORDING_MODIFIER = 'Shift';

  readonly createTimestamp: number;

  #frozenState: DeepReadonly<Partial<ExtensionOptionsState>>;

  #state: Partial<ExtensionOptionsState>;

  #stopRecordingKey = ExtensionOptions.DEFAULT_STOP_RECORDING_KEY;

  #stopRecordingModifier = ExtensionOptions.DEFAULT_STOP_RECORDING_MODIFIER;

  #updateTimestamp: number;

  constructor(state: ExtensionOptionsState) {
    this.#state = state;
    this.#frozenState = deepFreeze(state);

    this.createTimestamp = state.createTimestamp ?? new Date().getTime();
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
    this.reset(state);
  }

  /**
   * The raw {@link ExtensionOptionsState} data.
   *
   * Will become desynchronized from any unsaved changes to this {@link ExtensionOptions}'s properties.
   * This is by design, since the state data is meant to reflect the saved state of the record.
   *
   * @return The raw {@link ExtensionOptionsState} data.
   */
  get state(): DeepReadonly<Partial<ExtensionOptionsState>> {
    return this.#frozenState;
  }

  get stopRecordingKey(): string { return this.#stopRecordingKey; }
  set stopRecordingKey(key: string | Nullish) {
    this.#stopRecordingKey = key?.trim() || ExtensionOptions.DEFAULT_STOP_RECORDING_KEY;
  }

  get stopRecordingModifier(): string { return this.#stopRecordingModifier; }
  set stopRecordingModifier(modifier: string | Nullish) {
    this.#stopRecordingModifier = modifier?.trim() || ExtensionOptions.DEFAULT_STOP_RECORDING_MODIFIER;
  }

  get updateTimestamp(): number { return this.#updateTimestamp; }

  static async load(): Promise<ExtensionOptions> {
    const extensionOptions = await loadState('extensionOptions');
    return new ExtensionOptions(extensionOptions);
  }

  static async save(options: Partial<ExtensionOptionsState>): Promise<void> {
    const currentOptions = await ExtensionOptions.load();
    const newOptions: ExtensionOptionsState = {
      createTimestamp: currentOptions.createTimestamp,
      stopRecordingKey: options.stopRecordingKey ?? currentOptions.stopRecordingKey,
      stopRecordingModifier: options.stopRecordingModifier ?? currentOptions.stopRecordingModifier,
      updateTimestamp: new Date().getTime(),
    };
    await saveState({ extensionOptions: newOptions });
  }

  /**
   * Resets this {@link ExtensionOptions} instance to its initial state.
   *
   * @param state The {@link ExtensionOptionsState} to reset this {@link ExtensionOptions} to.
   * If not provided, resets to the initial state of the extension options.
   */
  reset(state: Partial<ExtensionOptionsState> = this.#state): void {
    this.stopRecordingKey = state.stopRecordingKey;
    this.stopRecordingModifier = state.stopRecordingModifier;
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
  }

}

export type * from './extension-options.interfaces.js';
