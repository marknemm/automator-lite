/**
 * Represents a message sent between windows or frames on a single content tab.
 *
 * @template Payload - The type of the message `payload`.
 */
export type WindowMessage<Payload = unknown> = MessageEvent<{

  /**
   * The message route to identify the message listener destination.
   */
  route: string;

  /**
   * The message payload containing the data to be sent.
   */
  payload: Payload;

  /**
   * An optional {@link Error} object if the message processing failed.
   */
  error?: Error;

}>;

/**
 * Represents a response to a {@link WindowMessage} sent between windows or frames on a single content tab.
 *
 * @template Payload - The type of the response `payload`.
 */
export interface WindowResponse<Payload = unknown> {

  /**
   * The response payload containing the data from the response.
   */
  payload?: Payload;

  /**
   * An optional {@link Error} object if the message processing failed.
   */
  error?: Error;

}
