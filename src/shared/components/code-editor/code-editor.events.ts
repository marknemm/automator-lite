import { type ViewUpdate } from '@codemirror/view';

export class CodeEditorChangeEvent extends CustomEvent<string> {

  static readonly TYPE = 'change';

  constructor(value: string, init: CustomEventInit<string> = {}) {
    super(CodeEditorChangeEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: value,
      ...init,
    });
  }

}

export class CodeEditorUpdateEvent extends CustomEvent<ViewUpdate> {

  static readonly TYPE = 'update';

  constructor(value: ViewUpdate, init: CustomEventInit<ViewUpdate> = {}) {
    super(CodeEditorUpdateEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: value,
      ...init,
    });
  }
}
