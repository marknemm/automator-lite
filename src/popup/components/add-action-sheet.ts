import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '~shared/components/button-list-item.js';
import '~shared/components/list.js';
import { Sheet } from '~shared/components/sheet.js';
import type { RecordingType } from '~shared/models/auto-record.interfaces.js';

import styles from './add-action-sheet.scss?inline';

/**
 * A sheet component for adding new actions to the Automator Lite extension.
 *
 * @element `spark-add-action-sheet`
 * @extends Sheet
 */
@customElement('spark-add-action-sheet')
export class AddActionSheet extends Sheet {

  static styles = [unsafeCSS(styles)];

  /**
   * Callback when an action is selected.
   *
   * @param action - The action that was selected.
   */
  @property({ attribute: false })
  accessor onAddActionSelect: (action: RecordingType) => void = () => {};

  /**
   * @default 'right'
   */
  @property({ type: String, reflect: true })
  accessor side: 'bottom' | 'top' | 'left' | 'right' = 'right';

  protected override renderTitle(): TemplateResult {
    return html`<h2 class="title">Add Record</h2>`;
  }

  protected override renderContent(): TemplateResult {
    return html`
      <spark-list>
        <spark-button-list-item @click=${() => this.onAddActionSelect('Standard')}>
          Mouse and Keyboard Recording
        </spark-button-list-item>
        <spark-button-list-item @click=${() => this.onAddActionSelect('Scripting')}>
          Manual Scripting
        </spark-button-list-item>
      </spark-list>
    `;
  }

}
