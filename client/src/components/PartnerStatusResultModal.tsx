/**
 * パートナーステータス結果ビジュアルカードモーダル
 *
 * 改善案1: 判定結果をフルスクリーンのモーダルカードで表示する。
 * - シングル: 緑グラデーション背景 + 大きなチェックマーク
 * - イエロー: 黄色背景 + 注意アイコン + 補足説明
 * - レッド: 赤背景 + 警告アイコン
 * - 「この結果をスクリーンショットで保存」ボタン（html2canvas使用）
 */
import { useRef, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StatusResult = "single" | "yellow" | "red" | "not_registered" | null;

interface PartnerStatusResultModalProps {
  open: boolean;
  onClose: () => void;
  result: StatusResult;
  targetEmail: string;
  checkedAt?: Date;
}

const STATUS_CONFIG = {
  single: {
    bg: "from-emerald-400 via-green-500 to-teal-500",
    cardBg: "bg-gradient-to-br from-emerald-50 to-green-50",
    border: "border-emerald-300",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-800",
    subTextColor: "text-emerald-700",
    badgeBg: "bg-emerald-600",
    Icon: CheckCircle,
    emoji: "🟢",
    label: "シングル",
    headline: "新しい交際が可能な状態です",
    description: "現在、恋人証明に登録されたパートナーはいません。",
    note: null,
  },
  yellow: {
    bg: "from-amber-400 via-yellow-400 to-orange-400",
    cardBg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-300",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    textColor: "text-amber-800",
    subTextColor: "text-amber-700",
    badgeBg: "bg-amber-500",
    Icon: AlertTriangle,
    emoji: "🟡",
    label: "イエロー",
    headline: "交際解消歴あり（90日以内）",
    description: "90日以内に交際解消の経緯があります。新しい交際は可能ですが、慎重にご判断ください。",
    note: "※ 解消から90日を経過するとシングル判定になります。",
  },
  red: {
    bg: "from-rose-500 via-red-500 to-pink-600",
    cardBg: "bg-gradient-to-br from-rose-50 to-red-50",
    border: "border-rose-300",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    textColor: "text-rose-800",
    subTextColor: "text-rose-700",
    badgeBg: "bg-rose-600",
    Icon: XCircle,
    emoji: "🔴",
    label: "レッド",
    headline: "現在パートナーがいます",
    description: "恋人証明に登録されたアクティブなパートナーシップが存在します。新しい交際登録はできません。",
    note: "※ 重複登録防止のため、現在の交際が解消されるまで新規登録はできません。",
  },
  not_registered: {
    bg: "from-gray-400 via-slate-400 to-gray-500",
    cardBg: "bg-gradient-to-br from-gray-50 to-slate-50",
    border: "border-gray-300",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    textColor: "text-gray-700",
    subTextColor: "text-gray-600",
    badgeBg: "bg-gray-500",
    Icon: AlertTriangle,
    emoji: "⚪",
    label: "未登録",
    headline: "恋人証明に未登録のアドレスです",
    description: "このメールアドレスは恋人証明に登録されていません。",
    note: "※ 登録済みのアドレスのみ判定できます。",
  },
} as const;

export function PartnerStatusResultModal({
  open,
  onClose,
  result,
  targetEmail,
  checkedAt,
}: PartnerStatusResultModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSaveScreenshot = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      // html2canvasを動的インポート（バンドルサイズ最適化）
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Retina対応
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `partner-status-${result}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("スクリーンショットを保存しました");
    } catch {
      toast.error("スクリーンショットの保存に失敗しました");
    }
  }, [result]);

  if (!open || !result) return null;

  const config = STATUS_CONFIG[result];
  const { Icon } = config;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
        {/* 閉じるボタン */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* メインカード（スクリーンショット対象） */}
        <div
          ref={cardRef}
          className={`rounded-3xl overflow-hidden shadow-2xl ${config.cardBg} border-2 ${config.border}`}
        >
          {/* グラデーションヘッダー */}
          <div className={`bg-gradient-to-r ${config.bg} px-6 py-8 text-center`}>
            <div className={`w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Icon className={`w-10 h-10 ${config.iconColor}`} strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">{config.emoji}</span>
              <span className={`text-3xl font-black text-white drop-shadow-md`}>{config.label}</span>
            </div>
            <p className="text-white/90 text-sm font-medium">{config.headline}</p>
          </div>

          {/* 詳細情報 */}
          <div className="px-6 py-5 space-y-4">
            {/* 対象メール */}
            <div className="rounded-xl bg-white/70 border border-white px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">確認対象</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{targetEmail}</p>
            </div>

            {/* 説明文 */}
            <p className={`text-sm leading-relaxed ${config.subTextColor}`}>
              {config.description}
            </p>

            {/* 注意書き */}
            {config.note && (
              <div className={`rounded-lg bg-white/60 border ${config.border} px-3 py-2`}>
                <p className={`text-xs ${config.subTextColor} leading-relaxed`}>{config.note}</p>
              </div>
            )}

            {/* 確認日時 */}
            {checkedAt && (
              <p className="text-xs text-gray-400 text-right">
                確認日時: {checkedAt.toLocaleString("ja-JP")}
              </p>
            )}

            {/* 恋人証明ブランド */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-pink-400">💕</span>
              <span className="text-xs text-gray-400 font-medium">恋人証明 / Koibito Shomei</span>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            onClick={handleSaveScreenshot}
          >
            <Camera className="w-4 h-4 mr-2" />
            画像で保存
          </Button>
          <Button
            className={`flex-1 ${config.badgeBg} hover:opacity-90 text-white border-0`}
            onClick={onClose}
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
