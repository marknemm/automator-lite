import { javascript } from '@codemirror/lang-javascript';
import { EditorState, type Text } from '@codemirror/state';
import { type ViewUpdate } from '@codemirror/view';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { basicSetup, EditorView } from 'codemirror';
import { html, unsafeCSS, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import pDebounce from 'p-debounce';
import { SparkComponent } from '../spark-component.js';
import { browserAutocompletion } from './autocomplete.js';
import { CodeEditorChangeEvent, CodeEditorUpdateEvent } from './code-editor.events.js';
import { CodeEditorConfig } from './code-editor.interfaces.js';
import styles from './code-editor.scss?inline';
import { editorTextChanged, editorUpdated } from './extensions.js';

/**
 * A custom code editor component built on top of `CodeMirror`.
 *
 * @element `spark-code-editor`
 * @extends SparkComponent
 */
@customElement('spark-code-editor')
export class CodeEditor extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * The `EditorViewConfig` to configure the CodeMirror editor instance.
   *
   * @default { extensions: [basicSetup, javascript()] }
   * @see https://codemirror.net/docs/ref/#view.EditorViewConfig
   */
  @property({ attribute: false })
  accessor config: CodeEditorConfig = {};

  /**
   * The current value of the editor.
   *
   * @default ''
   */
  @property({ attribute: false })
  accessor value: string | Text = '';

  @query('#editor')
  protected accessor editorContainer!: HTMLDivElement;

  #editorView!: EditorView;

  /**
   * Track last internally set value so external value state update does not trigger unnecessary re-render.
   */
  #lastInternalValue = '';

  /**
   * The `codemirror` {@link EditorView} instance.
   */
  get editorView(): EditorView {
    return this.#editorView;
  }

  protected override firstUpdated(props: PropertyValues): void {
    super.firstUpdated(props);

    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? this.config.darkThemeExtension ?? vscodeDark
      : this.config.lightThemeExtension ?? vscodeLight;

    if (!this.value && this.config.doc) {
      this.value = this.config.doc;
    }

    const moreExtensions = Array.isArray(this.config.extensions)
      ? this.config.extensions
      : this.config.extensions
        ? [this.config.extensions]
        : [];

    this.#editorView = new EditorView({
      parent: this.editorContainer,
      state: EditorState.create({
        ...this.config,
        doc: this.value ?? '',
        extensions: [
          basicSetup,
          theme,
          javascript({ typescript: true }),
          browserAutocompletion(),
          editorUpdated((update: ViewUpdate) => {
            this.dispatchEvent(new CodeEditorUpdateEvent(update));
          }),
          editorTextChanged(pDebounce((value: string) => {
            this.value = value;
            this.#lastInternalValue = this.value;
            this.dispatchEvent(new CodeEditorChangeEvent(this.value));
          }, this.config.changeDebounceMs ?? 500)),
          ...moreExtensions,
        ],
      }),
    });
  }

  protected override updated(props: PropertyValues): void {
    super.updated(props);
    if (props.has('value') && this.value !== this.#lastInternalValue) { // No unnecessary re-render.
      this.setValue(this.value); // Update the code editor on value prop change.
    }
  }

  /**
   * Sets a given {@link value} within the editor.
   *
   * @param value The value to set within the editor.
   */
  setValue(value: string | Text = this.value) {
    this.value = value;
    this.editorView.state.update({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: this.value || '',
      },
    });
  }

  override render(): TemplateResult {
    return html`<div id="editor"></div>`; // Will load CodeMirror lazily.
  }

}

export * from './code-editor.events.js';
export type * from './code-editor.interfaces.js';
export * from './extensions.js';

