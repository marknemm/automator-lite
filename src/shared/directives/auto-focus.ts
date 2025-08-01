import { directive, Directive, type ElementPart } from 'lit/directive.js';

/**
 * Directive to automatically focus an element when it is first rendered.
 */
export const autoFocus = directive(class extends Directive {
  render() {}
  update(part: ElementPart) {
    const el = part.element as HTMLElement;
    if (el && typeof el.focus === 'function') {
      // Focus only on first render
      if (!el.hasAttribute('data-autofocused')) {
        requestAnimationFrame(() => {
          // Focus the element
          el.focus();
          el.setAttribute('data-autofocused', '');
        });
      }
    }
  }
});
