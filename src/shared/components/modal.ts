import { LitElement, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import deferredPromise from 'p-defer';
import { autoFocus } from '~shared/directives/auto-focus.js';
import { mountTemplate, Template, type MountContext } from '~shared/utils/mount.js';
import type { ModalContext, ModalOptions } from './modal.interfaces.js';

import styles from './modal.scss?inline';

/**
 * A base modal component that can be extended to create custom modals.
 *
 * This component provides a basic structure for modals, including a backdrop,
 * content area, and methods for opening and closing the modal.
 *
 * @element `mn-modal`
 * @slot The default slot for inserting modal content.
 * @template D - The type of data passed to the modal; Defaults to `unknown`.
 * @template R - The type of result returned when the modal is closed; Defaults to `D`.
 * @extends LitElement
 */
@customElement('mn-modal')
export class Modal<D = unknown, R = D> extends LitElement {

  static styles = [unsafeCSS(styles)];

  /**
   * @see [ModalOptions.closeOnBackdropClick](./modal.interfaces.ts)
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  accessor closeOnBackdropClick = false;

  /**
   * @see [ModalOptions.closeOnEscape](./modal.interfaces.ts)
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  accessor closeOnEscape = false;

  /**
   * The open state of the modal.
   * Changing this property will open or close the modal.
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  accessor opened = true;

  /**
   * @see [ModalOptions.data](./modal.interfaces.ts)
   */
  @property({ attribute: false })
  accessor data: D | undefined = undefined;

  /**
   * @see [ModalOptions.onClose](./modal.interfaces.ts)
   */
  @property({ attribute: false })
  accessor onClose: (result?: R) => boolean | void = () => true;

  /**
   * Opens a modal dialog at a specified {@link mountPoint}.
   *
   * @param options - The {@link ModalOptions} for the modal.
   * @param options.content - The content to display in the modal, can be a TemplateResult or a function that returns a TemplateResult.
   * @param options.closeOnBackdropClick - Whether to close the modal when clicking on the backdrop.
   * @param options.closeOnEscape - Whether to close the modal when pressing the Escape key.
   * @param options.data - Data to pass to the modal, can be used in the content function.
   * @param options.onClose - Callback function that is called when the modal is closed. If it returns false, the modal will not close.
   * @param options.mountPoint - The DOM element where the modal will be mounted. Defaults to `document.body`.
   * @returns The context for the modal.
   *
   * @template D - The type of data passed to the modal; Defaults to `unknown`.
   * @template R - The type of result returned when the modal is closed; Defaults to `D`.
   */
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
        .closeOnBackdropClick=${closeOnBackdropClick}
        .closeOnEscape=${closeOnEscape}
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

  /**
   * Opens the modal dialog.
   */
  open(): void {
    this.opened = true;
  }

  /**
   * Closes the modal dialog and executes the {@link onClose} callback.
   *
   * @param data - Optional data to pass to the {@link onClose} callback.
   * @returns `true` if the modal was closed, `false` if closing was prevented by the {@link onClose} callback.
   */
  close(data?: R): boolean {
    const close = this.onClose?.(data);
    if (close === false) return false; // Prevent closing the modal

    this.opened = false;
    return true;
  }

  /**
   * Handles the backdrop click event.
   */
  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.close();
    }
  }

  /**
   * Handles the keydown event to close the modal on Escape key press.
   *
   * @param event - The {@link KeyboardEvent} triggered by the keydown action.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.closeOnEscape && event.key === 'Escape') {
      event.stopPropagation();
      this.close();
    }
  }

  /** @final Override {@link renderContent} instead. */
  protected override render(): TemplateResult {
    return html`
      <div
        class="modal-backdrop"
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

  /**
   * Renders the content of the modal.
   * This method can be overridden to provide specific content for the modal.
   * Otherwise, it defaults to rendering a `<slot>` element that allows for custom content insertion.
   *
   * @returns The content {@link TemplateResult} to be rendered inside the modal.
   */
  protected renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }
}

export type * from './modal.interfaces.js';
