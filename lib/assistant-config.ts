/**
 * Config + embed-snippet generation for the Ethora AI Assistant widget
 * (@ethora/ai-chat-widget, built as dist/ethora_assistant.js).
 *
 * Mirrors the data-* attributes read by ai-assistant-ui/src/widget/appearance.ts
 * and src/main.tsx (readOverrides). Kept in this playground rather than
 * imported from the widget repo, since the widget is consumed as a built
 * <script> tag, not an npm dependency.
 */

export interface AssistantSettings {
  // Identity / connection
  appId: string;
  apiUrl: string;
  botName: string;
  botAvatar: string;
  title: string;
  greetingTitle: string;
  greetingMessage: string;
  hideSystemMessages: boolean;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  iconsColor: string;
  ownBubbleBg: string;
  otherBubbleBg: string;
  inputBg: string;

  // Fonts
  fontFamily: string;
  fontSize: string;
  googleFont: string;
  locale: string;

  // Position & size
  position: 'left' | 'right';
  width: string;
  height: string;
  expandedWidth: string;
  expandedHeight: string;
  expandedInset: string;
  disableMedia: boolean;
  allowFullscreen: boolean;
  startFullscreen: boolean;

  // Launcher
  launcherIcon: string;
  launcherGradient: string;
  flatLauncher: boolean;
  launcherSize: number;
  launcherGlow: boolean;

  // Call to action
  ctaText: string;
  ctaDelay: number;
  ctaSparkle: boolean;
}

// appId verified live against production in ai-assistant-ui's own testing
// (see ai-assistant-ui/CLAUDE.md "VERIFIED LIVE"), used here only as a
// starting point so the preview has something real to connect to.
export const defaultAssistantSettings: AssistantSettings = {
  appId: '646cc8dc96d4a4dc8f7b2f2d',
  apiUrl: 'https://api.chat.ethora.com',
  botName: '',
  botAvatar: '',
  title: '',
  greetingTitle: '',
  greetingMessage: '',
  hideSystemMessages: true,

  primaryColor: '',
  secondaryColor: '',
  iconsColor: '',
  ownBubbleBg: '',
  otherBubbleBg: '',
  inputBg: '',

  fontFamily: '',
  fontSize: '',
  googleFont: '',
  locale: '',

  position: 'right',
  width: '',
  height: '',
  expandedWidth: '',
  expandedHeight: '',
  expandedInset: '',
  disableMedia: true,
  allowFullscreen: true,
  startFullscreen: false,

  launcherIcon: '',
  launcherGradient: '',
  flatLauncher: false,
  launcherSize: 56,
  launcherGlow: true,

  ctaText: 'Ask me anything!',
  ctaDelay: 1200,
  ctaSparkle: true,
};

