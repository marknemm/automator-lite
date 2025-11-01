import { isSameOrigin } from '~shared/utils/window.js';
import type { DeepQueryOptions, DeepTreeWalkerOptions } from './deep-query.interfaces.js';
import { Nullish } from 'utility-types';

/**
 * Performs a deep query for an element matching the given selector within the document.
 * Will search through the entire page, including iframes and shadow DOMs, returning the first match found.
 *
 * NOTE: This does not preserve the order of elements in the DOM.
 * It performs a depth-first search in each document, but does not access any nested iframes or shadow DOMs
 * until the full containing document has been searched. Performs more of a layered depth-first search
 * where each layer segmented by iframe or Shadow DOM boundary is searched in its entirety before proceeding
 * to the next layer.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param opts {@link DeepQueryOptions} to customize the deep query behavior.
 * @returns The first matching element or `null` if no match is found.
 */
export function deepQuerySelector<T extends HTMLElement>(
  selector: string,
  opts: DeepQueryOptions = {}
): T | null {
  const root = opts.root ?? document;
  const result = root.querySelector<T>(selector);
  if (result) return result;

  if (!opts.omitShadows) {
    const shadowResults = deepQueryShadows<T>(selector, opts);
    if (shadowResults.length > 0) return shadowResults[0];
  }

  if (opts.includeIFrames) {
    const iframeResults = deepQueryIFrames<T>(selector, opts);
    if (iframeResults.length > 0) return iframeResults[0];
  }

  return null; // Return null if no results found in the root, iframes, or shadows.
}

/**
 * Performs a deep query for all elements matching the given selector within the document, including iframes and shadow DOMs.
 *
 * NOTE: This does not preserve the order of elements in the DOM.
 * It performs a depth-first search in each document, but does not access any nested iframes or shadow DOMs
 * until the full containing document has been searched. Performs more of a layered depth-first search.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param opts {@link DeepQueryOptions} to customize the deep query behavior.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
export function deepQuerySelectorAll<T extends HTMLElement>(
  selector: string,
  opts: DeepQueryOptions = {}
): T[] {
  const root = opts.root ?? document;
  const results = Array.from(root.querySelectorAll<T>(selector));
  if (!opts.omitShadows) {
    results.push(...deepQueryShadows<T>(selector, opts, true));
  }
  if (opts.includeIFrames) {
    results.push(...deepQueryIFrames<T>(selector, opts, true));
  }
  return results;
}

/**
 * Performs a deep query for all elements matching the given selector within shadow DOMs.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param opts {@link DeepQueryOptions} for configuring the deep query behavior.
 * @param findAll Whether to find all matching elements or just the first one. Defaults to `false`.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
function deepQueryShadows<T extends HTMLElement>(
  selector: string,
  opts: DeepQueryOptions,
  findAll = false
): T[] {
  const results: T[] = [];
  const root = opts.root ?? document;
  const treeWalker = genShadowWalker(root);

  while (treeWalker.nextNode()) {
    const element = treeWalker.currentNode as HTMLElement;
    const shadowRoot = openOrClosedShadowRoot(element)!; // Tree walker filter will ensure not null
    if (findAll) {
      const shadowResults = deepQuerySelectorAll<T>(selector, { ...opts, root: shadowRoot });
      results.push(...shadowResults);
    } else {
      const singleResult = deepQuerySelector<T>(selector, { ...opts, root: shadowRoot });
      if (singleResult) return [singleResult]; // Return immediately if a single result is found
    }
  }

  return results;
}

/**
 * Generates a {@link TreeWalker} for visiting top-level shadow DOMs.
 *
 * @param root The root element to start the search from. Defaults to {@link document}.
 * @returns A {@link TreeWalker} instance for visiting top-level shadow DOMs.
 */
function genShadowWalker(
  root: Document | Element | ShadowRoot = document
): TreeWalker {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, (node: Node) =>
    openOrClosedShadowRoot(node as HTMLElement)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_SKIP
  );
}

/**
 * Returns the open or closed {@link ShadowRoot} of a node, if it exists.
 * This is a cross-browser compatible way to access shadow roots.
 *
 * @param node The {@link Node} to check for a shadow root. Will ignore non-{@link HTMLElement} nodes.
 * @returns The {@link ShadowRoot} if it exists, otherwise `null`.
 */
