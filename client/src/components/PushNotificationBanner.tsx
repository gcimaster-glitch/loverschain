import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useState } from "react";

/**
 * プッシュ通知の有効化バナー
 * - 購読済みの場合は表示しない（邪魔にならないように）
 * - 未購読の場合のみコンパクトに表示
 * - 通知拒否の場合は小さな案内を表示
 */
export function PushNotificationBanner() {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    vapidConfigured,
    subscribe,
  } = usePushNotification();

  const [dismissed, setDismissed] = useState(false);

  // 未対応ブラウザ or VAPID未設定 → 表示しない
  if (!isSupported || !vapidConfigured) return null;

  // 購読済み → 表示しない（設定完了済みなので邪魔にならないように）
  if (isSubscribed) return null;

  // 非表示にした場合
  if (dismissed) return null;

  // 通知が拒否されている場合 → 小さな案内のみ
  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <div className="flex items-center gap-2">
          <BellOff className="h-3.5 w-3.5 shrink-0" />
          <span>ブラウザの通知がブロックされています。設定から許可してください。</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-400 hover:text-amber-600"
          aria-label="閉じる"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // 未購読の場合 → コンパクトなブライダルカラーバナー
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-rose-700">
        <Bell className="h-4 w-4 shrink-0 text-rose-400" />
        <span className="text-xs">
          パートナーシップの更新をプッシュ通知で受け取れます
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          className="h-7 bg-rose-500 text-xs text-white hover:bg-rose-600 px-3"
          onClick={subscribe}
          disabled={isLoading}
        >
          {isLoading ? "設定中..." : "有効にする"}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-rose-300 hover:text-rose-500 p-1"
          aria-label="閉じる"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
