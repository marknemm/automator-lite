// This is a shared state management module for the Automator Lite extension.

import { isEqual } from 'lodash-es';
import { isContent } from './extension.js';
import type { State, StateChange } from './state.interfaces.js';
import { bindTopWindow, isTopWindow, requestTopWindow } from './window.js';

/**
 * Retrieves the {@link State} of the current page from Chrome storage.
 * If the {@link State} does not exist, it initializes it with default values.
 *
 * @returns A {@link Promise} that resolves to the {@link State} object.
 */
export async function loadState(): Promise<State> {
  const stateUid = await getStateUid();
  const storage = await chrome.storage.local.get(stateUid) ?? {};

  const state = (storage[stateUid] ?? {}) as State;
  state.addActive ??= false;
  state.records ??= [];

  return state;
}

/**
 * Saves the {@link State} of the current page in `Chrome storage`.
 *
 * @param state - The new {@link State} to merge into the current {@link State}.
 * @returns A {@link Promise} that resolves to the updated {@link State}.
 */
export async function saveState(state: Partial<State>): Promise<State> {
  const stateUid = await getStateUid();

  const currentState = await loadState();
  const newState = { ...currentState, ...state };

  await chrome.storage.local.set({ [stateUid]: newState });
  return newState;
}

/**
 * Listens for changes to the {@link State} in Chrome storage.
 * @param callback - The callback function to execute when the {@link State} changes.
 * @param properties The specific properties to listen for changes on.
 */
export async function onStateChange(callback: (change: StateChange) => void, ...properties: (keyof State)[]): Promise<void> {
  const stateUid = await getStateUid();

  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes[stateUid]) {
      const { oldValue, newValue } = changes[stateUid];

      if (!properties || properties.some((property) => !isEqual(newValue[property], oldValue[property]))) {
        callback({
          oldState: oldValue,
          newState: newValue,
        });
      }
    }
  });
}

if (isContent()) { // Top Window can only generate the UID for all state on the content page.
  bindTopWindow('mnGetStateUid', getStateUid);
}

/**
 * Gets the {@link State} UID associated with the current tab.
 * @returns A {@link Promise} that resolves to the {@link State} UID for the current tab.
 */
async function getStateUid(): Promise<string> {
  return new Promise((resolve) => {
    if (isContent()) {
      isTopWindow() // Top Window can only generate the UID for all state on the content page.
        ? resolve(window.location.hostname + window.location.pathname)
        : resolve(requestTopWindow('mnGetStateUid'));
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url ?? '');
        resolve(url.hostname + url.pathname);
      });
    }
  });
}

export type * from './state.interfaces.js';

