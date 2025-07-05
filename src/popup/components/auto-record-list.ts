import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '~shared/components/button-list.js';
import { type ButtonListItem } from '~shared/components/button-list.js';
import { type AutoRecord } from '~shared/models/auto-record.js';

import styles from './auto-record-list.scss?inline';

@customElement('mn-auto-record-list')
export class AutoRecordList extends LitElement {

  @property({ attribute: false })
  accessor items: AutoRecord[] = [];

  @property({ attribute: false })
  accessor onConfigure!: (record: AutoRecord) => void;

  @property({ attribute: false })
  accessor onDelete!: (record: AutoRecord) => Promise<void>;

  @property({ attribute: false })
  accessor onTogglePause!: (record: AutoRecord) => Promise<void>;

  protected render(): TemplateResult {
    return html`
      <mn-button-list
        .items=${this.items}
        .onClick=${(record: AutoRecord) => this.onConfigure(record)}
        .renderItem=${(item: ButtonListItem<AutoRecord>) => {
          console.log('.renderItem', item.data?.paused);
          return html`
            <mn-auto-record-list-item
              .item=${item}
              .onDelete=${this.onDelete}
              .onTogglePause=${this.onTogglePause}
            ></mn-auto-record-list-item>
          `;
        }}
        notFoundMessage="No auto records found."
      ></mn-button-list>
    `;
  }

}

@customElement('mn-auto-record-list-item')
export class AutoRecordListItem extends LitElement {

  static styles = [unsafeCSS(styles)];

  @property({ attribute: false })
  accessor item!: ButtonListItem<AutoRecord>;

  @property({ attribute: false })
  accessor onDelete!: (record: AutoRecord) => Promise<void>;

  @property({ attribute: false })
  accessor onTogglePause!: (record: AutoRecord) => Promise<void>;

  protected updated(changedProps: Map<string, unknown>) {
    console.log('AutoRecordListItem updated', changedProps, this.item);
  }

  protected render(): TemplateResult {
    const record = this.item.data;
    console.log('Rendering auto-record list item:', record);
    if (!record) return html``;

    return html`
      <span class="record-name" title="${record.selector}">
        ${record.name || record.selector}
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
    `;
  }

}
