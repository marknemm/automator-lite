// Main script that runs in the context of the web page.

import '@webcomponents/custom-elements'; // MUST be first!

import { type AutoRecordAction, type AutoRecordState, type RecordingType } from '~shared/models/auto-record.js';
import { onMessage, type Message } from '~shared/utils/messaging.js';
import fontStyles from '../shared/styles/fonts.scss?inline';
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
  style.textContent = fontStyles.replaceAll('../fonts/', `chrome-extension://${chrome.runtime.id}/dist/fonts/`);
  document.head.appendChild(style);

  /** Per-frame singleton auto-record executor for scheduling and executing records. */
  const recordExecutor = await RecordExecutor.init();

  /** Per-frame singleton recording context for recording new records. */
  const recordingCtx = await RecordingContext.init();

  // Listen for messages from popup or background script.
  onMessage('configureRecord', async ({ payload }: Message<AutoRecordState>) =>
    recordingCtx.configureAndSave(payload));

  onMessage('executeRecord', ({ payload }: Message<AutoRecordState>) =>
    recordExecutor.execRecord(payload));

  onMessage('executeRecordAction', ({ payload }: Message<AutoRecordAction>) =>
    recordExecutor.execAction(payload));

  onMessage('startRecording', ({ payload }: Message<RecordingType>) =>
    recordingCtx.start(payload));

  onMessage('stopRecording', () =>
    recordingCtx.stop());
}

init().then().catch((error) => {
  console.error('Error initializing content script:', error);
});
