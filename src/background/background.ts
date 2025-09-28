// This script runs in the background context of the extension.

import type { ScriptAction } from '~shared/models/auto-record.interfaces.js';
import '~shared/utils/extension-messaging.js'; // Init content -> content script message forwarding.
import { listenExtension } from '~shared/utils/extension-messaging.js';
import { execScriptAction } from './user-scripts.js';

listenExtension<ScriptAction, chrome.userScripts.InjectionResult>('execScriptAction', async (message) => {
  const action = message.payload;
  if (!action) throw new Error('ScriptAction required for execution.');

  return await execScriptAction(action);
});

listenExtension('options', () => {
  return chrome.runtime.openOptionsPage();
});

listenExtension('settings', () => {
  return chrome.tabs.create({
    url: `chrome://extensions/?id=${chrome.runtime.id}`,
  });
});
