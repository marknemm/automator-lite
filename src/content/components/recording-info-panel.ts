import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { mountTemplate, type MountContext } from '~shared/utils/mount.js';
import type { RecordInfoPanelOptions } from './record-info-panel.interfaces.js';

import styles from './recording-info-panel.scss?inline';

/**
 * A component that displays information about a recording.
 *
 * @element `spark-recording-info-panel`
 * @slot The default slot for inserting content into the recording info panel.
 * @extends LitElement
 */
@customElement('spark-recording-info-panel')
export class RecordingInfoPanel extends LitElement {

  static styles = [unsafeCSS(styles)];

  /**
   * The side of the screen where the recording info panel is displayed.
   * Can be either `left` or `right`, and will switch sides when hovered over.
   * @default 'left'
   */
  @property({ type: String, reflect: true })
  accessor side: 'left' | 'right' = 'left';

  /**
   * The key(s) that stops the recording when pressed in combination.
   * Will be displayed in the panel.
   *
   * @default ['Ctrl', 'Shift', '.']
   */
  @property({ type: Array })
  accessor stopRecordingKeys = [];

  /**
   * Switches the side of the screen where the recording info panel is displayed.
   */
  #switchSide() {
    this.side = (this.side === 'left')
      ? 'right'
      : 'left';
  }

  protected override render(): TemplateResult {
    const stopRecordingKeysHtml = unsafeHTML(this.stopRecordingKeys
      .map((mod) => `<kbd>${mod}</kbd>`)
      .join(' + '));

    return html`
      <div
        class="content"
        @mouseenter=${() => this.#switchSide()}
      >
        <h2>Recording in Progress</h2>
        <p>Press ${stopRecordingKeysHtml} to stop recording.</p>
        <slot></slot>
      </div>
    `;
  }

  /**
   * Mounts the recording info panel with the provided contents.
   *
   * @param options - The {@link RecordInfoPanelOptions} for mounting the panel.
   * @param options.stopRecordingKey - The key that stops the recording when pressed in combination with `Ctrl`; Defaults to `'Esc'`.
   * @param options.contents - The contents to be displayed inside the panel.
   * @returns The {@link MountContext} for the panel.
   */
  static mount({
    stopRecordingKeys,
    contents,
  }: RecordInfoPanelOptions) : MountContext {
    return mountTemplate({
      mountPoint: document.body,
      template: html`
        <spark-recording-info-panel .stopRecordingKeys=${stopRecordingKeys}>
          ${contents}
        </spark-recording-info-panel>
      `,
    });
  }

}

export type * from './record-info-panel.interfaces.js';

