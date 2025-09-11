import { deepQuerySelector, deepQuerySelectorAll, type DeepQueryOptions } from './deep-query.js';

/**
 * A JS Script interpreter for executing user scripts in a sandboxed environment.
 *
 * @see https://neil.fraser.name/software/JS-Interpreter/docs.html
 */
export class ScriptInterpreter {

  static #instance: ScriptInterpreter | undefined;

  /**
   * Protected constructor to enforce singleton pattern.
   */
  protected constructor() {}

  /**
   * Initializes the singleton instance of the {@link ScriptInterpreter}.
   *
   * @returns The singleton instance of the {@link ScriptInterpreter}.
   */
  static async init(): Promise<ScriptInterpreter> {
    // await chrome.userScripts.configureWorld({

    // });
    ScriptInterpreter.#instance ??= new ScriptInterpreter();
    return ScriptInterpreter.#instance;
  }

  /**
   * Runs the given JavaScript {@link code} in a sandboxed environment.
   *
   * @param code The `ES5` JavaScript code to run.
   * @return A {@link Promise} that resolves when the script execution completes.
   */
  async run(code: string): Promise<void> {
    // Initialize interpreter sandbox.
    const interpreter = new Interpreter(code, (interpreter: any, globalObject: any) => {
      this.#setupAutomatorApi(interpreter, globalObject);
      this.#setupConsole(interpreter, globalObject);
      this.#setupEvent(interpreter, globalObject);
      this.#setupDocument(interpreter, globalObject);
      this.#setupModals(interpreter, globalObject);
      this.#setupNetwork(interpreter, globalObject);
    });

    // Run interpreter and handle any async code.
    return new Promise<void>(async resolve => {
      let hasMore = true;
      while (hasMore) {
        hasMore = interpreter.run();
        if (hasMore) await this.#yield();
      }
      resolve();
    });
  }

  #setupAutomatorApi(interpreter: any, globalObject: any): void {
    new PseudoObject('automator', globalObject, interpreter)
      .fn('deepQuerySelector', (selector: string, opts?: DeepQueryOptions) =>
        deepQuerySelector(selector, opts)
      )
      .fn('deepQuerySelectorAll', (selector: string, opts?: DeepQueryOptions) =>
        deepQuerySelectorAll(selector, { ...opts })
      );
  }

  #setupConsole(interpreter: any, globalObject: any): void {
    new PseudoObject<Console>('console', globalObject, interpreter)
      .fn('log', (...args: any[]) => console.log(...args))
      .fn('error', (...args: any[]) => console.error(...args))
      .fn('warn', (...args: any[]) => console.warn(...args))
      .fn('info', (...args: any[]) => console.info(...args))
      .fn('debug', (...args: any[]) => console.debug(...args))
      .fn('assert', (...args: any[]) => console.assert(...args));
  }

  #setupEvent(interpreter: any, globalObject: any): void {
    interpreter.setProperty(
      globalObject,
      'Event',
      interpreter.createNativeFunction(
        (type: string, options: EventInit) => new Event(type, options),
        true
      )
    );
  }

  #setupDocument(interpreter: any, globalObject: any): void {
    new PseudoObject<Document>('document', globalObject, interpreter)
      .fn('getElementsByClassName', (className: string) => {
        const elements = document.getElementsByClassName(className);
        return elements.length > 0
          ? Array.from(elements).map(el => this.#WrapPseudoElement(el as HTMLElement, interpreter).raw)
          : null;
      })
      .fn('getElementById', (id: string) => {
        const el = document.getElementById(id);
        return el ? this.#WrapPseudoElement(el, interpreter).raw : null;
      })
      .fn('getElementsByTagName', (tagName: string) =>
        document.getElementsByTagName(tagName)
      )
      .fn('querySelector', (selector: string) =>
        document.querySelector(selector)
      )
      .fn('querySelectorAll', (selector: string) =>
        document.querySelectorAll(selector)
      );
  }

  #WrapPseudoElement(element: HTMLElement, interpreter: any): PseudoObject<HTMLElement> {
    return new PseudoObject<HTMLElement>(interpreter)
      .fn('getAttribute', (name: string) => element.getAttribute(name))
      .fn('setAttribute', (name: string, value: string) => element.setAttribute(name, value))
      .fn('removeAttribute', (name: string) => element.removeAttribute(name))
      .fn('remove', () => element.remove())
      .fn('appendChild', (child: Node) => element.appendChild(child))
      .fn('removeChild', (child: Node) => element.removeChild(child))
      .fn('click', () => element.click())
      .fn('focus', () => element.focus())
      .fn('blur', () => element.blur())
      .fn('dispatchEvent', (event: Event) => element.dispatchEvent(event))
      .fn('addEventListener', (type: string, listener: EventListener) => element.addEventListener(type, listener));
  }

  #setupModals(interpreter: any, globalObject: any): void {
    this.#globalFn('alert', (...args: any[]) => window.alert(...args), interpreter, globalObject);
    this.#globalFn('prompt', (...args: any[]) => window.prompt(...args), interpreter, globalObject);
    this.#globalFn('confirm', (...args: any[]) => window.confirm(...args), interpreter, globalObject);
  }

  #setupNetwork(interpreter: any, globalObject: any): void {
    this.#globalFn('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      window.fetch(input, init),
    interpreter, globalObject);
  }

  #globalFn(
    name: string,
    fn: (...args: any[]) => any,
    interpreter: any,
    globalObject: any
  ): void {
    interpreter.setProperty(
      globalObject,
      name,
      interpreter.createNativeFunction(fn)
    );
  }

  #toElement(target: string | Element): HTMLElement | null {
    return (typeof target === 'string')
      ? deepQuerySelector(target) as HTMLElement
      : target as HTMLElement;
  }

  /**
   * Yield control back to the browser.
   *
   * @returns A {@link Promise} that resolves after a short delay.
   */
  #yield(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 10); // Yield control back to browser.
    });
  }

  #isDangerousAttr(name: string): boolean {
    const dangerousAttrs = ['action', 'formaction', 'href', 'rel', 'src', 'srcdoc', 'target'];
    return dangerousAttrs.includes(name.toLowerCase())
        || /on.*/.test(name.toLowerCase());
  }

}

