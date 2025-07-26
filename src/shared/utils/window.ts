import type { Nullish } from 'utility-types';

/**
 * Gets the topmost {@link Window} with the same origin of the current browsing context.
 *
 * @param win The {@link Window} to start from. Defaults to the current {@link window}.
 * @return The topmost {@link Window} with the same origin as the given {@link Window}.
 */
export function getTopmostWindow(win: Window | Nullish = getWindow()): Window | Nullish {
  if (isSameOrigin(getWindow()?.top)) { // If the top window is the same origin, return it.
    return window.top!;
  }

  // Traverse up the parent chain until we find the topmost window with the same origin.
  let parentWin: Window | null = getParentWindow(win);
  while (parentWin) {
    win = parentWin;
    parentWin = getParentWindow(win);
  }

  return win;
}

/**
 * Get the parent {@link Window} of a given {@link Window}.
 * @param win The {@link Window} to get the parent of. Defaults to the current {@link window}.
 * @returns The parent {@link Window} if it exists and is the same origin, otherwise `null`.
 */
export function getParentWindow(win: Window | Nullish = getWindow()): Window | null {
  return win && isSameOrigin(win.parent) && win.parent !== win
    ? win.parent
    : null;
}

/**
 * Gets the current {@link window} object if it is defined.
 * This is a safe way to access the {@link window} object,
 * as it checks if the {@link window} object is defined before accessing it.
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
export function isSameOrigin(frame: Window | HTMLIFrameElement | Nullish): boolean {
  try {
    return !!(frame instanceof HTMLIFrameElement ? frame.contentDocument : frame?.document);
  } catch {
    return false;
  }
}

/**
 * Checks if the given {@link location} has the same pathname as a given {@link frame}.
 * 
 * @param location The {@link Location} or pathname to check.
 * @param frame The {@link Window} or {@link HTMLIFrameElement} to check against.
 * @returns `true` if the pathnames match, otherwise `false`.
 */
export function isSamePathname(
  location: Location | string | Nullish,
  frame: Window | HTMLIFrameElement | Nullish = getWindow(),
): boolean {
  // If window is not defined (background script or service worker), return false.
  if (typeof window === 'undefined' || !frame || !location) return false;

  const framePathname = (frame instanceof HTMLIFrameElement)
    ? frame.contentWindow?.location.pathname
    : frame.location.pathname;

  const pathname = (typeof location === 'string')
    ? location
    : location.pathname;

  return !!framePathname && framePathname === pathname;
}

/**
 * Binds a listener for messages sent to the top window.
 *
 * @param type The type of message to listen for.
 * @param callback The callback to invoke when a message is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @returns A function to unbind the listener.
 */
export function bindTopWindow<T>(
  type: string,
  callback: (event: MessageEvent<{ type: string; payload: any }>) => Promise<T> | T
): () => void {
  if (!isTopWindow()) return () => {}; // Only listen if this is the top window.
  return bindWindow(type, callback, getWindow()?.top);
}

/**
 * Binds a listener for messages sent to a specific {@link Window}.
 *
 * @param type The type of message to bind to.
 * @param callback The callback to invoke when a message of the given type is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @param win The {@link Window} to bind the listener to. Defaults to the current {@link window}.
 * @returns A function to unbind the listener.
 */
export function bindWindow(
  type: string,
  callback: (event: MessageEvent<{ type: string; payload: any }>) => void,
  win: Window | Nullish = getWindow()
): () => void {
  if (!win) return () => {}; // If win is explicitly null, do nothing.

  // Create a listener that will invoke the callback and respond with any result from the callback.
  const requestListener = async (event: MessageEvent<{ type: string; payload: any; }>) => {
    if (event.data.type === type) {
      const result = await callback(event);
      event.source?.postMessage({
        type: `${type}_response`,
        payload: result,
      }, { targetOrigin: '*' });
    }
  };

  // Bind the request listener and return the unbind function.
  win.addEventListener('message', requestListener);
  return () => win.removeEventListener('message', requestListener);
}

/**
 * Sends a request message to the top {@link Window} and returns a promise that resolves to the response data.
 *
 * @param type The type of the message to request.
 * @param payload The payload to send with the request.
 * @returns A {@link Promise} that resolves with the response payload.
 */
export async function requestTopWindow<T>(
  type: string,
  payload?: any,
): Promise<T> {
  return requestWindow<T>(type, payload, getWindow()?.top) as Promise<T>;
}

/**
 * Sends a request message to a specific {@link Window} and returns a promise that resolves to the response data.
 *
 * @param type The type of the message to request.
 * @param payload The payload to send with the request.
 * @param win The {@link Window} to send the request to. Defaults to the current {@link window}.
 * @param targetOrigin The origin of windows to send the request to. Defaults to `'*'` for all origins.
 * @returns A {@link Promise} that resolves with the response payload.
 */
export async function requestWindow<T>(
  type: string,
  payload?: any,
  win: Window | Nullish = getWindow(),
  targetOrigin = '*'
): Promise<T | undefined> {
  if (!win) return Promise.resolve(undefined); // If win is explicitly null, return undefined.

  const result = (await requestWindows<T>(type, payload, [win], targetOrigin))[0];
  if (result.error) throw result.error;

  return result.result;
}

/**
 * Sends a request message to specific {@link Window}(s) and returns a promise that resolves to the response data.
 *
 * @param type The type of the message to request.
 * @param payload The payload to send with the request.
 * @param windows The {@link Window}(s) to send the request to.
 * If no windows are provided, it defaults to the current document's iframes.
 * @param targetOrigin The origin to send the request to. Defaults to `'*'` for all origins.
 * @returns A {@link Promise} that resolves with the response payload from each {@link Window}.
 */
export async function requestWindows<T>(
  type: string,
  payload?: any,
  windows: Window[] = [],
  targetOrigin = '*',
): Promise<{ result?: T, error?: Error }[]> {
  // If no windows are provided, use the current document's iframes.
  if (windows.length === 0) {
    windows = Array.from(document.querySelectorAll('iframe'))
      .filter((iframe) => !!iframe.contentWindow)
      .map((iframe) => iframe.contentWindow!);
  }
  const results: Promise<{ result?: T, error?: Error }>[] = [];

  for (const win of windows) {
    results.push(new Promise((resolve) => {
      // Setup listener for the response.
      const responseListener = (event: MessageEvent<{ type: string; payload: T, error?: Error }>) => {
        if (event.data.type === `${type}_response`) {
          // Remove the listener once we receive the response.
          window.removeEventListener('message', responseListener);

          // Resolve with the payload or error.
          (!event.data.error)
            ? resolve({ result: event.data.payload })
            : resolve({ error: event.data.error });
        }
      };

      // Bind the response listener to the window.
      window.addEventListener('message', responseListener, { passive: true });
    }));

    // Send the request message to the window.
    win.postMessage({ type, payload }, targetOrigin);
  }

  return Promise.all(results);
}
