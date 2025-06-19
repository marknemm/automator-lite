import type { RenderOptions, RootPart, TemplateResult } from 'lit-html';

/**
 * Options for creating a Shadow DOM root.
 * @extends RenderOptions
 * @extends ShadowRootInit
 */
export interface ShadowRenderOptions extends RenderOptions, ShadowRootInit {

  /**
   * An array of CSS styles to be injected into the Shadow DOM.
   * If not provided, no styles will be injected.
   */
  styles?: string | string[];

  /**
   * The root element to be used for the Shadow DOM.
   * If not provided, a new div will be created and appended to the mount element.
   */
  rootElement?: HTMLElement;

  /**
   * The ID to be assigned to the root element.
   * If not provided, the ID of the root element will remain unchanged.
   */
  rootId?: string;

  /**
   * CSS class(es) to be applied to the root element.
   * Will be added to any existing classes on the root element.
   * If not provided, no additional classes will be applied.
   */
  rootClass?: string;

}

/**
 * Context for mounting a {@link Template} to a DOM element.
 */
export interface MountContext {

  /**
   * The {@link ShadowRoot} created for the mount element.
   * If the mount element is not a Shadow DOM host, this will be `undefined`.
   */
  shadowRoot?: ShadowRoot;

  /**
   * Refreshes the template in the DOM.
   * This will efficiently update the template without unmounting it.
   */
  refresh: (template: Template | TemplateGenerator) => MountContext;

  /**
   * Unmounts the template from the DOM.
   * This will remove the Shadow DOM root if it was created.
   */
  unmount: () => void;

}

/**
 * Result of mounting a {@link Template}.
 *
 * @extends MountContext
 */
export interface MountResult extends MountContext {

  /**
   * A top-level `ChildPart` returned from `render` that manages the connected state of
   * `AsyncDirectives` created throughout the tree below it.
   */
  rootPart: RootPart;

}

/**
 * The {@link MountElement} type represents an element to which a {@link Template} can be mounted.
 *
 * This can be a `CSS ID` ('#' prefix optional), {@link HTMLElement}, or {@link DocumentFragment}.
 */
export type MountElement = string | HTMLElement | DocumentFragment;

/**
 * The {@link Template} type represents a template that can be rendered in or mounted to the DOM.
 *
 * This can be an `HTML string`, {@link HTMLElement}, {@link DocumentFragment}, or a `lit-html` {@link TemplateResult}.
 */
export type Template = string | HTMLElement | DocumentFragment | TemplateResult;

/**
 * A function that generates a {@link Template} based on the provided {@link MountContext}.
 * This is useful for creating dynamic templates that depend on the context in which they are mounted.
 *
 * @param ctx - The {@link MountContext} providing contextual data for generating the template.
 * @returns A {@link Template} to be rendered.
 */
export type TemplateGenerator = (ctx: MountContext) => Template;
