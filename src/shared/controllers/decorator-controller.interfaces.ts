import type { LitElement } from 'lit';

/**
 * The context for a bound {@link LitElement} component decorator.
 *
 * Contains a `DecoratorController` for registering lifecycle callbacks
 * and other metadata about the decorated property or method.
 *
 * @template E The type of the `LitElement` component containing the decorator.
 * Defaults to `LitElement`.
 *
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html
 */
export interface DecoratorContext<E extends LitElement = LitElement> {

  /**
   * The instance of the {@link LitElement} component containing the decorator.
   */
  component: E;

  /**
   * The prototype of the {@link LitElement} component being decorated.
   */
  prototype: E;

  /**
   * The key of the property or method being decorated.
   */
  propKey: string | symbol;

  /**
   * The property descriptor for the decorated property.
   *
   * Will only be present for method and accessor decorators.
   */
  descriptor?: PropertyDescriptor;

}

/**
 * Lifecycle hooks for a {@link LitElement} component decorator.
 * Can be used to run logic when the containing component's lifecycle methods are invoked.
 *
 * @template E The type of the `LitElement` component containing the decorator.
 * Defaults to `LitElement`.
 */
export interface DecoratorLifecycleHooks<E extends LitElement = LitElement> {

  /**
   * Invoked when the element is connected to the DOM.
   *
   * @param ctx The {@link DecoratorContext} containing the component and decorator metadata.
   */
  hostConnected?: (ctx: DecoratorContext<E>) => void;

  /**
   * Invoked when the element is disconnected from the DOM.
   *
   * @param ctx The {@link DecoratorContext} containing the component and decorator metadata.
   */
  hostDisconnected?: (ctx: DecoratorContext<E>) => void;

  /**
   * Invoked when the element is first updated.
   *
   * @param ctx The {@link DecoratorContext} containing the component and decorator metadata.
   */
  hostFirstUpdated?: (ctx: DecoratorContext<E>) => void;

  /**
   * Invoked when the element is updated.
   *
   * @param ctx The {@link DecoratorContext} containing the component and decorator metadata.
   */
  hostUpdate?: (ctx: DecoratorContext<E>) => void;

  /**
   * Invoked when the element is updated.
   *
   * @param ctx The {@link DecoratorContext} containing the component and decorator metadata.
   */
  hostUpdated?: (ctx: DecoratorContext<E>) => void;

}

/**
 * The binding for a {@link LitElement} component member decorator.
 *
 * Bound to the prototype of the {@link LitElement} implementation
 * when {@link DecoratorController.bind} is called.
 *
 * @template E The type of the `LitElement` component containing the decorator.
 * Defaults to `LitElement`.
 */
export type DecoratorBinding<E extends LitElement = LitElement> = {

  /**
   * The prototype of the {@link LitElement} component being decorated.
   */
  prototype: DecoratedComponent<E>;

  /**
   * The key of the property or method being decorated.
   */
  propKey: string | symbol;

  /**
   * The {@link PropertyDecorator} for the decorated property.
   *
   * Will only be present for method and accessor decorators.
   */
  descriptor?: PropertyDescriptor;

  /**
   * The {@link DecoratorLifecycleHooks} defined by the bound decorator.
   *
   * Used to run logic when the containing component's lifecycle methods are invoked.
   */
  lifecycleHooks: DecoratorLifecycleHooks<E>;

}

/**
 * A {@link LitElement} component containing bound decorators.
 *
 * @template E The type of the `LitElement` component; defaults to `LitElement`.
 */
export type DecoratedComponent<E extends LitElement = LitElement> = E & {

  /**
   * The list of {@link DecoratorBinding}s bound to the {@link LitElement} component prototype.
   */
  _sparkDecoratorBindings?: DecoratorBinding<E>[];

};

/**
 * A return type for a {@link LitElement} property decorator.
 *
 * @param prototype The prototype of the {@link LitElement} component.
 * @param propKey The key of the property being decorated.
 *
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export type LitPropertyDecorator<E extends LitElement = LitElement> = (
  prototype: E,
  propKey: string | symbol,
) => void;

/**
 * A return type for a {@link LitElement} method decorator.
 *
 * @param prototype The prototype of the {@link LitElement} component.
 * @param propKey The key of the method being decorated.
 * @param descriptor The {@link PropertyDescriptor} for the decorated method.
 *
 * @template T The type of the decorated method; defaults to `(...args: unknown[]) => unknown`.
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export type LitMethodDecorator<
  T extends ((...args: any[]) => any) = (...args: unknown[]) => unknown,
  E extends LitElement = LitElement
> = (
  prototype: E,
  propKey: string | symbol,
  descriptor: TypedPropertyDescriptor<OptionalParameters<T>>
) => void;

/**
 * A return type for a {@link LitElement} accessor decorator.
 *
 * @param prototype The prototype of the {@link LitElement} component.
 * @param propKey The key of the accessor being decorated.
 * @param descriptor The {@link PropertyDescriptor} for the decorated accessor.
 *
 * @template T The type of the decorated accessor; defaults to `unknown`.
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export type LitAccessorDecorator<
  T = unknown,
  E extends LitElement = LitElement
> = (
  prototype: E,
  propKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => void;

/**
 * A return type for a {@link LitElement} accessor, method, or property decorator.
 *
 * @param prototype The prototype of the {@link LitElement} component.
 * @param propKey The key of the accessor, property, or method being decorated.
 * @param descriptor The {@link PropertyDescriptor} for the decorated accessor or method.
 * Will be `undefined` for plain properties.
 *
 * @template T The type of the decorated accessor or method; defaults to `unknown`.
 * @template E The type of the `LitElement` component containing the decorator; defaults to `LitElement`.
 */
export type LitMemberDecorator<
  T = unknown,
  E extends LitElement = LitElement
> = (
  prototype: E,
  propKey: string | symbol,
  descriptor?: TypedPropertyDescriptor<T>
) => void;

type OptionalParameters<T extends (...args: any) => any> =
  (...args: Partial<Parameters<T>>) => ReturnType<T>;
