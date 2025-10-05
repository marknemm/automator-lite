import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type CodeEditorChangeEvent } from '~shared/components/code-editor/code-editor.events.js';
import { Modal, ModalContext, StaticModalOptions } from '~shared/components/modal.js';
import { sparkButton } from '~shared/directives/spark-button.js';
import styles from './scripting-modal.scss?inline';
import { repeat } from 'lit/directives/repeat.js';
import { Task } from '@lit/task';
import { sendExtension } from '~shared/utils/extension-messaging.js';
import type { ScriptingModalData } from './scripting-modal.interfaces.js';

/**
 * A {@link Modal} dialog for editing and saving user scripts.
 * The modal allows users to select the target frame and edit the script code.
 *
 * @element spark-scripting-modal
 * @extends Modal<ScriptingModalData>
 */
@customElement('spark-scripting-modal')
export class ScriptingModal extends Modal<ScriptingModalData> {

  static styles = [unsafeCSS(styles)];

  #frameHref = window.location.href;
  #code = '';

  /** @default '80vw' */
  @property({ type: String, attribute: false })
  accessor width: string = '80vw';

  /** @default '80vh' */
  @property({ type: String, attribute: false })
  accessor height: string = '80vh';

  #windowLocationTask = new Task(this, {
    task: async () => sendExtension<undefined, string>({
      route: 'getHref',
      contexts: ['content'],
    }),
    args: () => [], // runs once
  });

  /**
   * Opens an {@link ScriptingModal} for editing a script.
   *
   * @param options - The {@link StaticModalOptions} for the modal.
   * @return A {@link ModalContext} for the opened modal.
   */
  static open<D = ScriptingModalData, R = D>(
    options: StaticModalOptions<D, R> = {}
  ): ModalContext<R> {
    return super.open({
      mountPoint: document.body,
      closedBy: 'any',
      ...options,
    });
  }

  protected override renderContent(): TemplateResult {
    return html`
      <div class="header">
        <h2 class="title">
          Automator Scripting
        </h2>
      </div>
      <div class="body">
        <div>
          <select @change="${(event: Event) => this.#frameHref = (event.target as HTMLSelectElement).value}">
            ${this.#windowLocationTask.render({
              pending: () => html`<option>${window.location.href}</option>`,
              complete: ({ payloads: payload }) => repeat(payload, (href) => html`
                <option value="${href}">${href}</option>
              `),
            })}
          </select>
        </div>
        <spark-code-editor
          .value="${this.data?.code ?? ''}"
          @change="${(event: CodeEditorChangeEvent) => this.#code = event.detail}"
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
          @click="${() => this.close({ code: this.#code, frameHref: this.#frameHref })}"
        ></button>
      </div>
    `;
  }

}

export type * from './scripting-modal.interfaces.js';
