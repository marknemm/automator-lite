// This script runs in the context of the web page.

import '@webcomponents/custom-elements';

import type { Nullish } from 'utility-types';
import { AutoRecord, AutoRecordMouseAction, AutoRecordType } from '~shared/models/auto-record.js';
import { AutoRecordConfigModal } from './components/auto-record-config-modal.js';
import { initExecutor } from './utils/auto-record-executor.js';
import { deriveElementSelector } from './utils/element-analysis.js';

import './content.scss';

/**
 * The active {@link AutoRecordType}.
 * If {@link Nullish}, no action is currently being added.
 */
let addAction: AutoRecordType | Nullish;

/**
 * This is the {@link HTMLElement} that will be highlighted when the user hovers over.
 * If the user clicks on it, it will have a {@link AutoRecord} created for it.
 */
let addTargetElem: HTMLElement | Nullish;

/**
 * Initializes the content script.
 *
 * @returns A {@link Promise} that resolves when the initialization is complete.
 */
async function init() {
  await initExecutor();

  // Bind event listeners to the document for adding a new record.
  document.addEventListener('mouseover', async (event) => await setAddTargetElem(event.target as HTMLElement));
  document.addEventListener('mouseout', () => unsetAddTargetElem());
  document.addEventListener('keypress', (event) => {
    console.log('Key pressed:', event.key);
    if (event.key === 'Escape') {
      deactivateAdd();
    }
  });

  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'mnAddRecord') {
      await configAndSaveRecord(new AutoRecord(event.data.payload));
    }
  });

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'addAction') {
      addAction = message.payload;
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
function setAddTargetElem(target: HTMLElement): void {
  if (addAction !== 'Recording' || !target?.classList) return;
  unsetAddTargetElem(); // Unset the previous target element if it exists.

  target.classList.add('mn-highlight');
  target.addEventListener('click', addClickTarget);
  addTargetElem = target;
}

/**
 * Unsets the currently highlighted target element.
 */
function unsetAddTargetElem() {
  if (addTargetElem) {
    addTargetElem.removeEventListener('click', addClickTarget);
    addTargetElem.classList.remove('mn-highlight');
    addTargetElem = null;
  }
}

/**
 * Deactivates the add functionality.
 * Unsets the current target element and resets the addActive state.
 */
function deactivateAdd() {
  unsetAddTargetElem();
  addAction = null;
}

/**
 * Adds a click target to the state.
 *
 * @param event - The {@link MouseEvent} that triggered the function.
 * @returns A {@link Promise} that resolves when the click target is added.
 */
async function addClickTarget(event: MouseEvent): Promise<void> {
  const target = event?.target as HTMLElement;
  if (!addAction || !target?.id && !target?.className) return;

  event.preventDefault();
  deactivateAdd();

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
