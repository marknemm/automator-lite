import { html, LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mountTemplate, type MountContext } from '~shared/utils/mount.js';

import { RecordInfoPanelOptions } from './record-info-panel.interfaces.js';
import styles from './recording-info-panel.scss?inline';

/**
 * A component that displays information about a recording.
 *
 * @element `mn-recording-info-panel`
 * @slot The default slot for inserting content into the recording info panel.
 * @extends LitElement
 */
@customElement('mn-recording-info-panel')
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
   * The key that stops the recording when pressed in combination with `Ctrl`.
   * @default 'Esc'
   */
  @property({ type: String })
  accessor stopRecordingKey = 'Esc';

  /**
   * Switches the side of the screen where the recording info panel is displayed.
   */
  #switchSide() {
    this.side = (this.side === 'left')
      ? 'right'
      : 'left';
  }

  protected override render(): TemplateResult {
    return html`
      <div
        class="content"
        @mouseenter=${() => this.#switchSide()}
      >
        <h2>Recording in Progress</h2>
        <p>Press <kbd>Ctrl</kbd> + <kbd>${this.stopRecordingKey}</kbd> to stop recording.</p>
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
    stopRecordingKey = 'Esc',
    contents,
  }: RecordInfoPanelOptions = {}) : MountContext {
    return mountTemplate({
      mountPoint: document.body,
      template: html`
        <mn-recording-info-panel stopRecordingKey=${stopRecordingKey}>
          ${contents}
        </mn-recording-info-panel>
      `,
    });
  }

}

export type * from './record-info-panel.interfaces.js';
