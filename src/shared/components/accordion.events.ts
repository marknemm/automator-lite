import { type ExpansionPanel } from './expansion-panel.js';

/**
 * A {@link CustomEvent} that is dispatched when the expansion panel is toggled.
 *
 * The event detail contains the {@link ExpansionPanel} that was toggled.
 *
 * @extends {CustomEvent<ExpansionPanel>}
 */
export class AccordionToggleEvent extends CustomEvent<ExpansionPanel> {

  static readonly TYPE = 'spark-accordion-toggle';

  constructor(panel: ExpansionPanel, init: CustomEventInit<ExpansionPanel> = {}) {
    super(AccordionToggleEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: panel,
      ...init,
    });
  }
}
