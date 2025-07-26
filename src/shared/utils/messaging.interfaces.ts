import type { ExtensionContext } from './extension.interfaces.js';

/**
 * A {@link Message} sent between different parts of the extension.
 *
 * @template T The type of the message `payload`. Defaults to `unknown`.
 */
export interface Message<T = unknown> {

  /**
   * The {@link ExtensionContext}(s) that the message is designated for.
   * 
   * If not specified, the message should be handled by any receiving {@link ExtensionContext}s.
   */
  contexts: ExtensionContext | ExtensionContext[];

  /**
   * Indicates that the message should be forwarded to all content frames by the background script.
   * 
   * Content scripts do not have access to the `chrome.tabs` API, so they cannot send messages
   * to all frames in the current tab directly.
   * 
   * `Note`: This will be automatically set to `true` if the message is sent from a content script
   * and the `contexts` include `content`.
   */
  forward?: boolean;

  /**
   * The {@link ExtensionContext} from which the message originated.
   * 
   * May be different than `sender` information if the message was forwarded by the background script.
   * A message from a content script frame may typically be forwarded by the background script to
   * all content frames in the same tab.
   */
  originContext: ExtensionContext;

  /**
   * The location from which the message originated.
   */
  originLocation: Location;

  /**
   * The payload of the message.
   */
  payload?: T;

  /**
   * The route of the message, which determines the appropriate handler.
   */
  route: string;

  /**
   * The {@link chrome.tabs.QueryInfo} to use when querying content {@link chrome.tabs.Tab Tab}s to send the message to.
   * 
   * @default { active: true, currentWindow: true }
   */
  tabsQueryInfo?: chrome.tabs.QueryInfo;

  /**
   * Indicates that the message should be sent only to the top frame in the content {@link chrome.tabs.Tab Tab}(s).
   * 
   * By default, messages are sent to all frames in the content tab.
   * 
   * Ignored if `content` is not included in the {@link Message.contexts contexts}.
   * 
   * @default false
   */
  topFrameOnly?: boolean;

  /**
   * Indicates that the message should be sent only to the frame with the specified {@link Location}.
   * 
   * This is used to filter messages to a specific content frame.
   * 
   * If not specified, the message will be sent to all frames in the content tab.
   */
  frameLocation?: Location | string;

}

export type { ExtensionContext };
