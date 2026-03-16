/**
 * LINE OAuth 2.0 ログインフロー
 * GET /api/auth/line          → LINE認可ページへリダイレクト
 * GET /api/auth/line/callback → LINEコールバック処理・セッションCookie発行
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

function getCallbackUrl(req: Request): string {
  // フロントエンドのoriginをクエリパラメータから取得、なければリクエストのoriginを使用
  const origin =
    (req.query.origin as string) ||
    `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/auth/line/callback`;
}

export function registerLineAuthRoutes(app: Express) {
  // ① LINE認可URLへリダイレクト
  app.get("/api/auth/line", (req: Request, res: Response) => {
    if (!ENV.lineChannelId) {
      res.status(503).json({ error: "LINE login is not configured" });
      return;
    }

    const state = crypto.randomBytes(16).toString("hex");
    const returnPath = (req.query.returnPath as string) || "/dashboard";
    const origin = (req.query.origin as string) || `${req.protocol}://${req.get("host")}`;

    // stateにreturnPathとoriginを埋め込む（既存のManus OAuthと同じ形式）
    const statePayload = Buffer.from(`${origin}|${origin}${returnPath}`).toString("base64");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.lineChannelId,
      redirect_uri: `${origin}/api/auth/line/callback`,
      state: statePayload,
      scope: "profile openid email",
    });

    res.redirect(302, `${LINE_AUTH_URL}?${params.toString()}`);
  });

  // ② LINEコールバック処理
  app.get("/api/auth/line/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    // デバッグ: 受け取ったパラメータをログ出力
    console.log("[LINE OAuth] Callback received:", {
      code: code ? code.substring(0, 20) + "..." : "MISSING",
      codeLength: code ? code.length : 0,
      state: state ? state.substring(0, 30) + "..." : "MISSING",
      error: error || "none",
      host: req.get("host"),
      protocol: req.protocol,
      xForwardedProto: req.get("x-forwarded-proto"),
      xForwardedHost: req.get("x-forwarded-host"),
    });

    if (error) {
      console.error("[LINE OAuth] Error from LINE:", error);
      res.redirect(302, "/?error=line_auth_failed");
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

      // callbackUrlは認可リクエスト時と完全一致させる必要がある
      // stateから復元したoriginを使用（req.protocolは内部プロキシでhttpになる場合がある）
      const callbackUrl = `${origin}/api/auth/line/callback`;
      console.log("[LINE OAuth] Token exchange - origin:", origin, "callbackUrl:", callbackUrl);

      // デバッグ: ENVの値を確認
      console.log("[LINE OAuth] ENV check - lineChannelId:", ENV.lineChannelId, "lineChannelSecret (first 8):", ENV.lineChannelSecret ? ENV.lineChannelSecret.substring(0, 8) + "..." : "EMPTY", "length:", ENV.lineChannelSecret?.length ?? 0);

      // LINEアクセストークンを取得
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: ENV.lineChannelId,
        client_secret: ENV.lineChannelSecret,
      });
      const tokenBody = tokenParams.toString();
      // デバッグ: 送信ボディをログ出力（client_secretは最初8文字のみ）
      const safeBody = tokenBody.replace(/client_secret=[^&]+/, `client_secret=${ENV.lineChannelSecret.substring(0, 8)}...`);
      console.log("[LINE OAuth] Token request body:", safeBody);
      const tokenRes = await fetch(LINE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody,
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[LINE OAuth] Token exchange failed - status:", tokenRes.status, "body:", errText, "redirect_uri used:", callbackUrl);
        // エラー詳細をクエリパラメータに含めてリダイレクト（デバッグ用）
        const errDetail = encodeURIComponent(errText.substring(0, 200));
        const codeInfo = encodeURIComponent(`len=${code.length},start=${code.substring(0, 10)}`);
        res.redirect(302, `/?error=line_token_failed&detail=${errDetail}&redirect_uri=${encodeURIComponent(callbackUrl)}&code_info=${codeInfo}`);
        return;
      }

      const tokenData = await tokenRes.json() as {
        access_token: string;
        id_token?: string;
        scope: string;
      };

      // LINEプロフィールを取得
      const profileRes = await fetch(LINE_PROFILE_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!profileRes.ok) {
        console.error("[LINE OAuth] Profile fetch failed");
        res.redirect(302, "/?error=line_profile_failed");
        return;
      }

      const profile = await profileRes.json() as {
        userId: string;
        displayName: string;
        pictureUrl?: string;
      };

      // LINEユーザーIDをopenIdとして使用（プレフィックスで区別）
      const openId = `line_${profile.userId}`;

      // メールアドレスをid_tokenから取得（申請済みの場合）
      let email: string | null = null;
      if (tokenData.id_token) {
        try {
          // id_tokenはJWT。ペイロードをbase64デコードしてemailを取得
          const payload = JSON.parse(
            Buffer.from(tokenData.id_token.split(".")[1], "base64").toString("utf8")
          );
          if (payload.email) email = payload.email;
        } catch {
          // id_tokenのデコード失敗は無視
        }
      }

      // ユーザーをDBにupsert
      await db.upsertUser({
        openId,
        name: profile.displayName || null,
        email,
        loginMethod: "line",
        avatarUrl: profile.pictureUrl || null,
        lastSignedIn: new Date(),
      });

      // セッションCookieを発行（既存のManus OAuthと同じ仕組み）
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.displayName || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, redirectTo);
    } catch (err) {
      console.error("[LINE OAuth] Callback error:", err);
      res.redirect(302, "/?error=line_auth_error");
    }
  });
}
