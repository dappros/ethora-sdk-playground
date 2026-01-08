'use client';

import React, { useState } from 'react';
import type { PlaygroundSettings } from '@/lib/chat-config';

interface SettingsPanelProps {
  settings: PlaygroundSettings;
  onSettingsChange: (settings: Partial<PlaygroundSettings>) => void;
  onSetup: () => void;
  isSettingUp: boolean;
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white dark:bg-gray-900">{children}</div>}
    </div>
  );
};

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onSetup,
  isSettingUp,
}: SettingsPanelProps) {
  const handleChange = (key: keyof PlaygroundSettings, value: any) => {
    onSettingsChange({ [key]: value });
  };

  const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
    htmlFor,
    children,
  }) => (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {children}
    </label>
  );

  const Input: React.FC<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
  }> = ({ id, value, onChange, placeholder, type = 'text' }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
    />
  );

  const Checkbox: React.FC<{
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }> = ({ id, checked, onChange, label }) => (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label
        htmlFor={id}
        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h2>
        <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
          Configure your chat settings
        </p>
      </div>

      <button
        onClick={onSetup}
        disabled={isSettingUp}
        className="w-full mb-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors shadow-sm hover:shadow"
      >
        {isSettingUp ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Setting up...
          </span>
        ) : (
          'Setup Chat Room & User'
        )}
      </button>

      <CollapsibleSection title="Authentication" defaultOpen={true}>
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            value={settings.userId}
            onChange={(value) => handleChange('userId', value)}
            placeholder="playground-user-1"
          />
        </div>
        <div>
          <Label htmlFor="roomId">Room ID / Workspace ID</Label>
          <Input
            id="roomId"
            value={settings.roomId}
            onChange={(value) => handleChange('roomId', value)}
            placeholder="playground-room-1"
          />
        </div>
        {settings.token && (
          <div>
            <Label htmlFor="token">Token (Auto-generated)</Label>
            <textarea
              id="token"
              value={settings.token}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 dark:text-white text-xs font-mono"
              rows={3}
            />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Appearance" defaultOpen={true}>
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={settings.primaryColor}
              onChange={(value) => handleChange('primaryColor', value)}
            />
            <Input
              type="text"
              value={settings.primaryColor}
              onChange={(value) => handleChange('primaryColor', value)}
              placeholder="#ffffff"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondaryColor"
              type="color"
              value={settings.secondaryColor}
              onChange={(value) => handleChange('secondaryColor', value)}
            />
            <Input
              type="text"
              value={settings.secondaryColor}
              onChange={(value) => handleChange('secondaryColor', value)}
              placeholder="#141414"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="qrUrl">QR URL</Label>
          <Input
            id="qrUrl"
            value={settings.qrUrl}
            onChange={(value) => handleChange('qrUrl', value)}
            placeholder="https://app.ethora.com/app/chat/?qrChatId="
          />
        </div>
        <div>
          <Label htmlFor="backgroundChatColor">Background Chat Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundChatColor"
              type="color"
              value={settings.backgroundChatColor || '#ffffff'}
              onChange={(value) => handleChange('backgroundChatColor', value)}
            />
            <Input
              type="text"
              value={settings.backgroundChatColor || ''}
              onChange={(value) => handleChange('backgroundChatColor', value || undefined)}
              placeholder="Optional background color"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="backgroundChatImage">Background Chat Image URL</Label>
          <Input
            id="backgroundChatImage"
            value={settings.backgroundChatImage || ''}
            onChange={(value) => handleChange('backgroundChatImage', value || undefined)}
            placeholder="Optional image URL"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="XMPP Settings" defaultOpen={true}>
        <div>
          <Label htmlFor="xmppDevServer">Dev Server URL</Label>
          <Input
            id="xmppDevServer"
            value={settings.xmppDevServer}
            onChange={(value) => handleChange('xmppDevServer', value)}
            placeholder="wss://xmpp.ethoradev.com:5443/ws"
          />
        </div>
        <div>
          <Label htmlFor="xmppHost">Host</Label>
          <Input
            id="xmppHost"
            value={settings.xmppHost}
            onChange={(value) => handleChange('xmppHost', value)}
            placeholder="xmpp.ethoradev.com"
          />
        </div>
        <div>
          <Label htmlFor="xmppConference">Conference Domain</Label>
          <Input
            id="xmppConference"
            value={settings.xmppConference}
            onChange={(value) => handleChange('xmppConference', value)}
            placeholder="conference.xmpp.ethoradev.com"
          />
        </div>
        <Checkbox
          id="xmppPingOnSendEnabled"
          checked={settings.xmppPingOnSendEnabled}
          onChange={(checked) => handleChange('xmppPingOnSendEnabled', checked)}
          label="XMPP Ping On Send Enabled"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Basic Features">
        <Checkbox
          id="newArch"
          checked={settings.newArch}
          onChange={(checked) => handleChange('newArch', checked)}
          label="New Architecture"
        />
        <Checkbox
          id="disableRooms"
          checked={settings.disableRooms}
          onChange={(checked) => handleChange('disableRooms', checked)}
          label="Disable Rooms"
        />
        <Checkbox
          id="disableRoomMenu"
          checked={settings.disableRoomMenu}
          onChange={(checked) => handleChange('disableRoomMenu', checked)}
          label="Disable Room Menu"
        />
        <Checkbox
          id="enableRoomsRetry"
          checked={settings.enableRoomsRetry}
          onChange={(checked) => handleChange('enableRoomsRetry', checked)}
          label="Enable Rooms Retry"
        />
        <div>
          <Label htmlFor="enableRoomsRetryHelperText">Rooms Retry Helper Text</Label>
          <Input
            id="enableRoomsRetryHelperText"
            value={settings.enableRoomsRetryHelperText}
            onChange={(value) => handleChange('enableRoomsRetryHelperText', value)}
            placeholder="Initializing room"
          />
        </div>
        <Checkbox
          id="refreshTokensEnabled"
          checked={settings.refreshTokensEnabled}
          onChange={(checked) => handleChange('refreshTokensEnabled', checked)}
          label="Refresh Tokens Enabled"
        />
        <Checkbox
          id="setRoomJidInPath"
          checked={settings.setRoomJidInPath}
          onChange={(checked) => handleChange('setRoomJidInPath', checked)}
          label="Set Room JID in Path"
        />
      </CollapsibleSection>

      <CollapsibleSection title="UI Controls">
        <Checkbox
          id="disableHeader"
          checked={settings.disableHeader}
          onChange={(checked) => handleChange('disableHeader', checked)}
          label="Disable Header"
        />
        <Checkbox
          id="disableMedia"
          checked={settings.disableMedia}
          onChange={(checked) => handleChange('disableMedia', checked)}
          label="Disable Media"
        />
        <Checkbox
          id="disableInteractions"
          checked={settings.disableInteractions}
          onChange={(checked) => handleChange('disableInteractions', checked)}
          label="Disable Interactions"
        />
        <Checkbox
          id="chatHeaderBurgerMenu"
          checked={settings.chatHeaderBurgerMenu}
          onChange={(checked) => handleChange('chatHeaderBurgerMenu', checked)}
          label="Chat Header Burger Menu"
        />
        <Checkbox
          id="disableNewChatButton"
          checked={settings.disableNewChatButton}
          onChange={(checked) => handleChange('disableNewChatButton', checked)}
          label="Disable New Chat Button"
        />
        <Checkbox
          id="disableUserCount"
          checked={settings.disableUserCount}
          onChange={(checked) => handleChange('disableUserCount', checked)}
          label="Disable User Count"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Chat Header Settings">
        <Checkbox
          id="chatHeaderSettingsHide"
          checked={settings.chatHeaderSettingsHide}
          onChange={(checked) => handleChange('chatHeaderSettingsHide', checked)}
          label="Hide Header"
        />
        <Checkbox
          id="chatHeaderSettingsDisableCreate"
          checked={settings.chatHeaderSettingsDisableCreate}
          onChange={(checked) => handleChange('chatHeaderSettingsDisableCreate', checked)}
          label="Disable Create"
        />
        <Checkbox
          id="chatHeaderSettingsDisableMenu"
          checked={settings.chatHeaderSettingsDisableMenu}
          onChange={(checked) => handleChange('chatHeaderSettingsDisableMenu', checked)}
          label="Disable Menu"
        />
        <Checkbox
          id="chatHeaderSettingsHideSearch"
          checked={settings.chatHeaderSettingsHideSearch}
          onChange={(checked) => handleChange('chatHeaderSettingsHideSearch', checked)}
          label="Hide Search"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Chat Info Settings">
        <Checkbox
          id="disableChatInfoHeader"
          checked={settings.disableChatInfoHeader}
          onChange={(checked) => handleChange('disableChatInfoHeader', checked)}
          label="Disable Header"
        />
        <Checkbox
          id="disableChatInfoDescription"
          checked={settings.disableChatInfoDescription}
          onChange={(checked) => handleChange('disableChatInfoDescription', checked)}
          label="Disable Description"
        />
        <Checkbox
          id="disableChatInfoType"
          checked={settings.disableChatInfoType}
          onChange={(checked) => handleChange('disableChatInfoType', checked)}
          label="Disable Type"
        />
        <Checkbox
          id="disableChatInfoMembers"
          checked={settings.disableChatInfoMembers}
          onChange={(checked) => handleChange('disableChatInfoMembers', checked)}
          label="Disable Members"
        />
        <Checkbox
          id="disableChatInfoHeaderMenu"
          checked={settings.disableChatInfoHeaderMenu}
          onChange={(checked) => handleChange('disableChatInfoHeaderMenu', checked)}
          label="Disable Header Menu"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Advanced Features">
        <Checkbox
          id="defaultLogin"
          checked={settings.defaultLogin}
          onChange={(checked) => handleChange('defaultLogin', checked)}
          label="Default Login"
        />
        <Checkbox
          id="forceSetRoom"
          checked={settings.forceSetRoom}
          onChange={(checked) => handleChange('forceSetRoom', checked)}
          label="Force Set Room"
        />
        <Checkbox
          id="disableRoomConfig"
          checked={settings.disableRoomConfig}
          onChange={(checked) => handleChange('disableRoomConfig', checked)}
          label="Disable Room Config"
        />
        <Checkbox
          id="disableProfilesInteractions"
          checked={settings.disableProfilesInteractions}
          onChange={(checked) => handleChange('disableProfilesInteractions', checked)}
          label="Disable Profiles Interactions"
        />
        <Checkbox
          id="clearStoreBeforeInit"
          checked={settings.clearStoreBeforeInit}
          onChange={(checked) => handleChange('clearStoreBeforeInit', checked)}
          label="Clear Store Before Init"
        />
        <Checkbox
          id="disableSentLogic"
          checked={settings.disableSentLogic}
          onChange={(checked) => handleChange('disableSentLogic', checked)}
          label="Disable Sent Logic"
        />
        <Checkbox
          id="initBeforeLoad"
          checked={settings.initBeforeLoad}
          onChange={(checked) => handleChange('initBeforeLoad', checked)}
          label="Init Before Load"
        />
        <Checkbox
          id="botMessageAutoScroll"
          checked={settings.botMessageAutoScroll}
          onChange={(checked) => handleChange('botMessageAutoScroll', checked)}
          label="Bot Message Auto Scroll"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Typing Indicator">
        <Checkbox
          id="disableTypingIndicator"
          checked={settings.disableTypingIndicator}
          onChange={(checked) => handleChange('disableTypingIndicator', checked)}
          label="Disable Typing Indicator"
        />
        <Checkbox
          id="customTypingIndicatorEnabled"
          checked={settings.customTypingIndicatorEnabled}
          onChange={(checked) => handleChange('customTypingIndicatorEnabled', checked)}
          label="Enable Custom Typing Indicator"
        />
        {settings.customTypingIndicatorEnabled && (
          <>
            <div>
              <Label htmlFor="customTypingIndicatorPosition">Position</Label>
              <select
                id="customTypingIndicatorPosition"
                value={settings.customTypingIndicatorPosition}
                onChange={(e) =>
                  handleChange(
                    'customTypingIndicatorPosition',
                    e.target.value as 'bottom' | 'top' | 'overlay' | 'floating'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="overlay">Overlay</option>
                <option value="floating">Floating</option>
              </select>
            </div>
            <div>
              <Label htmlFor="customTypingIndicatorText">Custom Text</Label>
              <Input
                id="customTypingIndicatorText"
                value={settings.customTypingIndicatorText}
                onChange={(value) => handleChange('customTypingIndicatorText', value)}
                placeholder="Users are typing..."
              />
            </div>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Message Features">
        <Checkbox
          id="blockMessageSendingWhenProcessing"
          checked={settings.blockMessageSendingWhenProcessing}
          onChange={(checked) => handleChange('blockMessageSendingWhenProcessing', checked)}
          label="Block Message Sending When Processing"
        />
        {settings.blockMessageSendingWhenProcessing && (
          <div>
            <Label htmlFor="blockMessageSendingTimeout">Timeout (ms)</Label>
            <Input
              id="blockMessageSendingTimeout"
              type="number"
              value={settings.blockMessageSendingTimeout?.toString() || ''}
              onChange={(value) =>
                handleChange('blockMessageSendingTimeout', value ? parseInt(value) : undefined)
              }
              placeholder="5000"
            />
          </div>
        )}
        <Checkbox
          id="messageTextFilterEnabled"
          checked={settings.messageTextFilterEnabled}
          onChange={(checked) => handleChange('messageTextFilterEnabled', checked)}
          label="Enable Message Text Filter"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Secondary Send Button">
        <Checkbox
          id="secondarySendButtonEnabled"
          checked={settings.secondarySendButtonEnabled}
          onChange={(checked) => handleChange('secondarySendButtonEnabled', checked)}
          label="Enable Secondary Send Button"
        />
        {settings.secondarySendButtonEnabled && (
          <>
            <div>
              <Label htmlFor="secondarySendButtonMessageEdit">Message Edit</Label>
              <Input
                id="secondarySendButtonMessageEdit"
                value={settings.secondarySendButtonMessageEdit}
                onChange={(value) => handleChange('secondarySendButtonMessageEdit', value)}
                placeholder="Edit message text"
              />
            </div>
            <Checkbox
              id="secondarySendButtonHideInputSendButton"
              checked={settings.secondarySendButtonHideInputSendButton}
              onChange={(checked) =>
                handleChange('secondarySendButtonHideInputSendButton', checked)
              }
              label="Hide Input Send Button"
            />
            <Checkbox
              id="secondarySendButtonOverwriteEnterClick"
              checked={settings.secondarySendButtonOverwriteEnterClick}
              onChange={(checked) =>
                handleChange('secondarySendButtonOverwriteEnterClick', checked)
              }
              label="Overwrite Enter Click"
            />
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Translations">
        <Checkbox
          id="translatesEnabled"
          checked={settings.translatesEnabled}
          onChange={(checked) => handleChange('translatesEnabled', checked)}
          label="Enable Translations"
        />
      </CollapsibleSection>

      <CollapsibleSection title="API Configuration">
        <div>
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            value={settings.baseUrl}
            onChange={(value) => handleChange('baseUrl', value)}
            placeholder="https://api.ethoradev.com/v1"
          />
        </div>
        <div>
          <Label htmlFor="customAppToken">Custom App Token (Optional)</Label>
          <Input
            id="customAppToken"
            value={settings.customAppToken || ''}
            onChange={(value) => handleChange('customAppToken', value || undefined)}
            placeholder="Leave empty if not needed"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
