import { deepQuerySelector } from '~content/utils/deep-query.js';
import type { DeriveSelectorOptions } from './element-analysis.interfaces.js';

const identifyingAttributes = [
  'aria-label',
  'aria-labelledby',
  'href',
  'id',
  'name',
  'title',
];

const interactiveAttributes = [
  'aria-haspopup',
  'aria-expanded',
  'aria-pressed',
  'aria-checked',
  'aria-selected',
  'aria-controls',
];

const interactiveRoles = [
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'option',
  'radio',
  'switch',
  'tab',
  'treeitem',
];

const interactiveTags = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
];

/**
 * Derives a unique identifying CSS selector for a given {@link element} based on its hierarchy.
 * 
 * @param element - The {@link Element} to derive the selector for.
 * @param options - {@link DeriveSelectorOptions} to customize the selector derivation.
 * @returns A tuple containing the derived selector as a string and the content of the {@link }.
 */
export function deriveElementSelector(element: Element, options: DeriveSelectorOptions = {}): [string, string] {
  // Scan hierarchy for best interactive element candidate.
  const targetElement = options.interactiveElement
    ? scanHierarchyForInteractiveElement(element, options)
    : element;

  // Scan hierarchy for best identifying element candidate.
  const [
    identifyingElement,
    identifyingRelationship,
  ] = scanHierarchyForIdentifyingElement(targetElement, options);

  const identifyingSelector = deriveSingularSelector(identifyingElement);

  // Generate the best selector based on the relationship between both elements.
  const selector = (identifyingRelationship === 'ancestor')
    ? `${identifyingSelector} ${deriveSingularSelector(targetElement)}`
    : identifyingSelector;

  // Include query index in the result in case of multiple matches.
  return [
    selector,
    targetElement.textContent || targetElement.innerHTML,
  ];
}

/**
 * Scans the hierarchy of the given element for an ancestor or child element
 * with an ID, aria-label, or interactive role.
 *
 * @param element - The starting point {@link Element} from which to scan.
 * @returns The first ancestor or child element with an ID, aria-label, or interactive role.
 * If no such element is found, returns the original element.
 */
function scanHierarchyForInteractiveElement(
  element: Element,
  options: DeriveSelectorOptions
): Element {
  const interactiveLookupSel = [
    ...interactiveTags,
    ...interactiveRoles.map(role => `[role="${role}"]`),
    ...interactiveAttributes.map(attr => `[${attr}]`),
    ...(options.interactiveSelectors || []),
  ].join(', ');

  const interactiveAncestor = element.closest(interactiveLookupSel);
  if (interactiveAncestor && elementBounded(interactiveAncestor, element)) {
    return interactiveAncestor;
  }

  const interactiveChild = deepQuerySelector(interactiveLookupSel, { root: element });
  if (interactiveChild && elementBounded(element, interactiveChild)) {
    return interactiveChild;
  }

  return element;
}

/**
 * Scans the hierarchy of the given element for an ancestor or child element
 * with an ID, aria-label, or identifying attribute.
 *
 * @param element - The starting point {@link Element} from which to scan.
 * @returns A tuple containing the first ancestor or child element with an ID,
 * aria-label, or identifying attribute, and a string indicating the relationship
 * ('parent', 'child', or 'self').
 *
 * If no such element is found, returns the original element and 'self'.
 */
function scanHierarchyForIdentifyingElement(
  element: Element,
  options: DeriveSelectorOptions
): [Element, 'ancestor' | 'child' | 'self'] {
  const identifyingLookSel = [
    ...identifyingAttributes,
    ...(options.identifyingAttributes || []),
  ].join(', ');

  const identifyingAncestor = element.closest(identifyingLookSel);
  if (identifyingAncestor) {
    return (element === identifyingAncestor)
      ? [identifyingAncestor, 'self']
      : [identifyingAncestor, 'ancestor'];
  }

  const identifyingChild = element.querySelector(identifyingLookSel);
  if (identifyingChild) return [identifyingChild, 'child'];

  return [element, 'self'];
}

/**
 * Derives a CSS selector for the given {@link Element}.
 *
 * @param element - The {@link Element} to derive the selector for.
 * @returns A string representing the derived selector.
 */
function deriveSingularSelector(element: Element): string {
  // Use ID if available, as it is the most specific.
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Use name attribute if available, especially for form elements.
  if (element.hasAttribute('name')) {
    const form = element.closest('form');
    return form
      ? `form[action="${CSS.escape(form.action)}"] [name="${CSS.escape(element.getAttribute('name')!)}"]`
      : `[name="${CSS.escape(element.getAttribute('name')!)}"]`;
  }

  // Use identifying attributes if available (e.g., aria-label, href).
  const identifyingAttr = identifyingAttributes.find(attr => element.hasAttribute(attr));
  if (identifyingAttr) {
    return `[${identifyingAttr}="${CSS.escape(element.getAttribute(identifyingAttr)!)}"]`;
  }

  // Use class names if available.
  if (element.className) {
    return `${element.tagName.toLowerCase()}.${Array.from(element.classList).map(cls => CSS.escape(cls)).join('.')}`;
  }

  // Fallback to tag name if no other attributes are available.
  return element.tagName.toLowerCase();
}

/**
 * Checks if the target element is contained within the bounds of the given element.
 *
 * @param element - The parent {@link Element} to check against.
 * @param target - The child {@link Element} to check if it is contained within the parent.
 * @returns `true` if the target is contained within the parent, `false` otherwise.
 */
function elementBounded(element: Element, target: Element): boolean {
  if (!element || !target) return false;

  const elementBounds = element.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();

  return targetBounds.x >= elementBounds.x
      && targetBounds.y >= elementBounds.y
      && targetBounds.x + targetBounds.width <= elementBounds.x + elementBounds.width
      && targetBounds.y + targetBounds.height <= elementBounds.y + elementBounds.height;
}

export type * from './element-analysis.interfaces.js';
