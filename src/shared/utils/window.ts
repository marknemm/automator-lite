import type { Nullish } from 'utility-types';
import { isContent } from './extension.js';
import type { WindowRequestOptions, WindowRequestEvent, WindowRequestData, WindowResponse, WindowsResponseEvent, WindowsResponses } from './window.interfaces.js';
import { deepQuerySelectorAll } from '~content/utils/deep-query.js';

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
 * @param route The route that the listener shall listen to.
 * @param callback The callback to invoke when a message is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @returns A function to unbind the listener.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenTopWindow<Req = unknown, Resp = void>(
  route: string,
  callback: (event: WindowRequestEvent<Req>) => Promise<Resp> | Resp,
): () => void {
  if (!isTopWindow()) return () => {}; // Only listen if this is the top window.
  return listenWindow<Req, Resp>(route, callback, getWindow()?.top);
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
  callback: (event: WindowRequestEvent<Req>) => Promise<Resp> | Resp,
  win: Window | Nullish = getWindow()
): () => void {
  if (!win) return () => {}; // If win is explicitly null, do nothing.

  // Create a listener that will invoke the callback and respond with any result from the callback.
  const requestListener = async (event: WindowRequestEvent<Req>) => {
    const { data } = event;
    if (data.route === route) {
      const result = await callback(event);

      // If broadcasting, recursively send to all child frames.
      let broadcastResponse: WindowsResponses<Resp> | undefined;
      if (data.broadcast && data.depth < data.maxDepth) {
        const frames = deepQuerySelectorAll<HTMLIFrameElement>('iframe')
          .filter((frame) => !!frame.contentWindow)
          .map((frame) => frame.contentWindow!);
        if (frames.length > 0) {
          broadcastResponse = await requestWindows<Req, Resp>({
            route,
            payload: data.payload,
            windows: frames,
            broadcast: true,
            depth: data.depth + 1,
            maxDepth: data.maxDepth,
          });
        }
      }

      // Send the response back to the original sender.
      const responseData: WindowResponse<Resp> = {
        broadcastResults: broadcastResponse?.results ?? [],
        depth: data.depth,
        href: win.location.href,
        payload: result,
        route: `${route}_${data.depth}_response`,
      };
      event.source?.postMessage(responseData, { targetOrigin: '*' });
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
 * @throws {Error} If the request fails.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function requestTopWindow<Req = unknown, Resp = void>(
  route: string,
  payload?: Req,
): Promise<Resp | undefined> {
  const topWindow = getWindow()?.top;
  if (!topWindow) return; // If not in content context.

  const [result] = (await requestWindows<Req, Resp>({
    route,
    payload,
    windows: topWindow,
  })).results;

  if (!result?.error) return result?.payload;
  throw new Error(`Request top window failed for '${route}' with error: ${result?.error.message ?? 'N/A'}`);
}

/**
 * Sends a request message to specific {@link Window}(s) and returns a promise that resolves to the response data.
 *
 * @param route The type of the message to request.
 * @param payload The payload to send with the request.
 * @param windows The {@link Window}(s) to send the request to.
 * If no windows are provided, it defaults to all of the current document's iframes.
 * @param targetOrigin The origin to send the request to. Defaults to `'*'` for all origins.
 * @returns A {@link Promise} that resolves with the response payload from each {@link Window}.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function requestWindows<Req = unknown, Resp = void>(
  request: WindowRequestOptions<Req>
): Promise<WindowsResponses<Resp>> {
  // Unpack arguments and setup return value.
  const { depth = 0, maxDepth = Infinity, payload, route, targetOrigin = '*' } = request;
  let { broadcast, windows = [] } = request;
  const results: Promise<WindowResponse<Resp>>[] = [];
  const response: WindowsResponses<Resp> = { results: [], payload: [] };

  // Ensure windows is always an array.
  if (!Array.isArray(windows)) {
    windows = [windows];
  }

  // If no windows are provided, recursively request all frames via broadcast from top window.
  if (windows.length === 0) {
    const topWindow = getWindow()?.top;
    if (!topWindow) return response;
    windows = [topWindow];
    broadcast = true;
  }

  // Setup response listener and send request to each window.
  for (const win of windows) {
    // Response listener promise setup.
    results.push(new Promise(resolve => {
      const responseListener = ({ data }: WindowsResponseEvent<Resp>) => {
        if (data.route !== `${route}_${depth}_response`) return; // Not route destination.
        window.removeEventListener('message', responseListener);
        resolve({ ...data, route });
      };
      window.addEventListener('message', responseListener); // listen
    }));

    // Request message to the window.
    const eventData: WindowRequestData<Req> = {
      broadcast,
      depth,
      maxDepth,
      payload,
      route,
      srcHref: window.location.href,
    };
    win.postMessage(eventData, targetOrigin); // send
  }

  const unpackResultData = (d: WindowResponse<Resp>[]): Resp[] => {
    return [
      ...d.map((r) => r.payload!),
      ...(d.flatMap((r) => unpackResultData(r.broadcastResults ?? []))),
    ];
  };

  response.results = await Promise.all(results);
  response.payload = unpackResultData(response.results);
  return response;
}

/**
 * Types of predefined inter-window messages.
 */
export const WindowMessageRoutes = {

  /**
   * Gets the base URL of any contacted windows.
   */
  GET_BASE_URL: 'getBaseUrl',

  /**
   * Gets the host of any contacted windows.
   */
  GET_HOST: 'getHost',

  /**
   * Gets the href of any contacted windows.
   */
  GET_HREF: 'getHref',

};

// Register some default bindings for basic window properties.
if (isContent()) {
  listenWindow(WindowMessageRoutes.GET_BASE_URL, () => window.location.hostname + window.location.pathname);
  listenWindow(WindowMessageRoutes.GET_HOST, () => window.location.host);
  listenWindow(WindowMessageRoutes.GET_HREF, () => window.location.href);
}

export type * from './window.interfaces.js';
