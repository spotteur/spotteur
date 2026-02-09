export const defaultValuePageRule = [
  {
    snapshotBrowsers: ['chrome'],
    viewports: [[1920, 1080]],
    mediaReset: true,
    reducedMotion: true,
    pagePath: '/',
    rules: [
      {
        attrs: [
          {
            name: 'data-spt-replace-words',
            value: '15',
          },
        ],
        selectors: ['[data-component="SummaryHero"] h2'],
      },
      {
        attrs: [
          {
            name: 'data-spt-hide',
            value: 'true',
          },
        ],
        selectors: ['[data-component="SlideShowCarousel"] > div > div > button[aria-label="Slide button"]'],
      },
    ],
  },
]
