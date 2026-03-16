export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// LINEログインURL生成
// サーバー経由でリダイレクト（LINE_CHANNEL_IDをフロントに露出しない安全な方式）
export const getLineLoginUrl = (returnPath?: string) => {
  const origin = window.location.origin;
  const path = returnPath || "/dashboard";
  return `${origin}/api/auth/line?origin=${encodeURIComponent(origin)}&returnPath=${encodeURIComponent(path)}`;
};

// GoogleログインURL生成
// サーバー経由でリダイレクト（クライアントIDをフロントに露出しない安全な方式）
export const getGoogleLoginUrl = (returnPath?: string) => {
  const origin = window.location.origin;
  const path = returnPath || "/dashboard";
  return `${origin}/api/auth/google?origin=${encodeURIComponent(origin)}&returnPath=${encodeURIComponent(path)}`;
};

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: path to redirect after login (e.g. "/invite/abc123")
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // stateにreturnPathを含める: base64(redirectUri + "|" + fullReturnUrl)
  const statePayload = returnPath
    ? `${redirectUri}|${window.location.origin}${returnPath}`
    : redirectUri;
  const state = btoa(statePayload);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
