/**
 * Vertical quickstart templates for the public Ethora SDK Playground.
 *
 * Each template is a ready-made starting point a visitor can try in the
 * browser without signing up: it applies a sensible set of chat settings,
 * shows a compliance angle for that industry, and links to the matching
 * SDKs / sample apps. Purely declarative data + a small merge helper — no
 * side effects, so it is safe to import anywhere (client or server).
 */

import { defaultSettings, type PlaygroundSettings } from './chat-config';

export interface VerticalTemplate {
  /** Stable id used in URLs / analytics. */
  id: string;
  /** Short label for the card. */
  label: string;
  /** Emoji used as a lightweight icon (no asset dependency). */
  icon: string;
  /** One-line value proposition. */
  tagline: string;
  /** 1–2 sentence description of the use case. */
  description: string;
  /** Compliance / trust angle that matters for this vertical. */
  complianceNote: string;
  /** Bullet features to highlight for this vertical. */
  highlights: string[];
  /** Partial settings merged over the playground defaults when selected. */
  settings: Partial<PlaygroundSettings>;
}

export const verticalTemplates: VerticalTemplate[] = [
  {
    id: 'telehealth',
    label: 'Telehealth',
    icon: '🩺',
    tagline: 'Secure patient–clinician chat & video visits',
    description:
      'Direct and group messaging between patients, clinicians and care teams, with secure video visits and file exchange — built to run inside a HIPAA-ready perimeter.',
    complianceNote: 'HIPAA-ready · self-hostable · BAA available',
    highlights: [
      '1:1 and group rooms for care teams',
      'Secure video/voice visits (WebRTC)',
      'Document & image exchange',
      'Push notifications across web + mobile',
    ],
    settings: {
      primaryColor: '#0052CD',
      secondaryColor: '#0A204E',
      theme: 'light',
      disableMedia: false,
      disableTypingIndicator: false,
      roomId: 'telehealth-demo-room',
    },
  },
  {
    id: 'insurance',
    label: 'Insurance / Claims',
    icon: '📋',
    tagline: 'Claimant ↔ adjuster messaging with audit trail',
    description:
      'White-label chat connecting claimants, adjusters, nurses and case workers — document collection, status updates and an auditable record for regulated workflows.',
    complianceNote: 'HIPAA + SOC 2 friendly · white-label · audit-ready',
    highlights: [
      'Case-centric rooms per claim',
      'Structured document collection',
      'Server-level Trust & Safety moderation',
      'White-label theming',
    ],
    settings: {
      primaryColor: '#0B5FFF',
      secondaryColor: '#102A43',
      theme: 'light',
      disableMedia: false,
      roomId: 'claims-demo-room',
    },
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: '🛒',
    tagline: 'Buyer ↔ seller chat with push notifications',
    description:
      'In-app messaging between buyers and sellers, with reactions, typing indicators and reliable push so conversations keep moving even when users leave the app.',
    complianceNote: 'GDPR controls · self-host for data residency',
    highlights: [
      'Buyer ↔ seller direct rooms',
      'Reactions, replies, typing indicators',
      'Reliable push notifications',
      'Drop-in React / React Native widgets',
    ],
    settings: {
      primaryColor: '#111827',
      secondaryColor: '#2563EB',
      theme: 'light',
      disableTypingIndicator: false,
      roomId: 'marketplace-demo-room',
    },
  },
  {
    id: 'support',
    label: 'Support / WordPress',
    icon: '💬',
    tagline: 'AI-assisted website chat assistant',
    description:
      'An embeddable AI chat assistant for your website or WordPress site — grounded on your own content (RAG) and served locally, with no remote third-party script.',
    complianceNote: 'Self-hosted AI option · data stays on your infra',
    highlights: [
      'Embeddable widget / WordPress plugin',
      'RAG assistant on your own docs',
      'No remote CDN — served locally',
      'Hand-off to a human agent',
    ],
    settings: {
      primaryColor: '#0F172A',
      secondaryColor: '#2775EA',
      theme: 'dark',
      disableHeader: false,
      roomId: 'support-demo-room',
    },
  },
];

/** Find a template by id. */
export function getVerticalTemplate(id: string): VerticalTemplate | undefined {
  return verticalTemplates.find((t) => t.id === id);
}

/**
 * Merge a template's settings over the playground defaults (or a given base),
 * returning a fresh settings object. Does not mutate inputs.
 */
export function applyVerticalTemplate(
  template: VerticalTemplate,
  base: PlaygroundSettings = defaultSettings
): PlaygroundSettings {
  return { ...base, ...template.settings };
}
