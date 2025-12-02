import type { SparkModel, SparkModelId, SparkModelIdentifier, SparkState } from './spark-model.js';

/**
 * Checks if two {@link SparkModelIdentifier} instances refer to the same model.
 *
 * @param a The first {@link SparkModelIdentifier} to compare.
 * @param b The second {@link SparkModelIdentifier} to compare.
 * @returns `true` if they refer to the same model, `false` otherwise.
 */
export function isSameId<TState extends SparkState = SparkState>(
  a: SparkModelIdentifier<SparkModel<TState>>,
  b: SparkModelIdentifier<SparkModel<TState>>
): boolean {
  const idA = toModelId(a);
  const idB = toModelId(b);
  return !!idA && idA === idB;
}

/**
 * Converts a {@link SparkModelIdentifier} to a string ID.
 *
 * @param id The {@link SparkModelIdentifier} to convert.
 * @returns The string ID, or `undefined` if it cannot be determined.
 */
export function toModelId(
  id: SparkModelIdentifier<SparkModel>
): SparkModelId | undefined {
  if (!id) return undefined;
  if (typeof id === 'string' || typeof id === 'number') {
    return id;
  }
  if ('id' in id && id.id != null) {
    return id.id;
  }
  if ('createTimestamp' in id && id.createTimestamp != null) {
    return id.createTimestamp;
  }
  return undefined;
}
