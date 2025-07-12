import { html, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '~shared/components/data-list-base.js';
import '~shared/components/button-list-item.js';
import { DataListBase } from '~shared/components/data-list-base.js';
import { type AutoRecord } from '~shared/models/auto-record.js';

import styles from './auto-record-list.scss?inline';

/**
 * A data list component for loading, displaying, and managing auto-records.
 *
 * @element `mn-auto-record-list`
 * @extends DataListBase<AutoRecord>
 */
@customElement('mn-auto-record-list')
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
    return html`
      <mn-button-list-item @click=${() => this.onConfigure(record)}>
        <span class="record-name" title="${record.name || record.uid}">
          ${record.name || record.uid}
        </span>
        <span class="record-controls">
          <button
            class="round-button ${record.paused ? 'play-button' : 'pause-button'}"
            data-target="${record.uid}"
            title="${record.paused ? 'Play' : 'Pause'}"
            type="button"
            @click=${async (event: MouseEvent) => {
              event.stopPropagation();
              await this.onTogglePause(record);
            }}
          >
            ${unsafeHTML(record.paused ? '&#9654;' : '&#9208;')}
          </button>
          <button
            class="round-button delete-button"
            data-target="${record.uid}"
            title="Delete"
            type="button"
            @click=${async (event: MouseEvent) => {
              event.stopPropagation();
              await this.onDelete(record);
            }}
          >
            &#10006;
          </button>
        </span>
      </mn-button-list-item>
    `;
  }

  protected override renderEmpty(): TemplateResult {
    return html`
      <div class="empty">
        <p>
          No recorded actions found. <br>
          Start by recording your first action!
        </p>
      </div>
    `;
  }

}
