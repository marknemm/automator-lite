import type { StateDeclaration } from 'lit/decorators.js';
import type { SparkComponent } from '~shared/components/spark-component.js';

/**
 * Options for defining a reactive state within a {@link SparkComponent}.
 *
 * @extends StateDeclaration
 * @template S The type of the `SparkComponent` containing the state; defaults to `SparkComponent`.
 */
export interface SparkStateDeclaration<
  S extends SparkComponent = SparkComponent,
  Type = unknown
> extends StateDeclaration<Type> {

  /**
   * The name of the method to call when the state is updated.
   */
  updated?: keyof S;

}
