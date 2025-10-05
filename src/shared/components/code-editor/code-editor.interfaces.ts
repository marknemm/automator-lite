import type { EditorStateConfig, Extension } from '@codemirror/state';


export interface CodeEditorConfig extends EditorStateConfig {

  /**
   * The debounce time in milliseconds for (text) change event firing.
   *
   * @default 500
   */
  changeDebounceMs?: number;

  /**
   * Dark theme {@link Extension} for the editor.
   *
   * @default vscodeDark from '@uiw/codemirror-theme-vscode'
   */
  darkThemeExtension?: Extension;

  /**
   * Light theme {@link Extension} for the editor.
   *
   * @default vscodeLight from '@uiw/codemirror-theme-vscode'
   */
  lightThemeExtension?: Extension;

}
