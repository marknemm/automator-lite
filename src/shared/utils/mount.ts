import { render, type ElementPart } from 'lit-html';
import { Directive, directive, type DirectiveResult } from 'lit-html/directive.js';
import type { MountArgs, MountContext, MountPoint, MountResult, Template, TemplateGenerator } from './mount.interfaces';

/**
 * A {@link Map} of style strings to their corresponding {@link CSSStyleSheet} objects.
 * This allows for reusing styles without creating new {@link CSSStyleSheet} instances for the same styles.
 */
const cachedStyleSheets = new Map<string, CSSStyleSheet>();

/**
 * Mounts a `template` to a specified `mountPoint`.
 *
 * @param mountPoint - The {@link MountPoint} to mount the `template` to.
 * This can be a `CSS ID` (with or without '#'), {@link HTMLElement}, or {@link ShadowRoot}.
 * @param mountMode - The mode to mount the host element relative to the `mountPoint`.
 * This can be 'append', 'prepend', 'after', or 'before'.
 * If not specified, the host element will be mounted directly to the `mountPoint`.
 * @param template - The {@link Template} to be rendered or a {@link TemplateGenerator} function that returns a {@link Template}.
 * @param shadowRootInit - Optional initialization options for the Shadow DOM.
 * If set to `null`, no Shadow DOM will be created.
 * @param beforeRender - Optional callback function to be called before the template is rendered.
 * This can be used to perform any necessary setup or modifications to the context.
 * @param afterRender - Optional callback function to be called after the template is rendered.
 * @param renderOpts - The {@link RenderOptions} for rendering the template.
 * @returns The {@link MountResult} of the mounted `template`.
 * @example
 * ```typescript
 * import { mountTemplate, host } from '~shared/utils/mount';
 * import myTemplate from './my-template.js';
 * import myStyles from './my-styles.scss?inline';  // Import styles as inline CSS
 *
 * // Mount the template to an element with ID 'my-mount-point'
 * mountTemplate({
 *   mountPoint: 'my-mount-point',
 *   template: (ctx) => html`
 *     <template ${host(myStyles)} class="my-component-host"></template>
 *
 *     <div class="my-component-content">
 *       ${myTemplate(ctx)}
 *     </div>
 *   `,
 *   mountMode: 'append', // Append the host element to the mount point
 *   shadowRootInit: { mode: 'open' }, // Create an open Shadow DOM
 *   beforeRender: (ctx) => {
 *     // Perform any setup before rendering the template
 *     console.log('Before render:', ctx);
 *   },
 *   afterRender: (result) => {
 *     // Perform any actions after the template has been rendered
 *     console.log('After render:', result);
  *  },
 * });
 * ```
 * @see {@link MountArgs} for the arguments structure.
 * @see {@link MountResult} for the result structure.
 */
export function mountTemplate({
  mountPoint,
  mountMode,
  template,
  shadowRootInit = { mode: 'open' },
  beforeRender,
  afterRender,
  renderOpts,
}: MountArgs): MountResult {
  // Derive the host element to render the template into and attach shadow DOM if configured.
  const hostElement = mountHostElement(mountPoint, mountMode);
  const shadowRoot = shadowRootInit !== null // Must set to `null` to disable Shadow DOM.
    ? hostElement.attachShadow(shadowRootInit ?? { mode: 'open' })
    : undefined;

  // Build the mount context used for rendering the template.
  const mountCtx: MountContext = {
    hostElement,
    shadowRoot,
    refresh: (newTemplate: Template | TemplateGenerator) => {
      beforeRender?.(mountCtx);
      if (typeof newTemplate === 'function') {
        newTemplate = newTemplate(mountCtx);
      }

      const rootPart = render(newTemplate, shadowRoot ?? hostElement, renderOpts);
      const mountResult: MountResult = { ...mountCtx, rootPart };

      afterRender?.(mountResult);
      return mountResult;
    },
    unmount: () => (hostElement === mountPoint) // Do not remove mount point itself
      ? render('', mountCtx.hostElement, renderOpts) // Clear content
      : hostElement.remove(), // Remove the host element - it was created relative to mount point
  };

  // Render the initial template into the host element or shadow root.
  return mountCtx.refresh(template);
}

