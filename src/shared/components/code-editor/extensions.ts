import { type ViewUpdate } from '@codemirror/view';
import { EditorView } from 'codemirror';

export function editorUpdated(cb: (update: ViewUpdate) => void) {
  return EditorView.updateListener.of(cb);
}

export function editorTextChanged(cb: (value: string) => void) {
  return EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.changes) {
      cb(update.state.doc.toString());
    }
  });
}
