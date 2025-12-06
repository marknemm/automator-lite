import type { SparkModel } from './spark-model.js';
import type { DeepReadonly, Nullish } from 'utility-types';

/**
 * The raw saved state for `Spark Models`.
 */
export interface SparkState {

  /**
   * The unique identifier for the {@link SparkState}.
   *
   * If not provided, the `createTimestamp` is used as the identifier.
   */
  id: SparkModelId;

  /**
   * The timestamp when the {@link SparkState} was first created.
   */
  createTimestamp: number;

  /**
   * The timestamp of the last update to the saved {@link SparkState} for this {@link SparkModel}.
   */
  updateTimestamp: number;

}

/**
 * Options for loading a {@link SparkModel}.
 *
 * @template S - The type of the {@link SparkState} being loaded.
 */
export interface LoadSparkModelOptions<S extends SparkState = any> {

  /**
   * A filter function to determine which records to load.
   *
   * @param state The {@link SparkState} to load.
   * @returns `true` if the {@link SparkState} should be loaded, `false` otherwise.
   */
  filter?: (state: S) => boolean;

  /**
   * The maximum number of {@link SparkState} instances to load.
   *
   * @default Infinity
   */
  limit?: number;

  /**
   * The number of {@link SparkState} instances to skip before starting to load.
   *
   * @default 0
   */
  offset?: number;

  /**
   * A function to sort the loaded models.
   *
   * @param a The first {@link SparkState} to compare.
   * @param b The second {@link SparkState} to compare.
   * @returns A negative number if `a` should come before `b`, a positive number if `a` should come after `b`, or `0` if they are equal.
   * @default `(a, b) => a.createTimestamp - b.createTimestamp`.
   */
  sort?: (a: S, b: S) => number;

  /**
   * Whether to bypass the cache when loading models.
   *
   * @default false
   */
  noCache?: boolean;

}

/**
 * The constructor type for a {@link SparkModel}.
 *
 * @template TModel The type of `SparkModel`.
 */
export type SparkModelCtor<TModel extends SparkModel> = new (
  ...args: ConstructorParameters<typeof SparkModel>
) => TModel;

/**
 * The unique identifier for a {@link SparkModel} instance.
 */
export type SparkModelId = number;

/**
 * The actions that can be performed for model persistence.
 */
export type SparkModelEventType = 'create' | 'delete' | 'persist' | 'save' | 'update';

export type SparkModelEmitEventType = Exclude<SparkModelEventType, 'save' | 'persist'>;

export type SparkStateEventHandler<
  TEvent extends SparkModelEventType,
  TState extends SparkState = SparkState
> = TEvent extends 'persist'
  ? (state?: Partial<TState>, oldState?: Partial<TState>) => void
  : TEvent extends 'save'
    ? (state: Partial<TState>, oldState?: Partial<TState>) => void
    : TEvent extends 'update'
      ? (newState: Partial<TState>, oldState: Partial<TState>) => void
      : TEvent extends 'create'
        ? (state: Partial<TState>) => void
        : (state: undefined, oldState: Partial<TState>) => void;

export type SparkStateEventEmitter<
  TEvent extends SparkModelEventType,
  TState extends SparkState
> = SparkStateEventHandler<TEvent, TState>;

export type SparkStateCreateEmitter<
  TState extends SparkState
> = SparkStateEventEmitter<'create', TState>;

export type SparkStateDeleteEmitter<
  TState extends SparkState
> = SparkStateEventEmitter<'delete', TState>;

export type SparkStateUpdateEmitter<
  TState extends SparkState
> = SparkStateEventEmitter<'update', TState>;

export type SparkModelEventHandler<
  TEvent extends SparkModelEventType,
  TModel extends SparkModel<any> = SparkModel,
> = TEvent extends 'persist'
    ? (model: TModel, state?: Partial<StateOf<TModel>>, oldState?: Partial<StateOf<TModel>>) => void
    : TEvent extends 'save'
      ? (model: TModel, state: Partial<StateOf<TModel>>, oldState?: Partial<StateOf<TModel>>) => void
      : TEvent extends 'update'
        ? (model: TModel, newState: Partial<StateOf<TModel>>, oldState: Partial<StateOf<TModel>>) => void
        : TEvent extends 'create'
          ? (model: TModel, state: Partial<StateOf<TModel>>) => void
          : (model: TModel) => void;

export type SparkModelEventEmitter<
  TEvent extends SparkModelEventType,
  TModel extends SparkModel<any> = SparkModel
> = SparkModelEventHandler<TEvent, TModel>;

export type SparkModelPersistListener<
  TEvent extends SparkModelEventType,
  TModel extends SparkModel<any> = SparkModel
> = (emit: SparkModelEventEmitter<TEvent, TModel>) => void;

/**
 * The type of state for a given {@link SparkModel}.
 */
export type StateOf<TModel extends SparkModel> = TModel['_stateBrand'];

/**
 * The identifier type for a given {@link SparkState}.
 *
 * Can be a unique {@link SparkModelId}, a partial {@link SparkState} object, or `null`/`undefined`.
 */
export type SparkStateIdentifier<TState extends SparkState> =
  | SparkModelId
  | Partial<TState>
  | Partial<DeepReadonly<TState>>
  | Nullish;

/**
 * The identifier type for a given {@link SparkModel}.
 *
 * Can be the {@link SparkModel} instance itself, a unique {@link SparkModelId},
 * a partial {@link SparkState} object, or `null`/`undefined`.
 */
export type SparkModelIdentifier<TModel extends SparkModel<any>> =
  | TModel
  | SparkStateIdentifier<StateOf<TModel>>;
