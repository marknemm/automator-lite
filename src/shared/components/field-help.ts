import { html, type TemplateResult } from 'lit-html';

import './field-help.scss';

export const fieldHelpTemplate = (
  helpText: string,
): TemplateResult => html`
  <span class="mn-field-help">
    <span>&#63;</span>
    <span class="mn-field-description">
      ${helpText}
    </span>
  </span>
`;