/**
 * Mounts the host {@link HTMLElement} that the {@link Template} will be rendered into.
 *
 * @param mountPoint - The {@link MountPoint} to mount the host element to.
 * @param mountMode - The mode to mount the host element relative to the `mountPoint`.
 * This can be 'append', 'prepend', 'after', or 'before'.
 * If not specified, the host element will be mounted directly to the `mountPoint`.
 * @returns The mounted host {@link HTMLElement}.
 */
function mountHostElement(
  mountPoint: MountPoint,
  mountMode: 'append' | 'prepend' | 'after' | 'before' | undefined = undefined,
): HTMLElement {
  // Derive the mount element from the mount point.
  const mountElement: HTMLElement | ShadowRoot | null = (typeof mountPoint === 'string')
    ? document.getElementById(mountPoint.replace('#', ''))
    : mountPoint;
  if (!mountElement) throw new Error(`Mount element with id "${mountPoint}" not found`);

  // If hostMode is specified, create host element to position relative to mount point.
  const hostElement = mountMode
    ? document.createElement('div')
    : mountElement instanceof ShadowRoot
      ? mountElement.host as HTMLElement
      : mountElement; // Otherwise, use the mount element itself.

  hostElement.dataset.host = mountMode || 'replace'; // Store host mode for reference.

  // Mount the host element to the specified mount point based on the hostMode.
  switch (mountMode) {
    case 'append':  mountElement.appendChild(hostElement); break;
    case 'prepend': mountElement.prepend(hostElement); break;
    case 'before':  mountElement.parentElement?.insertBefore(hostElement, mountElement); break;
    case 'after':   mountElement.parentElement?.insertBefore(hostElement, mountElement.nextSibling); break;
  }

  return hostElement;
}

/**
 * Directive to apply styles and attributes to the host element.
 * This directive injects the provided styles into the host element's Shadow DOM or Light DOM.
 * @param styles The CSS styles to apply to the host element.
 * @returns A {@link DirectiveResult} for the host element.
 * @example
 * ```typescript
 * html`
 *   <template
 *     ${host(styles)}
 *     id="component-host"
 *     class="component-container"></template>
 *
 *   <div class="component-content">
 *     <!-- Component content goes here -->
 *   </div>
 * `
 * ```
 */
export function host(...styles: string[]): DirectiveResult {
  return directive(class extends Directive {
    render() { return ''; }
    update({ element }: ElementPart) {
      // Hide all elements within the template until styles and attributes are applied.
      for (const child of Array.from(element.parentNode?.children ?? [])) {
        if (child instanceof HTMLElement && child !== element) {
          child.style.display = 'none'; // Hide all sibling elements of the host element.
        }
      }

      // Wait for the host template element to be rendered in the DOM so we can derive its context.
      setTimeout(() => {
        // Derive the root node and host element from the part element's context in the DOM.
        const root = element.getRootNode();
        const host = element.parentNode instanceof ShadowRoot
          ? element.parentNode.host
          : element.parentElement;

        // If inside Shadow DOM, must inject component styles into the shadow root.
        if (root instanceof ShadowRoot) {
          injectStyles(root, ...styles);
        }

        // Apply attributes if the template was rendered to a mounted host element.
        if (host && host.hasAttribute('data-host')) {
          if (element.id) {
            host.id = element.id;
          }

          if (element.classList.length) {
            host.classList.add(...Array.from(element.classList));
          }

          for (const attr of element.getAttributeNames()) {
            host.setAttribute(attr, element.getAttribute(attr)!);
          }
        }

        // Show all elements within the rendered template.
        for (const child of Array.from(element.parentNode?.children ?? [])) {
          if (child instanceof HTMLElement) {
            child.style.display = ''; // Show all sibling elements of the host element.
            if (child.getAttribute('style')?.trim() === '') {
              child.removeAttribute('style'); // Remove empty style attributes.
            }
          }
        }
        element.remove(); // Remove the host element after applying styles and attributes.
      });
      return this.render();
    }
  })();
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
