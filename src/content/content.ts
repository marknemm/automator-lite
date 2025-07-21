// This script runs in the context of the web page.

import '@webcomponents/custom-elements';

import type { Nullish } from 'utility-types';
import { AutoRecord, AutoRecordAction, AutoRecordState } from '~shared/models/auto-record.js';
import { type Message, onMessage } from '~shared/utils/messaging.js';
import { AutoRecordConfigModal } from './components/auto-record-config-modal.js';
import { initExecutor } from './utils/auto-record-executor.js';
import { RecordingContext } from './utils/recording-context.js';

import fontStyles from '../shared/styles/fonts.scss?inline';
import './content.scss';

/**
 * The mount context for the {@link RecordingInfoPanel}.
 * This is used to control the panel's lifecycle and interactions.
 * Will only be initialized for the top-level window to avoid duplicate mounts in iframes.
 */
const recordingCtx = new RecordingContext(configAndSaveRecord);

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

  await initExecutor(); // Initialize the auto-record executor to handle existing records.

  // Listen for messages from popup or background script.
  onMessage('startRecording', () => recordingCtx.start());
  onMessage('stopRecording', () => recordingCtx.stop());
  onMessage('configureRecord', (message: Message<AutoRecordState>) => configAndSaveRecord(message.payload));
}

/**
 * Saves the given {@link AutoRecord} by opening the configuration modal.
 *
 * @param record - The {@link AutoRecord} to save.
 * @returns A {@link Promise} that resolves when the record is saved.
 */
async function configAndSaveRecord(
  recordState: AutoRecord | AutoRecordState | AutoRecordAction[] | Nullish
): Promise<AutoRecord | undefined> {
  const record = (recordState instanceof AutoRecord)
    ? recordState
    : new AutoRecord(recordState ?? []);

  return (
    await AutoRecordConfigModal.open({
      mountPoint: document.body,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      data: record as AutoRecord,
    }).onModalClose
  )?.save();
}

init().then().catch((error) => {
  console.error('Error initializing content script:', error);
});
