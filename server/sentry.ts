/**
 * Sentry サーバーサイド初期化
 * SENTRY_DSN 環境変数が設定されている場合のみ有効化される
 */
import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set, skipping initialization");
    return;
  }
  if (initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    // パフォーマンストレースのサンプリングレート（本番では0.1〜0.2推奨）
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // エラーサンプリングレート（本番では1.0推奨）
    sampleRate: 1.0,
    // 個人情報を含む可能性のあるリクエストデータを除外
    beforeSend(event) {
      // パスワード・トークン等の機密情報をスクラブ
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        for (const key of ["password", "token", "secret", "authorization", "cookie"]) {
          if (key in data) data[key] = "[Filtered]";
        }
      }
      return event;
    },
  });

  initialized = true;
  console.log("[Sentry] Initialized successfully");
}

/**
 * エラーをSentryに手動でキャプチャする
 * tRPCエラーハンドラや重要な処理のcatchブロックで使用
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * カスタムメッセージをSentryに送信する
 */
export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" | "fatal" = "info",
  context?: Record<string, unknown>
): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message, level);
  });
}

export { Sentry };
