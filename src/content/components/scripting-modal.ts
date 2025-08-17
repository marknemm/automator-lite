import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type CodeEditorChangeEvent } from '~shared/components/code-editor.events.js';
import { Modal } from '~shared/components/modal.js';
import { sparkButton } from '~shared/directives/spark-button.js';
import styles from './scripting-modal.scss?inline';

@customElement('spark-scripting-modal')
export class ScriptingModal extends Modal<string> {

  static styles = [unsafeCSS(styles)];

  #stagedCode = '';

  /** @default '80vw' */
  @property({ type: String, attribute: false })
  accessor width: string = '80vw';

  /** @default '80vh' */
  @property({ type: String, attribute: false })
  accessor height: string = '80vh';

  protected override renderContent(): TemplateResult {
    return html`
      <div class="header">
        <h2 class="title">
          Automator Scripting
        </h2>
      </div>
      <div class="body">
        <spark-code-editor
          .value="${this.data ?? ''}"
          @change="${(event: CodeEditorChangeEvent) => this.#stagedCode = event.detail}"
        ></spark-code-editor>
      </div>
      <div class="footer">
        <button
          ${sparkButton()}
          icon="close"
          raised
          shape="rectangle"
          color="danger"
          title="Cancel"
          @click="${() => this.close()}"
        ></button>

        <button
          ${sparkButton()}
          icon="check"
          raised
          shape="rectangle"
          color="success"
          title="Save"
          @click="${() => this.close(this.#stagedCode)}"
        ></button>
      </div>
    `;
  }

}
