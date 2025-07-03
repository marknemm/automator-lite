import { LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import deferredPromise from 'p-defer';
import { autoFocus } from '~shared/directives/auto-focus.js';
import { mountTemplate, Template, type MountContext } from '~shared/utils/mount.js';
import type { ModalContext, ModalOptions } from './modal.interfaces.js';

import styles from './modal.scss?inline';

@customElement('mn-modal')
export class Modal<D = unknown, R = D> extends LitElement {

  static styles = [unsafeCSS(styles)];

  @property({ type: Boolean })
  closeOnBackdropClick = false;

  @property({ type: Boolean })
  closeOnEscape = false;

  @property({ type: Boolean })
  opened = true;

  @property({ attribute: false })
  data?: D;

  @property({ attribute: false })
  onClose?: (result?: R) => boolean | void;

  static open<D = unknown, R = D>(
    { content,
      closeOnBackdropClick = false,
      closeOnEscape = false,
      data,
      onClose,
      mountPoint = document.body,
    }: ModalOptions<D, R> = {}
  ): ModalContext<R> {
    const { promise: onModalClose, resolve } = deferredPromise<R | undefined>();
    const modalCtx: ModalContext<R> = { onModalClose, closeModal: () => {}, refreshModal: () => {} };
    const modalElement = new this<D, R>(); // Target subclass of Modal
    const modalTagName = unsafeStatic(modalElement.tagName.toLowerCase());

    const modalTemplate = (content?: Template) => html`
      <${modalTagName}
        ?closeOnBackdropClick=${closeOnBackdropClick}
        ?closeOnEscape=${closeOnEscape}
        .data=${data}
        .onClose=${(result: R) => modalCtx.closeModal(result)}
      >
        ${content}
      </${modalTagName}>
    `;

    mountTemplate({
      mountPoint,
      mountMode: 'append',
      template: ({ refresh, unmount }: MountContext) => {
        modalCtx.closeModal = (result?: R) => {
          const close = onClose?.(result);
          if (close === false) return; // Prevent unmounting if close is prevented.
          unmount();
          resolve(result);
        };

        modalCtx.refreshModal = (content: Template | ((ctx: ModalContext<R>) => TemplateResult)) => {
          refresh(typeof content === 'function' ? content(modalCtx) : content);
        };

        return modalTemplate(typeof content === 'function' ? content(modalCtx) : content);
      },
    });

    return modalCtx;
  }

  open(): void {
    this.opened = true;
  }

  close(data?: R): boolean {
    const close = this.onClose?.(data);
    if (close === false) return false; // Prevent closing the modal

    this.opened = false;
    return true;
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.close();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.closeOnEscape && event.key === 'Escape') {
      event.stopPropagation();
      this.close();
    }
  }

  protected render(): TemplateResult {
    return html`
      <div
        class="modal-backdrop ${this.opened ? 'open' : ''}"
        @click="${this.onBackdropClick}"
        @keydown="${this.onKeydown}"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          @click="${(event: Event) => event.stopPropagation()}"
          ${autoFocus()}
        >
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }
}

export type * from './modal.interfaces.js';
