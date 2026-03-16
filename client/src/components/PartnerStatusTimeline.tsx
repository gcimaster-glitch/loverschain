/**
 * パートナーステータス問い合わせ タイムライン進行状況コンポーネント
 *
 * 改善案2: 3ステップのタイムライン表示
 * - ①メール送信済み → ②相手が確認中（残り時間カウントダウン）→ ③結果受信
 * - pending中はパルスアニメーション付きインジケーター
 * - 結果受信時はビジュアルカードモーダルを開くボタンを表示
 */
import { useEffect, useState } from "react";
import { Mail, Clock, CheckCircle, AlertTriangle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type InquiryStatus = "pending" | "consented" | "declined" | "expired";
type StatusResult = "single" | "yellow" | "red" | "not_registered" | null;

interface PartnerStatusTimelineProps {
  targetEmail: string;
  status: InquiryStatus;
  result: StatusResult;
  resultLabel: string | null;
  expiresAt: Date;
  onViewResult: () => void;
}

function useCountdown(expiresAt: Date) {
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("期限切れ");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`残り ${hours}時間 ${minutes}分`);
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}

const RESULT_COLORS: Record<string, string> = {
  single: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-rose-600",
  not_registered: "text-gray-500",
};

const RESULT_EMOJIS: Record<string, string> = {
  single: "🟢",
  yellow: "🟡",
  red: "🔴",
  not_registered: "⚪",
};

export function PartnerStatusTimeline({
  targetEmail,
  status,
  result,
  resultLabel,
  expiresAt,
  onViewResult,
}: PartnerStatusTimelineProps) {
  const countdown = useCountdown(expiresAt);

  // ステップの状態を決定
  const step1Done = true; // 送信済みは常に完了
  const step2Done = status !== "pending";
  const step3Done = status === "consented";

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-1">
      {/* 対象メール */}
      <p className="text-xs text-muted-foreground mb-3 truncate">
        <span className="font-medium text-foreground">{targetEmail}</span> への問い合わせ
      </p>

      {/* タイムライン */}
      <div className="relative">
        {/* 縦線 */}
        <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-border" />

        <div className="space-y-4">
          {/* STEP 1: メール送信済み */}
          <div className="flex items-start gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              step1Done ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
            }`}>
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-semibold ${step1Done ? "text-foreground" : "text-muted-foreground"}`}>
                確認メールを送信しました
              </p>
              <p className="text-xs text-muted-foreground">相手のメールボックスに届いています</p>
            </div>
            {step1Done && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-1.5" />}
          </div>

          {/* STEP 2: 相手が確認中 */}
          <div className="flex items-start gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              step2Done
                ? status === "declined" || status === "expired"
                  ? "bg-gray-100 text-gray-400"
                  : "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }`}>
              {status === "pending" ? (
                <>
                  <Clock className="w-4 h-4" />
                  {/* パルスアニメーション */}
                  <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30" />
                </>
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-semibold ${
                status === "pending" ? "text-amber-700" :
                step2Done ? "text-foreground" : "text-muted-foreground"
              }`}>
                {status === "pending" ? "相手が確認中..." :
                 status === "declined" ? "拒否されました" :
                 status === "expired" ? "期限切れ" : "相手が確認しました"}
              </p>
              <p className="text-xs text-muted-foreground">
                {status === "pending" ? countdown :
                 status === "declined" ? "相手がステータスの開示を拒否しました" :
                 status === "expired" ? "72時間以内に回答がありませんでした" :
                 "同意が確認されました"}
              </p>
            </div>
            {step2Done && status !== "declined" && status !== "expired" && (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-1.5" />
            )}
            {(status === "declined" || status === "expired") && (
              <XCircle className="w-4 h-4 text-gray-400 shrink-0 mt-1.5" />
            )}
          </div>

          {/* STEP 3: 結果受信 */}
          <div className="flex items-start gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              step3Done ? "bg-purple-100 text-purple-600" : "bg-muted text-muted-foreground"
            }`}>
              {step3Done ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-semibold ${step3Done ? "text-foreground" : "text-muted-foreground"}`}>
                {step3Done ? "判定結果を受信しました" : "結果待ち"}
              </p>
              {step3Done && result && (
                <p className={`text-xs font-bold mt-0.5 ${RESULT_COLORS[result] ?? "text-gray-600"}`}>
                  {RESULT_EMOJIS[result] ?? ""} {resultLabel}
                </p>
              )}
            </div>
            {step3Done && <CheckCircle className="w-4 h-4 text-purple-500 shrink-0 mt-1.5" />}
          </div>
        </div>
      </div>

      {/* 結果確認ボタン（同意済みの場合のみ表示） */}
      {step3Done && result && (
        <div className="pt-3">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
            onClick={onViewResult}
          >
            <Eye className="w-4 h-4 mr-2" />
            判定結果を詳しく見る
          </Button>
        </div>
      )}
    </div>
  );
}
