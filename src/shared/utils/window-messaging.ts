import type { Nullish } from 'utility-types';
import { deepQuerySelectorAll } from '~content/utils/deep-query.js';
import { isContent } from './extension.js';
import { WindowMessageRoutes } from './window-messaging.constants.js';
import type { WindowRequestMessage, WindowRequestEvent, WindowRequest, WindowResponseMessage, WindowsResponseEvent, WindowResponse, WindowRequestHandler } from './window-messaging.interfaces.js';
import { getWindow, isTopWindow } from './window.js';

// Register default listeners for responding with standard window info.
if (isContent()) {
  listenWindow(WindowMessageRoutes.GET_BASE_URL, () => window.location.hostname + window.location.pathname);
  listenWindow(WindowMessageRoutes.GET_HOST, () => window.location.host);
  listenWindow(WindowMessageRoutes.GET_HREF, () => window.location.href);
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
export async function sendTopWindow<Req = unknown, Resp = void>(
  route: string,
  payload?: Req,
): Promise<Resp | undefined> {
  const topWindow = getWindow()?.top;
  if (!topWindow) return; // If not in content context.

  const [result] = (await sendWindow<Req, Resp>({
    route,
    payload,
    windows: topWindow,
  })).messages;

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
export async function sendWindow<Req = unknown, Resp = void>(
  request: WindowRequest<Req>
): Promise<WindowResponse<Resp>> {
  // Unpack arguments and setup return value.
  const { depth = 0, maxDepth = Infinity, payload, route, targetOrigin = '*' } = request;
  let { broadcast, windows = [] } = request;
  const responsePromises: Promise<WindowResponseMessage<Resp>>[] = [];

  // Ensure windows is always an array.
  if (!Array.isArray(windows)) {
    windows = [windows];
  }

  // If no windows are provided, recursively request all frames via broadcast from top window.
  if (windows.length === 0) {
    const topWindow = getWindow()?.top;
    if (!topWindow) return { messages: [], payload: [] };
    windows = [topWindow];
    broadcast = true;
  }

  // Setup response listener and send request to each window.
  for (const win of windows) {
    // Response listener promise setup.
    responsePromises.push(new Promise(resolve => {
      const responseListener = ({ data }: WindowsResponseEvent<Resp>) => {
        if (data.route !== `${route}_${depth}_response`) return; // Not route destination.
        window.removeEventListener('message', responseListener);
        resolve({ ...data, route });
      };
      window.addEventListener('message', responseListener); // listen
    }));

    // Request message to the window.
    const requestMessage: WindowRequestMessage<Req> = {
      broadcast,
      depth,
      maxDepth,
      payload,
      route,
      srcHref: window.location.href,
    };
    win.postMessage(requestMessage, targetOrigin); // send
  }

  const responseMessages = await Promise.all(responsePromises);
  const unpackResponsePayload = (responseMsg: WindowResponseMessage<Resp>[]): Resp[] => {
    return [
      ...responseMsg.map((r) => r.payload!),
      ...(responseMsg.flatMap((r) => unpackResponsePayload(r.broadcastMessages ?? []))),
    ];
  };

  return {
    messages: responseMessages,
    payload: unpackResponsePayload(responseMessages),
  };
}

/**
 * Binds a listener for messages sent to the top window.
 *
 * @param route The route that the listener shall listen to.
 * @param handler The request handler callback to invoke when a message is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @returns A function to unbind the listener.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenTopWindow<Req = unknown, Resp = void>(
  route: string,
  handler: WindowRequestHandler<Req, Resp>,
): () => void {
  if (!isTopWindow()) return () => {}; // Only listen if this is the top window.
  return listenWindow<Req, Resp>(route, handler, getWindow()?.top);
}

/**
 * Binds a listener for messages sent to a specific {@link Window}.
 *
 * @param route The type of message to bind to.
 * @param handler The request handler callback to invoke when a message of the given type is received.
 * This callback receives the message event and can optionally return a promise with the response data.
 * @param win The {@link Window} to bind the listener to. Defaults to the current {@link window}.
 * @returns A function to unbind the listener.
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenWindow<Req = unknown, Resp = void>(
  route: string,
  handler: WindowRequestHandler<Req, Resp>,
  win: Window | Nullish = getWindow()
): () => void {
  if (!win) return () => {}; // If win is explicitly null, do nothing.

  // Create a listener that will invoke the callback and respond with any result from the callback.
  const listener = async (event: WindowRequestEvent<Req>) => {
    const { data } = event;
    if (data.route === route) {
      const result = await handler(event);

      // If broadcasting, recursively send to all child frames.
      let broadcastResponse: WindowResponse<Resp> | undefined;
      if (data.broadcast && data.depth < data.maxDepth) {
        const frames = deepQuerySelectorAll<HTMLIFrameElement>('iframe')
          .filter((frame) => !!frame.contentWindow)
          .map((frame) => frame.contentWindow!);
        if (frames.length > 0) {
          broadcastResponse = await sendWindow<Req, Resp>({
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
      const responseMessage: WindowResponseMessage<Resp> = {
        broadcastMessages: broadcastResponse?.messages ?? [],
        depth: data.depth,
        href: win.location.href,
        payload: result,
        route: `${route}_${data.depth}_response`,
      };
      event.source?.postMessage(responseMessage, { targetOrigin: '*' });
    }
  };

  // Bind the request listener and return the unbind function.
  win.addEventListener('message', listener);
  return () => win.removeEventListener('message', listener);
}

export * from './window-messaging.constants.js';
export type * from './window-messaging.interfaces.js';
