import { ModuleKind, ScriptTarget, transpileModule, type TranspileOptions } from 'typescript';

/**
 * A utility class for compiling TypeScript or modern ES code to ES5 JavaScript.
 */
export class ScriptCompiler {

  static #instance: ScriptCompiler | null = null;

  static DEFAULT_OPTIONS = Object.freeze({
    compilerOptions: {
      module: ModuleKind.None,
      target: ScriptTarget.ES5,
    },
  });

  /**
   * Protected constructor to prevent direct instantiation of singleton.
   */
  protected constructor() {}

  /**
   * Initializes the singleton {@link ScriptCompiler} instance or returns it if already initialized.
   *
   * @returns The initialized {@link ScriptCompiler} instance.
   */
  static init(): ScriptCompiler {
    ScriptCompiler.#instance ??= new ScriptCompiler();
    return ScriptCompiler.#instance;
  }

  /**
   * Compiles TypeScript or modern ES code to ES5 JavaScript.
   *
   * @param code - The TypeScript or modern ES code to compile.
   * @param options - The {@link TranspileOptions}.
   * Defaults to `{ compilerOptions: { module: ModuleKind.None, target: ScriptTarget.ES5 } }`
   * @returns The compiled ES5 JavaScript code.
   */
  compile(code: string, options?: TranspileOptions): string {
    options ??= {
      compilerOptions: {
        module: ScriptCompiler.DEFAULT_OPTIONS.compilerOptions.module,
        target: ScriptCompiler.DEFAULT_OPTIONS.compilerOptions.target,
      },
    };

    const result = transpileModule(code, options);
    return result.outputText;
  }

}
