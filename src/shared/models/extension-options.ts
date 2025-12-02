import deepFreeze from 'deep-freeze';
import type { DeepReadonly, Nullish } from 'utility-types';
import { loadState, saveState } from '~shared/utils/state.js';
import type { ExtensionOptionsState } from './extension-options.interfaces.js';

export class ExtensionOptions implements ExtensionOptionsState {

  static readonly DEFAULT_STOP_RECORDING_KEY = 'Enter';

  static readonly DEFAULT_STOP_RECORDING_MODIFIER = 'Shift';

  readonly createTimestamp: number;

  /**
   * The singleton instance of the {@link ExtensionOptions}.
   */
  static #instance: ExtensionOptions | undefined;

  #frozenState: DeepReadonly<Partial<ExtensionOptionsState>>;

  #state: Partial<ExtensionOptionsState>;

  #stopRecordingKey = ExtensionOptions.DEFAULT_STOP_RECORDING_KEY;

  #stopRecordingModifier = ExtensionOptions.DEFAULT_STOP_RECORDING_MODIFIER;

  #updateTimestamp: number;

  protected constructor(state: ExtensionOptionsState) {
    this.#state = state;
    this.#frozenState = deepFreeze(state);

    this.createTimestamp = state.createTimestamp ?? new Date().getTime();
    this.#updateTimestamp = state.updateTimestamp ?? this.createTimestamp;
    this.reset(state);
  }

  get id(): number { return 0; }

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

  /**
   * Loads the extension options from storage and populates a singleton cached instance.
   */
  static async load(): Promise<ExtensionOptions> {
    if (!ExtensionOptions.#instance) {
      const extensionOptions = await loadState('extensionOptions');
      ExtensionOptions.#instance = new ExtensionOptions(extensionOptions);
    }
    return ExtensionOptions.#instance;
  }

  /**
   * Saves the current state of this {@link ExtensionOptions} model.
   *
   * @param mergeData The options to {@link merge} with the current state before saving.
   * Any options not specified in {@link mergeData} will be saved as-is.
   * @returns A {@link Promise} that resolves to this {@link ExtensionOptions} instance when the save is complete.
   */
  async save(mergeData: Partial<ExtensionOptionsState>): Promise<this> {
    this.stopRecordingKey = mergeData.stopRecordingKey ?? this.stopRecordingKey;
    this.stopRecordingModifier = mergeData.stopRecordingModifier ?? this.stopRecordingModifier;
    this.#updateTimestamp = new Date().getTime();
    this.#state = (await saveState({ extensionOptions: this })).extensionOptions;
    this.#frozenState = deepFreeze(this.#state);
    return this;
  }

  /**
   * Merges the given {@link data} into this {@link ExtensionOptions} instance.
   *
   * @param data The {@link ExtensionOptionsState} Partial containing the new state values.
   * Will only set the state of included properties.
   * @return This {@link ExtensionOptions} instance with the given {@link data} merged in.
   */
  merge(data: Partial<ExtensionOptionsState>): this {
    if (Object.hasOwn(data, 'stopRecordingKey'))      this.stopRecordingKey = data.stopRecordingKey!;
    if (Object.hasOwn(data, 'stopRecordingModifier')) this.stopRecordingModifier = data.stopRecordingModifier!;
    return this;
  }

  /**
   * Resets this {@link ExtensionOptions} instance to its initial state.
   *
   * @param mergeData The {@link ExtensionOptionsState} Partial containing explicit reset data.
   * Will {@link merge} the provided data into the initial state. Useful for retaining some properties.
   * @return This {@link ExtensionOptions} instance with the reset state applied.
   */
  reset(mergeData: Partial<ExtensionOptionsState> = {}): this {
    const state = mergeData
      ? Object.assign({}, this.#state, mergeData)
      : this.#state;
    this.merge(state);
    this.#updateTimestamp = this.#state.updateTimestamp ?? this.createTimestamp;
    return this;
  }

}

export type * from './extension-options.interfaces.js';
