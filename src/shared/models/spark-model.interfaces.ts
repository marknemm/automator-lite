import type { SparkModel } from './spark-model.js';

/**
 * The raw saved state for `Spark Models`.
 */
export interface SparkModelState {

  /**
   * The unique identifier for the {@link SparkModelState}.
   *
   * If not provided, the `createTimestamp` is used as the identifier.
   */
  id?: number | string;

  /**
   * The timestamp when the {@link SparkModelState} was first created.
   */
  createTimestamp?: number;

  /**
   * The timestamp of the last update to the saved {@link SparkModelState} for this {@link SparkModel}.
   */
  updateTimestamp?: number;

}

/**
 * Options for loading a {@link SparkModel}.
 *
 * @template S - The type of the {@link SparkModelState} being loaded.
 */
export interface LoadSparkModelOptions<S extends SparkModelState = any> {

  /**
   * A filter function to determine which records to load.
   *
   * @param state The {@link SparkModelState} to load.
   * @returns `true` if the {@link SparkModelState} should be loaded, `false` otherwise.
   */
  filter?: (state: S) => boolean;

  /**
   * A function to sort the loaded models.
   *
   * @param a The first {@link SparkModelState} to compare.
   * @param b The second {@link SparkModelState} to compare.
   * @returns A negative number if `a` should come before `b`, a positive number if `a` should come after `b`, or `0` if they are equal.
   * @default `(a, b) => a.createTimestamp - b.createTimestamp`.
   */
  sort?: (a: S, b: S) => number;

  /**
   * Whether to bypass the cache when loading models.
   */
  noCache?: boolean;

}

export type SparkModelCtor<TModel extends SparkModel> = new (
  state?: Partial<SparkModelState>
) => TModel;

/**
 * The unique identifier for a {@link SparkModel} instance.
 */
export type SparkModelId = string;

/**
 * The actions that can be performed for model persistence.
 */
export type SparkModelEventType = 'create' | 'delete' | 'persist' | 'save' | 'update';

export type SparkModelEmitEventType = Exclude<SparkModelEventType, 'save' | 'persist'>;

export type SparkStateEventHandler<
  TEvent extends SparkModelEventType,
  TState extends SparkModelState
> = TEvent extends 'persist' | 'save'
  ? (state: Partial<TState>, oldState?: Partial<TState>) => void
  : TEvent extends 'update'
    ? (newState: Partial<TState>, oldState: Partial<TState>) => void
    : (state: Partial<TState>) => void;

export type SparkStateEventEmitter<
  TEvent extends SparkModelEventType,
  TState extends SparkModelState
> = SparkStateEventHandler<TEvent, TState>;

export type SparkStateCreateEmitter<
  TState extends SparkModelState
> = SparkStateEventEmitter<'create', TState>;

export type SparkStateDeleteEmitter<
  TState extends SparkModelState
> = SparkStateEventEmitter<'delete', TState>;

export type SparkStateUpdateEmitter<
  TState extends SparkModelState
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
