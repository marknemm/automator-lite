import { deriveElementSelector } from './element-analysis.js';
import { getParentWindow, isSameOrigin } from '../../shared/utils/window.js';
import { createDeepTreeWalker, deepQuerySelectorAll, openOrClosedShadowRoot } from './deep-query.js';

/**
 * Gets the selector chain for the iframe containing the current window.
 * Each member is an ancestor iframe in order of descending hierarchy.
 *
 * Note: Cannot access ancestor iframes if they are cross-origin.
 *
 * @returns An array of strings representing the selector chain for the iframe.
 */
export function getIframeSelectorChain(): string[] {
  const chain: string[] = [];
  let currentWin: Window | null = window;

  while (currentWin) {
    const parentWin = getParentWindow(currentWin);
    if (parentWin) {
      const siblingIframes = Array.from(parentWin.document.querySelectorAll('iframe'));
      const iframe = siblingIframes.find((el) => el.contentWindow === currentWin);
      if (iframe) {
        const [iframeSelector] = deriveElementSelector(iframe);
        chain.unshift(iframeSelector);
      }
    }
    currentWin = parentWin;
  }

  return chain;
}

/**
 * Gets the embedded {@link Window} from a given chain of {@link iframeSelectors}.
 *
 * Note: If any of the iframes in the chain are `cross-origin`, this will fail with a log warning and return `null`.
 *
 * @param iframeSelectorChain An ordered array of selectors for the `iframes` to traverse.
 * @param win The {@link Window} to start the search from. Defaults to the current {@link window}.
 * @returns The embedded {@link Window} if found, otherwise `null`.
 */
export function getEmbeddedWindow(iframeSelectorChain: string[], win: Window = window): Window | null {
  for (let i = 0; i < iframeSelectorChain.length; i++) {
    const iframe = win.document.querySelector<HTMLIFrameElement>(iframeSelectorChain[i]);

    // If the iframe is not found or is cross-origin, log warning and return null.
    if (!isSameOrigin(iframe)) {
      const selectorChain = iframeSelectorChain.slice(0, i + 1).join(' > ');
      (iframe)
        ? console.warn(`Cross-origin iframe found for selector: ${selectorChain}`)
        : console.warn(`No iframe found for selector: ${selectorChain}`);
      return null;
    }

    win = iframe!.contentWindow!;
  }

  return win; // Found the embedded iframe window.
}

/**
 * Observes the document for added iframes and invokes a callback for each new iframe.
 *
 * @param callback A callback function that is invoked whenever a new iframe is added to the DOM.
 * @param root The root element to start observing for added iframes. Defaults to the {@link document}.
 * @returns The {@link MutationObserver} that has been initialized to observe added iframes.
 */
export function observeIframeAdditions(
  callback: (iframe: HTMLIFrameElement) => void,
  root: Document | Element = document
): MutationObserver {
  // Create a MutationObserver to watch for added iframes.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLIFrameElement) {
          callback(node);
        } else if (node instanceof Element) { // Check inside added subtrees.
          deepQuerySelectorAll<HTMLIFrameElement>('iframe', { root: node })
            .forEach((iframe) => callback(iframe));
        }
      });
    }
  });

  // Observe light DOM and all shadow DOMs.
  observer.observe(root, { childList: true, subtree: true });
  const deepTreeWalker = createDeepTreeWalker({
    root,
    filter: (node) => openOrClosedShadowRoot(node as HTMLElement) !== null,
  });
  for (const shadowRoot of deepTreeWalker) {
    observer.observe(shadowRoot, { childList: true, subtree: true });
  }

  return observer;
}
