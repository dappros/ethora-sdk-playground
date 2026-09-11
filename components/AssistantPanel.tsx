'use client';

import React, { useMemo, useState } from 'react';
import {
  type AssistantSettings,
  defaultAssistantSettings,
  generateEmbedSnippet,
  getAssistantAttributes,
} from '@/lib/assistant-config';

interface AssistantPanelProps {
  settings: AssistantSettings;
  onSettingsChange: (updates: Partial<AssistantSettings>) => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {title}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white dark:bg-gray-900">{children}</div>}
    </div>
  );
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    {children}
  </label>
);

const fieldClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1976d2'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer"
        />
        <input
          id={id}
          type="text"
          value={value}
          placeholder="unset (widget default)"
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={fieldClass}
      />
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600"
      />
    </label>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 accent-blue-600 cursor-pointer"
      />
    </div>
  );
}

const SIZE_PRESETS: { label: string; width: string; height: string }[] = [
  { label: 'Widget default', width: '', height: '' },
  { label: 'Compact', width: '320px', height: '440px' },
  { label: 'Standard', width: '380px', height: '520px' },
  { label: 'Large', width: '420px', height: '620px' },
  { label: 'Tall', width: '380px', height: '80vh' },
];

function SizePresetField({
  width,
  height,
  onPreset,
}: {
  width: string;
  height: string;
  onPreset: (width: string, height: string) => void;
}) {
  const activeLabel = SIZE_PRESETS.find((p) => p.width === width && p.height === height)?.label;
  return (
    <div>
      <Label htmlFor="sizePresets">Quick sizes</Label>
      <div id="sizePresets" className="flex flex-wrap gap-2">
        {SIZE_PRESETS.map((preset) => {
          const isActive = preset.label === activeLabel;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onPreset(preset.width, preset.height)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Or type an exact CSS value (px, vh/vw, calc(...)) in the fields below.
      </p>
    </div>
  );
}

function buildPreviewHtml(settings: AssistantSettings): string {
  const attrs = getAssistantAttributes(settings)
    .map(([attr, value]) => `${attr}="${value.replace(/"/g, '&quot;')}"`)
    .join(' ');
  // Loads the locally-built widget bundle (copied from ai-assistant-ui's
  // dist/ethora_assistant.js) so the preview reflects the actual latest build,
  // not a hand-simulated approximation of it.
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;font:14px system-ui,sans-serif;color:#666;padding:16px;">
    <p>Assistant widget preview &mdash; launcher appears bottom-${settings.position}.</p>
    <script id="chat-content-assistant" src="/assistant/ethora_assistant.js" ${attrs}></script>
  </body>
</html>`;
}

export default function AssistantPanel({ settings, onSettingsChange }: AssistantPanelProps) {
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleChange = (key: keyof AssistantSettings, value: any) => {
    onSettingsChange({ [key]: value });
  };

  const snippet = useMemo(() => generateEmbedSnippet(settings), [settings]);
  const previewHtml = useMemo(() => buildPreviewHtml(settings), [settings, previewKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable; user can still select the text manually.
    }
  };

  const handleReset = () => onSettingsChange(defaultAssistantSettings);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Configurator */}
      <aside className="w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink lg:flex-shrink-0 max-h-[45vh] lg:max-h-none p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Assistant configurator
          </h2>
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Reset to defaults
          </button>
        </div>

        <CollapsibleSection title="Identity & connection" defaultOpen>
          <TextField
            id="appId"
            label="App ID"
            value={settings.appId}
            onChange={(v) => handleChange('appId', v)}
          />
          <TextField
            id="apiUrl"
            label="API URL"
            value={settings.apiUrl}
            onChange={(v) => handleChange('apiUrl', v)}
          />
          <TextField
            id="botName"
            label="Bot display name"
            value={settings.botName}
            placeholder="(bot's own name)"
            onChange={(v) => handleChange('botName', v)}
          />
          <TextField
            id="botAvatar"
            label="Bot avatar URL"
            value={settings.botAvatar}
            placeholder="https://…"
            onChange={(v) => handleChange('botAvatar', v)}
          />
          <TextField
            id="title"
            label="Popup title"
            value={settings.title}
            onChange={(v) => handleChange('title', v)}
          />
          <TextField
            id="greetingTitle"
            label="Greeting title"
            value={settings.greetingTitle}
            onChange={(v) => handleChange('greetingTitle', v)}
          />
          <TextField
            id="greetingMessage"
            label="Greeting message"
            value={settings.greetingMessage}
            onChange={(v) => handleChange('greetingMessage', v)}
          />
          <ToggleField
            id="hideSystemMessages"
            label="Hide system messages"
            checked={settings.hideSystemMessages}
            onChange={(v) => handleChange('hideSystemMessages', v)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Colors">
          <ColorField
            id="primaryColor"
            label="Primary"
            value={settings.primaryColor}
            onChange={(v) => handleChange('primaryColor', v)}
          />
          <ColorField
            id="secondaryColor"
            label="Secondary"
            value={settings.secondaryColor}
            onChange={(v) => handleChange('secondaryColor', v)}
          />
          <ColorField
            id="iconsColor"
            label="Icons"
            value={settings.iconsColor}
            onChange={(v) => handleChange('iconsColor', v)}
          />
          <ColorField
            id="ownBubbleBg"
            label="Own message bubble"
            value={settings.ownBubbleBg}
            onChange={(v) => handleChange('ownBubbleBg', v)}
          />
          <ColorField
            id="otherBubbleBg"
            label="Bot message bubble"
            value={settings.otherBubbleBg}
            onChange={(v) => handleChange('otherBubbleBg', v)}
          />
          <ColorField
            id="inputBg"
            label="Input bar"
            value={settings.inputBg}
            onChange={(v) => handleChange('inputBg', v)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Fonts & locale">
          <TextField
            id="fontFamily"
            label="Font family"
            value={settings.fontFamily}
            placeholder="e.g. Inter, sans-serif"
            onChange={(v) => handleChange('fontFamily', v)}
          />
          <TextField
            id="fontSize"
            label="Font size"
            value={settings.fontSize}
            placeholder="e.g. 16px"
            onChange={(v) => handleChange('fontSize', v)}
          />
          <TextField
            id="googleFont"
            label="Google Font (auto-loaded)"
            value={settings.googleFont}
            placeholder="e.g. Inter"
            onChange={(v) => handleChange('googleFont', v)}
          />
          <TextField
            id="locale"
            label="Locale (BCP-47)"
            value={settings.locale}
            placeholder="e.g. en, uk"
            onChange={(v) => handleChange('locale', v)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Position & size">
          <div>
            <Label htmlFor="position">Docked side</Label>
            <select
              id="position"
              value={settings.position}
              onChange={(e) => handleChange('position', e.target.value as 'left' | 'right')}
              className={fieldClass}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
          <SizePresetField
            width={settings.width}
            height={settings.height}
            onPreset={(w, h) => {
              handleChange('width', w);
              handleChange('height', h);
            }}
          />
          <TextField
            id="width"
            label="Width"
            value={settings.width}
            placeholder="calc(20vw + 30px)"
            onChange={(v) => handleChange('width', v)}
          />
          <TextField
            id="height"
            label="Height"
            value={settings.height}
            placeholder="calc(40vh + 32px)"
            onChange={(v) => handleChange('height', v)}
          />
          <TextField
            id="expandedWidth"
            label="Expanded width"
            value={settings.expandedWidth}
            placeholder="100%"
            onChange={(v) => handleChange('expandedWidth', v)}
          />
          <TextField
            id="expandedHeight"
            label="Expanded height"
            value={settings.expandedHeight}
            placeholder="100%"
            onChange={(v) => handleChange('expandedHeight', v)}
          />
          <TextField
            id="expandedInset"
            label="Expanded inset"
            value={settings.expandedInset}
            placeholder="0px"
            onChange={(v) => handleChange('expandedInset', v)}
          />
          <ToggleField
            id="disableMedia"
            label="Disable attach/mic controls"
            checked={settings.disableMedia}
            onChange={(v) => handleChange('disableMedia', v)}
          />
          <ToggleField
            id="allowFullscreen"
            label="Allow fullscreen expand"
            checked={settings.allowFullscreen}
            onChange={(v) => handleChange('allowFullscreen', v)}
          />
          <ToggleField
            id="startFullscreen"
            label="Start expanded"
            checked={settings.startFullscreen}
            onChange={(v) => handleChange('startFullscreen', v)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Launcher">
          <TextField
            id="launcherIcon"
            label="Launcher icon URL"
            value={settings.launcherIcon}
            placeholder="https://…"
            onChange={(v) => handleChange('launcherIcon', v)}
          />
          <TextField
            id="launcherGradient"
            label="Launcher gradient (two colors)"
            value={settings.launcherGradient}
            placeholder="6e72fc,ad1deb"
            onChange={(v) => handleChange('launcherGradient', v)}
          />
          <ToggleField
            id="flatLauncher"
            label="Flat launcher (use primary color)"
            checked={settings.flatLauncher}
            onChange={(v) => handleChange('flatLauncher', v)}
          />
          <SliderField
            id="launcherSize"
            label="Launcher size"
            value={settings.launcherSize}
            min={40}
            max={88}
            step={4}
            onChange={(v) => handleChange('launcherSize', v)}
          />
          <ToggleField
            id="launcherGlow"
            label="Pulsing glow"
            checked={settings.launcherGlow}
            onChange={(v) => handleChange('launcherGlow', v)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Call to action">
          <TextField
            id="ctaText"
            label="Teaser text"
            value={settings.ctaText}
            placeholder="Ask me anything!"
            onChange={(v) => handleChange('ctaText', v)}
          />
          <NumberField
            id="ctaDelay"
            label="Teaser delay (ms)"
            value={settings.ctaDelay}
            onChange={(v) => handleChange('ctaDelay', v)}
          />
          <ToggleField
            id="ctaSparkle"
            label="Sparkle icon"
            checked={settings.ctaSparkle}
            onChange={(v) => handleChange('ctaSparkle', v)}
          />
        </CollapsibleSection>
      </aside>

      {/* Preview + embed code */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col min-w-0 min-h-[300px] lg:min-h-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Live preview &mdash; loads the built <code>ethora_assistant.js</code>
          </span>
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium"
          >
            Reload preview
          </button>
        </div>
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-950">
          <iframe
            key={previewKey}
            title="Assistant widget preview"
            srcDoc={previewHtml}
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Embed snippet
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto">
            <code>{snippet}</code>
          </pre>
        </div>
      </main>
    </div>
  );
}
