import type { ExtensionContext, TabsQueryInfo } from './extension.interfaces.js';
import type { FrameLocation } from './window.interfaces.js';

/**
 * An {@link ExtensionRequest} to be sent via the intra-extension messaging system.
 *
 * @see {@link ExtensionRequestMessage}
 */
export interface ExtensionRequest<T = unknown> {

  /**
   * The {@link ExtensionContext}(s) that the request message is designated for.
   *
   * If not specified, the request message should be handled by any receiving {@link ExtensionContext}s.
   */
  contexts: ExtensionContext | ExtensionContext[];

  /**
   * Indicates that the message should be sent only to the frame(s) with the specified {@link FrameLocation}.
   *
   * If not specified, the message will be sent to all frames in the content tab.
   *
   * `Note`: `all_frames` must be configured in `manifest.json` for this to work.
   */
  frameLocations?: FrameLocation | FrameLocation[];

  /**
   * The payload of the request message.
   */
  payload?: T;

  /**
   * The route of the message, which determines the appropriate handler.
   */
  route: string;

  /**
   * The {@link TabsQueryInfo} to use when querying content {@link chrome.tabs.Tab Tab}s to send the message to.
   *
   * @default { active: true, currentWindow: true }
   */
  tabsQueryInfo?: TabsQueryInfo;

  /**
   * Indicates that the message should be sent only to the top frame in the content {@link chrome.tabs.Tab Tab}(s).
   *
   * By default, messages are sent to all frames in the content tab.
   *
   * Ignored if `content` is not included in the {@link ExtensionRequestMessage.contexts contexts}.
   *
   * @default false
   */
  topFrameOnly?: boolean;

}

/**
 * An {@link ExtensionRequestMessage} sent between different parts of the extension.
 *
 * @template T The type of the message `payload`. Defaults to `unknown`.
 * @extends ExtensionRequest<T>
 */
export interface ExtensionRequestMessage<T = unknown> extends ExtensionRequest<T> {

  contexts: ExtensionContext[]; // Normalized to array.

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
   * Indicates that the message should be sent only to the frame(s) with the specified base location(s).
   *
   * If not specified, the message will be sent to all frames in the content tab.
   *
   * `Note`: `all_frames` must be configured in `manifest.json` for this to work.
   */
  frameLocations: string[]; // Normalized to base location string array.

  /**
   * The {@link ExtensionContext} from which the message originated.
   *
   * May be different than `sender` information if the message was forwarded by the background script.
   * A message from a content script frame may typically be forwarded by the background script to
   * all content frames in the same tab.
   */
  senderContext: ExtensionContext;

  /**
   * The `href` of the frame from which the message originated.
   */
  senderFrameHref: string;

  /**
   * The `href` of the top-level window from which the message originated.
   */
  senderTopHref: string;

  tabsQueryInfo: TabsQueryInfo;

}

/**
 * Handles an incoming {@link message}.
 *
 * @param message The incoming {@link ExtensionRequestMessage}.
 * @returns The response payload data for the handled {@link message}.
 */
export type ExtensionRequestHandler<Req = unknown, Resp = void> =
  (message: ExtensionRequestMessage<Req>, sender: chrome.runtime.MessageSender) => Promise<Resp> | Resp;

export interface ExtensionResponseMessage<T> {

  /**
   * The {@link Error} that occurred while processing the message.
   */
  error?: any;

  /**
   * The {@link ExtensionResponseMessage} objects rendered by any forwarded messages.
   */
  forwardedMessages: ExtensionResponseMessage<T>[];

  /**
   * The payload of the response message.
   */
  payload?: T;

  /**
   * The {@link ExtensionContext} from which the response originated.
   */
  responderContext: ExtensionContext;

  /**
   * The location from which the response originated.
   */
  responderFrameLocation?: string;

  /**
   * The route of the response message.
   */
  route: string;

}

export interface ExtensionResponse<T = unknown> {

  payload: T[];

  messages: ExtensionResponseMessage<T>[];

}

export type { ExtensionContext, TabsQueryInfo };
