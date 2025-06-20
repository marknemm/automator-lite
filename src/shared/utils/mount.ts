import { render } from 'lit-html';
import type { MountContext, MountOptions, MountPoint, MountResult, Template, TemplateGenerator } from './mount.interfaces';

/**
 * A map of style strings to their corresponding CSSStyleSheet objects.
 * This allows for reusing styles without creating new CSSStyleSheet instances for the same styles.
 */
const cachedStyleSheets = new Map<string, CSSStyleSheet>();

/**
 * Mounts a `template` to a specified `mountPoint`.
 *
 * @param mountPoint - The {@link MountPoint} to mount the `template` to.
 * @param template - The {@link Template} to be rendered to the `mountPoint`,
 * or a {@link TemplateGenerator} function that returns a {@link Template}.
 * @param opts - {@link MountOptions} for the `template`.
 * @returns The {@link MountResult} of the mounted `template`.
 */
export function mountTemplate(
  mountPoint: MountPoint,
  template: Template | TemplateGenerator,
  opts: MountOptions = {},
): MountResult {
  // Derive the host element to render the template into and attach shadow DOM if configured.
  const hostElement: HTMLElement = mountHostElement(mountPoint, opts);
  const shadowRoot = opts.shadowRootInit
    ? hostElement.attachShadow(opts.shadowRootInit)
    : undefined;

  // Build the mount context used for rendering the template.
  const mountCtx: MountContext = {
    hostElement,
    shadowRoot,
    refresh: (newTemplate: Template | TemplateGenerator) => {
      opts.beforeRender?.(mountCtx);
      if (typeof newTemplate === 'function') {
        newTemplate = newTemplate(mountCtx);
      }

      const rootPart = render(newTemplate, shadowRoot ?? hostElement, opts);
      injectStyles(shadowRoot ?? hostElement, ...(opts.styles ? [opts.styles].flat() : []));
      const mountResult: MountResult = { ...mountCtx, rootPart };

      opts.afterRender?.(mountResult);
      return mountResult;
    },
    unmount: () => (hostElement === mountPoint) // Do not remove mount point itself
      ? render('', mountCtx.hostElement, opts) // Clear content
      : hostElement.remove(), // Remove the host element - it was created relative to mount point
  };

  // Render the initial template into the host element or shadow root.
  return mountCtx.refresh(template);
}

/**
 * Mounts the host {@link HTMLElement} that the {@link Template} will be rendered into.
 *
 * @param mountPoint - The {@link MountPoint} to mount the host element to.
 * @param opts - The {@link MountOptions} for mounting the host element.
 * @returns The mounted host {@link HTMLElement}.
 */
function mountHostElement(
  mountPoint: MountPoint,
  opts: MountOptions,
): HTMLElement {
  // Derive the mount element from the mount point.
  const mountElement: HTMLElement | ShadowRoot | null = (typeof mountPoint === 'string')
    ? document.getElementById(mountPoint.replace('#', ''))
    : mountPoint;
  if (!mountElement) throw new Error(`Mount element with id "${mountPoint}" not found`);

  // If hostMode is specified, create host element to position relative to mount point.
  const hostElement = opts.hostMode
    ? document.createElement(opts.hostTagName || 'div')
    : mountElement instanceof ShadowRoot
      ? mountElement.host as HTMLElement
      : mountElement; // Otherwise, use the mount element itself.
  setupHostAttributes(hostElement, opts);

  // Mount the host element to the specified mount point based on the hostMode.
  switch (opts.hostMode) {
    case 'append':  mountElement.appendChild(hostElement); break;
    case 'prepend': mountElement.prepend(hostElement); break;
    case 'before':  mountElement.parentElement?.insertBefore(hostElement, mountElement); break;
    case 'after':   mountElement.parentElement?.insertBefore(hostElement, mountElement.nextSibling); break;
  }

  return hostElement;
}

/**
 * Sets up the attributes of the host element.
 *
 * @param hostElement - The {@link HTMLElement} to set attributes on.
 * @param opts - The {@link MountOptions} containing the attributes to set.
 */
function setupHostAttributes(
  hostElement: HTMLElement,
  opts: MountOptions,
): void {
  if (opts.hostId) {
    hostElement.id = opts.hostId;
  }

  if (opts.hostClass?.length) {
    hostElement.classList.add(...(
      (typeof opts.hostClass === 'string')
        ? opts.hostClass.split(/\s+/)
        : opts.hostClass
    ));
  }

  if (opts.hostAttributes) {
    for (const attr in opts.hostAttributes) {
      hostElement.setAttribute(attr, opts.hostAttributes[attr]);
    }
  }
}

/**
 * Injects CSS styles into a Shadow DOM.
 *
 * @param root - {@link ShadowRoot} to inject styles into.
 * @param styles - CSS styles to be injected.
 */
export function injectStyles(
  root: ShadowRoot | Element,
  ...styles: string[]
): void {
  for (const styleStr of styles) {
    if (!styleStr) continue; // Skip empty styles

    // Check if the browser supports adoptedStyleSheets (Chromium or Safari).
    if ('adoptedStyleSheets' in Document.prototype && root instanceof ShadowRoot) {
      let sheet = cachedStyleSheets.get(styleStr);
      if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(styleStr);
        cachedStyleSheets.set(styleStr, sheet);
      }
      if (!root.adoptedStyleSheets.includes(sheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      }
    } else { // Light DOM or fallback for browsers that do not support adoptedStyleSheets (Firefox).
      if (!Array.from(root.children).some(child => child.tagName === 'style' && child.textContent === styleStr)) {
        const style = document.createElement('style');
        style.textContent = styleStr;
        root.prepend(style);
      }
    }
  }
}

export type * from './mount.interfaces';
