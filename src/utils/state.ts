// This is a shared state management module for the MN Auto Click extension.

import { isEqual } from 'lodash-es';
import type { State, StateChange } from './state.interfaces.js';

/**
 * Retrieves the {@link State} of the current page from Chrome storage.
 * If the {@link State} does not exist, it initializes it with default values.
 *
 * @returns A {@link Promise} that resolves to the {@link State} object.
 */
export async function loadState(): Promise<State> {
  const stateUid = await getStateUid();
  const storage = await chrome.storage.local.get(stateUid) ?? {};
  console.log(stateUid);

  const state = (storage[stateUid] ?? {}) as State;
  state.addActive = state.addActive ?? false;
  state.records = state.records ?? [];

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
 * @param property The specific property to listen for changes on.
 */
export async function onStateChange(callback: (change: StateChange) => void, property?: keyof State): Promise<void> {
  const stateUid = await getStateUid();

  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes[stateUid]) {
      const { oldValue, newValue } = changes[stateUid];

      if (!property || !isEqual(newValue[property], oldValue[property])) {
        callback({
          oldState: oldValue,
          newState: newValue,
        });
      }
    }
  });
}

/**
 * Gets the {@link State} UID associated with the current tab.
 * @returns A {@link Promise} that resolves to the {@link State} UID for the current tab.
 */
async function getStateUid(): Promise<string> {
  return new Promise((resolve) => {
    const topWindow = window.top ?? window;
    (chrome.tabs) // Is script running in extension popup or content ctx.
      ? chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const url = new URL(tabs[0].url ?? '');
          resolve(url.hostname + url.pathname);
        })
      : resolve(topWindow.location.hostname + topWindow.location.pathname);
  });
}

export type * from './state.interfaces.js';
