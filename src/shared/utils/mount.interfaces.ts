import type { RenderOptions, RootPart, TemplateResult } from 'lit-html';

/**
 * Arguments for mounting a {@link Template} to a DOM element.
 * @extends MountOptions
 */
export interface MountArgs extends MountOptions {

  /**
   * The {@link MountPoint} to render the template to.
   * This can be a `CSS ID` (with or without the '#' prefix), an {@link HTMLElement}, or a {@link ShadowRoot}.
   */
  mountPoint: MountPoint;

  /**
   * The template to be rendered relative to the mount point.
   *
   * This can be a static {@link Template} or a {@link TemplateGenerator} function
   * that returns a {@link Template} based on the provided {@link MountContext}.
   */
  template: Template | TemplateGenerator;

}

/**
 * Options for rendering a template to a DOM element.
 */
export interface MountOptions {

  /**
   * The mount mode for the template.
   *
   * If specified, the template will be rendered to a dynamically mounted host `HTMLElement`.
   * If not specified (default), then renders directly to the mount point element, replacing all its content.
   *
   * - `append`: Appends the host element to the end of the mount element's children.
   * - `prepend`: Prepends the host element to the start of the mount element's children.
   * - `after`: Inserts the host element after the mount element.
   * - `before`: Inserts the host element before the mount element.
   */
  mountMode?: 'append' | 'prepend' | 'after' | 'before';

  /**
   * Options for initializing the Shadow DOM.
   * If set to `null`, the template will not be rendered into a Shadow DOM.
   * @default { mode: 'open' }
   */
  shadowRootInit?: ShadowRootInit;

  /**
   * {@link RenderOptions} for rendering the `lit-html` template.
   */
  renderOpts?: RenderOptions;

  /**
   * Callback function to be called before the template is rendered.
   * This can be used to perform any necessary setup or modifications to the context.
   * @param ctx The {@link MountContext} for the mount operation.
   */
  beforeRender?: (ctx: MountContext) => void;

  /**
   * Callback function to be called after the template is rendered.
   * @param result The {@link MountResult} of the mount operation.
   */
  afterRender?: (result: MountResult) => void;

}

/**
 * Context for mounting a {@link Template} to a DOM element.
 */
export interface MountContext {

  /**
   * The mounted host {@link HTMLElement} that the template or shadow root is rendered into.
   * If the {@link MountOptions.mountMode} is not specified, this will be the mount element itself.
   */
  hostElement: HTMLElement;

  /**
   * The {@link ShadowRoot} created for the mount element.
   * If the mount element is not a Shadow DOM host, this will be `undefined`.
   */
  shadowRoot?: ShadowRoot;

  /**
   * Refreshes the template in the DOM.
   * This will efficiently update the template without unmounting it.
   *
   * @param template - The {@link Template} to be rendered or a {@link TemplateGenerator} function that returns a {@link Template}.
   * @param onRefresh - A callback function to be called after the template is refreshed.
   * @returns The {@link MountResult} for chaining.
   */
  refresh: (template: Template | TemplateGenerator) => MountResult;

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
 * The {@link MountPoint} type represents an element to or around which a {@link Template} can be mounted.
 *
 * This can be a `CSS ID` ('#' prefix optional), {@link HTMLElement}, or {@link DocumentFragment}.
 */
export type MountPoint = string | HTMLElement | ShadowRoot;

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
