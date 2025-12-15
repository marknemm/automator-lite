import { html, TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './alert-toast.scss?inline';
import { Toast } from './toast.js';

/**
 * Alert toast notification with severity levels.
 *
 * @element `spark-alert-toast`
 *
 * Attributes/Properties:
 * - `severity`: one of `success` | `warning` | `error` | `info` (default `info`)
 * - `icon`: optional icon name to display before the message
 * - Inherits from Toast: `message`, `duration`, `show`, `position`
 *
 * Usage:
 *   <spark-alert-toast message="Operation successful" severity="success" show></spark-alert-toast>
 *   SparkAlertToast.show('An error occurred', { severity: 'error', duration: 5000 })
 */
@customElement('spark-alert-toast')
export class AlertToast extends Toast {

  static styles = [unsafeCSS(styles)];

  /**
   * Severity level that determines styling and icon.
   *
   * @default 'info'
   */
  @property({ type: String, reflect: true })
  accessor severity: 'success' | 'warning' | 'error' | 'info' = 'info';

  /**
   * Optional icon name to display before the message.
   */
  @property({ type: String })
  accessor icon: string | undefined = undefined;

  override renderContent(): TemplateResult {
    return html`
      ${this.icon
        ? html`<span class="icon material-symbols-outlined">${this.icon}</span>`
        : null
      }

      <div class="message">
        <slot></slot>
      </div>
    `;
  }
}

export type * from './alert-toast.interfaces.js';
