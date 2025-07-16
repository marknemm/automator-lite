/**
 * Performs a deep query for an element matching the given selector within the document, including iframes and shadow DOMs.
 * Will search through the entire page, including iframes and shadow DOMs, returning the first match found.
 * 
 * NOTE: This does not preserve the order of elements in the DOM.
 * It performs a depth-first search in each document, but does not access any nested iframes or shadow DOMs
 * until the full containing document has been searched. Performs more of a layered depth-first search.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param root The root element to start the search from. Defaults to `document`.
 * @returns The first matching element or `null` if no match is found.
 */
export function deepQuerySelector<T extends HTMLElement>(
  selector: string,
  root: Document | Element | ShadowRoot = document
): T | null {
  const result = root.querySelector<T>(selector);
  if (result) return result;

  const iframeResults = deepQueryIFrames<T>(selector, root);
  if (iframeResults.length > 0) return iframeResults[0];

  const shadowResults = deepQueryShadows<T>(selector, root);
  if (shadowResults.length > 0) return shadowResults[0];

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
 * @param root The root element to start the search from. Defaults to `document`.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
export function deepQuerySelectorAll<T extends HTMLElement>(
  selector: string,
  root: Document | Element | ShadowRoot = document
): T[] {
  const results = Array.from(root.querySelectorAll<T>(selector));
  results.push(...deepQueryIFrames<T>(selector, root, true));
  results.push(...deepQueryShadows<T>(selector, root, true));
  return results;
}

/**
 * Performs a deep query for all elements matching the given selector within iframes.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param root The root element to start the search from. Defaults to `document`.
 * @param findAll Whether to find all matching elements or just the first one. Defaults to `false`.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
function deepQueryIFrames<T extends HTMLElement>(
  selector: string,
  root: Document | Element | ShadowRoot,
  findAll = false
): T[] {
  const results: T[] = [];
  const iframes = Array.from(root.querySelectorAll('iframe'));

  for (const iframe of iframes) {
    try {
      if (iframe.contentWindow?.location.origin === window.location.origin && iframe.contentDocument) {
        if (findAll) {
          const iframeResults = deepQuerySelectorAll<T>(selector, iframe.contentDocument);
          results.push(...iframeResults);
        } else {
          const singleResult = deepQuerySelector<T>(selector, iframe.contentDocument);
          if (singleResult) return [singleResult]; // Return immediately if a single result is found
        }
      }
    } catch (error) {} // Ignore cross-origin iframe access errors
  }

  return results;
}

/**
 * Performs a deep query for all elements matching the given selector within shadow DOMs.
 *
 * @param selector The selector to match elements against. Cannot cross shadow DOM or iframe boundaries.
 * @param root The root element to start the search from. Defaults to `document`.
 * @param findAll Whether to find all matching elements or just the first one. Defaults to `false`.
 * @returns An array of matching elements or an empty array if no matches are found.
 */
function deepQueryShadows<T extends HTMLElement>(
  selector: string,
  root: Document | Element | ShadowRoot,
  findAll = false
): T[] {
  const results: T[] = [];
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, (node: Node) =>
    openOrClosedShadowRoot(node as HTMLElement)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_SKIP
  );

  while (treeWalker.nextNode()) {
    const element = treeWalker.currentNode as HTMLElement;
    const shadowRoot = openOrClosedShadowRoot(element)!; // Tree walker filter will ensure not null
    if (findAll) {
      const shadowResults = deepQuerySelectorAll<T>(selector, shadowRoot);
      results.push(...shadowResults);
    } else {
      const singleResult = deepQuerySelector<T>(selector, shadowRoot);
      if (singleResult) return [singleResult]; // Return immediately if a single result is found
    }
  }

  return results;
}

/**
 * Returns the open or closed {@link ShadowRoot} of an element, if it exists.
 * This is a cross-browser compatible way to access shadow roots.
 *
 * @param element The element to check for a shadow root.
 * @returns The {@link ShadowRoot} if it exists, otherwise `null`.
 */
function openOrClosedShadowRoot(element: HTMLElement): ShadowRoot | null {
  return chrome.dom
    ? chrome.dom.openOrClosedShadowRoot(element) // Chrome
    : (element as any).openOrClosedShadowRoot(); // Firefox
}
