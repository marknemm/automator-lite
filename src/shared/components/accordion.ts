import { html, unsafeCSS, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ExpansionPanel } from './expansion-panel.js';
import { List } from './list.js';

import styles from './accordion.scss?inline';

@customElement('spark-accordion')
export class Accordion extends List {

  static styles = [unsafeCSS(styles)];

  /** If `true`, multiple panels can be open at the same time. */
  @property({ type: Boolean })
  accessor multiExpand = false;

  @property({ attribute: false })
  accessor onPanelToggle: (panel: ExpansionPanel) => void = () => {};

  #panels: ExpansionPanel[] = [];

  /**
   * A read-only list of all {@link ExpansionPanel} elements in the accordion.
   */
  get panels(): ReadonlyArray<ExpansionPanel> {
    return this.#panels;
  }

  protected override renderContent(): TemplateResult {
    return html`
      <slot @slotchange="${() => this.handleSlotChange()}"></slot>
    `;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up event listeners when the component is removed from the DOM.
    for (const panel of this.panels) {
      panel.removeEventListener('toggle', this.#onPanelToggle);
    }
  }

  protected handleSlotChange = () => {
    // Remove existing event listeners from all panels.
    for (const panel of this.panels) {
      panel.removeEventListener('toggle', this.#onPanelToggle);
    }

    // Query the slot for all ExpansionPanel elements.
    this.#panels = this.#queryPanels();

    // Reattach event listeners to the newly queried panels.
    for (const panel of this.panels) {
      panel.addEventListener('toggle', this.#onPanelToggle);
      panel.role = 'listitem'; // Ensure each panel has the correct role.
    }
  };

  #queryPanels(): ExpansionPanel[] {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return [];

    return slot.assignedElements().filter(el =>
      el.tagName.toLowerCase() === 'spark-expansion-panel'
    ) as ExpansionPanel[];
  }

  #onPanelToggle = (event: Event) => {
    const toggledPanel = event.currentTarget as ExpansionPanel;

    if (!this.multiExpand && toggledPanel.expanded) {
      // Close all other panels
      for (const panel of this.panels) {
        if (panel !== toggledPanel && panel.expanded) {
          panel.expanded = false;
        }
      }
    }

    this.onPanelToggle(toggledPanel);
  };
}
