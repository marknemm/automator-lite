const sheets = new Map<string, CSSStyleSheet>();

/**
 * Injects CSS styles into a Shadow DOM.
 *
 * @param root ShadowRoot to inject styles into.
 * @param styles CSS styles to be injected.
 */
export function injectShadowStyles(root: ShadowRoot, styles: string) {
  if ('adoptedStyleSheets' in Document.prototype) {
    let sheet = sheets.get(styles);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);
      sheets.set(styles, sheet);
    }
    root.adoptedStyleSheets.push(sheet);
  } else { // Fallback for browsers that do not support adoptedStyleSheets (Firefox)
    const style = document.createElement('style');
    style.textContent = styles;
    root.appendChild(style);
  }
}
