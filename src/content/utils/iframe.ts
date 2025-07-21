import { deriveElementSelector } from './element-analysis.js';
import { getParentWindow, isSameOrigin } from '../../shared/utils/window.js';

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
