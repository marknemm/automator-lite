import { AutoRecordAction } from '~shared/models/auto-record.js';

export class DeleteActionEvent extends CustomEvent<AutoRecordAction> {

  static readonly TYPE = 'delete-action';

  constructor(action: AutoRecordAction, init: CustomEventInit<AutoRecordAction> = {}) {
    super(DeleteActionEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: action,
      ...init,
    });
  }

}
