import AutoRecord, { type AutoRecordState, type MouseAction } from '~shared/models/auto-record.js';
import { SparkStore } from '~shared/models/spark-store.js';
import { isTopWindow } from '~shared/utils/window.js';

export async function resetToTestEntry(): Promise<void> {
  if (isTopWindow()) {
    await clearRecords();

    const testRecord = genTestRecord();
    await testRecord.save();
  }
}

export async function clearRecords(): Promise<void> {
  if (isTopWindow()) {
    const autoRecordStore = SparkStore.getInstance(AutoRecord);
    const recs = await autoRecordStore.loadMany();
    for (const record of recs) {
      await record.delete();
    }
  }
}

export async function loadRecords(): Promise<AutoRecord[]> {
  if (isTopWindow()) {
    const autoRecordStore = SparkStore.getInstance(AutoRecord);
    return autoRecordStore.loadMany();
  }
  return [];
}

export function genTestRecord(state: Partial<AutoRecordState> = {}): AutoRecord {
  const autoRecordStore = SparkStore.getInstance(AutoRecord);

  const testRecord = autoRecordStore.newModel({
    name: 'Test Record',
    autoRun: true,
    frequency: 5000,
    actions: [
      {
        actionType: 'Mouse',
        eventType: 'click',
        frameHref: 'https://www.google.com/',
        tabHref: 'https://www.google.com/',
        timestamp: Date.now(),
      } as MouseAction,
    ],
    ...state,
  });

  return testRecord;
}
