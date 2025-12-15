import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Modal, ModalContext, InstanceModalOptions } from '~shared/components/modal.js';
import { sparkButton } from '~shared/directives/spark-button.js';
import type { Alert } from '~shared/utils/alert.interfaces.js';
import styles from './alert-modal.scss?inline';

/**
 * A {@link Modal} dialog for alerting the user of errors or important information.
 *
 * @element spark-alert-modal
 * @extends `Modal<Alert, boolean>`
 */
@customElement('spark-alert-modal')
export class AlertModal extends Modal<Alert, boolean> {

  static styles = [unsafeCSS(styles)];

  /**
   * Opens an {@link AlertModal} for displaying a user alert notification.
   *
   * @param options - The {@link InstanceModalOptions} for the modal.
   */
  static override open<D = Alert, R = boolean>(
    options: InstanceModalOptions<D, R> = {}
  ): ModalContext<R> {
    return super.open({
      mountPoint: document.body,
      closedBy: 'any',
      ...options,
    });
  }

  protected override renderContent(): TemplateResult {
    return html`
      ${this.data?.title
        ? html`
          <div class="header">
            <h2 class="title">
              ${this.data?.title}
            </h2>
          </div>
        `
        : null
      }
      <div class="body">

        ${this.data?.message}
      </div>
      <div class="footer">
        ${(!this.data?.dismissalButtons || this.data?.dismissalButtons === 'OK')
          ? html`
            <button
              ${sparkButton()}
              raised
              shape="rectangle"
              color="success"
              @click="${() => this.close()}"
            >
              OK
            </button>
          `
          : (this.data?.dismissalButtons === 'Confirm')
            ? html`
              <button
                ${sparkButton()}
                raised
                shape="rectangle"
                color="danger"
                title="Cancel"
                @click="${() => this.close(false)}"
              ></button>

              <button
                ${sparkButton()}
                icon="check"
                raised
                shape="rectangle"
                color="success"
                title="Confirm"
                @click="${() => this.close(true)}"
              ></button>
            `
            : this.data?.dismissalButtons
        }
      </div>
    `;
  }

}

export type * from './alert-modal.interfaces.js';
