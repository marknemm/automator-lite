import { render, RenderOptions } from 'lit-html';
import type { MountContext, MountShadowTemplateOptions, Template, TemplateGenerator } from './mount.interfaces';

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
 * Mounts a template to a specified element.
 *
 * @param mountTo - The element to mount the `template` to or its ID.
 * @param template - The {@link Template} to be rendered to the `mount` element,
 * or a {@link TemplateGenerator} function that returns a {@link Template}.
 * @param opts - {@link RenderOptions} for the `template`.
 * @returns The {@link MountContext} of the mounted `template`.
 */
export function mountTemplate(
  mountTo: string | HTMLElement | DocumentFragment,
  template: Template | TemplateGenerator,
  opts: RenderOptions = {},
): MountContext {
  const mountElement: HTMLElement | DocumentFragment | null = (typeof mountTo === 'string')
    ? document.getElementById(mountTo.replace('#', ''))
    : mountTo;

  if (!mountElement) throw new Error(`Host element with id "${mountTo}" not found`);

  const mountCtx: MountContext = {
    rootPart: undefined!, // Will be initialized just below.
    shadowRoot: mountElement instanceof ShadowRoot
      ? mountElement
      : undefined,
    refresh: (newTemplate: Template | TemplateGenerator) => {
      if (typeof newTemplate === 'function') {
        newTemplate = newTemplate(mountCtx);
      }
      mountCtx.rootPart = render(newTemplate, mountElement, opts);
      return mountCtx;
    },
    unmount: () => mountElement instanceof ShadowRoot
      ? mountElement.host.remove()
      : render('', mountElement, opts),
  };

  if (typeof template === 'function') {
    template = template(mountCtx);
  }
  mountCtx.rootPart = render(template, mountElement, opts);

  return mountCtx;
}

/**
 * Mounts a shadow DOM root to the specified element and then mounts the `template` to a Shadow DOM.
 *
 * @param mountTo - The element to mount the shadow root host element to or its ID.
 * @param template - The {@link Template} to be rendered inside the Shadow DOM,
 * or a {@link TemplateGenerator} function that returns a {@link Template}.
 * @param opts - {@link MountShadowTemplateOptions} for the Shadow DOM. Defaults to `{ mode: 'open' }`.
 * @returns The {@link MountContext} of the mounted `template`.
 */
export function mountShadowTemplate(
  mountTo: string | HTMLElement | DocumentFragment,
  template: Template | TemplateGenerator,
  opts: MountShadowTemplateOptions = { mode: 'open' },
): MountContext {
  const shadowRoot = mountShadowRoot(mountTo, opts);
  return mountTemplate(shadowRoot, template, opts);
}

/**
 * Mounts a Shadow DOM root to a specified element.
 *
 * @param mountTo - The element to mount the shadow root host element to or its ID.
 * @param opts - {@link MountShadowTemplateOptions} for the Shadow DOM. Defaults to `{ mode: 'open' }`.
 * @returns The {@link ShadowRoot} created for the mount element.
 */
export function mountShadowRoot(
  mountTo: string | HTMLElement | DocumentFragment,
  opts: MountShadowTemplateOptions = { mode: 'open' },
): ShadowRoot {
  const mountElement: HTMLElement | DocumentFragment | null = (typeof mountTo === 'string')
    ? document.getElementById(mountTo.replace('#', ''))
    : mountTo;

  if (!mountElement) throw new Error(`Host element with id "${mountTo}" not found`);

  const rootElement = opts.rootElement ?? document.createElement('div');
  rootElement.id = opts.rootId || rootElement.id;
  mountElement.appendChild(rootElement);

  const shadowRoot = rootElement.attachShadow(opts);
  injectShadowStyles(shadowRoot, ...[opts.styles].flat().filter(Boolean) as string[]);
  return shadowRoot;
}

/**
 * Injects CSS styles into a Shadow DOM.
 *
 * @param root - {@link ShadowRoot} to inject styles into.
 * @param styles - CSS styles to be injected.
 */
export function injectShadowStyles(root: ShadowRoot, ...styles: string[]) {
  for (const styleStr of styles) {
    if (!styleStr) continue; // Skip empty styles
    try {
      if (!('adoptedStyleSheets' in Document.prototype))
        throw new Error('adoptedStyleSheets not supported');

      const ownerDocument = root.parentElement?.ownerDocument ?? document;
      if (!documentSheets.has(ownerDocument)) {
        documentSheets.set(ownerDocument, new Map<string, CSSStyleSheet>());
      }
      const sheets = documentSheets.get(ownerDocument)!;

      let sheet = sheets.get(styleStr);
      if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(styleStr);
        sheets.set(styleStr, sheet);
      }
      root.adoptedStyleSheets.push(sheet);
    } catch (error) { // Fallback for browsers that do not support adoptedStyleSheets (Firefox) or issues with iframe security.
      console.warn(error);
      const style = document.createElement('style');
      style.textContent = styleStr;
      root.appendChild(style);
    }
  }
}

export type * from './mount.interfaces';
