export function deepQuerySelectorAll<T extends HTMLElement>(
  selector: string,
  root: Document | ShadowRoot = document
): T[] {
  const results = Array.from(root.querySelectorAll<T>(selector));
  results.push(...deepQueryIFrames<T>(selector, root));
  results.push(...deepQueryShadows<T>(selector, root));
  return results;
}

function deepQueryIFrames<T extends HTMLElement>(
  selector: string,
  root: Document | ShadowRoot
): T[] {
  const results: T[] = [];
  const iframes = Array.from(root.querySelectorAll('iframe'));

  for (const iframe of iframes) {
    try {
      if (iframe.contentWindow?.location.origin === window.location.origin && iframe.contentDocument) {
        const iframeResults = deepQuerySelectorAll<T>(selector, iframe.contentDocument);
        results.push(...iframeResults);
      }
    } catch (error) {} // Ignore cross-origin iframe access errors
  }

  return results;
}


function deepQueryShadows<T extends HTMLElement>(
  selector: string,
  root: Document | ShadowRoot
): T[] {
  const results: T[] = [];
  const shadowWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, (node: Node) =>
    (node as Element).shadowRoot ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  );

  while (shadowWalker.nextNode()) {
    const node = shadowWalker.currentNode as HTMLElement;
    if (node.shadowRoot) {
      const shadowResults = deepQuerySelectorAll<T>(selector, node.shadowRoot);
      results.push(...shadowResults);
    }
  }

  return results;
}

function openShadowDOM(element: HTMLElement): ShadowRoot | null {
  return chrome.dom
    ? chrome.dom.openOrClosedShadowRoot(element) // Chrome
    : (element as any).openOrClosedShadowRoot(); // Firefox
}
