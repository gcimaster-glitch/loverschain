/**
 * Google OAuth 2.0 ログインフロー
 * GET /api/auth/google          → Google認可ページへリダイレクト
 * GET /api/auth/google/callback → Googleコールバック処理・セッションCookie発行
 */
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function registerGoogleAuthRoutes(app: Express) {
  // ① Google認可URLへリダイレクト
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(503).json({ error: "Google login is not configured" });
      return;
    }
    const returnPath = (req.query.returnPath as string) || "/dashboard";
    const origin = (req.query.origin as string) || `${req.protocol}://${req.get("host")}`;
    // stateにreturnPathとoriginを埋め込む（LINEと同じ形式）
    const statePayload = Buffer.from(`${origin}|${origin}${returnPath}`).toString("base64");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.googleClientId,
      redirect_uri: `${origin}/api/auth/google/callback`,
      state: statePayload,
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });
    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // ② Googleコールバック処理
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      res.redirect(302, "/?error=google_auth_failed");
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // stateからoriginを復元
      let origin = `${req.protocol}://${req.get("host")}`;
      let redirectTo = "/dashboard";
      try {
        const decoded = Buffer.from(state, "base64").toString("utf8");
        const parts = decoded.split("|");
        if (parts[0]) origin = parts[0];
        if (parts.length >= 2 && parts[1]) {
          const returnUrl = new URL(parts[1]);
          redirectTo = returnUrl.pathname + returnUrl.search + returnUrl.hash;
        }
      } catch {
        // stateのデコード失敗は無視してデフォルトにフォールバック
      }

      const callbackUrl = `${origin}/api/auth/google/callback`;

      // Googleアクセストークンを取得
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[Google OAuth] Token exchange failed:", errText);
        res.redirect(302, "/?error=google_token_failed");
        return;
      }

      const tokenData = await tokenRes.json() as {
        access_token: string;
        id_token?: string;
        token_type: string;
      };

      // Googleユーザー情報を取得
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        console.error("[Google OAuth] UserInfo fetch failed");
        res.redirect(302, "/?error=google_profile_failed");
        return;
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;           // Google固有ユーザーID
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
        email?: string;
        email_verified?: boolean;
      };

      // GoogleユーザーIDをopenIdとして使用（プレフィックスで区別）
      const openId = `google_${userInfo.sub}`;
      const displayName = userInfo.name || userInfo.given_name || null;

      // ユーザーをDBにupsert
      await db.upsertUser({
        openId,
        name: displayName,
        email: userInfo.email ?? null,
        loginMethod: "google",
        avatarUrl: userInfo.picture || null,
        lastSignedIn: new Date(),
      });

      // セッションCookieを発行（既存のManus OAuthと同じ仕組み）
      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, redirectTo);
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, "/?error=google_auth_error");
    }
  });
}
