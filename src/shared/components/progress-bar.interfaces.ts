import type { ProgressBar } from './progress-bar.js';

declare global {
  interface HTMLElementTagNameMap {
    'spark-progress-bar': ProgressBar;
  }
}

export type SparkProgressBarType = 'indeterminate' | 'determinate';