/**
 * A wrapper around a raw `js-interpreter` pseudo object.
 *
 * Provides a simplified interface for interacting with the pseudo object.
 */
class PseudoObject<T = any> {

  /**
   * The raw {@link PseudoObject} instance used directly by the `js-interpreter`.
   */
  readonly raw: Partial<T>;

  readonly property: string = '';

  /**
   * Creates an instance of {@link PseudoObject}.
   *
   * This instance is bound to a {@link property} on a given {@link hostObject}.
   *
   * @param property The property of the pseudo object.
   * @param hostObject The host object to set the pseudo object on.
   * @param interpreter The interpreter instance.
   */
  constructor(
    property: string,
    hostObject: Partial<T> | PseudoObject,
    interpreter: any
  );

  /**
   * Creates a standalone instance of {@link PseudoObject}.
   *
   * This instance is not bound to a property on a host object.
   *
   * @param interpreter The interpreter instance.
   */
  constructor(
    interpreter: any
  );

  /**
   * Creates an instance of {@link PseudoObject}.
   *
   * @param propertyOrInterpreter The property that the pseudo object will be bound to
   * on a given {@link hostObject} or the interpreter instance.
   * @param hostObject The host object to set the pseudo object on, if any.
   * @param interpreter The interpreter instance.
   */
  constructor(
    propertyOrInterpreter: any,
    public readonly hostObject?: any | PseudoObject,
    public readonly interpreter?: any,
  ) {
    (typeof propertyOrInterpreter === 'string')
      ? this.property = propertyOrInterpreter
      : this.interpreter = propertyOrInterpreter;

    this.raw = this.interpreter.createObject(this.interpreter.OBJECT);

    if (this.property && this.hostObject) {
      const rawHostObject = (this.hostObject instanceof PseudoObject)
        ? this.hostObject.raw
        : this.hostObject;
      this.interpreter.setProperty(rawHostObject, this.property, this.raw);
    }
  }

  /**
   * Adds a function to the {@link raw} {@link PseudoObject}.
   *
   * @param name The name of the function.
   * @param fn The function implementation.
   * @returns This current {@link PseudoObject} instance for chaining.
   */
  fn(name: keyof T, fn: (...args: any[]) => any): this {
    this.interpreter.setProperty(this.raw, name, this.interpreter.createNativeFunction(fn));
    return this;
  }

}
