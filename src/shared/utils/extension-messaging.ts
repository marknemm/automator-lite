import type { ExtensionContext, ExtensionRequest, ExtensionRequestHandler, ExtensionRequestMessage, ExtensionResponse, ExtensionResponseMessage } from './extension-messaging.interfaces.js';
import { GetAllFrameResultDetails, getAllFrames, getExtensionContext, isBackground, isContent, queryTabs } from './extension.js';
import log from './logger.js';
import { sendTopWindow, WindowMessageRoutes } from './window-messaging.js';
import { getBaseURL, isSameBaseUrl, isTopWindow } from './window.js';

/**
 * Sends a {@link request} to all specified extension contexts.
 *
 * @param request The {@link BroadcastMessage} to send to all specified extension contexts.
 * Only the {@link ExtensionRequestMessage.route route} property is required, and all other metadata is generated internally as needed.
 * @returns A {@link Promise} that resolves to an array of responses from the message handlers.
 *
 * @usage
 * ```ts
 * const responses = await sendExtension({
 *   route: 'my-message-route',
 *   contexts: ['background', 'content', 'options', 'popup'],
 *   payload: { key: 'value' },
 * });
 * ```
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export async function sendExtension<Req = unknown, Resp = void>(
  request: ExtensionRequest<Req>
): Promise<ExtensionResponse<Resp>> {
  const responsePromises: Promise<ExtensionResponseMessage<Resp>>[] = [];

  // Normalize the request to a message.
  const message = await toMessage(request);
  const { contexts } = message;

  // Send message to background, options, and popup contexts.
  if (contexts.find(ctx => ['background', 'options', 'popup'].includes(ctx))) {
    responsePromises.push(
      chrome.runtime.sendMessage(message)
    );
  }

  // Send message to content context with tabs filtering.
  if (contexts.includes('content') && !isContent()) { // Content cannot access chrome.tabs API (background forwards).
    const destinations = await getTabMessageDestinations(message);

    for (const { tabId, documentId, frameId } of destinations) {
      responsePromises.push(
        chrome.tabs.sendMessage(
          tabId,
          message,
          (documentId || frameId) ? { documentId, frameId } : {}
        ).catch((err) => {
          log.error(err);
          return undefined; // Ignore errors if frame does not have the content script.
        })
      );
    }
  }

  const responseMessages = await Promise.all(responsePromises);

  const unpackResponsePayloads = (responseMsg: ExtensionResponseMessage<Resp>[]): Resp[] => {
    return [
      ...responseMsg.map((r) => r?.payload),
      ...(responseMsg.flatMap((r) => unpackResponsePayloads(r?.forwardedMessages ?? []))),
    ].filter(r => r !== undefined);
  };

  const unpackResponseErrors = (responseMsg: ExtensionResponseMessage<Resp>[]): any[] => {
    return [
      ...responseMsg.map((r) => r?.error),
      ...(responseMsg.flatMap((r) => unpackResponseErrors(r?.forwardedMessages ?? []))),
    ].filter(e => e !== undefined);
  };

  return {
    messages: responseMessages,
    payloads: unpackResponsePayloads(responseMessages),
    errors: unpackResponseErrors(responseMessages),
  };
}

/**
 * Converts a given {@link request} to a normalized {@link ExtensionRequestMessage}.
 *
 * @param request The {@link ExtensionRequest} to convert.
 * @returns The converted {@link ExtensionRequestMessage}.
 *
 * @template T The type of the request/message payload.
 */
async function toMessage<T>(request: ExtensionRequest<T>): Promise<ExtensionRequestMessage<T>> {
  // Normalize to array of contexts.
  const contexts: ExtensionContext[] = request.contexts?.length
    ? [request.contexts].flat()
    : ['background', 'content', 'options', 'popup'];

  // Background must forward content -> content messaging with chrome.tabs API.
  const forward = isContent() && contexts.includes('content');
  if (forward && !contexts.includes('background')) {
    contexts.push('background');
  }

  return {
    ...request,
    contexts,
    forward,
    frameLocations: request.frameLocations // Normalize to array of URL pathname strings.
      ? [request.frameLocations].flat().map(getBaseURL)
      : [],
    senderContext: getExtensionContext(),
    senderFrameHref: isBackground()
      ? 'background'
      : document.location.href,
    senderTopHref: isBackground()
      ? 'background'
      : await sendTopWindow<never, string>(WindowMessageRoutes.GET_HREF) ?? document.location.href,
    tabsQueryInfo: request.tabsQueryInfo
      ?? { active: true, currentWindow: true }, // Default to active tab in current window.
  };
}

