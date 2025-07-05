/**
 * Represents an item in a button list.
 *
 * @param D - The type of data associated with the button item.
 */
export interface ButtonListItem<D = unknown> {

  /**
   * The unique identifier for the button item.
   */
  uid: string;

  /**
   * The data associated with the button item.
   */
  data?: D;

  /**
   * Whether the button is disabled.
   * @default false
   */
  disabled?: boolean;

}
