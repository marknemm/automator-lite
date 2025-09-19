declare namespace chrome {
  export namespace userScripts {
    /**
     * Injects a script into a target context. By default, the script will be run at `document_idle`, or immediately if the page has already loaded. If the `injectImmediately` property is set, the script will inject without waiting, even if the page has not finished loading. If the script evaluates to a promise, the browser will wait for the promise to settle and return the resulting value.
     * @since Chrome 135
     * 
     * @param injection The script to inject.
     * @returns A promise that resolves to an array of {@link InjectionResult} objects, one for each frame the script was injected into.
     */
    function execute(injection: UserScriptInjection): Promise<InjectionResult[]>;

    interface UserScriptInjection {

      /** Whether the injection should be triggered in the target as soon as possible. Note that this is not a guarantee that injection will occur prior to page load, as the page may have already loaded by the time the script reaches the target. */
      injectImmediately?: boolean;

      /** The list of {@link ScriptSource} objects defining sources of scripts to be injected into the target. */
      js: ScriptSource[];

      /** Details specifying the target into which to inject the script. */
      target: InjectionTarget;

      /** The JavaScript "world" to run the script in. The default is `USER_SCRIPT`. */
      world?: ExecutionWorld;

      /** Specifies the user script world ID to execute in. If omitted, the script will execute in the default user script world. Only valid if `world` is omitted or is `USER_SCRIPT`. Values with leading underscores (`_`) are reserved. */
      worldId?: string;
      
    }

    interface InjectionResult {
      
      /** The document associated with the injection. */
      documentId: string;

      /** The error, if any. `error` and `result` are mutually exclusive. */
      error?: string;
      
      /** The frame associated with the injection. */
      frameId: number;

      /** The result of the script execution. */
      result?: any;

    }

    interface InjectionTarget {

      /** Whether to inject the script into all frames or only the top frame. Default is false (top frame only). */
      allFrames?: boolean;

      /** The IDs of specific documentIds to inject into. This must not be set if frameIds is set. */
      documentIds?: string[];

      /** The IDs of specific frames to inject into. */
      frameIds?: number[];

      /** The ID of the tab in which to inject the script. */
      tabId: number;

    }
  }
}
