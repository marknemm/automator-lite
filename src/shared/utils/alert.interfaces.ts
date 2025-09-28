import type { Template } from './mount.interfaces.js';

/**
 * An interface representing an alert notification that will be presented to the user in a modal or toast.
 */
export interface Alert {

  /**
   * Defines the buttons to display for dismissing the notification.
   * Can be an array of {@link DismissalButton} objects or a string indicating a default set of buttons.
   *
   * Possible string values:
   * - 'Confirm': Displays `Confirm` (checkmark) and `Cancel` (cross) buttons.
   * - 'OK': Displays an `OK` button.
   *
   * @default 'OK'
   */
  dismissalButtons?: Template | 'Confirm' | 'OK';

  /**
   * The timeout duration, in milliseconds, for the notification to be dismissed automatically.
   * Only applicable if {@link dismissalType} is `auto`.
   *
   * @default 5000 // 5 seconds
   */
  dismissalTimeout?: number;

  /**
   * The type of dismissal for the notification.
   *
   * Can be one of:
   * - `auto`: The notification will automatically disappear after a short period.
   * - `manual`: The user must manually dismiss the notification.
   */
  dismissalType?: 'auto' | 'manual';

  /**
   * The message body of the notification.
   */
  message: Template;

  /**
   * The type of notification.
   */
  theme: 'info' | 'warning' | 'danger' | 'success';

  /**
   * The title of the notification.
   */
  title: Template;

}
