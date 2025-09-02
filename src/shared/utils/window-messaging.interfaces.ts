/**
 * Represents a request sent to specific window(s) or frame(s).
 *
 * @template Payload - The type of the request `payload`.
 */
export interface WindowRequest<Payload = unknown> {

  /**
   * Whether to broadcast the message to all frames beneath the specified window(s).
   *
   * @default false
   */
  broadcast?: boolean;

  /**
   * The current depth of the message in the frame hierarchy.
   *
   * @default 0
   */
  depth?: number;

  /**
   * The maximum depth to traverse when broadcasting the message.
   *
   * @default infinity
   */
  maxDepth?: number;

  /**
   * The message payload containing the data to be sent.
   */
  payload?: Payload;

  /**
   * The message route to identify the message listener destination.
   */
  route: string;

  /**
   * The target origin for the message, which can be used to restrict the message to a specific domain.
   *
   * @default '*' for all domains.
   */
  targetOrigin?: string;

  /**
   * The window or windows to send the message to.
   *
   * Defaults to all frames in the current tab.
   */
  windows?: Window | Window[];

}

/**
 * Represents the data structure for a request message sent between windows or frames.
 *
 * @template Payload - The type of the message `payload`.
 */
export type WindowRequestMessage<Payload = unknown> = {

  /**
   * Whether to broadcast the message to all frames beneath the specified window(s).
   *
   * @default false
   */
  broadcast?: boolean;

  /**
   * The current depth of the message in the frame hierarchy.
   *
   * @default 0
   */
  depth: number;

  /**
   * The maximum depth to traverse when broadcasting the message.
   *
   * @default infinity
   */
  maxDepth: number;

  /**
   * The message payload containing the data to be sent.
   */
  payload?: Payload;

  /**
   * The message route to identify the message listener destination.
   */
  route: string;

  /**
   * The href of the window or frame that sent the original request.
   *
   * This may be different than the most recent sender's href if the request was broadcasted.
   */
  srcHref: string;

};

/**
 * Represents a request {@link MessageEvent} sent between windows or frames on a single content tab.
 *
 * @template Payload - The type of the message `payload`.
 */
export type WindowRequestEvent<Payload = unknown> = MessageEvent<WindowRequestMessage<Payload>>;

/**
 * Represents a handler for processing incoming window request {@link event} data.
 *
 * @param event - The incoming {@link WindowRequestEvent} to process.
 * @returns The response payload data to send back to the requester.
 */
export type WindowRequestHandler<Req = unknown, Resp = void>
  = (event: WindowRequestEvent<Req>) => Promise<Resp> | Resp;

/**
 * Represents a response message for a {@link WindowRequestEvent} sent between windows or frames on a single content tab.
 *
 * @template Payload - The type of the response `payload`.
 */
export interface WindowResponseMessage<Payload = unknown> {

  /**
   * The broadcast response messages from any child frames that processed the message.
   *
   * If there are no child frames that processed the message, this array will be empty.
   */
  broadcastMessages: WindowResponseMessage<Payload>[];

  /**
   * The current depth of the message result in the frame hierarchy.
   */
  depth: number;

  /**
   * An optional {@link Error} object if the message processing failed.
   */
  error?: Error;

  /**
   * The href of the window or frame that generated this result.
   */
  href: string;

  /**
   * The response payload containing the data from the response.
   */
  payload?: Payload;

  /**
   * The message route to identify the message listener destination.
   */
  route: string;

}

/**
 * Represents a response {@link MessageEvent} sent between windows or frames on a single content tab.
 *
 * @template Payload - The type of the response `payload`.
 */
export type WindowsResponseEvent<Payload = unknown> = MessageEvent<WindowResponseMessage<Payload>>;

/**
 * Represents the final aggregated response resulting from an initial {@link WindowRequest}.
 *
 * @template Payload - The type of the response `payload`.
 */
export interface WindowResponse<Payload = unknown> {

  /**
   * The flattened raw payload data from all Window responses (omits any error responses).
   */
  payload: Payload[];

  /**
   * The hierarchical {@link WindowResponseMessage} objects from all windows that processed the message.
   */
  messages: WindowResponseMessage<Payload>[];

}
