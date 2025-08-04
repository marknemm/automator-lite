import { ElementPart } from 'lit';
import { SparkDirective } from './spark-directive.js';
import { directive } from 'lit/directive.js';

export class SparkButton extends SparkDirective {

  static readonly CONTOURS = ['flat', 'outlined', 'raised'] as const;
  static readonly SHAPES = ['rectangle', 'round'] as const;

  static FLAT = 'flat';
  static RAISED = 'raised';
  static OUTLINED = 'outlined';

  static RECTANGLE = 'rectangle';
  static ROUND = 'round';

  update(part: ElementPart) {
    const element = part.element as HTMLButtonElement;
    this.assertElementType(element, HTMLButtonElement);
    super.update(part, []);

    element.classList.add('spark-button');
    element.type ??= 'button'; // Ensure button type is set.
  }

}

export const sparkButton = directive(SparkButton);
export default sparkButton;