/**
 * Gets the content tab message destinations for a given {@link message}.
 *
 * @param message The {@link ExtensionRequestMessage} to send.
 * @returns An array of tab and frame IDs to send the message to.
 */
async function getTabMessageDestinations(
  message: ExtensionRequestMessage
): Promise<(Partial<GetAllFrameResultDetails> & { tabId: number })[]> {
  const { tabsQueryInfo } = message;
  const destinations: (Partial<GetAllFrameResultDetails> & { tabId: number })[] = [];

  const tabs = await queryTabs(tabsQueryInfo);
  for (const tab of tabs) {
    if (tab?.id == null) continue;

    if (chrome.webNavigation) {
      const frames = await getAllFrames({ tabId: tab.id });
      for (const frame of frames) {
        destinations.push({ ...frame, tabId: tab.id });
      }
    } else {
      destinations.push({ tabId: tab.id }); // No frameId, send to tab in general.
    }
  }

  return destinations;
}

/**
 * Listens for messages of a specific {@link route} and executes the provided {@link callback} when a message is received.
 *
 * Only messages that are designated for the current {@link ExtensionContext} will be processed.
 *
 * @param route The route of the message to listen for. Can be a string or a regular expression.
 * @param callback The callback function to execute when a message of the specified route is received.
 * @returns A cleanup function that can be called to remove the listener.
 *
 * @usage
 * ```ts
 * listenExtension('my-message-route', (message, sender) => {
 *   console.log('Received message:', message);
 *   return 'Response data';
 * });
 * ```
 *
 * @template Req The type of the request payload.
 * @template Resp The type of the response payload.
 */
export function listenExtension<Req = unknown, Resp = void>(
  route: string | RegExp,
  handler: ExtensionRequestHandler<Req, Resp>,
): () => void {
  const listener = (
    message: ExtensionRequestMessage<Req>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    const shouldHandle = (testRouteMatch(message.route, route) && testContextMatch(message));
    const shouldForward = (route === '__forward' && message.forward && isBackground());

    // Check if route/ctx destination match or if message should be forwarded via background script.
    if (shouldHandle || shouldForward) {
      (async () => { // Wrap in async function to return true immediately (below) to sender to signal async.
        try {
          // Handle message in current context.
          const result = shouldHandle
            ? await handler(message, sender)
            : undefined;

          // Forward message to content frames from background script.
          const forwardedMessages = shouldForward
            ? (await sendExtension<Req, Resp>({
                ...message,
                contexts: ['content'],
              })).messages
            : [];

          const responseMessage: ExtensionResponseMessage<Resp> = {
            ...message,
            forwardedMessages,
            payload: result,
            responderContext: getExtensionContext(),
            responderFrameLocation: isBackground() ? 'background' : getBaseURL(),
          };
          sendResponse(responseMessage);
        } catch (error) {
          const errorMessage: ExtensionResponseMessage<Resp> = {
            ...message,
            error: error instanceof Error ? error.message : error,
            forwardedMessages: [],
            payload: undefined,
            responderContext: getExtensionContext(),
            responderFrameLocation: isBackground() ? 'background' : getBaseURL(),
          };
          sendResponse(errorMessage);
        }
      })();
      return true; // Sender should wait for the response.
    }
    return false; // Sender should not wait for the response.
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Tests if a message route matches a given route.
 *
 * @param messageRoute The message route to test.
 * @param route The route to match against.
 * @returns `true` if the message route matches the given route, otherwise `false`.
 */
function testRouteMatch(messageRoute: string, route: string | RegExp): boolean {
  return !!messageRoute && ((typeof route === 'string')
    ? ['*', messageRoute.trim()].includes(route.trim())
    : route.test(messageRoute.trim()));
}

/**
 * Tests if the message should be handled by the current context.
 *
 * @param message The {@link ExtensionRequestMessage} to test.
 * @returns `true` if the message should be handled by the current context, otherwise `false`.
 */
function testContextMatch(message: ExtensionRequestMessage): boolean {
  const { contexts, frameLocations } = message;

  // Check if the message is designated for the current context.
  if (!contexts.includes(getExtensionContext())) {
    return false; // Context does not match.
  }

  return !isContent()
      || ((!message.topFrameOnly || isTopWindow())
      && (!frameLocations.length || !!frameLocations.find(location => isSameBaseUrl(location))));
}

/* Initializes message forwarding from the background script to content scripts.
 * This will automatically forward messages that have the `forward` flag set to `true`.
 *
 * This is useful for content scripts that need to send messages to all frames in the current tab,
 * since content scripts do not have access to the `chrome.tabs` API.
 */
if (isBackground()) {
  listenExtension('__forward', () => {});
}

export type * from './extension-messaging.interfaces.js';
