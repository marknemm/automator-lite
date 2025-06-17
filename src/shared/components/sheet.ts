import { html, render, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { createRef, ref } from 'lit-html/directives/ref.js';

const sheetRef = createRef<HTMLDivElement>();

export const sheetTemplate = (
  content: TemplateResult,
  title: string | TemplateResult = '',
): TemplateResult => html`
  <div class="mn-sheet" ${ref(sheetRef)}>
    <div class="mn-sheet-header">
      ${title
        ? html`<h2 class="mn-sheet-title">${title}</h2>`
        : undefined}
      <button
        class="mn-round-button mn-close-button"
        type="button"
        @click=${() => sheetRef.value?.classList.remove('mn-sheet-open')}
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
  containerId: string,
  content: TemplateResult,
  title: string | TemplateResult = '',
): void {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} not found`);

  const template = sheetTemplate(content, title);
  render(template, container);
}
