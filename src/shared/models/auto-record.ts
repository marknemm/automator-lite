import type { Nullish } from 'utility-types';
import { model } from '~shared/decorators/model.js';
import { SparkModel } from '~shared/models/spark-model.js';
import { AutoRecordObserver } from './auto-record-observer.js';
import { AutoRecordPersister } from './auto-record-persister.js';
import type { AutoRecordAction, AutoRecordState } from './auto-record.interfaces.js';

/**
 * {@link AutoRecord} model data that contains actions that are replayable on a webpage.
 *
 * @extends SparkModel<AutoRecordState>
 */
@model({
  stateListener: AutoRecordObserver,
  statePersister: AutoRecordPersister,
})
export class AutoRecord extends SparkModel<AutoRecordState> {

  #actions: AutoRecordAction[] = [];
  #autoRun = false;
  #executing = false;
  #frequency: number | Nullish;
  #name = '';
  #paused = false;

  get actions(): AutoRecordAction[] { return this.#actions; }
  set actions(actions: AutoRecordAction[] | Nullish) { this.#actions = actions ?? []; }

  get autoRun(): boolean { return this.#autoRun; }
  set autoRun(autoRun: boolean | Nullish) { this.#autoRun = autoRun ?? false; }

  get executing(): boolean { return this.#executing; }
  set executing(executing: boolean | Nullish) { this.#executing = executing ?? false; }

  get frequency(): number | Nullish { return this.#frequency; }
  set frequency(frequency: number | Nullish) {
    this.#frequency = (typeof frequency === 'number')
      ? Math.max(0, frequency)
      : frequency;
  }

  get name(): string { return this.#name; }
  set name(name: string | Nullish) { this.#name = name?.trim() ?? ''; }

  get paused(): boolean { return this.#paused ?? false; }
  set paused(paused: boolean | Nullish) { this.#paused = paused ?? false; }

}

export type * from './auto-record.interfaces.js';
export default AutoRecord;
