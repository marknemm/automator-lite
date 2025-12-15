import { type PropertyValues, TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import deferredPromise from 'p-defer';
import type { Nullish } from 'utility-types';
import { cleanup } from '~shared/decorators/cleanup.js';
import { property } from '~shared/decorators/property.js';
import { sparkButton } from '~shared/directives/spark-button.js';
import { MountContext, mountTemplate, Template } from '~shared/utils/mount.js';
import { SparkComponent } from './spark-component.js';
import type { ToastContext, ToastOptions, ToastPosition } from './toast.interfaces.js';
import styles from './toast.scss?inline';

/**
 * Lightweight toast notification.
 *
 * @template D - The type of data passed to the toast; Defaults to `unknown`.
 * @template R - The type of result returned when the toast is closed; Defaults to `unknown`.
 * @element `spark-toast`
 *
 * Attributes/Properties:
 * - `message`: text content to show inside the toast
 * - `duration`: milliseconds before auto-dismiss (default 3000)
 * - `show`: when present, the toast is visible
 * - `position`: one of `top-right` | `top-left` | `bottom-right` | `bottom-left` (default `top-right`)
 *
 * Usage:
 *   <spark-toast message="Saved" show></spark-toast>
 *   ts`
 *   const toast = document.createElement('spark-toast');
 *   toast.message = 'Saved successfully';
 *   toast.duration = 2500;
 *   toast.showToast();
 * `
 */
@customElement('spark-toast')
export class Toast<D = unknown, R = unknown> extends SparkComponent {

	static styles = [unsafeCSS(styles)];

  static mountedInstances = new Map<typeof Toast, ToastContext<any>[]>();

  /**
   * Informs assistive technologies of the live region politeness.
   *
   * @default 'polite'
   */
  @property({ type: String, reflect: true })
  accessor ariaLive = 'polite';

  /**
   * @see [ToastOptions.data](./toast.interfaces.ts)
   */
  @property({ attribute: false })
  accessor data: D | undefined = undefined;

  /**
   * @see [ToastOptions.duration](./toast.interfaces.ts)
   * @default 3000
   */
  @property({ type: Number })
  accessor duration: number | Nullish = 3000;

  /**
   * @see [ToastOptions.height](./toast.interfaces.ts)
   * @default 'fit-content'
   */
  @property({ type: String, reflect: true })
  accessor height: string = 'fit-content';

  /**
   * @see [ToastOptions.position](./toast.interfaces.ts)
   * @default 'top-right'
   */
  @property({ type: String, reflect: true })
  accessor position: ToastPosition = 'top-right';

  /**
   * Informs assistive technologies of the role of the element.
   *
   * @default 'status'
   */
  @property({ type: String, reflect: true })
  accessor role: 'status' | 'alert' = 'status';

  /**
   * @see [ToastOptions.show](./toast.interfaces.ts)
   * @default false
   */
	@property({ type: Boolean, reflect: true })
  accessor show = false;

  /**
   * @see [ToastOptions.width](./toast.interfaces.ts)
   * @default '250px'
   */
  @property({ type: String, reflect: true })
  accessor width: string = '250px';

  /**
   * The ID of the auto-dismiss timer.
   */
  @cleanup(clearTimeout)
	private _timer: number | undefined;

  /**
   * Shows a toast notification.
   *
   * @param options - The {@link ToastOptions} for the toast.
   * @param options.content - The content to display in the toast, can be a TemplateResult or a function that returns a TemplateResult.
   * @param options.data - Data to pass to the toast, can be used in the content function.
   * @param options.duration - Duration in milliseconds before auto-dismissal of the toast. Set to `null` or `0` to disable auto-dismissal. Defaults to `3000`.
   * @param options.height - The CSS height of the toast, can be a CSS length value like `400px`, `50%`, etc. Defaults to 'fit-content'.
   * @param options.mountPoint - The DOM element where the toast will be mounted. Defaults to `document.body`.
   * @param options.onDismiss - Callback function that is called when the toast is dismissed. If it returns false, the toast will not dismiss.
   * @param options.position - The position on the screen where the toast should appear. Defaults to 'top-right'.
   * @param options.width - The CSS width of the toast, can be a CSS length value like `400px`, `50%`, etc. Defaults to '400px'.
   * @returns The context for the toast.
   *
   * @template D - The type of data passed to the toast; Defaults to `unknown`.
   * @template R - The type of result returned when the toast is closed; Defaults to `D`.
   */
  static show<D = unknown, R = unknown>(
		{ content,
      data,
      duration = 3000,
      height = 'fit-content',
      mountPoint = document.body,
      onDismiss,
      position = 'top-right',
      width = '250px',
    }: ToastOptions<D, R> = {}
  ): ToastContext<R> {
    const { promise: onToastDismiss, resolve } = deferredPromise<R | undefined>();
    const toastCtx = onToastDismiss as ToastContext<R>;
    toastCtx.dismiss = () => {};
    toastCtx.refresh = () => {};
    toastCtx.resize = () => {};
    const toastElement = new this<D, R>(); // Target subclass of Toast
    const toastTagName = unsafeStatic(toastElement.tagName.toLowerCase());

    const toastTemplate = (content?: Template) => html`
      <${toastTagName}
        .data=${data}
        .duration=${duration}
        @dismiss=${(event: CustomEvent) => toastCtx.dismiss(event.detail.data)}
        show
        position="${position}"
        width="${width}"
        height="${height}"
      >
        ${content}
      </${toastTagName}>
    `;

    mountTemplate({
      mountPoint,
      mountMode: 'append',
      template: ({ refresh, unmount }: MountContext) => {
        toastCtx.dismiss = (result?: R) => {
          const dismiss = onDismiss?.(result);
          if (dismiss === false) return; // Prevent unmounting if dismiss is prevented.
          unmount();
          const instances = this.mountedInstances.get(this) || [];
          this.mountedInstances.set(this, instances.filter(ctx => ctx !== toastCtx));
          resolve(result);
        };

        toastCtx.refresh = (content: Template | ((ctx: ToastContext<R>) => TemplateResult)) => {
          refresh(typeof content === 'function' ? content(toastCtx) : content);
        };

        toastCtx.resize = (width: string, height: string) => {
          toastElement.width = width;
          toastElement.height = height;
        };

        return toastTemplate(typeof content === 'function' ? content(toastCtx) : content);
      },
    });

    const instances = this.mountedInstances.get(this) || [];
    instances.push(toastCtx);
    this.mountedInstances.set(this, instances);
    return toastCtx;
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('show')) {
      clearTimeout(this._timer);
      if (this.show && (this.duration ?? 0) > 0) {
        this._timer = setTimeout(() => this.show = false, this.duration!);
      }
    }

    if (changedProperties.has('width')) {
      this.style.setProperty('--spark-toast-width', this.width);
    }

    if (changedProperties.has('height')) {
      this.style.setProperty('--spark-toast-height', this.height);
    }
  }

  /**
   * Dismisses the toast.
   *
   * @param data - Optional data to pass when dismissing the toast.
   * @return `true` if the toast was dismissed, `false` if dismissing was prevented by the `dismiss` event callback.
   */
  dismiss(data?: R): boolean {
    const dismiss = this.dispatchEvent(new CustomEvent('dismiss', {
      bubbles: true,
      composed: true,
      detail: { data },
    }));
    if (dismiss === false) return false; // Prevent dismissing the toast

    this.show = false;
    return true;
  }

  /** @final Override {@link renderContent} instead. */
	override render() {
		return html`
      <div class="content">
        ${this.renderContent()}
      </div>

      <button
        ${sparkButton()}
        class="close"
        icon="close"
        color="danger"
        title="Dismiss"
        type="button"
        @click=${() => this.dismiss()}
      ></button>
		`;
	}

  /**
   * Renders the content of the toast.
   *
   * @returns The {@link TemplateResult} for the toast content.
   */
  renderContent(): TemplateResult {
    return html`<slot></slot>`;
  }

}

export type * from './toast.interfaces.js';
