import { html, type TemplateResult } from 'lit-html';

export const fieldHelpTemplate = (
  helpText: string
): TemplateResult => html`
  <span class="mn-field-help">
    <span>&#63;</span>
    <span class="mn-field-description">
      ${helpText}
    </span>
  </span>
`;
