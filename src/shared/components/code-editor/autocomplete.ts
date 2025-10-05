import { autocompletion, type Completion } from '@codemirror/autocomplete';

const autocompletionEntries = new Map<string, Completion[]>();

/**
 * Generates a `codemirror` extension for autocompletion suggestion for common browser API.
 *
 * @returns A `codemirror` extension for autocompletion suggestion for common browser API.
 */
export function browserAutocompletion() {
  return autocompletion({
    override: [
      (ctx) => {
        const matchNonGlobal = ctx.matchBefore(/.*\.\w*$/);
        if (matchNonGlobal) {
          const autocompleteEntries = getAutocompletionEntries(matchNonGlobal.text);
          if (autocompleteEntries.length) {
            const dotIdx = matchNonGlobal.text.lastIndexOf('.');
            return {
              from: matchNonGlobal.from + dotIdx + 1,
              options: autocompleteEntries,
            };
          }
          return null;
        }

        const matchGlobal = ctx.matchBefore(/^\w*$/);
        if (matchGlobal) {
          return {
            from: matchGlobal.from,
            options: getAutocompletionEntries('window'),
          };
        }

        return null;
      },
    ],
  });
}

function getAutocompletionEntries(accessPathname: string): Completion[] {
  // Grab from cache if present.
  if (autocompletionEntries.has(accessPathname)) {
    return autocompletionEntries.get(accessPathname)!;
  }

  try {
    // Get the object that is being accessed.
    const propPathSegments = accessPathname.trim().split('.').slice(0, -1);
    let obj: any = window;
    for (const propSegment of propPathSegments) {
      obj = obj[propSegment];
      if (!obj) return [];
    }

    // Get all properties on the accessed object and enumerate Completion entries.
    const autocompleteEntries = getAllProperties(obj).map((key) => {
      const property = obj[key];
      return {
        label: key,
        type: (typeof property === 'function')
          ? (property.prototype && property.prototype.constructor === property)
            ? 'class' as const
            : 'function' as const
          : 'variable' as const,
      };
    });

    // Set cache and return.
    autocompletionEntries.set(accessPathname, autocompleteEntries);
    return autocompleteEntries;
  } catch {
    return [];
  }
}

function getAllProperties(obj: any): string[] {
  const props = new Set<string>();
  let current = obj;

  while (current && current !== Object.prototype) {
    Object.getOwnPropertyNames(current).forEach((p) => props.add(p));
    current = Object.getPrototypeOf(current);
  }

  return Array.from(props);
}
