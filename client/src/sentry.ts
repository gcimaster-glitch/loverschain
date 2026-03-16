/**
 * Sentry フロントエンド初期化
 * VITE_SENTRY_DSN 環境変数が設定されている場合のみ有効化される
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentryFrontend(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // 開発環境では警告のみ（本番では必ずDSNを設定すること）
    if (import.meta.env.PROD) {
      console.warn("[Sentry] VITE_SENTRY_DSN not set in production");
    }
    return;
  }
  if (initialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // パフォーマンストレースのサンプリングレート
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // セッションリプレイのサンプリングレート（エラー発生時は100%）
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // 個人情報をマスク
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    // 個人情報を含む可能性のあるURLパラメータをスクラブ
    beforeSend(event) {
      return event;
    },
  });

  initialized = true;
}

export { Sentry };
