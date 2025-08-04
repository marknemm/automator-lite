import { nothing, type ElementPart, type Part } from 'lit';
import { Directive } from 'lit/directive.js';
import type { Nullish } from 'utility-types';
import { SparkComponent } from '~shared/components/spark-component.js';

/**
 * An abstract {@link SparkDirective} class that apply styles and behavior to directives.
 *
 * @template PROPS - The arguments type for the directive; defaults to `any[]`.
 * @template PART - The part type for the directive; defaults to {@link Part}.
 *
 * @extends Directive
 */
export class SparkDirective<
  PROPS extends unknown[] = unknown[],
> extends Directive {

  /**
   * A readonly array of all possible {@link SparkTheme} values for host elements/components.
   *
   * @see {@link SparkComponent.THEMES} for available themes.
   */
  static readonly THEMES = SparkComponent.THEMES;

  override render(..._props: PROPS): unknown {
    return nothing;
  }

  override update(part: Part, props: PROPS): unknown {
    // If bound to an element, apply the spark CSS class.
    const { element } = part as ElementPart;
    element?.classList.add('spark');

    return this.render(...(props as PROPS));
  }

  protected hasAnyClass(element: Element, classes: readonly string[]): boolean {
    return classes.some(cls => element.classList.contains(cls));
  }

  /**
   * Asserts that the given {@link element} is of the specified type.
   *
   * @param element The {@link Element} to check.
   * @param type The constructor of the expected type.
   * @throws {Error} If the element is not of the expected type.
   */
  protected assertElementType<T extends Element>(
    element: Element | Nullish,
    type: new () => T
  ): asserts element is T {
    if (!element) {
      throw new Error(`Directive (${this.constructor.name}) must be bound to an element.`);
    }

    if (!(element instanceof type)) {
      throw new Error(`Directive (${this.constructor.name}) must be bound to a ${type.name}.`);
    }
  }

}
