import { render } from 'lit';
import type { MountArgs, MountContext, MountPoint, MountResult, Template, TemplateGenerator } from './mount.interfaces.js';

/**
 * A {@link Map} of style strings to their corresponding {@link CSSStyleSheet} objects.
 * This allows for reusing styles without creating new {@link CSSStyleSheet} instances for the same styles.
 */
const cachedStyleSheets = new Map<string, CSSStyleSheet>();

/**
 * A stack of {@link MountContext} objects for tracking the nearest ancestor mount root
 * that a template is being rendered into.
 */
const mountCtxStack: MountContext[] = [];

/**
 * Retrieves the nearest {@link MountContext} from the stack.
 * This is useful for accessing the current rendering context, such as the host element,
 * shadow root, and refresh/unmount methods.
 * @returns The nearest {@link MountContext} from the stack, or `undefined` if the stack is empty.
 */
export function getNearestMountCtx(): MountContext | undefined {
  return mountCtxStack.length
    ? mountCtxStack[mountCtxStack.length - 1]
    : undefined;
}

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
 * If `undefined`, no Shadow DOM will be created.
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
  shadowRootInit,
  beforeRender,
  afterRender,
  renderOpts,
}: MountArgs): MountResult {
  // Derive the host element to render the template into and attach shadow DOM if configured.
  const hostElement = mountHostElement(mountPoint, mountMode);
  const shadowRoot = shadowRootInit
    ? hostElement.attachShadow(shadowRootInit)
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

      mountCtxStack.push(mountCtx); // Push the current context to the stack.
      const rootPart = render(newTemplate, shadowRoot ?? hostElement, renderOpts);
      const mountResult: MountResult = { ...mountCtx, rootPart };
      mountCtxStack.pop(); // Pop the context from the stack after rendering.

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
 * Injects CSS styles into a Shadow DOM.
 *
 * @param node - {@link Node} to inject styles into.
 * If this is not a {@link Document} or {@link ShadowRoot}, it will derive the root node from the provided element.
 * @param styles - CSS styles to be injected.
 */
export function injectStyles(
  node: Node,
  ...styles: string[]
): void {
  // Try to derive the root node from the provided element.
  const root = (node instanceof Document || node instanceof ShadowRoot)
    ? node
    : node.getRootNode() instanceof ShadowRoot
      ? node.getRootNode() as ShadowRoot
      : document;

  for (const styleStr of styles) {
    if (!styleStr) continue; // Skip empty styles

    // Check if the browser supports adoptedStyleSheets (Chromium or Safari).
    if ('adoptedStyleSheets' in Document.prototype) {
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
      if (!Array.from(root.querySelectorAll('>style')).some(child => child.textContent === styleStr)) {
        const style = document.createElement('style');
        style.textContent = styleStr;
        root.prepend(style);
      }
    }
  }
}

export type * from './mount.interfaces.js';
