import { html } from 'lit';
import type { ModalContext, InstanceModalOptions } from '~shared/components/modal.interfaces.js';
import type { Alert } from '~shared/utils/alert.interfaces.js';
import { sendExtension } from '~shared/utils/extension-messaging.js';
import { AlertModal } from '../../shared/components/alert-modal.js';

/**
 * A {@link AlertModal} dialog for displaying scripting error alerts.
 */
export class ScriptingErrorModal {

  /**
   * Opens an {@link AlertModal} for displaying a scripting error alert.
   *
   * @param options - The {@link InstanceModalOptions} for the modal.
   */
  static open(
    options: InstanceModalOptions<string[], void> = {}
  ): ModalContext<void> {
    const errors = (options.data instanceof Array ? options.data : []) as string[];

    const message = errors[0]?.includes('userScripts API not available')
                 || errors[0]?.includes('\'userScripts.execute\' is not available in this context')
      ? html`
        <p>
          You must turn on "Allow User Scripts" in the
          <a href="#" @click="${() => sendExtension({ contexts: ['background'], route: 'settings' })}">
            Automator Lite Settings
          </a>
          to run script actions.
        </p>
        <p>
          After enabling, please reload all tabs where you want the scripts to run.
        </p>
        <br><br>
        <img
          src="chrome-extension://${chrome.runtime.id}/dist/public/images/allow-user-scripts.gif"
          alt="Allow user scripts visualization"
          width="500"/>
        <br><br>
        <p class="faint italic">
          Please note that the "userScripts" API is only available in
          Chrome, Edge, and Opera.
        </p>
      `
      : html`
        <p>
          ${errors[0]?.replaceAll('\n', '<br>').trim() || 'Unknown error'}
        </p>
      `;

    return AlertModal.open<Alert, void>({
      mountPoint: document.body,
      closedBy: 'any',
      width: '530px',
      ...options,
      data: {
        theme: 'danger',
        title: 'Automator Lite - Script Error',
        message,
        ...options.data,
      },
    });
  }

}
