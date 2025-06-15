import { TemplateResult } from 'lit-html';

/**
 * Represents an item in a button list.
 */
export interface ButtonListItem {

  /**
   * The unique identifier for the button item.
   */
  uid: string;

  /**
   * The template or string content to be displayed inside the button.
   * If not provided, a default template will be used that renders the {@link uid}.
   */
  contents?: TemplateResult | string;

  /**
   * The action to be performed when the button is clicked.
   */
  action: () => void | Promise<void>;

  /**
   * Whether the button is disabled.
   * @default false
   */
  disabled?: boolean;

}
