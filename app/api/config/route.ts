import { NextResponse } from 'next/server';

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const normalizeApiBaseUrl = (raw: string) => {
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
};

const parseBool = (value?: string) => {
  if (value === undefined) return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

export async function GET() {
  const settings: Record<string, any> = {};

  const apiUrl = readEnv(
    'ETHORA_CHAT_API_URL',
    'NEXT_PUBLIC_ETHORA_CHAT_API_URL',
    'NEXT_PUBLIC_CHAT_API_URL'
  );
  if (apiUrl) {
    settings.baseUrl = normalizeApiBaseUrl(apiUrl);
  }

  const userId = readEnv(
    'ETHORA_CHAT_USER_ID',
    'NEXT_PUBLIC_ETHORA_CHAT_USER_ID',
    'NEXT_PUBLIC_CHAT_USER_ID'
  );
  if (userId) settings.userId = userId;

  const roomId = readEnv(
    'ETHORA_CHAT_ROOM_ID',
    'NEXT_PUBLIC_ETHORA_CHAT_ROOM_ID',
    'NEXT_PUBLIC_CHAT_ROOM_ID'
  );
  if (roomId) settings.roomId = roomId;

  const primaryColor = readEnv(
    'ETHORA_CHAT_PRIMARY_COLOR',
    'NEXT_PUBLIC_ETHORA_CHAT_PRIMARY_COLOR',
    'NEXT_PUBLIC_CHAT_PRIMARY_COLOR'
  );
  if (primaryColor) settings.primaryColor = primaryColor;

  const secondaryColor = readEnv(
    'ETHORA_CHAT_SECONDARY_COLOR',
    'NEXT_PUBLIC_ETHORA_CHAT_SECONDARY_COLOR',
    'NEXT_PUBLIC_CHAT_SECONDARY_COLOR'
  );
  if (secondaryColor) settings.secondaryColor = secondaryColor;

  const theme = readEnv(
    'ETHORA_CHAT_THEME',
    'NEXT_PUBLIC_ETHORA_CHAT_THEME',
    'NEXT_PUBLIC_CHAT_THEME'
  );
  if (theme) settings.theme = theme;

  const qrUrl = readEnv(
    'ETHORA_CHAT_QR_URL',
    'NEXT_PUBLIC_ETHORA_CHAT_QR_URL',
    'NEXT_PUBLIC_CHAT_QR_URL'
  );
  if (qrUrl) settings.qrUrl = qrUrl;

  const xmppDevServer = readEnv(
    'ETHORA_XMPP_DEV_SERVER',
    'NEXT_PUBLIC_ETHORA_XMPP_DEV_SERVER',
    'NEXT_PUBLIC_CHAT_XMPP_DEV_SERVER'
  );
  if (xmppDevServer) settings.xmppDevServer = xmppDevServer;

  const xmppHost = readEnv(
    'ETHORA_XMPP_HOST',
    'NEXT_PUBLIC_ETHORA_XMPP_HOST',
    'NEXT_PUBLIC_CHAT_XMPP_HOST'
  );
  if (xmppHost) settings.xmppHost = xmppHost;

  const xmppConference = readEnv(
    'ETHORA_XMPP_CONFERENCE',
    'NEXT_PUBLIC_ETHORA_XMPP_CONFERENCE',
    'NEXT_PUBLIC_CHAT_XMPP_CONFERENCE'
  );
  if (xmppConference) settings.xmppConference = xmppConference;

  const xmppPingOnSendEnabled = parseBool(
    readEnv(
      'ETHORA_XMPP_PING_ON_SEND_ENABLED',
      'NEXT_PUBLIC_ETHORA_XMPP_PING_ON_SEND_ENABLED',
      'NEXT_PUBLIC_CHAT_XMPP_PING_ON_SEND_ENABLED'
    )
  );
  if (xmppPingOnSendEnabled !== undefined) {
    settings.xmppPingOnSendEnabled = xmppPingOnSendEnabled;
  }

  return NextResponse.json({ settings });
}
