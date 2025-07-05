import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { type MountContext, MountOptions, type MountPoint, mountTemplate, Template, withStyles } from '~shared/utils/mount.js';

import sheetStyles from './sheet.scss?inline';

export const sheetTemplate = (
  { hostElement }: MountContext,
  content: Template,
  title: Template = '',
): TemplateResult => html`
  <div class="sheet" ${withStyles(sheetStyles)}>
    <div class="sheet-header">
      ${title
        ? html`<h2 class="sheet-title">${title}</h2>`
        : undefined}
      <button
        class="round-button close-button"
        type="button"
        @click=${() => hostElement.classList.remove('sheet-open')}
        title="Close"
      >
        ${unsafeHTML('&#10006;')}
      </button>
    </div>
    <div class="sheet-content">
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
