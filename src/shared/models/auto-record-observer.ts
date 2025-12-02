import { isEqual } from 'lodash-es';
import log from '~shared/utils/logger.js';
import { onStateChange } from '~shared/utils/state.js';
import type { AutoRecordState } from './auto-record.interfaces.js';
import { SparkStateCreateEmitter, SparkStateDeleteEmitter, SparkStateUpdateEmitter } from './spark-model.js';
import { SparkStateObserver } from './spark-state-observer.js';

export class AutoRecordObserver extends SparkStateObserver<AutoRecordState> {

  protected override async observeCreate(
    emit: SparkStateCreateEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const createdRecords = newRecords.filter(
        newRecord => !oldRecords.some(oldRecord =>
          this.isStateEqual(oldRecord, newRecord)
        )
      );

      for (const record of createdRecords) {
        log.debug('AutoRecordStateManager.listenCreate - detected record creation:', record);
        emit(record);
      }
    }, 'records');
  }

  protected override observeDelete(
    emit: SparkStateDeleteEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const deletedRecords = oldRecords.filter(
        oldRecord => !newRecords.some(newRecord =>
          this.isStateEqual(newRecord, oldRecord)
        )
      );

      for (const record of deletedRecords) {
        log.debug('AutoRecordStateManager.listenDelete - detected record deletion:', record);
        emit(undefined, record);
      }
    }, 'records');
  }

  protected override observeUpdate(
    emit: SparkStateUpdateEmitter<AutoRecordState>
  ): Promise<() => void> {
    return onStateChange(async (stateChange) => {
      const oldRecords = stateChange.oldState.records ?? [];
      const newRecords = stateChange.newState.records ?? [];
      const updatedRecords = newRecords.filter(
        newRecord => {
          const oldRecord = oldRecords.find(oldRecord =>
            this.isStateEqual(oldRecord, newRecord)
          );
          return oldRecord && !isEqual(oldRecord, newRecord);
        }
      );

      for (const newRecord of updatedRecords) {
        const oldRecord = oldRecords.find(oldRecord =>
          this.isStateEqual(oldRecord, newRecord)
        )!;
        log.debug('AutoRecordStateManager.listenUpdate - detected record update:', { newRecord, oldRecord });
        emit(newRecord, oldRecord);
      }
    }, 'records');
  }

  isStateEqual(
    state: AutoRecordState,
    identifier: string | Partial<AutoRecordState>
  ): boolean {
    if (typeof identifier === 'string') {
      return `${state.createTimestamp}` === identifier;
    }
    if ('id' in identifier && identifier.id != null) {
      return state.id === identifier.id;
    }
    if ('createTimestamp' in identifier && identifier.createTimestamp != null) {
      return state.createTimestamp === identifier.createTimestamp;
    }
    return false;
  }

}
