import { unsafeCSS, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import deferredPromise from 'p-defer';
import { mountTemplate, Template, type MountContext } from '~shared/utils/mount.js';
import type { ModalContext, ModalOptions } from './modal.interfaces.js';
import styles from './modal.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * A base {@link Modal} component that can be extended to create custom modals.
 *
 * This component provides a basic structure for modals, including a backdrop,
 * content area, and methods for opening and closing the modal.
 *
 * @element `spark-modal`
 * @slot The default slot for inserting modal content.
 * @template D - The type of data passed to the modal; Defaults to `unknown`.
 * @template R - The type of result returned when the modal is closed; Defaults to `D`.
 * @extends SparkComponent
 */
@customElement('spark-modal')
export class Modal<D = unknown, R = D> extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * @see [ModalOptions.closedBy](./modal.interfaces.ts)
   * @default 'none'
   */
  @property({ type: String })
  accessor closedBy: 'any' | 'closerequest' | 'none' = 'none';

  /**
   * @see [ModalOptions.data](./modal.interfaces.ts)
   */
  @property({ attribute: false })
  accessor data: D | undefined = undefined;

  /**
   * @see [ModalOptions.height](./modal.interfaces.ts)
   * @default 'fit-content'
   */
  @property({ type: String, reflect: true })
  accessor height = 'fit-content';

  /**
   * The open state of the modal.
   * Changing this property will open or close the modal.
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  accessor open = false;

  /**
   * @see [ModalOptions.width](./modal.interfaces.ts)
   * @default '400px'
   */
  @property({ type: String, reflect: true })
  accessor width = '400px';

  @query('dialog')
  protected accessor dialogElement: HTMLDialogElement | undefined;

  /**
   * Opens a modal dialog at a specified {@link mountPoint}.
   *
   * @param options - The {@link ModalOptions} for the modal.
   * @param options.content - The content to display in the modal, can be a TemplateResult or a function that returns a TemplateResult.
   * @param options.closedBy - Specifies how the modal can be closed. Defaults to 'none'.
   * @param options.data - Data to pass to the modal, can be used in the content function.
   * @param options.height - The CSS height of the modal, can be a CSS length value like `400px`, `50%`, etc. Defaults to 'fit-content'.
   * @param options.mountPoint - The DOM element where the modal will be mounted. Defaults to `document.body`.
   * @param options.onClose - Callback function that is called when the modal is closed. If it returns false, the modal will not close.
   * @param options.width - The CSS width of the modal, can be a CSS length value like `400px`, `50%`, etc. Defaults to '400px'.
   * @returns The context for the modal.
   *
   * @template D - The type of data passed to the modal; Defaults to `unknown`.
   * @template R - The type of result returned when the modal is closed; Defaults to `D`.
   */
  static open<D = unknown, R = D>(
    { closedBy = 'none',
      content,
      data,
      height = 'fit-content',
      mountPoint = document.body,
      onClose,
      width = '400px',
    }: ModalOptions<D, R> = {}
  ): ModalContext<R> {
    const { promise: onModalClose, resolve } = deferredPromise<R | undefined>();
    const modalCtx = onModalClose as ModalContext<R>;
    modalCtx.close = () => {};
    modalCtx.refresh = () => {};
    modalCtx.resize = () => {};
    const modalElement = new this<D, R>(); // Target subclass of Modal
    const modalTagName = unsafeStatic(modalElement.tagName.toLowerCase());

    const modalTemplate = (content?: Template) => html`
      <${modalTagName}
        .closedBy="${closedBy}"
        .data=${data}
        @close=${(event: CustomEvent) => modalCtx.close(event.detail.data)}
        open
        width="${width}"
        height="${height}"
      >
        ${content}
      </${modalTagName}>
    `;

    mountTemplate({
      mountPoint,
      mountMode: 'append',
      template: ({ refresh, unmount }: MountContext) => {
        modalCtx.close = (result?: R) => {
          const close = onClose?.(result);
          if (close === false) return; // Prevent unmounting if close is prevented.
          unmount();
          resolve(result);
        };

        modalCtx.refresh = (content: Template | ((ctx: ModalContext<R>) => TemplateResult)) => {
          refresh(typeof content === 'function' ? content(modalCtx) : content);
        };

        modalCtx.resize = (width: string, height: string) => {
          modalElement.width = width;
          modalElement.height = height;
        };

        return modalTemplate(typeof content === 'function' ? content(modalCtx) : content);
      },
    });

    return modalCtx;
  }

  /**
   * Opens the modal dialog.
   */
  show(): void {
    this.open = true;
  }

  /**
   * Closes the modal dialog and executes the {@link onClose} callback.
   *
   * @param data - Optional data to pass to the {@link onClose} callback.
   * @returns `true` if the modal was closed, `false` if closing was prevented by the {@link onClose} callback.
   */
  close(data?: R): boolean {
    const close = this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true,
      detail: { data },
    }));
    if (close === false) return false; // Prevent closing the modal

    this.open = false;
    return true;
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('open') && this.open !== this.dialogElement?.open) {
      this.open
        ? this.dialogElement?.showModal()
        : this.dialogElement?.close();
    }

    if (changedProperties.has('width')) {
      this.style.setProperty('--spark-modal-width', this.width);
    }

    if (changedProperties.has('height')) {
      this.style.setProperty('--spark-modal-height', this.height);
    }
  }

  /** @final Override {@link renderContent} instead. */
  protected override render(): TemplateResult {
    return html`
      <dialog
        @close="${(e: Event) => {
          e.stopPropagation(); // Define custom close event above.
          this.close();
        }}"
        closedby="${this.closedBy}"
      >
        ${this.renderContent()}
      </dialog>
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
