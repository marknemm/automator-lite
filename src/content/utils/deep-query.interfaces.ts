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

/**
 * Options for configuring deep tree walker behavior.
 *
 * @extends DeepQueryOptions
 */
export interface DeepTreeWalkerOptions extends DeepQueryOptions {

  /**
   * The type of nodes or elements to appear in the node list.
   *
   * @default NodeFilter.SHOW_ELEMENT
   * @see https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter
   */
  whatToShow?: number;

  /**
   * A filter predicate to apply to each node.
   *
   * If provided, it should return `true` for nodes to include, or `false` to exclude.
   * If not provided (default), all nodes will be included.
   *
   * Note: This filter is applied in addition to the `whatToShow` option.
   *
   * @param node The node to test.
   * @returns `true` if the node should be included, `false` otherwise.
   */
  filter?: (node: Node) => boolean;

}
