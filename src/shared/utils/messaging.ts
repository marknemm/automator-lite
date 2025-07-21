import { getExtensionContext, isBackground, isContent, queryTabs } from './extension.js';
import type { ExtensionContext, Message } from './messaging.interfaces.js';
import { isTopWindow } from './window.js';

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
 */
export async function sendMessage<T, R = void>(
  message: Partial<Message<T>> & Pick<Message<T>, 'route'>
): Promise<R[]> {
  const responses: R[] = [];
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
      } as Message<T>)
    );
  }

  // Send message to content context with tabs filtering.
  if (contexts.includes('content') && !isContent()) { // Content cannot access chrome.tabs API (background forwards).
    const tabs = await queryTabs(tabsQueryInfo);

    for (const tab of tabs) {
      if (tab?.id) {
        responses.push(
          await chrome.tabs.sendMessage(tab.id, {
            originContext: getExtensionContext(),
            originLocation: isBackground() ? 'background' : window.location,
            ...message,
            contexts: ['content'], // chrome.tabs API is only for content.
            tabsQueryInfo,
          } as Message<T>)
        );
      }
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
 */
export function onMessage<T, R = unknown>(
  route: string | RegExp,
  callback: (message: Message<T>, sender: chrome.runtime.MessageSender) => Promise<R> | R,
): () => void {
  const listener = async (
    message: Message<T>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    // Normalize contexts to an array.
    const contexts = message.contexts?.length
      ? [message.contexts].flat()
      : [];

    // Does message route match this listener's route?
    const routeMatch = message.route && ((typeof route === 'string')
      ? ['*', message.route.trim()].includes(route.trim())
      : route.test(message.route.trim()));

    // If message is only for top content frame, ensure this is the top window.
    if (isContent() && message.topFrameOnly && !isTopWindow()) {
      return;
    }

    // Should listener handle the message based on route and context match?
    if (routeMatch && contexts.includes(getExtensionContext())) {
      const result = await callback(message, sender);
      sendResponse(result);
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
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
