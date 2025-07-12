import { nothing, type ChildPart, type ElementPart, type Part } from 'lit';
import { Directive, directive, type DirectiveResult } from 'lit/directive.js';
import { getNearestMountCtx, injectStyles } from '~shared/utils/mount.js';

/**
 * Directive to inject component CSS styles into the nearest mounted root node (Shadow DOM or Light DOM).
 *
 * Should prefer using LitElement with static styles instead of this directive.
 * This should only be used for raw lit-html templates that do not use LitElement.
 *
 * @param styles - CSS style string(s) to be injected.
 * @returns A {@link DirectiveResult} for the host element.
 * @example
 * ```typescript
 * html`
 *   ${withStyles(cssStyleStr)}
 *
 *   <div class="component-content">
 *     <!-- Component content goes here -->
 *   </div>
 * `
 * ```
 */
export function withStyles(...styles: string[]): DirectiveResult {
  return directive(
    class extends Directive {
      render() { return nothing; }
      update(part: Part) {
        const startNode = (part as ChildPart).startNode
                       ?? (part as ElementPart).element;
        const mountCtx = getNearestMountCtx();

        (mountCtx)
          // Inject styles into mount context before rendering.
          ? injectStyles(mountCtx.shadowRoot ?? mountCtx.hostElement, ...styles)
          // If no mount context, need to wait for the template to render before injecting styles.
          : setTimeout(() => injectStyles(startNode, ...styles));

        return this.render();
      }
    }
  )();
}
