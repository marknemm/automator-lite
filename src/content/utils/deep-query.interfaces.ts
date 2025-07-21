/**
 * Options for configuring deep query behavior.
 */
export interface DeepQueryOptions {

  /**
   * Whether to include iframes in the search. Defaults to `false`.
   */
  includeIFrames?: boolean;

  /**
   * Whether to omit shadow DOMs from the search. Defaults to `false`.
   */
  omitShadows?: boolean;

  /**
   * The root element to start the search from. Defaults to `document`.
   */
  root?: Document | Element | ShadowRoot;

}
