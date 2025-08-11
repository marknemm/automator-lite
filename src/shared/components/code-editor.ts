import { javascript } from '@codemirror/lang-javascript';
import { EditorView, basicSetup } from 'codemirror';
import { html, unsafeCSS, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import styles from './code-editor.scss?inline';
import { SparkComponent } from './spark-component.js';

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
   * The {@link editor.IStandaloneEditorConstructionOptions} to configure the Monaco editor instance.
   *
   * @default { language: 'javascript' }
   */
  @property({ attribute: false })
  accessor options: any = {};

  @query('#editor')
  protected accessor editorContainer!: HTMLDivElement;

  #editor!: EditorView;

  get editor(): EditorView {
    return this.#editor;
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.#editor = new EditorView({
      parent: this.editorContainer,
      extensions: [basicSetup, javascript()],
      ...this.options,
    });
  }

  override render(): TemplateResult {
    return html`<div id="editor"></div>`; // Will load CodeMirror lazily.
  }

}
