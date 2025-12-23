# SPT-001: Screenshot Specification

## Overview

To reduce false-positive issue and ensure consistent visual testing result, we need a specification on how we will interact with the target website before taking a screenshot and how we take a screenshot.

## Screenshot Configuration

Users can customize the screenshot process by providing a configuration object. This can be defined directly on the HTML page or configured within the Spotteur UI for users who cannot modify the source code.

### API Definition

```javascript
window.spotteur = {
  options: {
    browsers: ["chrome", "firefox", "edge"],
    viewports: [
      [1024, 768],
      [375, 812],
    ],
    mediaReset: true,
    reducedMotion: true,
    rules: [
      {
        selectors: ["h1"],
        attrs: {
          "data-spt-replace-words": "5",
          "data-spt-hide": "true",
        },
      },
    ],
  },
};
```

### Options

- `browsers`: An array of strings specifying which browsers to use. Supported values: `chrome`, `firefox`, `edge`.
- `viewports`: An array of arrays, where each inner array represents `[width, height]` in pixels.
- `mediaReset`: Boolean. If true, resets all time-based media to a static state.
- `reducedMotion`: Boolean. If true, disables CSS animations and transitions.
- `rules`: An array of rules to dynamically apply `data-spt-*` attributes.
  - `selectors`: Array of CSS selectors to target elements.
  - `attrs`: Object containing the `data-spt-*` attributes to apply to the matched elements.

## Rules

Spotteur supports special `data-spt-*` attributes to change how they look in screenshots.

### Logic

The runner looks for these attributes in your page and applies changes after the `pre-screenshot` hook runs.

### API Definition

- `data-spt-hide`

  - Value: `true` or leave it empty.
  - Effect: Hides the element but keeps its empty space on the page. The implementation will add inline style `visibility: hidden !important` to the DOM.
  - Example: `<h1 data-spt-hide>Test</h1>`

- `data-spt-remove`

  - Value: `true` or leave it empty.
  - Effect: Removes the element completely from the page. The implementation will add inline style `display: none !important` to the DOM.
  - Example: `<h1 data-spt-remove>Test</h1>`

- `data-spt-replace-words`

  - Value: A number (min 1, max 500).
  - Effect: Replaces the text inside the element with consistent placeholder text (Lorem Ipsum) based on the specified amount.
  - Example: `<h1 data-spt-replace-words="5">Test</h1>`

- `data-spt-custom`
  - Value: A text key.
  - Effect: Replaces the text inside the element with a value from the dictionary matching the provided key. The dictionary can be configured via the Spotteur UI.
  - Example: `<h1 data-spt-custom="heading">Test</h1>`

## Media Handling

To ensure deterministic screenshots, all time-based media can be reset to a static state using one of the following methods:

- Set `mediaReset` to `true` in the global `window.spotteur.options` object.
- Add the `data-spt-media-reset` attribute to the `<html>` or `<body>` tag of your page.

### Logic

The runner executes a script to check these settings. If enabled, it locates all `<video>` and `<audio>` elements and forces them to a paused state at the beginning of the timeline.

```javascript
const hasOption = window.spotteur?.options?.mediaReset === true;
const hasAttribute = document.querySelector(
  "html[data-spt-media-reset], body[data-spt-media-reset]"
);

if (hasOption || hasAttribute) {
  const mediaElements = document.querySelectorAll("video, audio");
  mediaElements.forEach((media) => {
    media.pause();
    media.currentTime = 0;
  });
}
```

### API Definition

```javascript
window.spotteur = {
  options: {
    mediaReset: true,
  },
};
```

## Reduced Motion

To ensure deterministic screenshots, CSS animations and transitions can be disabled using one of the following methods:

- Set `reducedMotion` to `true` in the global `window.spotteur.options` object.
- Add the `data-spt-reduced-motion` attribute to the `<html>` or `<body>` tag of your page.

### Logic

If enabled, the runner should attempt to launch the browser with `prefers-reduced-motion` media query set to `reduce` (e.g. using `--force-prefers-reduced-motion` flag in Chrome).

Additionally, the runner executes a script to check these settings. If enabled, it injects a style block into the `<head>` of the document to force disable all animations and transitions.

```javascript
const hasOption = window.spotteur?.options?.reducedMotion === true;
const hasAttribute = document.querySelector(
  "html[data-spt-reduced-motion], body[data-spt-reduced-motion]"
);

if (hasOption || hasAttribute) {
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `;
  document.head.appendChild(style);
}
```

### API Definition

```javascript
window.spotteur = {
  options: {
    reducedMotion: true,
  },
};
```

## User Script Hooks

Spotteur supports a global hook system allowing the target page to define custom behavior before and after a screenshot.

### Logic

The runner must detect the presence of a global `spotteur.hooks` object on the global `window` variable. For now, the only available event is `pre-screenshot` that will be executed before the screenshot is taken.

Each hook should be an async function and return a promise. The runner will invoke & resolve that function.

### API Definition

```javascript
window.spotteur = {
  hooks: {
    /**
     * @returns {Promise<void>}
     */
    "pre-screenshot": async () => {
      // Custom logic
    },
  },
};
```
