import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '~shared/components/accordion.js';
import '~shared/components/expansion-panel.js';
import sparkButton from '~shared/directives/spark-button.js';
import type { AutoRecordAction, KeyboardAction, MouseAction } from '~shared/models/auto-record.interfaces.js';
import { DeleteActionEvent } from './actions-config-menu.events.js';

import styles from './actions-config-menu.scss?inline';

@customElement('spark-actions-config-menu')
export class ActionsConfigMenu extends LitElement {

  static styles = [unsafeCSS(styles)];

  @property({ attribute: false })
  accessor actions: AutoRecordAction[] = [];

  protected override render(): TemplateResult {
    return html`
      <spark-accordion>
        ${repeat(this.actions, (action) => action.timestamp, (action) => html`
          <spark-expansion-panel>
            <div
              slot="header"
              class="action-label"
              title="${action.textContent}"
            >
              ${this.#getActionLabel(action)}
            </div>
            <div class="action-details">
              <table>
                <tbody>
                  <tr>
                    <td>Type:</td>
                    <td>${action.actionType}</td>
                  </tr>
                  ${action.actionType === 'Mouse' ? html`
                    <tr>
                      <td>Event Type:</td>
                      <td>${(action as MouseAction).mouseEventType}</td>
                    </tr>
                    <tr>
                      <td>Coordinates:</td>
                      <td>${(action as MouseAction).coordinates.x}, ${(action as MouseAction).coordinates.y}</td>
                    </tr>
                  ` : ''}
                  ${action.actionType === 'Keyboard' ? html`
                    <tr>
                      <td>Event Type:</td>
                      <td>${(action as KeyboardAction).keyboardEventType}</td>
                    </tr>
                    <tr>
                      <td>Key:</td>
                      <td>${(action as KeyboardAction).key}</td>
                    </tr>
                  ` : ''}
                  ${this.#listModifierKeys(action) ? html`
                    <tr>
                      <td>modifierKeys:</td>
                      <td>
                        <span class="faint italic">
                          ${this.#listModifierKeys(action)}
                        </span>
                      </td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td>Selector:</td>
                    <td title="${action.selector}">${action.selector}</td>
                  </tr>
                  <tr>
                    <td>Text Content:</td>
                    <td>${action.textContent}</td>
                  </tr>
                  <tr>
                    <td>Timestamp:</td>
                    <td>${new Date(action.timestamp).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="footer">
              <button
                ${sparkButton()}
                color="danger"
                icon="delete"
                title="Delete Action: ${action.textContent}"
                @click="${() => this.dispatchEvent(new DeleteActionEvent(action))}"
              ></button>
            </div>
          </spark-expansion-panel>
        `)}
      </spark-accordion>
    `;
  }

  #listModifierKeys(action: AutoRecordAction): string {
    const { alt, ctrl, meta, shift } = action.modifierKeys || {};
    return `
      ${alt ? 'Alt ' : ''}
      ${ctrl ? 'Control ' : ''}
      ${meta ? 'Meta ' : ''}
      ${shift ? 'Shift' : ''}
    `.trim();
  }

  #getActionLabel(action: AutoRecordAction): TemplateResult | string {
    if (action.actionType === 'Keyboard') {
      return this.#getKeyboardActionLabel(action as KeyboardAction);
    }

    if (action.actionType === 'Mouse') {
      return this.#getMouseActionLabel(action as MouseAction);
    }

    return 'Script Action';
  }

  #getKeyboardActionLabel(action: KeyboardAction): TemplateResult | string {
    switch (action.keyboardEventType) {
      case 'keydown': return html`
        Key Down:&nbsp; <span class="faint italic">${action.key}</span>
      `;
      case 'keyup': return html`
        Key Up:&nbsp; <span class="faint italic">${action.key}</span>
      `;
      default: return 'Keyboard Action';
    }
  }

  #getMouseActionLabel(action: MouseAction): TemplateResult | string {
    switch (action.mouseEventType) {
      case 'click': return html`
        Click:&nbsp; <span class="faint italic">${action.textContent}</span>
      `;
      case 'dblclick': return html`
        Double Click:&nbsp; <span class="faint italic">${action.textContent}</span>
      `;
      case 'contextmenu': return html`
        Right Click:&nbsp; <span class="faint italic">${action.textContent}</span>
      `;
      default: return 'Mouse Action';
    }
  }

}

export * from './actions-config-menu.events.js';
