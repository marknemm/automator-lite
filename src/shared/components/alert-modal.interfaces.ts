import type { AlertModal } from './alert-modal.js';

declare global {
  interface HTMLElementTagNameMap {
    'spark-alert-modal': AlertModal;
  }
}

export type * from './modal.interfaces.js';
