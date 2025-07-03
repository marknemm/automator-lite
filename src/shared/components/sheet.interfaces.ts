import type { TemplateResult } from 'lit';

/**
 * Options for configuring the sheet behavior.
 */
export interface SheetOptions {

  /**
   * Set to `true` to prevent the auto-focus behavior on the first input element in the sheet.
   * @default false
   */
  noFocus?: boolean;

  /**
   * Set to `true` to prevent the sheet from closing when the Escape key is pressed.
   * @default false
   */
  noCloseOnEscape?: boolean;

}

/**
 * Contextual data for controlling the sheet.
 */
export interface SheetContext<T = unknown> {

  /**
   * The {@link ShadowRoot} element of the sheet, which can be used to manipulate the sheet's DOM.
   */
  sheetRoot: ShadowRoot;

  /**
   * Function to close the sheet and execute the onClose callback.
   *
   * @param data - Optional data to pass to the onClose callback.
   */
  closeSheet: (data?: T) => void;

  /**
   * Function to refresh the sheet content with a new template.
   *
   * @param template - The new {@link TemplateResult} to render inside the sheet.
   * @param refocus - Optional flag to refocus the first input element after refreshing. Defaults to `false`.
   */
  refreshSheet: (template: TemplateResult, refocus?: boolean) => void;

  /**
   * A `Promise` that resolves to the data passed to the {@link closeSheet} function when the sheet is closed.
   */
  onSheetClose: Promise<T | undefined>;

}