export function openOrClosedShadowRoot(node: Node | Nullish): ShadowRoot | null {
  try {
    if (node instanceof HTMLElement) { // Roots can only be attached to HTMLElements
      return (chrome.dom && node instanceof HTMLElement)
        ? chrome.dom.openOrClosedShadowRoot(node) // Chrome
        : (node as any).openOrClosedShadowRoot(); // Firefox
    }
  } catch {} // Ignore errors related to accessing nodes that are technically HTMLElements but not supported

  return null; // Shadow root does not exist on this node
}

/**
 * Performs a deep query for all elements matching the given selector within iframes.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param opts {@link DeepQueryOptions} to customize the query behavior.
 * @param findAll Whether to find all matching elements or just the first one. Defaults to `false`.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
function deepQueryIFrames<T extends HTMLElement>(
  selector: string,
  opts: DeepQueryOptions,
  findAll = false
): T[] {
  const results: T[] = [];
  const root = opts.root ?? document;
  const iframes = Array.from(root.querySelectorAll('iframe'));

  for (const iframe of iframes) {
    try {
      if (iframe.contentWindow?.location.origin === window.location.origin && iframe.contentDocument) {
        if (findAll) {
          const iframeResults = deepQuerySelectorAll<T>(selector, { ...opts, root: iframe.contentDocument });
          results.push(...iframeResults);
        } else {
          const singleResult = deepQuerySelector<T>(selector, { ...opts, root: iframe.contentDocument });
          if (singleResult) return [singleResult]; // Return immediately if a single result is found
        }
      }
    } catch (error) {} // Ignore cross-origin iframe access errors
  }

  return results;
}

/**
 * Creates a deep tree walker which yields nodes that match the specified filter.
 * Will traverse the boundaries of shadow DOMs and iframes based on the provided options.
 *
 * `Note`: This performs a depth-first search and will preserve the order of elements in the DOM.
 *
 * @param opts {@link DeepTreeWalkerOptions} for configuring the deep tree walker.
 * @param opts.root The root element to start the search from. Defaults to {@link document}.
 * @param opts.whatToShow The type of nodes or elements to appear in the node list. Defaults to `NodeFilter.SHOW_ELEMENT`.
 * @param opts.filter A custom filter predicate function to use.
 * @param opts.includeIFrames Whether to include iframes in the search. Defaults to `false`.
 * @param opts.omitShadows Whether to omit shadow DOMs from the search. Defaults to `false`.
 * @returns A generator that yields nodes matching the specified filter and options.
 */
export function *createDeepTreeWalker({
  root = document,
  whatToShow = NodeFilter.SHOW_ELEMENT,
  filter = () => true,
  includeIFrames = false,
  omitShadows = false,
}: DeepTreeWalkerOptions = {}): Generator<Node> {
  const internalFilter = (node: Node): number => {
    return (
      filter(node)
      || (!omitShadows && openOrClosedShadowRoot(node as HTMLElement)) // Shadow DOMs
      || (includeIFrames && node instanceof HTMLIFrameElement && isSameOrigin(node)) // IFrames
    )
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_SKIP;
  };

  const walker = document.createTreeWalker(root, whatToShow, internalFilter);

  while (walker.nextNode()) {
    const { currentNode } = walker;

    if (filter(currentNode)) {
      yield currentNode; // Yield nodes that pass the supplied filter
    }

    // Dig into shadow DOM and yield internal nodes
    const shadowRoot = openOrClosedShadowRoot(currentNode as HTMLElement);
    if (!omitShadows && shadowRoot) {
      yield* createDeepTreeWalker({
        root: shadowRoot,
        whatToShow,
        filter,
        includeIFrames,
        omitShadows,
      });
    }

    // Dig into iframes and yield internal nodes
    if (includeIFrames && currentNode instanceof HTMLIFrameElement && isSameOrigin(currentNode)) {
      yield* createDeepTreeWalker({
        root: (currentNode as HTMLIFrameElement).contentDocument!,
        whatToShow,
        filter,
        includeIFrames,
        omitShadows,
      });
    }
  }
}

export type * from './deep-query.interfaces.js';
