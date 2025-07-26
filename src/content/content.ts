// Main script that runs in the context of the web page.

import '@webcomponents/custom-elements';

import { AutoRecord, type AutoRecordAction, type AutoRecordState } from '~shared/models/auto-record.js';
import { onMessage, type Message } from '~shared/utils/messaging.js';
import AutoRecordExecutor from './utils/auto-record-executor.js';
import RecordingContext from './utils/recording-context.js';

import fontStyles from '../shared/styles/fonts.scss?inline';
import './content.scss';

/**
 * Initializes the content script.
 *
 * @returns A {@link Promise} that resolves when the initialization is complete.
 */
async function init() {
  // Inject the font styles into the document head - must use chrome extension ID to reference font files.
  // Unlike popup, content scripts cannot directly access the extension's resources.
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      ${fontStyles.replaceAll('../fonts/', `chrome-extension://${chrome.runtime.id}/dist/fonts/`)}
    </style>
  `);

  /** Per-frame singleton auto-record executor for scheduling and executing records. */
  const recordExecutor = await AutoRecordExecutor.init();

  /** Per-frame singleton recording context for recording new records. */
  const recordingCtx = RecordingContext.init();

  // Listen for messages from popup or background script.
  onMessage('configureRecord', (message: Message<AutoRecordState>) => AutoRecord.configure(message.payload));
  onMessage('executeRecord', (message: Message<AutoRecordState>) => recordExecutor.execRecord(message.payload));
  onMessage('executeRecordAction', (message: Message<AutoRecordAction>) => recordExecutor.execAction(message.payload));
  onMessage('startRecording', () => recordingCtx.start());
  onMessage('stopRecording', () => recordingCtx.stop());
}

init().then().catch((error) => {
  console.error('Error initializing content script:', error);
});
