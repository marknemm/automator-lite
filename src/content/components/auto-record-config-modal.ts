import { html, unsafeCSS, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '~shared/components/field-help.js';
import { Modal, type ModalContext, type StaticModalOptions } from '~shared/components/modal.js';
import sparkButton from '~shared/directives/spark-button.js';
import { AutoRecordState, type AutoRecordAction } from '~shared/models/auto-record.js';
import log from '~shared/utils/logger.js';
import { type DeleteActionEvent } from './action-expansion-panel.events.js';
import './actions-config-menu.js';
import styles from './auto-record-config-modal.scss?inline';

/**
 * A {@link Modal} component for configuring an auto-record.
 *
 * @element `spark-auto-record-config-modal`
 * @extends Modal<AutoRecordState>
 */
@customElement('spark-auto-record-config-modal')
export class AutoRecordConfigModal extends Modal<AutoRecordState> {

  static styles = [unsafeCSS(styles)];

  @state()
  private accessor actions: AutoRecordAction[] = [];

  @state()
  private accessor errMsg = '';

  /**
   * Opens an {@link AutoRecordConfigModal} for configuring a record.
   *
   * @param options - Either the {@link AutoRecordState} or the {@link ModalOptions} for the modal.
   */
  static open<D = Partial<AutoRecordState>, R = D>(
    options: StaticModalOptions<D, R> | Partial<AutoRecordState> | AutoRecordAction[] = {}
  ): ModalContext<R> {
    if (options instanceof Array) {
      options = { data: { actions: options } as D };
    } else if (!(options instanceof Object && 'data' in options)) {
      options = { data: options as D };
    }

    return super.open({
      mountPoint: document.body,
      closedBy: 'any',
      ...options,
    });
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Keep separate actions state for edited actions.
    if (changedProperties.has('data')) {
      this.actions = this.data?.actions || [];
    }
  }

  protected override renderContent(): TemplateResult {
    return html`
      <div class="header">
        <h2 class="title">
          Automator Lite<br>Record Configuration
        </h2>
      </div>
      <form @submit="${(event: SubmitEvent) => this.#submit(event)}">
        <div class="body">
          <div class="danger error">
            ${this.errMsg}
          </div>

          <label for="record-config-record-name">
            Record Name:
            <spark-field-help>A name for this record.</spark-field-help>
          </label>
          <input
            autofocus
            type="text"
            id="record-config-record-name"
            name="recordName"
            required
            value="${this.data!.name}"
          />

          <label for="record-config-record-auto-run">
            Auto Run:
            <spark-field-help>Automatically run this record when the page loads.</spark-field-help>
          </label>
          <input
            type="checkbox"
            id="record-config-record-auto-run"
            name="autoRun"
            ?checked="${this.data!.autoRun ?? true}"
          />

          <label for="record-config-record-interval">
            Repeat Interval:
            <spark-field-help>The record will repeat at this interval (milliseconds) if non-zero.</spark-field-help>
          </label>
          <input
            type="number"
            id="record-config-record-interval"
            name="recordInterval"
            placeholder="Enter record interval"
            min="0"
            value="${this.data!.frequency ?? 0}"
          />

          <label>
            Actions:
            <spark-field-help>The playback actions for this record.</spark-field-help>
          </label>
          <spark-actions-config-menu
            .actions="${this.actions}"
            @deleteAction="${this.#handleDeleteAction}"
          ></spark-actions-config-menu>
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
            title="Confirm"
            type="submit"
          ></button>
        </div>
      </form>
    `;
  }

  #handleDeleteAction = (event: DeleteActionEvent): void => {
    this.actions = this.actions.filter(
      action => action.timestamp !== event.detail.timestamp
    );
  };

  #submit(event: SubmitEvent): void {
    event.preventDefault(); // Do not refresh the page on form submission
    this.errMsg = ''; // Reset error message

    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return; // Ensure the form is valid before proceeding
    const formData = new FormData(form);

    try {
      this.data!.name = formData.get('recordName')?.toString().trim() ?? '';
      this.data!.autoRun = formData.has('autoRun');
      this.data!.frequency = parseInt(formData.get('recordInterval')?.toString() ?? '0', 10);
      this.data!.actions = this.actions;
      this.close(this.data!); // Close the modal and resolve with the updated record
    } catch (error) {
      log.error(error);
      this.errMsg = 'Error saving record, please try again.';
    }
  }
}
