import type { ScriptAction } from '~shared/models/auto-record.interfaces.js';
import { getAllFrames, queryTabs } from '~shared/utils/extension.js';
import log from '~shared/utils/logger.js';
import { getBaseURL, isSameBaseUrl } from '~shared/utils/window.js';

/**
 * Executes a user {@link ScriptAction} in its designated tab and frame.
 * @param action The {@link ScriptAction} to execute.
 * @returns A {@link Promise} that resolves with the script {@link chrome.userScripts.InjectionResult InjectionResult}.
 * @throws If the `userScripts` API is not available, or script injection target cannot be found.
 */
export async function execScriptAction(
  action: ScriptAction
): Promise<chrome.userScripts.InjectionResult> {
  if (!chrome.userScripts) log.throw('userScripts API not available');

  const target = await getExecutionTarget(action);
  if (!target) log.throw('Could not find target tab or frame for user script action');

  const results = await chrome.userScripts.execute({
    js: [{ code: action.compiledCode }],
    target: target!,
    world: 'MAIN',
  });

  return results[0];
}

/**
 * Determines the execution target for a user script action.
 * @param action The {@link ScriptAction} for which to determine the execution target.
 * @returns A {@link Promise} that resolves to the {@link chrome.userScripts.InjectionTarget InjectionTarget}
 * for the action, or `undefined` if not found.
 */
async function getExecutionTarget(
  action: ScriptAction
): Promise<chrome.userScripts.InjectionTarget | undefined> {
  const senderTopBaseUrl = getBaseURL(action.tabHref);
  const [tab] = await queryTabs({
    url: [
      `https://${senderTopBaseUrl}*`,
      `http://${senderTopBaseUrl}*`,
    ],
  });
  if (!tab?.id) { return; }

  const [frame] = await getAllFrames({
    tabId: tab.id,
    filter: frameDetails => isSameBaseUrl(frameDetails.url, action.frameHref),
  });
  if (!frame) { return; }

  return {
    tabId: tab.id,
    frameIds: [frame.frameId],
  };
}
