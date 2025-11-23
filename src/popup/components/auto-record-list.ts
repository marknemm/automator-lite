import { html, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '~shared/components/button-list-item.js';
import DataListBase from '~shared/components/data-list-base.js';
import sparkButton from '~shared/directives/spark-button.js';
import type AutoRecord from '~shared/models/auto-record.js';
import styles from './auto-record-list.scss?inline';

/**
 * A data list component for loading, displaying, and managing auto-records.
 *
 * @element `spark-auto-record-list`
 * @extends DataListBase<AutoRecord>
 */
@customElement('spark-auto-record-list')
export class AutoRecordList extends DataListBase<AutoRecord> {

  static styles = [unsafeCSS(styles)];

  /**
   * Callback function to configure an {@link AutoRecord}.
   *
   * @param record - The {@link AutoRecord} to configure.
   */
  @property({ attribute: false })
  accessor onConfigure!: (record: AutoRecord) => void;

  /**
   * Callback function to delete an {@link AutoRecord}.
   *
   * @param record - The {@link AutoRecord} to delete.
   */
  @property({ attribute: false })
  accessor onDelete!: (record: AutoRecord) => Promise<void>;

  /**
   * Callback function to toggle the pause state of an {@link AutoRecord}.
   *
   * @param record - The {@link AutoRecord} to toggle.
   */
  @property({ attribute: false })
  accessor onTogglePause!: (record: AutoRecord) => Promise<void>;

  protected override renderItem(record: AutoRecord): TemplateResult {
    const name = record.name || record.id;
    const playPauseIcon = record.paused ? 'play' : 'pause';
    const playPauseColor = record.paused ? 'success' : 'primary';
    const playPauseTitle = `${record.paused ? 'Play Record:' : 'Pause Record:'} ${name}`;

    return html`
      <spark-button-list-item @click=${() => this.onConfigure(record)}>
        <span class="record-name" title="Configure Record: ${name}">
          ${name}
        </span>
        <span class="record-controls">
          <button
            ${sparkButton()}
            icon="${playPauseIcon}"
            color="${playPauseColor}"
            title="${playPauseTitle}"
            @click=${async (event: MouseEvent) => {
              event.stopPropagation();
              await this.onTogglePause(record);
            }}
          ></button>
          <button
            ${sparkButton()}
            icon="delete"
            color="danger"
            title="Delete Record: ${name}"
            @click=${async (event: MouseEvent) => {
              event.stopPropagation();
              await this.onDelete(record);
            }}
          ></button>
        </span>
      </spark-button-list-item>
    `;
  }

  protected override renderEmpty(): TemplateResult {
    return html`
      <div class="empty">
        <p>
          No automation records found. <br>
          Start by recording your first action!
        </p>
      </div>
    `;
  }

}
