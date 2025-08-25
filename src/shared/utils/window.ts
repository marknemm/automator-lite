import type { Nullish } from 'utility-types';
import { isContent } from './extension.js';
import type { WindowMessage, WindowResponse } from './window.interfaces.js';

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
 * @param route The type of message to listen for.
 * @param callback The callback to invoke when a message is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @returns A function to unbind the listener.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenTopWindow<Req = unknown, Resp = void>(
  route: string,
  callback: (event: WindowMessage<Req>) => Promise<Resp> | Resp
): () => void {
  if (!isTopWindow()) return () => {}; // Only listen if this is the top window.
  return listenWindow(route, callback, getWindow()?.top);
}

/**
 * Binds a listener for messages sent to a specific {@link Window}.
 *
 * @param route The type of message to bind to.
 * @param callback The callback to invoke when a message of the given type is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @param win The {@link Window} to bind the listener to. Defaults to the current {@link window}.
 * @returns A function to unbind the listener.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenWindow<Req = unknown, Resp = void>(
  route: string,
  callback: (event: WindowMessage<Req>) => Promise<Resp> | Resp,
  win: Window | Nullish = getWindow()
): () => void {
  if (!win) return () => {}; // If win is explicitly null, do nothing.

  // Create a listener that will invoke the callback and respond with any result from the callback.
  const requestListener = async (event: WindowMessage<Req>) => {
    if (event.data.route === route) {
      const result = await callback(event);
      event.source?.postMessage({
        route: `${route}_response`,
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
 * @param route The type of the message to request.
 * @param payload The payload to send with the request.
 * @returns A {@link Promise} that resolves with the response payload.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function requestTopWindow<Req = unknown, Resp = void>(
  route: string,
  payload?: Req,
): Promise<Resp> {
  return requestWindow<Req, Resp>(route, payload, getWindow()?.top) as Promise<Resp>;
}

/**
 * Sends a request message to a specific {@link Window} and returns a promise that resolves to the response data.
 *
 * @param route The type of the message to request.
 * @param payload The payload to send with the request.
 * @param win The {@link Window} to send the request to. Defaults to the current {@link window}.
 * @param targetOrigin The origin of windows to send the request to. Defaults to `'*'` for all origins.
 * @returns A {@link Promise} that resolves with the response payload.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function requestWindow<Req = unknown, Resp = void>(
  route: string,
  payload?: Req,
  win: Window | Nullish = getWindow(),
  targetOrigin = '*'
): Promise<Resp | undefined> {
  if (!win) return Promise.resolve(undefined); // If win is explicitly null, return undefined.

  const result = (await requestWindows<Req, Resp>(route, payload, [win], targetOrigin))[0];
  if (result.error) throw result.error;

  return result.payload;
}

/**
 * Sends a request message to specific {@link Window}(s) and returns a promise that resolves to the response data.
 *
 * @param route The type of the message to request.
 * @param payload The payload to send with the request.
 * @param windows The {@link Window}(s) to send the request to.
 * If no windows are provided, it defaults to the current document's iframes.
 * @param targetOrigin The origin to send the request to. Defaults to `'*'` for all origins.
 * @returns A {@link Promise} that resolves with the response payload from each {@link Window}.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function requestWindows<Req = unknown, Resp = void>(
  route: string,
  payload?: Req,
  windows: Window[] = [],
  targetOrigin = '*',
): Promise<WindowResponse<Resp>[]> {
  // If no windows are provided, use the current document's iframes.
  if (windows.length === 0) {
    windows = Array.from(document.querySelectorAll('iframe'))
      .filter((iframe) => !!iframe.contentWindow)
      .map((iframe) => iframe.contentWindow!);
  }
  const results: Promise<WindowResponse<Resp>>[] = [];

  for (const win of windows) {
    results.push(new Promise((resolve) => {
      // Setup listener for the response.
      const responseListener = (message: WindowMessage<Resp>) => {
        if (message.data.route === `${route}_response`) {
          // Remove the listener once we receive the response.
          window.removeEventListener('message', responseListener);

          // Resolve with the payload or error.
          (!message.data.error)
            ? resolve({ payload: message.data.payload })
            : resolve({ error: message.data.error });
        }
      };

      // Bind the response listener to the window.
      window.addEventListener('message', responseListener, { passive: true });
    }));

    // Send the request message to the window.
    win.postMessage({ route, payload }, targetOrigin);
  }

  return Promise.all(results);
}

/**
 * Types of predefined inter-window messages.
 */
export const WindowMessageRoutes = {

  /**
   * Gets the base URL of any contacted windows.
   */
  GET_BASE_URL: 'ALgetBaseUrl',

  /**
   * Gets the href of any contacted windows.
   */
  GET_HREF: 'ALgetHref',

  /**
   * Gets the {@link URL} of any contacted windows.
   */
  GET_URL: 'ALgetURL',

};

// Register some default bindings for basic window properties.
if (isContent()) {
  listenWindow(WindowMessageRoutes.GET_BASE_URL, () => window.location.hostname + window.location.pathname);
  listenWindow(WindowMessageRoutes.GET_HREF, () => window.location.href);
}

export type * from './window.interfaces.js';