// Maps each field to its data-* attribute name and how to serialize it.
// A field is omitted from the embed snippet when it equals the widget's own
// built-in default, so the generated snippet stays minimal.
const ATTR_MAP: Array<{
  key: keyof AssistantSettings;
  attr: string;
  isDefault: (settings: AssistantSettings) => boolean;
  serialize?: (settings: AssistantSettings) => string;
}> = [
  { key: 'appId', attr: 'data-app-id', isDefault: () => false },
  { key: 'apiUrl', attr: 'data-api-url', isDefault: (s) => !s.apiUrl },
  { key: 'botName', attr: 'data-bot-name', isDefault: (s) => !s.botName },
  { key: 'botAvatar', attr: 'data-bot-avatar', isDefault: (s) => !s.botAvatar },
  { key: 'title', attr: 'data-title', isDefault: (s) => !s.title },
  { key: 'greetingTitle', attr: 'data-greeting-title', isDefault: (s) => !s.greetingTitle },
  { key: 'greetingMessage', attr: 'data-greeting-message', isDefault: (s) => !s.greetingMessage },
  {
    key: 'hideSystemMessages',
    attr: 'data-hide-system-messages',
    isDefault: (s) => s.hideSystemMessages === true,
    serialize: (s) => String(s.hideSystemMessages),
  },
  { key: 'primaryColor', attr: 'data-primary-color', isDefault: (s) => !s.primaryColor },
  { key: 'secondaryColor', attr: 'data-secondary-color', isDefault: (s) => !s.secondaryColor },
  { key: 'iconsColor', attr: 'data-icons-color', isDefault: (s) => !s.iconsColor },
  { key: 'ownBubbleBg', attr: 'data-own-bubble-bg', isDefault: (s) => !s.ownBubbleBg },
  { key: 'otherBubbleBg', attr: 'data-other-bubble-bg', isDefault: (s) => !s.otherBubbleBg },
  { key: 'inputBg', attr: 'data-input-bg', isDefault: (s) => !s.inputBg },
  { key: 'fontFamily', attr: 'data-font-family', isDefault: (s) => !s.fontFamily },
  { key: 'fontSize', attr: 'data-font-size', isDefault: (s) => !s.fontSize },
  { key: 'googleFont', attr: 'data-google-font', isDefault: (s) => !s.googleFont },
  { key: 'locale', attr: 'data-locale', isDefault: (s) => !s.locale },
  { key: 'position', attr: 'data-position', isDefault: (s) => s.position === 'right' },
  { key: 'width', attr: 'data-width', isDefault: (s) => !s.width },
  { key: 'height', attr: 'data-height', isDefault: (s) => !s.height },
  { key: 'expandedWidth', attr: 'data-expanded-width', isDefault: (s) => !s.expandedWidth },
  { key: 'expandedHeight', attr: 'data-expanded-height', isDefault: (s) => !s.expandedHeight },
  { key: 'expandedInset', attr: 'data-expanded-inset', isDefault: (s) => !s.expandedInset },
  {
    key: 'disableMedia',
    attr: 'data-disable-media',
    isDefault: (s) => s.disableMedia === true,
    serialize: (s) => String(s.disableMedia),
  },
  {
    key: 'allowFullscreen',
    attr: 'data-allow-fullscreen',
    isDefault: (s) => s.allowFullscreen === true,
    serialize: (s) => String(s.allowFullscreen),
  },
  {
    key: 'startFullscreen',
    attr: 'data-start-fullscreen',
    isDefault: (s) => s.startFullscreen === false,
    serialize: (s) => String(s.startFullscreen),
  },
  { key: 'launcherIcon', attr: 'data-launcher-icon', isDefault: (s) => !s.launcherIcon },
  { key: 'launcherGradient', attr: 'data-launcher-gradient', isDefault: (s) => !s.launcherGradient },
  {
    key: 'flatLauncher',
    attr: 'data-flat-launcher',
    isDefault: (s) => s.flatLauncher === false,
    serialize: (s) => String(s.flatLauncher),
  },
  {
    key: 'launcherSize',
    attr: 'data-launcher-size',
    isDefault: (s) => s.launcherSize === 56,
    serialize: (s) => String(s.launcherSize),
  },
  {
    key: 'launcherGlow',
    attr: 'data-launcher-glow',
    isDefault: (s) => s.launcherGlow === true,
    serialize: (s) => String(s.launcherGlow),
  },
  { key: 'ctaText', attr: 'data-cta-text', isDefault: (s) => s.ctaText === 'Ask me anything!' },
  {
    key: 'ctaDelay',
    attr: 'data-cta-delay',
    isDefault: (s) => s.ctaDelay === 1200,
    serialize: (s) => String(s.ctaDelay),
  },
  {
    key: 'ctaSparkle',
    attr: 'data-cta-sparkle',
    isDefault: (s) => s.ctaSparkle === true,
    serialize: (s) => String(s.ctaSparkle),
  },
];

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Every non-default data-* attribute, in the order the widget script reads them. */
export function getAssistantAttributes(settings: AssistantSettings): Array<[string, string]> {
  return ATTR_MAP.filter((entry) => !entry.isDefault(settings)).map((entry) => [
    entry.attr,
    entry.serialize ? entry.serialize(settings) : String(settings[entry.key]),
  ]);
}

/** The production embed snippet a customer would paste onto their own site. */
export function generateEmbedSnippet(
  settings: AssistantSettings,
  scriptSrc = 'https://cdn.ethora.com/assistant/ethora_assistant.js'
): string {
  const attrs = getAssistantAttributes(settings)
    .map(([attr, value]) => `  ${attr}="${escapeAttr(value)}"`)
    .join('\n');
  return `<script\n  id="chat-content-assistant"\n  src="${scriptSrc}"\n${attrs}\n></script>`;
}
