import type { AlertToast } from './alert-toast.js';

declare global {
  interface HTMLElementTagNameMap {
    'spark-alert-toast': AlertToast;
  }
}

export type * from './toast.interfaces.js';
