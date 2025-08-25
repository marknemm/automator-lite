import { getExtensionContext, isBackground, isContent, queryTabs } from './extension.js';
import type { ExtensionContext, Message, SendMessage } from './messaging.interfaces.js';
import { isSamePathname, isTopWindow } from './window.js';

/**
 * Broadcasts a {@link message} to all frames in the current {@link chrome.tabs.Tab Tab}.
 *
 * @param message The {@link BroadcastMessage} to broadcast to all frames in the current {@link chrome.tabs.Tab Tab}.
 * Only the {@link Message.route route} property is required, and all other metadata is generated internally as needed.
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
export async function sendMessage<Req = unknown, Resp = void>(
  message: SendMessage<Req>
): Promise<Resp[]> {
  const responses: Resp[] = [];
  const { tabsQueryInfo = { active: true, currentWindow: true } } = message;

  // Normalize contexts to an array.
  const contexts = (message.contexts?.length)
    ? [message.contexts].flat()
    : ['background', 'content', 'options', 'popup'] as ExtensionContext[]; // Default to all contexts.

  // If content script is sending a message to content, background will forward it.
  const forward = isContent() && contexts.includes('content');
  if (forward && !contexts.includes('background')) {
    contexts.push('background'); // Ensure background is included if forwarding.
  }

  // Send message to background, options, and popup contexts.
  if (contexts.find(ctx => ['background', 'options', 'popup'].includes(ctx)) || forward) {
    responses.push(
      await chrome.runtime.sendMessage({
        originContext: getExtensionContext(),
        originLocation: isBackground() ? 'background' : window.location,
        ...message,
        contexts: contexts.filter(ctx => ctx !== 'content'), // Use chrome.tabs below for content.
        forward, // If true, background will forward message to content scripts.
        tabsQueryInfo,
      } as Message<Req>)
    );
  }

  // Send message to content context with tabs filtering.
  if (contexts.includes('content') && !isContent()) { // Content cannot access chrome.tabs API (background forwards).
    const tabs = await queryTabs(tabsQueryInfo);

    for (const tab of tabs) {
      if (tab?.id == null) continue;
      responses.push(
        await chrome.tabs.sendMessage(tab.id, {
          originContext: getExtensionContext(),
          originLocation: isBackground() ? 'background' : window.location,
          ...message,
            contexts: ['content'], // chrome.tabs API is only for content.
            tabsQueryInfo,
        } as Message<Req>)
      );
    }
  }

  return Promise.all(responses);
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
export function onMessage<Req = unknown, Resp = void>(
  route: string | RegExp,
  callback: (message: Message<Req>, sender: chrome.runtime.MessageSender) => Promise<Resp> | Resp,
): () => void {
  const listener = async (
    message: Message<Req>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    // Does message route match this listener's route?
    const routeMatch = message.route && ((typeof route === 'string')
      ? ['*', message.route.trim()].includes(route.trim())
      : route.test(message.route.trim()));

    // Should listener handle the message based on route and context match?
    if (routeMatch && testContextMatch(message)) {
      const result = await callback(message, sender);
      console.log('Sending response: ', result);
      sendResponse(result);
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Tests if the message should be handled by the current context.
 *
 * @param message The {@link Message} to test.
 * @returns `true` if the message should be handled by the current context, otherwise `false`.
 */
function testContextMatch(message: Message): boolean {
  // Normalize contexts to an array.
    const contexts = message.contexts?.length
      ? [message.contexts].flat()
      : [];

  // Check if the message is designated for the current context.
  if (!contexts.includes(getExtensionContext())) {
    return false; // Context does not match.
  }

  return !isContent()
      || ((!message.topFrameOnly || isTopWindow())
      && (!message.frameLocation || isSamePathname(message.frameLocation)));
}

/**
 * Initializes message forwarding from the background script to content scripts.
 * This will automatically forward messages that have the `forward` flag set to `true`.
 *
 * This is useful for content scripts that need to send messages to all frames in the current tab,
 * since content scripts do not have access to the `chrome.tabs` API.
 *
 * If invoked from any other context than background, will be a `no-op`.
 *
 * @return A function that can be called to stop the message forwarding listener.
 */
export function initMessageForwarding(): () => void {
  if (!isBackground()) return () => {};

  return onMessage('*', (message) => {
    if (message.forward) {
      message.contexts = ['content']; // IMPORTANT: No infinite loop, only forward to content.
      return sendMessage(message);
    }
  });
}

export type * from './messaging.interfaces.js';
