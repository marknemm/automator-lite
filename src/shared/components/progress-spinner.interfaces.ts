import type { ProgressSpinner } from './progress-spinner.js';

declare global {
  interface HTMLElementTagNameMap {
    'spark-progress-spinner': ProgressSpinner;
  }
}
