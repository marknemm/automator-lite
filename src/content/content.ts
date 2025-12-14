// Main script that runs in the context of the web page.

import '@webcomponents/custom-elements'; // MUST be first!

import { type AutoRecordAction, type AutoRecordState, type RecordingType } from '~shared/models/auto-record.js';
import type { Alert } from '~shared/utils/alert.interfaces.js';
import { listenExtension, type ExtensionRequestMessage } from '~shared/utils/extension-messaging.js';
import log from '~shared/utils/logger.js';
import fontStyles from '../shared/styles/fonts.scss?inline'; // Cannot use '~' alias for CSS imports.
import { AlertModal } from '../shared/components/alert-modal.js';
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

  listenExtension('pauseRecord', ({ payload }: ExtensionRequestMessage<AutoRecordState>) => {
    return recordExecutor.unscheduleRecord(payload);
  });

  listenExtension('playRecord', async ({ payload }: ExtensionRequestMessage<AutoRecordState>) => {
    await recordExecutor.scheduleRecord(payload);
  });

  listenExtension('startRecording', ({ payload }: ExtensionRequestMessage<RecordingType>) => {
    recordingCtx.start(payload);
  });

  listenExtension('stopRecording', () => {
    recordingCtx.stop();
  });
}

init().then().catch((error) => {
  log.error('Error initializing content script:', error);
});
