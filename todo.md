# TODO

List of needed bug fixes, features, and architectural updates that shall be completed at some point in the future.

<br>



## Bug Fixes

Bugs that should be fixed at some point.
These may be related to some features, but often are minor standalone issues.

### Important
* [ ] Indicate when an `AutoRecord` is actively playing and prevent duplicate play.
* [x] Prevent opening duplicate `AutoRecord` config dialogs.
* [x] Fix issue where content script hasn't loaded, popup script tries to send it a message, and silently fails.
* [x] Fix duplicate Recording Panel on pages with iframes (content).
* [x] Fix issue in SPA where auto/repeat record is not finding element on page back because iframe is dynamically added (content).
* [x] Fix issue where cross-origin iframe records are not working (content).

### Easy
* [x] Vertically align the pause button; it is off by a pixel or two in Edge (popup).

### Medium
*EMPTY*

### Hard
*EMPTY*

<br>



## Features

Required user-facing features.
These provide a roadmap for the development of the app.

### Important
- [ ] Show error to user when they attempt to open another dialog config when one is opened.
- [x] Add progress spinner and bar components.
- [x] Add ability to manually run a record that isn't scheduled to run on page load.
- [x] Implement manual (JS) scripting records (content).
  - [-] Allow user to click on target location to designate the frame context the script should run in.
  - [x] Open dialog box for writing or copy/pasting JS script (use lightweight code editor if possible).
  - [x] Show details of the script action in record config dialog actions and allow editing.
  - [x] Add functionality in `RecordExecutor` to run script in context of webpage.
    - [x] IMPORTANT: DOUBLE CHECK - DO NOT RUN WITH PRIVILEGES OF EXTENSION!!!
- [ ] Add ability to insert actions before/after existing actions in Record configuration modal (content).
- [x] Add list of actions with remove functionality in Record configuration modal (content).
- [x] Refine commit actions before saving by combining/removing/splitting where sensible (content).

### Easy
- [ ] Add button to pause all records on a page (popup).
- [ ] Update extension icon to signify if recording or record playback is active (popup).
- [ ] Update behavior of extension icon to not open the extension popup if clicked to stop recording (popup).
- [ ] Update Sheet to animate out when closed (popup).

### Medium
- [x] Create `SparkToast` component for displaying non-blocking auto-dismissing notifications.
- [ ] Create utility for displaying `Alert` notification data in either a `SparkModal` or `SparkToast`.
  - [x] Create `AlertModal`.
  - [ ] Create `AlertToast`.
  - [ ] Create `Alert` utility for multiplexing between the `AlertModal` and `AlertToast`.
- [ ] Add ability to click and drag, resize, and minimize `SparkModal` components (shared).
- [ ] Add global option for customizing stop recording key combo (options).
- [ ] Add global option for pausing all records on all pages (options).
- [ ] Add global options for defaults for new record configuration values (options).

### Hard
- [ ] Improve `deepQuerySelector` logic to support splitting a selector across shadow boundaries (content).
- [ ] Record screenshot snippets of action targets and display them in configuration modal ([html2canvas](https://www.npmjs.com/package/html2canvas/v/1.4.1)) (content).

<br>



## Architecture

Improvements to the architecture of this application.
These are often not user-facing and can be thought of as behind the scenes features/improvements.

### Important
*EMPTY*

### Easy
- [ ] Re-evaluate directly saving state of `AutoRecord` in `RecordExecutor` - too many mod locations for state.
- [x] In modal.ts, remove content from static open method so derived classes can omit custom content without confusion.

### Medium
- [x] Create `SparkComponent` abstract class that extends `LitElement` and forms uniform theming and support for all components.
- [x] Create `SparkModel` abstract class for defining a common interface for CRUD Models.
- [ ] Create `SparkToast` component for auto-dismissing popup messages.
- [ ] Replace all callback input properties with standard CustomEvent emitters.
  - [x] Replaced a portion of properties.
  - [ ] Replaced all properties.
- [ ] Update Accordion component to be both useable via inheritance in addition to composition.
- [ ] Update instances of inter-frame communication to use messaging utility instead of window utility.
- [ ] Merge List and DataListBase so that List forms the basis for both data driven and declarative lists. This makes it possible to extends List and allow extended components to support both styles inherently.
- [ ] Create README.md.
- [ ] Add unit test framework (individual unit tests will be added as separate tasks).
- [ ] Create a utility type for taking a union of all possible parameter subsets for a function.

### Hard
- [x] Create `SparkModel` / `SparkStore` abstraction.
- [ ] Support linter @final jsdoc to finalize inherited methods like in Java/C++; can possibly make a separate npm module.

<br>



## Rabbit Hole

A list of spin-off ideas that are often very complex and won't be handled within the scope of this app.

- Web Component Library named Spark and publish to npm.
- VS Code / Trello / Jira Plugin with embedded AI (Copilot) for dynamic TODO list.
