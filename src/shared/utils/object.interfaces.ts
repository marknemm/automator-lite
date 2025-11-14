/**
 * Options for deep merging objects.
 */
export interface DeepMergeOptions {

  /**
   * Defines how arrays are handled during the merge.
   *
   * - `merge`: The source array replaces entries in the destination array at matching indices
   *   -- leaving unmatched entries untouched.
   * - `replace` The source array replaces the destination array.
   * - `concat`: The source array is concatenated to the destination array.
   *
   * @default 'merge'
   */
  arrayBehavior?: 'merge' | 'replace' | 'concat';

  /**
   * If `true`, the merge will only occur if the source and destination objects have the same prototype.
   *
   * @default `false`
   */
  enforcePrototypeMatch?: boolean;

  /**
   * A filter function to determine which properties should be merged.
   *
   * @param key The property key being considered.
   * @param dest The destination object.
   * @param src The source object.
   * @returns `true` if the property should be merged, `false` otherwise.
   */
  filter?: (key: string, dest: any, src: any) => boolean;

  /**
   * If `true`, properties with `undefined` or missing values in the source object will be merged.
   *
   * @default `false`
   */
  includeUndefined?: boolean;

  /**
   * If `true`, properties that exist in the destination object but are missing in the
   * source object will be set to `undefined` in the destination.
   *
   * @default `false`
   */
  removeMissingKeys?: boolean;

}
