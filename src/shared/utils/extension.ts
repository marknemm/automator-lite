import type { ExtensionContext, GetAllFrameDetails, GetAllFrameResultDetails, Tab, TabsQueryInfo } from './extension.interfaces.js';
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
 * Queries the current active {@link Tab}.
 *
 * `Note`: This function will alway return `undefined` if called from a content script,
 * as content scripts do not have access to the `chrome.tabs` API.
 *
 * @returns The current active {@link Tab} or `undefined` if not found.
 * @throws {Error} If the {@link chrome.tabs} API is not available due to missing `"tabs"` or `"activeTab"` permissions in `manifest.json`.
 */
export async function queryActiveTab(): Promise<Tab | undefined> {
  return (await queryTabs({ active: true, currentWindow: true }))[0];
}

/**
 * Queries all {@link Tab}s matching the given {@link queryInfo}.
 *
 * `Note`: This function will alway return `[]` if called from a content script,
 * as content scripts do not have access to the {@link chrome.tabs} API.
 *
 * @param queryInfo The {@link TabsQueryInfo} for querying the {@link Tab} objects.
 * @returns An array of matching {@link Tab} objects or `[]` if none found.
 * @throws {Error} If the {@link chrome.tabs} API is not available due to missing `"tabs"` or `"activeTab"` permissions in `manifest.json`.
 */
export async function queryTabs(
  queryInfo: TabsQueryInfo
): Promise<Tab[]> {
  const { filter, ...origQueryInfo } = queryInfo;
  if (isContent()) return Promise.resolve([]); // Not available in content scripts.

  if (!chrome.tabs)
    throw new Error('chrome.tabs API is not available; must add `"permissions": ["tabs"]` or `"permissions": ["activeTab"]` to manifest.json');

  return new Promise((resolve) => {
    chrome.tabs.query(
      origQueryInfo,
      tabs => resolve(
        (tabs && filter)
          ? tabs.filter(filter)
          : tabs ?? []
      )
    );
  });
}

/**
 * Queries content frames based off of a given set of {@link getAllFrameDetails}.
 *
 * `Note`: This function will alway return `[]` if called from a content script,
 * as content scripts do not have access to the {@link chrome.webNavigation} API.
 *
 * @param getAllFrameDetails The {@link GetAllFrameDetails} for the frames to query.
 * @returns An array of all queried {@link GetAllFrameResultDetails}.
 * @throws {Error} If the {@link chrome.webNavigation} API is not available due to missing `"webNavigation"` permissions in `manifest.json`.
 */
export async function getAllFrames(
  getAllFrameDetails: GetAllFrameDetails,
): Promise<GetAllFrameResultDetails[]> {
  const { filter, ...origGetAllFrameDetails } = getAllFrameDetails;
  if (isContent()) return Promise.resolve([]); // Not available in content scripts.

  if (!chrome.webNavigation)
    throw new Error('chrome.webNavigation API is not available; must add `"permissions": ["webNavigation"]` to manifest.json');

  return new Promise(resolve =>
    chrome.webNavigation.getAllFrames(
      origGetAllFrameDetails,
      frames => resolve(
        (frames && filter)
          ? frames.filter(filter)
          : frames ?? []
      )
    )
  );
}

export type * from './extension.interfaces.js';
