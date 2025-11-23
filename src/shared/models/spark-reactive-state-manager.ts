import type { SparkModelEmitEventType, SparkModelEventType, SparkModelState, SparkStateCreateEmitter, SparkStateDeleteEmitter, SparkStateEventHandler, SparkStateUpdateEmitter } from './spark-model.interfaces.js';
import { SparkStateManager } from './spark-state-manager.js';

/**
 * The abstract base {@link SparkReactiveStateManager} for managing reactive {@link SparkModel} state persistence.
 *
 * @template TState The type of {@link SparkModelState} managed by this {@link SparkReactiveStateManager}.
 *
 * @extends SparkStateManager<TState>
 */
export abstract class SparkReactiveStateManager<
  TState extends SparkModelState
> extends SparkStateManager<TState> {

  readonly #createCbs: Array<SparkStateEventHandler<'create', TState>> = [];
  readonly #deleteCbs: Array<SparkStateEventHandler<'delete', TState>> = [];
  readonly #updateCbs: Array<SparkStateEventHandler<'update', TState>> = [];

  /**
   * Starts listening for all {@link SparkModelState} change events.
   *
   * @returns A {@link Promise} that resolves to a function to stop all listeners.
   */
  listen(): () => void {
    const stopCreate = this.listenCreate(this.#emit.bind(this, 'create'));
    const stopDelete = this.listenDelete(this.#emit.bind(this, 'delete'));
    const stopUpdate = this.listenUpdate(this.#emit.bind(this, 'update'));

    return async () => {
      (await stopCreate)();
      (await stopDelete)();
      (await stopUpdate)();
    };
  }

  /**
   * Starts listening for create events.
   *
   * @param emit The {@link SparkStateCreateEmitter} function to call when a create event occurs.
   *
   * @returns A {@link Promise} that resolves to a function to stop listening for create events.
   */
  protected abstract listenCreate(emit: SparkStateCreateEmitter<TState>): (() => void) | Promise<() => void>;

  /**
   * Starts listening for delete events.
   *
   * @param emit The {@link SparkStateDeleteEmitter} function to call when a delete event occurs.
   *
   * @returns A {@link Promise} that resolves to a function to stop listening for delete events.
   */
  protected abstract listenDelete(emit: SparkStateDeleteEmitter<TState>): (() => void) | Promise<() => void>;

  /**
   * Starts listening for update events.
   *
   * @param emit The {@link SparkStateUpdateEmitter} function to call when an update event occurs.
   *
   * @returns A {@link Promise} that resolves to a function to stop listening for update events.
   */
  protected abstract listenUpdate(emit: SparkStateUpdateEmitter<TState>): (() => void) | Promise<() => void>;

  /**
   * Registers a listener for the given event type.
   *
   * @param eventType The event type to listen for.
   * @param cb The callback to invoke when the event occurs.
   *
   * @returns A function to unregister the listener.
   *
   * @template TEvent - The type of the event.
   * @final Override {@link onCreate}, {@link onDelete}, and {@link onUpdate} to register listeners for specific event types.
   */
  on<TEvent extends SparkModelEventType>(
    eventType: TEvent,
    cb: SparkStateEventHandler<TEvent, TState>
  ): () => void {
    switch (eventType) {
      case 'create':  this.#createCbs.push(cb as SparkStateEventHandler<'create', TState>);   break;
      case 'delete':  this.#deleteCbs.push(cb as SparkStateEventHandler<'delete', TState>);   break;
      case 'persist': this.#deleteCbs.push(cb as SparkStateEventHandler<'persist', TState>);
      case 'save':    this.#createCbs.push(cb as SparkStateEventHandler<'save', TState>);
      case 'update':  this.#updateCbs.push(cb as SparkStateEventHandler<'update', TState>);   break;
      default:
        throw new Error(`SparkReactiveStateManager.on: Unsupported event type: ${eventType}`);
    }

    return () => {
      const createIdx = this.#createCbs.indexOf(cb as SparkStateEventHandler<'create', TState>);
      if (createIdx !== -1) this.#createCbs.splice(createIdx, 1);

      const deleteIdx = this.#deleteCbs.indexOf(cb as SparkStateEventHandler<'delete', TState>);
      if (deleteIdx !== -1) this.#deleteCbs.splice(deleteIdx, 1);

      const updateIdx = this.#updateCbs.indexOf(cb as SparkStateEventHandler<'update', TState>);
      if (updateIdx !== -1) this.#updateCbs.splice(updateIdx, 1);
    };
  }

  #emit(
    eventType: SparkModelEmitEventType,
    state: Partial<TState>,
    oldState?: Partial<TState>
  ): void {
    let listeners: Array<SparkStateEventHandler<any, TState>> = [];

    switch (eventType) {
      case 'create': listeners = this.#createCbs; break;
      case 'delete': listeners = this.#deleteCbs; break;
      case 'update': listeners = this.#updateCbs; break;
      default:
        throw new Error(`SparkReactiveStateManager.#emit: Unsupported event type: ${eventType}`);
    }

    for (const listener of listeners) {
      (listener as SparkStateEventHandler<'persist', TState>)(state, oldState);
    }
  }

}
