const FEED_DIMENSIONS = { width: 1080, height: 1350 };
const STORY_DIMENSIONS = { width: 1080, height: 1920 };

const BASE_BINDINGS = [
  { selector: '#bg', type: 'image', field: 'resolvedBg', required: true },
  { selector: '#logo', type: 'logo', field: 'resolvedLogo', required: true },
  { selector: '#title', type: 'text', field: 'h1', optional: true },
  { selector: '#subtitle', type: 'text', field: 'h2', optional: true },
  { selector: '#tag', type: 'text', field: 'tag', optional: true },
  { selector: '#textBody', type: 'text', field: 'text', optional: true },
];

const THEME_BINDINGS = [
  { selector: '#themeStylesheet', type: 'attribute', attribute: 'href', field: 'themeStylesheet', optional: true },
  { selector: 'html', type: 'attribute', name: 'data-theme', field: 'themeName', optional: true },
];

const themableStory = (overrides = {}) => ({
  dimensions: { ...STORY_DIMENSIONS },
  bindings: [...THEME_BINDINGS],
  cssVars: [],
  classes: [],
  attributes: [],
  ...overrides,
});

const fixedStory = (overrides = {}) => ({
  dimensions: { ...STORY_DIMENSIONS },
  bindings: [],
  cssVars: [],
  classes: [],
  attributes: [],
  ...overrides,
});

module.exports = {
  defaults: {
    dimensions: { ...FEED_DIMENSIONS },
    bindings: BASE_BINDINGS,
    cssVars: [],
    classes: [],
    attributes: [],
  },
  templates: {
    TemplateAGazeta: {},
    TemplateAGazetaFeed: {
      dimensions: { width: 1080, height: 1080 },
    },
    TemplateSimples: {},
    TemplateTopicos: {},
    'layout-horizontal': themableStory(),
    'layout-vertical': themableStory(),
    'layout-hz': themableStory(),
    'layout-bbc': fixedStory(),
    'opiniao': fixedStory(),
    'colunistas': fixedStory(),
    'se-cuida': fixedStory(),
  },
};
