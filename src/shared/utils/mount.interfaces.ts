import type { RenderOptions, RootPart, TemplateResult } from 'lit-html';

/**
 * Options for creating a Shadow DOM root.
 * @extends RenderOptions
 * @extends ShadowRootInit
 */
export interface MountShadowTemplateOptions extends RenderOptions, ShadowRootInit {

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

}

/**
 * Resulting context of mounting a {@link Template}.
 */
export interface MountContext {

  /**
   * The {@link ShadowRoot} created for the mount element.
   * If the mount element is not a Shadow DOM host, this will be `undefined`.
   */
  shadowRoot?: ShadowRoot;

  /**
   * A top-level `ChildPart` returned from `render` that manages the connected state of
   * `AsyncDirectives` created throughout the tree below it.
   */
  rootPart: RootPart;

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

export type Template = string | HTMLElement | DocumentFragment | TemplateResult;
export type TemplateGenerator = (mountCtx: Omit<MountContext, 'rootPart'>) => Template;
