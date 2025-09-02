import { getExtensionContext, isBackground, isContent, getAllFrames, queryTabs } from './extension.js';
import type { ExtensionContext, ExtensionRequestMessage, ExtensionRequest, ExtensionRequestHandler, ExtensionResponseMessage, ExtensionResponse } from './extension-messaging.interfaces.js';
import { getBaseURL, isSameBaseUrl, isTopWindow } from './window.js';

/**
 * Broadcasts a {@link request} to all frames in the current {@link chrome.tabs.Tab Tab}.
 *
 * @param request The {@link BroadcastMessage} to broadcast to all frames in the current {@link chrome.tabs.Tab Tab}.
 * Only the {@link ExtensionRequestMessage.route route} property is required, and all other metadata is generated internally as needed.
 * @returns A {@link Promise} that resolves to an array of responses from the message handlers.
 *
 * @usage
 * ```ts
 * const responses = await broadcast({
 *   route: 'my-message-route',
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
  const message = toMessage(request);
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

    for (const { tabId, frameId } of destinations) {
      responsePromises.push(
        chrome.tabs.sendMessage(
          tabId,
          message,
          frameId ? { frameId } : {}
        ).catch(() => undefined) // Ignore errors if frame does not have the content script.
      );
    }
  }

  const responseMessages = await Promise.all(responsePromises);
  const unpackResponsePayload = (responseMsg: ExtensionResponseMessage<Resp>[]): Resp[] => {
    return [
      ...responseMsg.map((r) => r?.payload),
      ...(responseMsg.flatMap((r) => unpackResponsePayload(r?.forwardedMessages ?? []))),
    ].filter(r => r !== undefined);
  };

  return {
    messages: responseMessages,
    payload: unpackResponsePayload(responseMessages),
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
function toMessage<T>(request: ExtensionRequest<T>): ExtensionRequestMessage<T> {
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
    senderFrameLocation: isBackground()
      ? 'background'
      : getBaseURL(),
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
): Promise<{ tabId: number; frameId?: number; }[]> {
  const { tabsQueryInfo } = message;
  const destinations: { tabId: number; frameId?: number; }[] = [];

  const tabs = await queryTabs(tabsQueryInfo);
  for (const tab of tabs) {
    if (tab?.id == null) continue;

    if (chrome.webNavigation) {
      const frames = await getAllFrames({
        tabId: tab.id,
        filter: message.frameLocations.length
          ? frame => !!message.frameLocations.find(loc => isSameBaseUrl(loc, frame.url))
          : undefined,
      });
      for (const frame of frames) {
        destinations.push({ tabId: tab.id, frameId: frame.frameId });
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
 * onMessage('my-message-route', (message, sender) => {
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
  const listener = async (
    message: ExtensionRequestMessage<Req>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    // Does message route match this listener's route?
    const routeMatch = message.route && ((typeof route === 'string')
      ? ['*', message.route.trim()].includes(route.trim())
      : route.test(message.route.trim()));

    // Should listener handle the message based on route and context match?
    if (routeMatch && testContextMatch(message)) {
      console.log('Handling message:', message);
      const result = await handler(message, sender);

      const forwardedMessages = (message.forward && isBackground())
        ? (await sendExtension<Req, Resp>(message)).messages
        : [];

      const responseMessage: ExtensionResponseMessage<Resp> = {
        ...message,
        forwardedMessages,
        payload: result,
        responderContext: getExtensionContext(),
        responderFrameLocation: isBackground() ? 'background' : getBaseURL(),
      };
      sendResponse(responseMessage);
      return true; // Signal that the sender should wait for the response.
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
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
  listenExtension('*', () => {});
}

export type * from './extension-messaging.interfaces.js';
