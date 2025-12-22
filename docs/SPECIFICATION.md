# Spotteur Screenshot Specification

## Overview

To reduce false-positive issue and ensure consistent visual testing result, we need a specification on how we will interact with the target website before taking a screenshot.

## User Script Hooks

Spotteur supports a global hook system allowing the target page to define custom behavior before and after a screenshot.

### Logic

The runner must detect the presence of a global `SpotteurHooks` object on the global `window` variable. For now, the only available event is `pre-screenshot` that will be executed before the screenshot is taken.

Each hook should be an async function and return a promise. The runner will invoke & resolve that function.

### API Definition

```javascript
window.SpotteurHooks = {
  /**
   * @returns {Promise<void>}
   */
  "pre-screenshot": async () => {
    // Custom logic
  },
};
```

## DOM Decorators

Spotteur supports special `data-spt-*` attributes to change how they look in screenshots.

### Logic

The runner looks for these attributes in your page and applies changes after the `pre-screenshot` hook runs.

### API Definition

- `data-spt-hide`

  - Value: `true` or leave it empty.
  - Effect: Hides the element but keeps its empty space on the page (should be using CSS `visibility: hidden`).
  - Example: `<h1 data-spt-hide>Test</h1>`

- `data-spt-remove`

  - Value: `true` or leave it empty.
  - Effect: Removes the element completely from the page (should be using CSS `display: none`).
  - Example: `<h1 data-spt-remove>Test</h1>`

- `data-spt-replace-words`

  - Value: A number (min 1, max 500).
  - Effect: Replaces the text inside the element with consistent placeholder text (Lorem Ipsum) based on the specified amount.
  - Example: `<h1 data-spt-replace-words="5">Test</h1>`

- `data-spt-custom`
  - Value: A text key.
  - Effect: Replaces the text inside the element with a value from user defined dictionary matching the key.
  - Example: `<h1 data-spt-custom="heading">Test</h1>`

## Media Handling

To ensure deterministic screenshots, all time-based media must be reset to a static state.

### Logic

The runner executes a script to locate all `<video>` and `<audio>` elements and force them to a paused state at the beginning of the timeline.

```javascript
const mediaElements = document.querySelectorAll("video, audio");
mediaElements.forEach((media) => {
  media.pause();
  media.currentTime = 0;
});
```
