# TODO

List of needed bug fixes and potential features that shall be completed at some point in the future.

<br>



## Bug Fixes

### Important
* [x] Fix duplicate Recording Panel on pages with iframes.
* [x] Fix issue in SPA where auto/repeat record is not finding element on page back because iframe is dynamically added.
* [x] Fix issue where cross-origin iframe records are not working.

### Easy
* [ ] Vertically align the pause button; it is off by a pixel or two in Edge.

### Medium
*EMPTY*

### Hard
*EMPTY*

<br>



## Features

### Important
- [ ] Add list of actions with insert and remove functionality in Record configuration modal.
- [ ] Refine commit actions before saving by combining/removing/splitting where sensible.

### Easy
- [ ] Update Sheet to animate out when closed.
- [ ] Add button to pause all records on a page.

### Medium
- [ ] Create README.md
- [ ] Add global option for customizing stop recording key combo (options.html).
- [ ] Add global option for pausing all records on all pages.

### Hard
- [ ] Improve `deepQuerySelector` logic to support splitting a selector across shadow boundaries.
- [ ] Record screenshot snippets of action targets ([html2canvas](https://www.npmjs.com/package/html2canvas/v/1.4.1)).

<br>


## Architecture

### Important
*EMPTY*

### Easy
- [ ] In modal.ts, remove content from static open method so derived classes can omit custom content without confusion.

### Medium
*EMPTY*

### Hard
- [ ] Support linter @final jsdoc to finalize inherited methods like in Java/C++; can possibly make a separate npm module.
