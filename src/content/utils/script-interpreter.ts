import { deepQuerySelector, deepQuerySelectorAll, type DeepQueryOptions } from './deep-query.js';

/**
 * A JS Script interpreter for executing user scripts in a sandboxed environment.
 *
 * @see https://neil.fraser.name/software/JS-Interpreter/docs.html
 */
export class ScriptInterpreter {

  static #instance: ScriptInterpreter | undefined;

  #interpreter: any;

  #globalObject: any;

  /**
   * Protected constructor to enforce singleton pattern.
   */
  protected constructor() {}

  /**
   * Initializes the singleton instance of the {@link ScriptInterpreter}.
   *
   * @returns The singleton instance of the {@link ScriptInterpreter}.
   */
  static init(): ScriptInterpreter {
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
    this.#interpreter = new Interpreter(code, (interpreter: any, globalObject: any) => {
      this.#interpreter = interpreter;
      this.#globalObject = globalObject;

      this.#setupAutomatorApi();
      this.#setupConsole();
      this.#setupDocument();
      this.#setupModals();
      this.#setupNetwork();
    });

    // Run interpreter and handle any async code.
    return new Promise<void>(async resolve => {
      let hasMore = true;
      while (hasMore) {
        hasMore = this.#interpreter.run();
        if (hasMore) await this.#yield();
      }
      resolve();
    });
  }

  #setupAutomatorApi(): void {
    new PseudoObject('automator', this.#interpreter, this.#globalObject)
      .fn('blur', (target: string | HTMLElement) =>
        this.#toElement(target)?.blur()
      )
      .fn('click', (target: string | HTMLElement) =>
        this.#toElement(target)?.click()
      )
      .fn('focus', (target: string | HTMLElement) =>
        this.#toElement(target)?.focus()
      )
      .fn('keydown', (target: string | HTMLElement, key: string) =>
        this.#toElement(target)?.dispatchEvent(new KeyboardEvent('keydown', { key }))
      )
      .fn('keyup', (target: string | HTMLElement, key: string) =>
        this.#toElement(target)?.dispatchEvent(new KeyboardEvent('keyup', { key }))
      )
      .fn('deepQuerySelector', (selector: string, opts?: DeepQueryOptions) =>
        deepQuerySelector(selector, opts)
      )
      .fn('deepQuerySelectorAll', (selector: string, opts?: DeepQueryOptions) =>
        deepQuerySelectorAll(selector, { ...opts })
      )
      .fn('queryChild', (target: string | HTMLElement, selector: string) =>
        this.#toElement(target)?.querySelector(selector)
      )
      .fn('queryChildren', (target: string | HTMLElement, selector: string) =>
        this.#toElement(target)?.querySelectorAll(selector)
      )
      .fn('getChildren', (target: string | HTMLElement) =>
        Array.from(this.#toElement(target)?.children ?? [])
      )
      .fn('getTextContent', (target: string | HTMLElement) =>
        this.#toElement(target)?.textContent
      )
      .fn('setTextContent', (target: string | HTMLElement, text: string) => {
        const element = this.#toElement(target);
        if (element) element.textContent = text;
      })
      .fn('getValue', (target: string | HTMLElement) =>
        (this.#toElement(target) as any)?.value
      )
      .fn('setValue', (target: string | HTMLElement, value: string) => {
        const element = this.#toElement(target);
        if (element && (element as any).value) {
          (element as any).value = value;
        }
      })
      .fn('getAttribute', (target: string | HTMLElement, name: string) =>
        this.#toElement(target)?.getAttribute(name)
      )
      .fn('setAttribute', (target: string | HTMLElement, name: string, value: string) => {
        if (this.#isDangerousAttr(name)) {
          throw new Error(`Setting attribute "${name}" is not allowed for security reasons.`);
        }
        this.#toElement(target)?.setAttribute(name, value);
      })
      .fn('removeAttribute', (target: string | HTMLElement, name: string) =>
        this.#toElement(target)?.removeAttribute(name)
      )
      .fn('removeElement', (target: string | HTMLElement) =>
        this.#toElement(target)?.remove()
      );
  }

  #setupConsole(): void {
    new PseudoObject('console', this.#interpreter, this.#globalObject)
      .fn('log', (...args: any[]) => console.log(...args))
      .fn('error', (...args: any[]) => console.error(...args))
      .fn('warn', (...args: any[]) => console.warn(...args))
      .fn('info', (...args: any[]) => console.info(...args))
      .fn('debug', (...args: any[]) => console.debug(...args))
      .fn('assert', (...args: any[]) => console.assert(...args));
  }

  #setupDocument(): void {
    new PseudoObject('document', this.#interpreter, this.#globalObject)
      .fn('getElementsByClassName', (className: string) =>
        document.getElementsByClassName(className)
      )
      .fn('getElementById', (id: string) =>
        document.getElementById(id)
      )
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

  #setupModals(): void {
    this.#globalFn('alert', (...args: any[]) => window.alert(...args));
    this.#globalFn('prompt', (...args: any[]) => window.prompt(...args));
    this.#globalFn('confirm', (...args: any[]) => window.confirm(...args));
  }

  #setupNetwork(): void {
    this.#globalFn('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      window.fetch(input, init)
    );
  }

  #globalFn(
    name: string,
    fn: (...args: any[]) => any
  ): void {
    this.#interpreter.setProperty(
      this.#globalObject,
      name,
      this.#interpreter.createNativeFunction(fn)
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

class PseudoObject {

  readonly raw: any;

  constructor(
    public readonly name: string,
    public readonly interpreter: any,
    public readonly hostObject: any | PseudoObject
  ) {
    if (this.hostObject instanceof PseudoObject) {
      this.hostObject = this.hostObject.raw; // Ensure hostObject is raw pseudo object.
    }

    this.interpreter.setProperty(this.hostObject, this.name,
        this.interpreter.createObject(this.interpreter.OBJECT));

    this.raw = this.interpreter.getProperty(this.hostObject, this.name);
  }

  fn(name: string, fn: (...args: any[]) => any): this {
    this.interpreter.setProperty(this.raw, name, this.interpreter.createNativeFunction(fn));
    return this;
  }

}
