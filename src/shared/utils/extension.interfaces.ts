/**
 * Defines the context in which an extension script is running.
 */
export type ExtensionContext = 'background' | 'content' | 'options' | 'popup';

/**
 * {@link chrome.tabs.QueryInfo} for filtering queried tabs using the {@link chrome.tabs} API.
 *
 * @alias chrome.tabs.QueryInfo
 */
export type TabsQueryInfo = chrome.tabs.QueryInfo & {

  /**
   * Filters each queried {@link tab} based on this predicate.
   *
   * @param tab The {@link Tab} to evaluate.
   * @returns `true` if the {@link tab} matches the criteria and shall be included, otherwise `false`.
   */
  filter?: (tab: Tab) => boolean

};

/**
 * Represents a single {@link chrome.tabs.Tab} in the browser resulting from a query
 * using the {@link chrome.tabs} API.
 *
 * @extends chrome.tabs.Tab
 */
export type Tab = chrome.tabs.Tab;

/**
 * Represents the {@link chrome.webNavigation.GetAllFrameDetails} for querying frames
 * using the {@link chrome.webNavigation} API.
 *
 * @extends chrome.webNavigation.GetAllFrameDetails
 */
export type GetAllFrameDetails = chrome.webNavigation.GetAllFrameDetails & {

  /**
   * Filters each retrieved {@link frame} based on this predicate.
   *
   * @param frame The {@link GetAllFrameResultDetails} to evaluate.
   * @returns `true` if the {@link frame} matches the criteria and shall be included, otherwise `false`.
   */
  filter?: (frame: GetAllFrameResultDetails) => boolean

};

/**
 * Represents the {@link chrome.webNavigation.GetAllFrameResultDetails} from querying frames
 * using the {@link chrome.webNavigation} API.
 *
 * @alias chrome.webNavigation.GetAllFrameResultDetails
 */
export type GetAllFrameResultDetails = chrome.webNavigation.GetAllFrameResultDetails;
