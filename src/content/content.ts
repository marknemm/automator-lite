// Main script that runs in the context of the web page.

import '@webcomponents/custom-elements'; // MUST be first!

import AutoRecord, { type AutoRecordAction, type AutoRecordState, type RecordingType } from '~shared/models/auto-record.js';
import { SparkStore } from '~shared/models/spark-store.js';
import type { Alert } from '~shared/utils/alert.interfaces.js';
import { listenExtension, type ExtensionRequestMessage } from '~shared/utils/extension-messaging.js';
import log from '~shared/utils/logger.js';
import fontStyles from '../shared/styles/fonts.scss?inline';
import { AlertModal } from './components/alert-modal.js';
import './content.scss';
import RecordExecutor from './utils/record-executor.js';
import RecordingContext from './utils/recording-context.js';

/**
 * Initializes the content script.
 *
 * @returns A {@link Promise} that resolves when the initialization is complete.
 */
async function init() {
  // Inject the font styles into the document head - must use chrome extension ID to reference font files.
  // Unlike popup, content scripts cannot directly access the extension's resources.
  const style = document.createElement('style');
  style.textContent = fontStyles.replaceAll('../public/fonts/', `chrome-extension://${chrome.runtime.id}/dist/public/fonts/`);
  document.head.appendChild(style);

  /** Per-frame singleton auto-record executor for scheduling and executing records. */
  const recordExecutor = await RecordExecutor.init();

  /** Per-frame singleton recording context for recording new records. */
  const recordingCtx = await RecordingContext.init();

  /** Per-frame singleton {@link SparkStore} instance for managing {@link AutoRecord} persistence. */
  const autoRecordStore = SparkStore.getInstance(AutoRecord);

  // Listen for messages from popup or background script.
  listenExtension('alert', ({ payload }: ExtensionRequestMessage<Alert>) => {
    return AlertModal.open({ data: payload });
  });

  listenExtension('configureRecord', ({ payload }: ExtensionRequestMessage<AutoRecordState>) => {
    recordingCtx.configureAndSave(payload);
  });

  listenExtension('executeRecord', ({ payload }: ExtensionRequestMessage<AutoRecordState>) => {
    return recordExecutor.execRecord(payload);
  });

  listenExtension('executeRecordAction', ({ payload }: ExtensionRequestMessage<AutoRecordAction>) => {
    return recordExecutor.execAction(payload);
  });

  listenExtension('getHref', () => {
    return window.location.href;
  });

  listenExtension('startRecording', ({ payload }: ExtensionRequestMessage<RecordingType>) => {
    recordingCtx.start(payload);
  });

  listenExtension('stopRecording', () => {
    recordingCtx.stop();
  });

  // Listen for 'records' state changes and unschedule / reschedule records accordingly.
  autoRecordStore.on('save', async (model: AutoRecord) => {
    recordExecutor.unscheduleRecord(model);
    console.log('AutoRecord schedule potential: ', model);
    if (!model.paused && model.frequency) {
      recordExecutor.scheduleRecord(model);
    }
  });

  // On delete, unschedule the record.
  autoRecordStore.on('delete', async (model: AutoRecord) => {
    // Unschedule the deleted record.
    recordExecutor.unscheduleRecord(model);
  });
}

init().then().catch((error) => {
  log.error('Error initializing content script:', error);
});
