// This script runs in the background context of the extension.

import type { ScriptAction } from '~shared/models/auto-record.interfaces.js';
import '~shared/utils/extension-messaging.js'; // Init content -> content script message forwarding.
import { listenExtension } from '~shared/utils/extension-messaging.js';
import { getAllFrames, queryTabs } from '~shared/utils/extension.js';
import { getBaseURL, isSameBaseUrl } from '~shared/utils/window.js';

listenExtension<ScriptAction>('execScriptAction', async (message) => {
  const action = message.payload;
  if (!action) { return; }

  const [tab] = await queryTabs({ url: getBaseURL(message.senderTopHref) });
  if (!tab?.id) { return; }

  const [frame] = await getAllFrames({
    tabId: tab.id,
    filter: frameDetails => isSameBaseUrl(frameDetails.url, action.frameHref),
  });
  if (!frame) { return; }

  await chrome.userScripts.execute({
    js: [{ code: action.compiledCode }],
    target: {
      tabId: tab.id,
      frameIds: [frame.frameId],
      documentIds: [frame.documentId],
    },
    world: 'MAIN',
  });
});
