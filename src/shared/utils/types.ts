export type Key<T = any> = keyof T;

/**
 * A utility type that makes all parameters of a function optional.
 *
 * @template T The function type to modify.
 */
export type OptionalParameters<T extends (...args: any) => any> =
  (...args: Partial<Parameters<T>>) => ReturnType<T>;

// TODO: This resolves to any... why?
// export type ParameterSubsets<T extends (...args: any) => any> =
//   T extends (...args: [infer _First, ...infer Rest]) => ReturnType<T>
//     ? T | ParameterSubsets<(...args: Rest) => ReturnType<T>>
//     : T;
