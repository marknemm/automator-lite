import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { AutoRecordAction, AutoRecordKeyboardAction, AutoRecordMouseAction } from '~shared/models/auto-record.interfaces.js';
import '~shared/components/accordion.js';
import '~shared/components/expansion-panel.js';

import styles from './actions-config-menu.scss?inline';

@customElement('mn-actions-config-menu')
export class ActionsConfigMenu extends LitElement {

  static styles = [unsafeCSS(styles)];

  @property({ attribute: false })
  accessor actions: AutoRecordAction[] = [];

  protected override render(): TemplateResult {
    return html`
      <mn-accordion>
        ${repeat(this.actions, (action) => action.timestamp, (action) => html`
          <mn-expansion-panel>
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
          </mn-expansion-panel>
        `)}
      </mn-accordion>
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
