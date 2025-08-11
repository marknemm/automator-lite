/**
 * A {@link CustomEvent} that is dispatched when the expansion panel is toggled.
 *
 * The event detail contains the `boolean` expanded state of the panel.
 *
 * @extends {CustomEvent<boolean>}
 */
export class ExpansionPanelToggleEvent extends CustomEvent<boolean> {

  static readonly TYPE = 'spark-expansion-panel-toggle';

  constructor(expanded: boolean, init: CustomEventInit<boolean> = {}) {
    super(ExpansionPanelToggleEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: expanded,
      ...init,
    });
  }
}
