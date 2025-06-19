import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { type MountContext, type MountElement, mountShadowTemplate } from '~shared/utils/mount';
import sheetStyles from './sheet.scss';

export const sheetTemplate = (
  ctx: MountContext,
  content: TemplateResult,
  title: string | TemplateResult = '',
): TemplateResult => html`
  <div class="mn-sheet-inner">
    <div class="mn-sheet-header">
      ${title
        ? html`<h2 class="mn-sheet-title">${title}</h2>`
        : undefined}
      <button
        class="mn-round-button mn-close-button"
        type="button"
        @click=${() => ctx.shadowRoot!.host.classList.remove('mn-sheet-open')}
        title="Close"
      >
        ${unsafeHTML('&#10006;')}
      </button>
    </div>
    <div class="mn-sheet-content">
      ${content}
    </div>
  </div>
`;

export function renderSheet(
  mountTo: MountElement,
  content: TemplateResult,
  title: string | TemplateResult = '',
): void {
  mountShadowTemplate(mountTo, (ctx: MountContext) => sheetTemplate(ctx, content, title), {
    mode: 'open',
    styles: sheetStyles,
  });
}
