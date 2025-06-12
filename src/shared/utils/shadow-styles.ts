/**
 * Cache for CSSStyleSheets associated with a specific document.
 * 
 * Each document key is either the root document or an iframe document.
 * Adopted stylesheets cannot be used across different documents due to security restrictions.
 * 
 * Each value associated with a document contains a map of style strings to their corresponding CSSStyleSheet objects.
 * This allows for reusing styles without creating new CSSStyleSheet instances for the same styles.
 */
const documentSheets = new WeakMap<Document, Map<string, CSSStyleSheet>>();

/**
 * Injects CSS styles into a Shadow DOM.
 *
 * @param root ShadowRoot to inject styles into.
 * @param styles CSS styles to be injected.
 */
export function injectShadowStyles(root: ShadowRoot, styles: string) {
  try {
    if (!('adoptedStyleSheets' in Document.prototype))
      throw new Error('adoptedStyleSheets not supported');

    const ownerDocument = root.parentElement?.ownerDocument ?? document;
    if (!documentSheets.has(ownerDocument)) {
      documentSheets.set(ownerDocument, new Map<string, CSSStyleSheet>());
    }
    const sheets = documentSheets.get(ownerDocument)!;

    let sheet = sheets.get(styles);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);
      sheets.set(styles, sheet);
    }
    root.adoptedStyleSheets.push(sheet);
  } catch (error) { // Fallback for browsers that do not support adoptedStyleSheets (Firefox) or issues with iframe security.
    console.warn(error);
    const style = document.createElement('style');
    style.textContent = styles;
    root.appendChild(style);
  }
}
