import { html, TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Nullish } from 'utility-types';
import '~shared/components/code-editor.js';
import { ExpansionPanel } from '~shared/components/expansion-panel.js';
import sparkButton from '~shared/directives/spark-button.js';
import type { AutoRecordAction, KeyboardAction, MouseAction, ScriptAction, UserInputAction } from '~shared/models/auto-record.interfaces.js';
import { DeleteActionEvent } from './action-expansion-panel.events.js';
import styles from './action-expansion-panel.scss?inline';
import { ScriptingModal } from './scripting-modal.js';
import { ScriptCompiler } from '~content/utils/script-compiler.js';

@customElement('spark-action-expansion-panel')
export class ActionExpansionPanel extends ExpansionPanel {

  static styles = [unsafeCSS(styles)];

  @property({ attribute: false })
  accessor action: AutoRecordAction | Nullish;

  #compiler = ScriptCompiler.init();

  protected override renderHeader(): TemplateResult {
    let actionLabelContent: TemplateResult = html``;

    switch(this.action?.actionType) {
      case 'Keyboard': actionLabelContent = this.#genKeyboardActionLabel(); break;
      case 'Mouse':    actionLabelContent = this.#genMouseActionLabel(); break;
      case 'Script':   actionLabelContent = this.#genScriptActionLabel(); break;
      default:         actionLabelContent = html`Action`; break;
    }

    return html`
      <div class="action-label">
        ${actionLabelContent}
      </div>
    `;
  }

  #genKeyboardActionLabel(): TemplateResult {
    const { eventType, key } = this.action as KeyboardAction;

    switch (eventType) {
      case 'keydown': return html`
        Key Down:&nbsp;
        <span class="faint italic">${key}</span>
      `;
      case 'keyup': return html`
        Key Up:&nbsp;
        <span class="faint italic">${key}</span>
      `;
      default: return html`Keyboard Action`;
    }
  }

  #genMouseActionLabel(): TemplateResult {
    const { eventType, selector, textContent } = this.action as MouseAction;
    const label = textContent || selector;

    switch (eventType) {
      case 'click': return html`
        Click:&nbsp;
        <span class="faint italic" title="${label}">${label}</span>
      `;
      case 'dblclick': return html`
        Double Click:&nbsp;
        <span class="faint italic" title="${label}">${label}</span>
      `;
      case 'mousedown': return html`
        Mouse Down:&nbsp;
        <span class="faint italic" title="${label}">${label}</span>
      `;
      case 'mouseup': return html`
        Mouse Up:&nbsp;
        <span class="faint italic" title="${label}">${label}</span>
      `;
      case 'contextmenu': return html`
        Right Click:&nbsp;
        <span class="faint italic" title="${label}">${label}</span>
      `;
      default: return html`Mouse Action`;
    }
  }

  #genScriptActionLabel(): TemplateResult {
    const { code, name } = this.action as ScriptAction;
    const label = name || code;

    return html`
      Script Action:&nbsp;
      <span class="faint italic" title="${label}">${label}</span>
    `;
  }

  protected override renderContent(): TemplateResult {
    if (!this.action) return html`<div class="error">No action data available.</div>`;

    return (['Mouse', 'Keyboard'].includes(this.action.actionType))
      ? this.#renderUserInputAction()
      : this.#renderScriptAction();
  }

  #renderUserInputAction(): TemplateResult {
    if (!this.action) return html`<div class="error">No action data available.</div>`;

    const { eventType, selector, textContent, timestamp } = this.action as UserInputAction;
    const { coordinates } = this.action as MouseAction;
    const { key } = this.action as KeyboardAction;
    const modifierKeysStr = this.#genModifiersKeysStr();

    return html`
      <div class="action-details">
        <table>
          <tbody>
            <tr>
              <td>Action:</td>
              <td>${eventType}</td>
            </tr>
            ${coordinates ? html`
              <tr>
                <td>Coordinates:</td>
                <td>${coordinates.x}, ${coordinates.y}</td>
              </tr>
            ` : ''}
            ${key ? html`
              <tr>
                <td>Key:</td>
                <td>${key}</td>
              </tr>
            ` : ''}
            ${modifierKeysStr ? html`
              <tr>
                <td>modifierKeys:</td>
                <td>
                  <span class="faint italic">
                    ${modifierKeysStr}
                  </span>
                </td>
              </tr>
            ` : ''}
            <tr>
              <td>Selector:</td>
              <td>${selector}</td>
            </tr>
            <tr>
              <td>Text Content:</td>
              <td>${textContent}</td>
            </tr>
            <tr>
              <td>Timestamp:</td>
              <td>${new Date(timestamp).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="footer">
        <button
          ${sparkButton()}
          color="danger"
          icon="delete"
          title="Delete Action: ${textContent}"
          @click="${() => this.dispatchEvent(new DeleteActionEvent(this.action!))}"
        ></button>
      </div>
    `;
  }

  #renderScriptAction(): TemplateResult {
    if (!this.action) return html`<div class="error">No action data available.</div>`;
    const { code, name, timestamp } = this.action as ScriptAction;

    return html`
      <div class="action-details">
        <table>
          <tbody>
            <tr>
              <td>Script Name:</td>
              <td>${name}</td>
            </tr>
            <tr>
              <td>Code:</td>
              <td title="${code}">${code}</td>
            </tr>
            <tr>
              <td>Timestamp:</td>
              <td>${new Date(timestamp).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="footer">
        <button
          ${sparkButton()}
          color="danger"
          icon="delete"
          title="Delete Action: ${name}"
          @click="${() => this.dispatchEvent(new DeleteActionEvent(this.action!))}"
        ></button>
        <button
          ${sparkButton()}
          color="primary"
          icon="edit"
          title="Edit Action: ${name}"
          @click="${async () => await this.#openScriptingModal()}"
        ></button>
      </div>
    `;
  }

  async #openScriptingModal(): Promise<void> {
    if (!this.action) return;
    const { code } = this.action as ScriptAction;
    // Open the scripting modal with the action's code
    const updatedCode = await ScriptingModal.open({ data: code });
    if (updatedCode) {
      (this.action as ScriptAction).code = updatedCode;
      (this.action as ScriptAction).compiledCode = this.#compiler.compile(updatedCode);
    }
  }

  #genModifiersKeysStr(): string {
    const { modifierKeys } = this.action as UserInputAction;
    const { alt, ctrl, meta, shift } = modifierKeys ?? {};
    return `
      ${alt ? 'Alt, ' : ''}
      ${ctrl ? 'Control, ' : ''}
      ${meta ? 'Meta, ' : ''}
      ${shift ? 'Shift, ' : ''}
    `.replace(/, $/, '').trim();
  }

}

export * from './action-expansion-panel.events.js';
