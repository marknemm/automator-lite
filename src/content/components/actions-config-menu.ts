import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '~shared/components/accordion.js';
import '~shared/components/expansion-panel.js';
import type { AutoRecordAction } from '~shared/models/auto-record.interfaces.js';
import './action-expansion-panel.js';
import styles from './actions-config-menu.scss?inline';

@customElement('spark-actions-config-menu')
export class ActionsConfigMenu extends LitElement {

  static styles = [unsafeCSS(styles)];

  @property({ attribute: false })
  accessor actions: AutoRecordAction[] = [];

  protected override render(): TemplateResult {
    return html`
      <spark-accordion>
        ${repeat(this.actions, (action) => action.timestamp, (action) =>
          html`
            <spark-action-expansion-panel
              .action="${action}">
            </spark-action-expansion-panel>
          `
        )}
      </spark-accordion>
    `;
  }
}
