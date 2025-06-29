// This script runs in the context of the web page.

import type { Nullish } from 'utility-types';
import { AutoRecord } from '~shared/models/auto-record';
import { initExecutor } from './utils/auto-record-executor';
import { deriveElementSelector } from './utils/element-analysis';
import { openRecordConfigModal } from './components/auto-record-config-modal';

import './content.scss';

/**
 * Whether the add functionality is active.
 */
let addActive = false;

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

  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'mnAddRecord') {
      const record = await openRecordConfigModal(new AutoRecord(event.data?.payload)).onModalClose;
      await record?.save();
    }
  });

  chrome.runtime.onMessage.addListener(async (message) => {
    addActive = (message.type === 'addActive') && message.payload;

    if (message.type === 'configureRecord' && window.top === window) {
      const record = await openRecordConfigModal(new AutoRecord(message.payload)).onModalClose;
      await record?.save();
    }
  });
}

/**
 * Sets the target element for adding a click target.
 * Highlights the target element and stores it for later use.
 *
 * @param target - The target {@link HTMLElement} to set as the add target.
 * @returns A {@link Promise} that resolves when the target element is set.
 */
function setAddTargetElem(target: HTMLElement): void {
  if (!addActive || !target?.classList) return;
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
 * Adds a click target to the state.
 *
 * @param event - The {@link MouseEvent} that triggered the function.
 * @returns A {@link Promise} that resolves when the click target is added.
 */
async function addClickTarget(event: MouseEvent): Promise<void> {
  const target = event?.target as HTMLElement;
  if (!addActive || !target?.id && !target?.className) return;

  event.preventDefault();
  unsetAddTargetElem();
  addActive = false;

  const [selector, queryIdx] = deriveElementSelector(target);
  window.top?.postMessage({
    type: 'mnAddRecord',
    payload: AutoRecord.create(selector, queryIdx).recordState,
  });
}

init().then().catch((error) => {
  console.error('Error initializing content script:', error);
});
