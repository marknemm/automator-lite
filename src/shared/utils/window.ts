import type { Nullish } from 'utility-types';
import type { Frame, FrameLocation } from './window.interfaces.js';

/**
 * Gets the topmost {@link Window} with the same origin of the current browsing context.
 *
 * @param win The {@link Window} to start from. Defaults to the current {@link window}.
 * @return The topmost {@link Window} with the same origin as the given {@link Window}.
 * If no such window exists, `undefined` is returned.
 */
export function getTopmostWindow(win: Window | Nullish = getWindow()): Window | undefined {
  if (isSameOrigin(getWindow()?.top)) { // If the top window is the same origin, return it.
    return window.top!;
  }

  // Traverse up the parent chain until we find the topmost window with the same origin.
  let parentWin: Window | undefined = getParentWindow(win);
  while (parentWin) {
    win = parentWin;
    parentWin = getParentWindow(win);
  }

  return win ?? undefined;
}

/**
 * Get the parent {@link Window} of a given {@link Window}.
 *
 * @param win The {@link Window} to get the parent of. Defaults to the current {@link window}.
 * @returns The parent {@link Window} if it exists and is the same origin, otherwise `undefined`.
 */
export function getParentWindow(win: Window | Nullish = getWindow()): Window | undefined {
  return win && isSameOrigin(win.parent) && win.parent !== win
    ? win.parent
    : undefined;
}

/**
 * Gets the current {@link window} object if it is defined.
 * This is a safe way to access the {@link window} object,
 * as it checks if the {@link window} object is defined before accessing it.
 *
 * `Note:` The {@link window} object will not be defined in background scripts or service workers.
 *
 * @returns The current {@link window} object if it is defined, otherwise `undefined`.
 */
export function getWindow(): Window | undefined {
  return isWindowDefined() ? window : undefined;
}

/**
 * Checks if the {@link window} object is defined.
 * The {@link window} object will not be defined in background scripts or service workers.
 *
 * @returns `true` if the {@link window} object is defined, otherwise `false`.
 */
export function isWindowDefined(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Checks if the given {@link Window} is the top window for the entire page.
 * @param win The {@link Window} to check. Defaults to the current {@link window}.
 * @returns `true` if the given {@link Window} is the top window, otherwise `false`.
 */
export function isTopWindow(win: Window | Nullish = getWindow()): boolean {
  return !!win && win === window.top;
}

/**
 * Check if the given {@link frame} is the same origin as the current {@link Window}.
 * @param frame The {@link Window} or {@link HTMLIFrameElement} to check.
 * @returns `true` if the {@link frame} is the same origin, otherwise `false`.
 */
export function isSameOrigin(frame: Frame | Nullish): boolean {
  try {
    return !!(
      isFrameElement(frame)
        ? frame.contentDocument
        : frame?.document
    );
  } catch {
    return false;
  }
}

/**
 * Checks if the given {@link compare} has the same base URL as a given {@link baseline}.
 * The base URL consists of the host and pathname of the URL.
 *
 * @param compare The {@link Frame} or {@link FrameLocation} to compare.
 * @param baseline The {@link Frame} or {@link FrameLocation} baseline to compare against.
 * Defaults to the current {@link window}.
 * @returns `true` if the base URLs match, otherwise `false`.
 * If either parameter is {@link Nullish} or empty, `false` is returned.
 */
export function isSameBaseUrl(
  compare: Frame | FrameLocation | Nullish,
  baseline: Frame | FrameLocation | Nullish = getWindow(),
): boolean {
  if (!compare || !baseline) return false;

  const comparePathname = getBaseURL(compare);
  const baselinePathname = getBaseURL(baseline);

  return !!baselinePathname
      && comparePathname === baselinePathname;
}

export function startsWithBaseUrl(
  compare: Frame | FrameLocation | Nullish,
  baseline: Frame | FrameLocation | Nullish = getWindow(),
): boolean {
  if (!compare || !baseline) return false;

  const comparePathname = getBaseURL(compare);
  const baselinePathname = getBaseURL(baseline);

  return !!baselinePathname
      && comparePathname.startsWith(baselinePathname);
}

/**
 * Gets the base URL of a given {@link frame}, which consists of the host and pathname.
 *
 * @param frame The {@link Frame} or {@link FrameLocation} to get the base URL of.
 * Defaults to the current {@link window}.
 * @returns The base URL of the given {@link frame}.
 * If the {@link frame} is not defined or its pathname is inaccessible, `''` is returned.
 */
export function getBaseURL(
  frame: Frame | FrameLocation | Nullish = getWindow()
): string {
  try {
    // Add protocol if missing.
    if (typeof frame === 'string' && !/^http.*/.test(frame)) {
      frame = `https://${frame}`;
    }

    const url: URL | Location | Nullish = isWindowInstance(frame)
      ? new URL(frame.location.href)
      : isFrameElement(frame)
        ? new URL(frame.contentWindow?.location.href ?? '')
        : typeof frame === 'string'
          ? new URL(frame)
          : frame;

    return url
      ? url.host + url.pathname
      : '';
  } catch (error) { console.error('Error getting base URL:', error); return ''; }
}

/**
 * Checks if the given object is an instance of the HTMLIFrameElement class.
 *
 * @param frame The object to check.
 * @returns `true` if the object is an instance of the HTMLIFrameElement class, otherwise `false`.
 */
export function isFrameElement(frame: any): frame is HTMLIFrameElement {
  return isWindowDefined()
      && frame instanceof HTMLIFrameElement;
}

/**
 * Checks if the given object is an instance of the Window class.
 *
 * @param win The object to check.
 * @returns `true` if the object is an instance of the Window class, otherwise `false`.
 */
export function isWindowInstance(win: any): win is Window {
  return isWindowDefined()
      && win instanceof Window;
}

export type * from './window.interfaces.js';
