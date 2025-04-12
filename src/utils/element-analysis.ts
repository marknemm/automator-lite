const identifyingAttributes = [
  'aria-label',
  'aria-labelledby',
  'href',
  'id',
  'name',
];

const identifyingSelector = [
  ...identifyingAttributes.map(attr => `[${attr}]`)
].join(', ');

const interactiveAttributes = [
  'aria-haspopup',
  'aria-expanded',
  'aria-pressed',
  'aria-checked',
  'aria-selected',
  'aria-controls',
  'aria-current',
  'aria-grabbed',
  'aria-dropeffect',
  'tabindex',
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

const interactiveSelector = [
  ...interactiveTags,
  ...interactiveRoles.map(role => `[role="${role}"]`),
  ...interactiveAttributes.map(attr => `[${attr}]`),
].join(', ');

/**
 * Derives a CSS selector for the given {@link HTMLElement}.
 *
 * @param element - The {@link HTMLElement} to derive the selector for.
 * @returns A tuple containing the derived selector as a string and an index number.
 * The index number is the position of the element when queried from the DOM.
 */
export function deriveElementSelector(element: Element): [string, number] {
  // Scan hierarchy for best interactive element candidate.
  const interactiveElement = scanHierarchyForInteractiveElement(element);

  // Scan hierarchy for best identifying element candidate.
  const [
    identifyingElement,
    identifyingRelationship
  ] = scanHierarchyForIdentifyingElement(interactiveElement);

  const identifyingSelector = deriveSingularSelector(identifyingElement);

  // Generate the best selector based on the relationship between both elements.
  let selector = (identifyingRelationship === 'ancestor')
    ? `${identifyingSelector} ${deriveSingularSelector(interactiveElement)}`
    : identifyingSelector;

  // Include query index in the result in case of multiple matches.
  const queryResult = document.querySelectorAll(selector);
  return [
    selector,
    Array.from(queryResult).findIndex(
      (el) => el === interactiveElement || el === identifyingElement
    ),
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
function scanHierarchyForInteractiveElement(element: Element): Element {
  const interactiveAncestor = element.closest(interactiveSelector);
  if (interactiveAncestor && elementBounded(interactiveAncestor, element)) {
    return interactiveAncestor;
  }

  const interactiveChild = element.querySelector(interactiveSelector);
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
function scanHierarchyForIdentifyingElement(element: Element): [Element, 'ancestor' | 'child' | 'self'] {
  const identifyingAncestor = element.closest(identifyingSelector);
  if (identifyingAncestor) {
    return (element === identifyingAncestor)
      ? [identifyingAncestor, 'self']
      : [identifyingAncestor, 'ancestor'];
  }

  const identifyingChild = element.querySelector(identifyingSelector);
  if (identifyingChild) return [identifyingChild, 'child'];

  return [element, 'self'];
}

function deriveSingularSelector(element: Element): string {
  // Following build selector using identifying attributes.
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.hasAttribute('name')) {
    const form = element.closest('form');

    return form
      ? `form[action="${form.action}"] [name="${element.getAttribute('name')}"]`
      : `[name="${element.getAttribute('name')}"]`;
  }

  const identifyingAttr = identifyingAttributes.find(attr => element.hasAttribute(attr));
  if (identifyingAttr) {
    return `[${identifyingAttr}="${element.getAttribute(identifyingAttr)}"]`;
  }
  ////////////////////////////////////////////////////////////////

  // Anything below here is a fallback that is highly likely to be inconsistent upon reload.
  return (element.className)
    ? `.${element.className.replace(/\s+/g, '.')}`
    : element.tagName.toLowerCase();
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
