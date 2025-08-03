# TODO

List of needed bug fixes, features, and architectural updates that shall be completed at some point in the future.

<br>



## Bug Fixes

### Important
* [x] Fix duplicate Recording Panel on pages with iframes (content).
* [x] Fix issue in SPA where auto/repeat record is not finding element on page back because iframe is dynamically added (content).
* [x] Fix issue where cross-origin iframe records are not working (content).

### Easy
* [ ] Vertically align the pause button; it is off by a pixel or two in Edge (popup).

### Medium
*EMPTY*

### Hard
*EMPTY*

<br>



## Features

### Important
- [ ] Add list of actions with insert and remove functionality in Record configuration modal (content).
- [ ] Refine commit actions before saving by combining/removing/splitting where sensible (content).

### Easy
- [ ] Add button to pause all records on a pag (popup).
- [ ] Update extension icon to signify if recording or record playback is active (popup).
- [ ] Update behavior of extension icon to not open the extension popup if clicked to stop recording (popup).
- [ ] Update Sheet to animate out when closed (popup).

### Medium
- [ ] Add global option for customizing stop recording key combo (options).
- [ ] Add global option for pausing all records on all pages (options).
- [ ] Add global options for defaults for new record configuration values (options).

### Hard
- [ ] Improve `deepQuerySelector` logic to support splitting a selector across shadow boundaries (content).
- [ ] Record screenshot snippets of action targets and display them in configuration modal ([html2canvas](https://www.npmjs.com/package/html2canvas/v/1.4.1)) (content).

<br>


## Architecture

### Important
*EMPTY*

### Easy
- [ ] In modal.ts, remove content from static open method so derived classes can omit custom content without confusion.

### Medium
- [ ] Replace all callback input properties with standard CustomEvent emitters.
- [ ] Update Accordion component to be both useable via inheritance in addition to composition.
- [ ] Update instances of inter-frame communication to use messaging utility instead of window utility.
- [ ] Merge List and DataListBase so that List forms the basis for both data driven and declarative lists. This makes it possible to extends List and allow extended components to support both styles inherently.
- [ ] Create README.md
- [ ] Add unit test framework (individual unit tests will be added as separate tasks).

### Hard
- [ ] Support linter @final jsdoc to finalize inherited methods like in Java/C++; can possibly make a separate npm module.
