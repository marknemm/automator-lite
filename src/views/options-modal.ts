import { html, render } from 'lit-html';

const modalTemplate = () => html`
  <div id="mn-options-modal" class="mn-modal">
    <div class="mn-modal-content">
      <div class="mn-modal-header">
        <span class="mn-modal-title">Automator Lite Options</span>
        <button id="mn-options-modal-close" class="mn-modal-close" title="Close">
          &#10006;
        </button>
      </div>
      <div class="mn-modal-body">
        <button id="mn-options-modal-confirm" class="mn-modal-confirm">Confirm</button>
      </div>
    </div>
  </div>
`

/**
 * Opens the options modal.
 */
export async function openOptionsModal(): Promise<void> {
  render(modalTemplate(), document.body);
}
