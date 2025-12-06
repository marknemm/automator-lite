import type { SparkModelEmitEventType, SparkModelEventType, SparkState, SparkStateCreateEmitter, SparkStateDeleteEmitter, SparkStateEventHandler, SparkStateUpdateEmitter } from './spark-model.js';

/**
 * Abstract class representing an observer for changes in the {@link SparkState} of a {@link SparkModel}.
 *
 * @template TState The type of state being observed.
 */
export abstract class SparkStateObserver<
  TState extends SparkState = SparkState
> {

  readonly #createCbs: Array<SparkStateEventHandler<'create'>> = [];
  readonly #deleteCbs: Array<SparkStateEventHandler<'delete'>> = [];
  readonly #updateCbs: Array<SparkStateEventHandler<'update'>> = [];

  /**
   * Starts listening for all {@link SparkState} change events.
   *
   * @returns A {@link Promise} that resolves to a function to stop all listeners.
   */
  observe(): () => void {
    const stopCreate = this.observeCreate(this.emit.bind(this, 'create'));
    const stopDelete = this.observeDelete(this.emit.bind(this, 'delete'));
    const stopUpdate = this.observeUpdate(this.emit.bind(this, 'update'));

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
  protected abstract observeCreate(emit: SparkStateCreateEmitter<TState>): (() => void) | Promise<() => void>;

  /**
   * Starts listening for delete events.
   *
   * @param emit The {@link SparkStateDeleteEmitter} function to call when a delete event occurs.
   *
   * @returns A {@link Promise} that resolves to a function to stop listening for delete events.
   */
  protected abstract observeDelete(emit: SparkStateDeleteEmitter<TState>): (() => void) | Promise<() => void>;

  /**
   * Starts listening for update events.
   *
   * @param emit The {@link SparkStateUpdateEmitter} function to call when an update event occurs.
   *
   * @returns A {@link Promise} that resolves to a function to stop listening for update events.
   */
  protected abstract observeUpdate(emit: SparkStateUpdateEmitter<TState>): (() => void) | Promise<() => void>;

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
      case 'create':  this.#createCbs.push(cb as SparkStateEventHandler<'create'>);   break;
      case 'delete':  this.#deleteCbs.push(cb as SparkStateEventHandler<'delete'>);   break;
      case 'persist': this.#deleteCbs.push(cb as SparkStateEventHandler<'persist'>);
      case 'save':    this.#createCbs.push(cb as SparkStateEventHandler<'save'>);
      case 'update':  this.#updateCbs.push(cb as SparkStateEventHandler<'update'>);   break;
      default:
        throw new Error(`SparkReactiveStateManager.on: Unsupported event type: ${eventType}`);
    }

    return () => {
      const createIdx = this.#createCbs.indexOf(cb as SparkStateEventHandler<'create'>);
      if (createIdx !== -1) this.#createCbs.splice(createIdx, 1);

      const deleteIdx = this.#deleteCbs.indexOf(cb as SparkStateEventHandler<'delete'>);
      if (deleteIdx !== -1) this.#deleteCbs.splice(deleteIdx, 1);

      const updateIdx = this.#updateCbs.indexOf(cb as SparkStateEventHandler<'update'>);
      if (updateIdx !== -1) this.#updateCbs.splice(updateIdx, 1);
    };
  }

  /**
   * Emits an event to all registered listeners for the given event type.
   *
   * @param eventType The {@link SparkModelEmitEventType} to emit.
   * @param state The new {@link SparkState} associated with the event.
   * @param oldState The old {@link SparkState} associated with the event, if applicable.
   *
   * @final Do NOT override, exposed for SparkStateSubject extension.
   */
  protected emit(
    eventType: SparkModelEmitEventType,
    state: Partial<TState> | undefined,
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
