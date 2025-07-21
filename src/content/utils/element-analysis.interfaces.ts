export interface DeriveSelectorOptions {

  /**
   * A list of attributes to use for identifying elements.
   * Will be added to the end of the default identifying attributes.
   */
  identifyingAttributes?: string[];

  /**
   * Whether to derive the interactive element contained within the given element.
   * If `true`, the function will scan the hierarchy for the best interactive element candidate.
   * If `false`, the function will use the given element as-is.
   * 
   * This is useful for given elements that are selected by the user via click since the given target
   * element may not be the most interactive one.
   * 
   * Can customize the derivation of the element via {@link interactiveSelectors}.
   * 
   * @default false
   */
  interactiveElement?: boolean;

  /**
   * A list of selectors to use for identifying interactive elements.
   * Will be added to the end of the default interactive selectors.
   * 
   * Ignored if {@link interactiveElement} is `false`.
   */
  interactiveSelectors?: string[];

}
