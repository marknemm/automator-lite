import { ExtensionContext } from './extension.interfaces.js';
import { isWindowDefined } from './window.js';

/**
 * Gets the current {@link ExtensionContext} that this script is running in.
 * 
 * @returns The current {@link ExtensionContext} of this script.
 */
export function getExtensionContext(): ExtensionContext {
  if (isBackground()) return 'background';
  if (isContent())    return 'content';
  if (isOptions())    return 'options';
  if (isPopup())      return 'popup';
  throw new Error('Cannot determine extension context');
}

/**
 * Checks if this script is running in the context of the Chrome extension background page.
 * 
 * @returns `true` if running in the background context, otherwise `false`.
 */
export function isBackground(): boolean {
  return chrome.tabs && typeof self !== 'undefined' && (self as any).registration;
}

/**
 * Checks if this script is running in the context of a content script.
 * 
 * @returns `true` if running in the content script context, otherwise `false`.
 */
export function isContent(): boolean {
  return !chrome.tabs;
}

/**
 * Checks if this script is running in the context of the Chrome extension options page.
 * 
 * @returns `true` if running in the options context, otherwise `false`.
 */
export function isOptions(): boolean {
  return chrome.tabs && isWindowDefined() && window.location.href.includes('options.html');
}

/**
 * Checks if this script is running in the context of the Chrome extension popup.
 * 
 * @returns `true` if running in the popup context, otherwise `false`.
 */
export function isPopup(): boolean {
  return chrome.tabs && isWindowDefined() && window.location.href.includes('popup.html');
}

/**
 * Queries the current active {@link chrome.tabs.Tab Tab}.
 * 
 * `Note`: This function will alway return `undefined` if called from a content script,
 * as content scripts do not have access to the `chrome.tabs` API.
 * 
 * @returns The current active {@link chrome.tabs.Tab Tab} or `undefined` if not found.
 */
export async function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return (await queryTabs({ active: true, currentWindow: true }))[0];
}

/**
 * Queries all {@link chrome.tabs.Tab Tab}s matching the given {@link queryInfo}.
 * 
 * `Note`: This function will alway return `[]` if called from a content script,
 * as content scripts do not have access to the `chrome.tabs` API.
 * 
 * @param queryInfo The {@link chrome.tabs.QueryInfo QueryInfo} for the {@link chrome.tabs.Tab Tab}s.
 * @returns An array of matching {@link chrome.tabs.Tab Tab}s or `[]` if none found.
 */
export async function queryTabs(
  queryInfo: chrome.tabs.QueryInfo
): Promise<chrome.tabs.Tab[]> {
  if (isContent()) return Promise.resolve([]); // Not available in content scripts.

  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
}
