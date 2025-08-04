import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '~shared/components/accordion.js';
import '~shared/components/expansion-panel.js';
import sparkButton from '~shared/directives/spark-button.js';
import type { AutoRecordAction, AutoRecordKeyboardAction, AutoRecordMouseAction } from '~shared/models/auto-record.interfaces.js';

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
                      <td>${(action as AutoRecordMouseAction).mouseEventType}</td>
                    </tr>
                    <tr>
                      <td>Coordinates:</td>
                      <td>${(action as AutoRecordMouseAction).coordinates.x}, ${(action as AutoRecordMouseAction).coordinates.y}</td>
                    </tr>
                  ` : ''}
                  ${action.actionType === 'Keyboard' ? html`
                    <tr>
                      <td>Key Strokes:</td>
                      <td>${(action as AutoRecordKeyboardAction).keyStrokes.join(' ')}</td>
                    </tr>
                  ` : ''}
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
                theme="danger"
                icon="delete"
                title="Delete Action: ${action.textContent}"
                @click="${() => this.dispatchEvent(new CustomEvent('delete-action', { detail: action }))}"
              ></button>
            </div>
          </spark-expansion-panel>
        `)}
      </spark-accordion>
    `;
  }

  #getActionLabel(action: AutoRecordAction): TemplateResult | string {
    if (action.actionType === 'Mouse') {
      switch ((action as AutoRecordMouseAction).mouseEventType) {
        case 'click': return html`
          Click:&nbsp; <span class="faint italic">${action.textContent}</span>
        `;
        case 'dblclick': return html`
          Double Click:&nbsp; <span class="faint italic">${action.textContent}</span>
        `;
        case 'contextmenu': return html`
          Right Click:&nbsp; <span class="faint italic">${action.textContent}</span>
        `;
      }
    }

    if (action.actionType === 'Keyboard') {
      return html`
        Keyboard Input:&nbsp;
        <span class="faint italic">${(action as AutoRecordKeyboardAction).keyStrokes.join('')}</span>
      `;
    }

    return 'Script Action';
  }

}
