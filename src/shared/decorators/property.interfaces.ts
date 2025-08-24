import type { PropertyDeclaration } from 'lit';
import type { SparkComponent } from '~shared/components/spark-component.js';

/**
 * Options for defining a reactive property within a {@link SparkComponent}.
 *
 * @extends PropertyDeclaration
 * @template S The type of the `SparkComponent` containing the property; defaults to `SparkComponent`.
 */
export interface SparkPropertyDeclaration<
  S extends SparkComponent = SparkComponent,
  Type = unknown,
  TypeHint = unknown
> extends PropertyDeclaration<Type, TypeHint> {

  /**
   * The name of the method to call when the property is updated.
   */
  updated?: keyof S;

}
