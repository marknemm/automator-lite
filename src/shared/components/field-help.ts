import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './field-help.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * A component that provides help text for form fields.
 * It displays a question mark icon that, when hovered over, shows the description provided in the slot.
 *
 * @element `spark-field-help`
 * @slot The default slot for inserting help text or description.
 * @extends SparkComponent
 */
@customElement('spark-field-help')
export class FieldHelp extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  protected override render(): TemplateResult {
    return html`
      <span class="field-help">
        <span>&#63;</span>
        <span class="field-description">
          <slot></slot>
        </span>
      </span>
    `;
  }
}
