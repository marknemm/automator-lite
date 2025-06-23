import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { host, type MountContext, MountOptions, type MountPoint, mountTemplate, Template } from '~shared/utils/mount';

import sheetStyles from './sheet.scss?inline';

export const sheetTemplate = (
  { hostElement }: MountContext,
  content: Template,
  title: Template = '',
): TemplateResult => html`
  <template ${host(sheetStyles)} class="mn-sheet-host"></template>

  <div class="mn-sheet-inner">
    <div class="mn-sheet-header">
      ${title
        ? html`<h2 class="mn-sheet-title">${title}</h2>`
        : undefined}
      <button
        class="mn-round-button mn-close-button"
        type="button"
        @click=${() => hostElement.classList.remove('mn-sheet-open')}
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
  mountPoint: MountPoint,
  title: Template = '',
  content: Template,
  mountOptions: MountOptions = {},
): void {
  mountTemplate({
    mountPoint,
    template: (ctx: MountContext) => sheetTemplate(ctx, content, title),
    ...mountOptions,
  });
}
