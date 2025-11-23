import { Nullish } from 'utility-types';
import { log } from './logger.js';
import type { DeepMergeOptions } from './object.interfaces.js';

/**
 * Checks if a property can be set on a given object, considering its prototype chain.
 *
 * @param obj The object to check.
 * @param key The property key to check.
 * @returns `true` if the property can be set, `false` otherwise.
 */
export function canSetProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): boolean {
  let current: any = obj;

  while (current) {
    const desc = Object.getOwnPropertyDescriptor(current, key);
    if (desc) {
      if ('value' in desc) return Boolean(desc.writable);
      return typeof desc.set === 'function';
    }
    current = Object.getPrototypeOf(current);
  }

  // property not found: assignment will create own prop only if extensible
  return Object.isExtensible(obj);
}

/**
 * Recursively merges source object into target object.
 *
 * Functions and non-writable properties are skipped.
 * Recurses into nested objects (including class instances) when both target and source
 * are objects with compatible prototypes.
 *
 * @param dest The target object to merge into.
 * @param src The source object to merge from.
 * @param opts Optional {@link DeepMergeOptions} to customize merging behavior.
 */
export function deepMerge(
  dest: any,
  src: any,
  opts?: DeepMergeOptions,
): void {
  if (!src || typeof src !== 'object') return;
  const { filter } = opts || {};

  for (const key of Object.keys(src)) {
    try {
      const srcValue = (() => {
        const descriptor = Object.getOwnPropertyDescriptor(src, key);
        return descriptor && typeof descriptor.get === 'function' ? descriptor.get.call(src) : src[key];
      })();

      // Skip filtered properties
      if (filter && !filter(key, dest, src)) continue;

      // Skip non-writable properties
      if (!canSetProperty(dest, key)) continue;

      const destValue = (() => {
        const descriptor = Object.getOwnPropertyDescriptor(dest, key);
        return descriptor && typeof descriptor.get === 'function' ? descriptor.get.call(dest) : dest[key];
      })();

      // If both are objects (plain or class instances), recurse
      if (shouldRecurseMerge(destValue, srcValue)) {
        deepMerge(destValue, srcValue, opts);
        // Else if both are arrays, merge based on arrayBehavior
      } else if (Array.isArray(srcValue) && Array.isArray(destValue)) {
        deepMergeArrays(destValue, srcValue, opts);
        // Else direct assignment for primitives, arrays, or mismatched types
      } else if (srcValue !== undefined || opts?.includeUndefined) {
        console.log('Merging property:', key, 'Value:', srcValue);
        dest[key] = srcValue;
      }
    } catch (error) {
      // Silently skip properties that throw on assignment
      console.warn(`Failed to merge property "${key}":`, error);
    }
  }

  // Handle removal of missing keys
  if (opts?.removeMissingKeys) {
    for (const key of Object.keys(dest)) {
      try {
        if (!(key in src) && canSetProperty(dest, key)) {
          dest[key] = undefined;
        }
      } catch (error) {
        // Silently skip properties that throw on assignment
        console.warn(`Failed to clear property "${key}":`, error);
      }
    }
  }
}

/**
 * Determines if we should recursively merge two values by checking if both are objects
 * (excluding arrays, Date, RegExp, etc.) and optionally if they have compatible prototypes.
 *
 * @param dest The destination value.
 * @param src The source value.
 * @param opts Optional {@link DeepMergeOptions} to customize merging behavior.
 * @returns `true` if recursion should occur, `false` otherwise.
 */
function shouldRecurseMerge(dest: any, src: any, opts?: DeepMergeOptions): boolean {
  // Both must be objects
  if (!isObject(dest) || !isObject(src)) return false;

  // Don't recurse into arrays, Date, RegExp, Map, Set, etc.
  if (Array.isArray(dest) || Array.isArray(src)) return false;
  if (dest instanceof Date || src instanceof Date) return false;
  if (dest instanceof RegExp || src instanceof RegExp) return false;
  if (dest instanceof Map || src instanceof Map) return false;
  if (dest instanceof Set || src instanceof Set) return false;

  if (opts?.enforcePrototypeMatch) {
    // Prototypes must match exactly
    return Object.getPrototypeOf(dest) === Object.getPrototypeOf(src);
  }

  return true;
}

/**
 * Merges source array into target array based on the specified array behavior.
 *
 * @param target The target array to merge into.
 * @param source The source array to merge from.
 * @param opts Optional {@link DeepMergeOptions} to customize merging behavior.
 */
function deepMergeArrays(target: any[], source: any[], opts?: DeepMergeOptions): void {
  switch (opts?.arrayBehavior) {
    case 'concat':
      target.splice(target.length, 0, ...source);
      break;
    case 'replace':
      target.splice(0, target.length, ...source);
      break;
    case 'merge':
    default:
      for (let i = 0; i < source.length; i++) {
        if (i < target.length) {
          if (shouldRecurseMerge(target[i], source[i])) {
            deepMerge(target[i], source[i], opts);
          } else {
            target[i] = source[i];
          }
        } else {
          target.push(source[i]);
        }
      }
  }
}

/**
 * Checks if a value is an object (not null, not primitive).
 *
 * @returns `true` if the value is an object, `false` otherwise.
 */
export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object';
}

/**
 * Checks if a value is a plain object (not array, Date, class instance, etc.).
 *
 * @param value The value to check.
 * @returns `true` if the value is a plain object, `false` otherwise.
 */
export function isPlainObject(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Serializes an object into a plain object by recursively extracting its enumerable properties.
 *
 * @param obj The object to serialize.
 * @returns A plain object representing the serialized data.
 */
export function serializeObject<T extends object>(obj: T | Nullish): object {
  const data: any = {};
  if (!obj) return data;

  // Get all property descriptors from the prototype chain
  let proto = obj;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      // Skip constructor, private fields, functions, and already-processed keys
      if (key === 'constructor' || key.startsWith('_') || key.startsWith('#') || key in data) {
        continue;
      }

      try {
        // Get value via getter if available
        const value = (obj as any)[key];

        // Skip functions and undefined values
        if (typeof value === 'function' || value === undefined) {
          continue;
        }

        // Recursively serialize nested objects
        if (Array.isArray(value)) {
          data[key] = value.map(item =>
            (typeof item === 'object' && item !== null)
              ? serializeObject(item)
              : item
          );
        } else if (value && typeof value === 'object') {
          data[key] = serializeObject(value);
        } else {
          data[key] = value;
        }
      } catch (error) {
        // Skip properties that throw on access
        log.debug(`Failed to access property '${key}' during serialization:`, error);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return data;
}

export type * from './object.interfaces.js';
