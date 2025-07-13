// This script runs in the context of the web page.

import '@webcomponents/custom-elements';

import type { Nullish } from 'utility-types';
import { AutoRecord, type AutoRecordMouseAction } from '~shared/models/auto-record.js';
import { type MountContext } from '~shared/utils/mount.js';
import { AutoRecordConfigModal } from './components/auto-record-config-modal.js';
import { RecordingInfoPanel } from './components/recording-info-panel.js';
import { initExecutor } from './utils/auto-record-executor.js';
import { deriveElementSelector } from './utils/element-analysis.js';

import './content.scss';
import fontStyles from '../shared/styles/fonts.scss?inline';

/**
 * This is the {@link HTMLElement} that will be highlighted when the user hovers over.
 * If the user clicks on it, it will have a {@link AutoRecord} created for it.
 */
let addTargetElem: HTMLElement | Nullish;

/**
 * The mount context for the {@link RecordingInfoPanel}.
 * This is used to control the panel's lifecycle and interactions.
 *
 * Also tracks the active recording state.
 * If the panel is mounted, it indicates that a recording is active.
 * If {@link Nullish}, the panel is not currently mounted, and no recording is active.
 */
let recordingCtx: MountContext | Nullish;

/**
 * Initializes the content script.
 *
 * @returns A {@link Promise} that resolves when the initialization is complete.
 */
async function init() {
  // Inject the font styles into the document head.
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      ${fontStyles.replaceAll('../fonts/', `chrome-extension://${chrome.runtime.id}/dist/fonts/`)}
    </style>
  `);

  await initExecutor();

  // Bind event listeners to the document for adding a new record.
  document.addEventListener('mouseover', async (event) => await setTargetHighlight(event.target as HTMLElement));
  document.addEventListener('mouseout', () => unsetTargetHighlight());
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Escape') {
      stopRecording();
    }
  });

  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'mnAddRecord') {
      await configAndSaveRecord(new AutoRecord(event.data.payload));
    }
  });

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'startRecording') {
      startRecording();
    }

    if (message.type === 'stopRecording') {
      stopRecording();
    }

    if (message.type === 'configureRecord' && window.top === window) {
      await configAndSaveRecord(new AutoRecord(message.payload));
    }
  });
}

/**
 * Saves the given {@link AutoRecord} by opening the configuration modal.
 *
 * @param record - The {@link AutoRecord} to save.
 * @returns A {@link Promise} that resolves when the record is saved.
 */
async function configAndSaveRecord(record: AutoRecord): Promise<void> {
  return (
    await AutoRecordConfigModal.open({
      mountPoint: document.body,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      data: record,
    }).onModalClose
  )?.save();
}

/**
 * Sets the target element for adding a click target.
 * Highlights the target element and stores it for later use.
 *
 * @param target - The target {@link HTMLElement} to set as the add target.
 * @returns A {@link Promise} that resolves when the target element is set.
 */
function setTargetHighlight(target: HTMLElement): void {
  if (!recordingCtx || !target?.classList) return;
  unsetTargetHighlight(); // Unset the previous target element if it exists.

  target.classList.add('mn-highlight');
  target.addEventListener('click', addClickTarget);
  addTargetElem = target;
}

/**
 * Unsets the currently highlighted target element.
 */
function unsetTargetHighlight() {
  if (addTargetElem) {
    addTargetElem.removeEventListener('click', addClickTarget);
    addTargetElem.classList.remove('mn-highlight');
    addTargetElem = null;
  }
}

/**
 * Starts the recording by mounting the {@link RecordingInfoPanel}.
 * If the panel is already mounted, it will not remount it.
 */
function startRecording() {
  if (!recordingCtx) {
    recordingCtx = RecordingInfoPanel.mount();
    if (!document.activeElement) {
      document.body.focus(); // Ensure the body is focused to capture key events.
    }
  }
}

/**
 * Deactivates the add functionality.
 * Unsets the current target element and resets the addActive state.
 */
function stopRecording() {
  unsetTargetHighlight();
  recordingCtx?.unmount();
  recordingCtx = null;
}

/**
 * Adds a click target to the state.
 *
 * @param event - The {@link MouseEvent} that triggered the function.
 * @returns A {@link Promise} that resolves when the click target is added.
 */
async function addClickTarget(event: MouseEvent): Promise<void> {
  const target = event?.target as HTMLElement;
  if (!recordingCtx || !target?.id && !target?.className) return;

  event.preventDefault();
  stopRecording();

  const [selector] = deriveElementSelector(target);
  const clickAction = {
    type: 'Mouse',
    mode: 'click',
    selector,
    textContent: target.textContent?.trim() || target.title.trim(),
  } as AutoRecordMouseAction;

  window.top?.postMessage({
    type: 'mnAddRecord',
    payload: new AutoRecord({ actions: [clickAction] }).state(),
  });
}

init().then().catch((error) => {
  console.error('Error initializing content script:', error);
});
