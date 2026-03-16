/**
 * パートナーステータス同意ページ（デザイン強化版 v7.22）
 * URL: /partner-status-consent?token=xxx
 *
 * デザイン強化ポイント:
 * - 依頼者のアバター・名前を大きく表示
 * - 「なぜこの情報が必要か」の説明セクション
 * - 開示内容のプレビュー（3段階の視覚的説明）
 * - 同意ボタンを目立たせ、拒否は控えめに
 * - 恋人証明の信頼性・プライバシー保護を強調（トグル式）
 */
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Heart, CheckCircle, XCircle, Loader2, Shield, AlertTriangle, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const STATUS_COLORS = {
  single: "text-green-600",
  yellow: "text-amber-600",
  red: "text-red-600",
  not_registered: "text-gray-600",
} as const;

const STATUS_ICONS = {
  single: "🟢",
  yellow: "🟡",
  red: "🔴",
  not_registered: "⚪",
} as const;

const BG = "linear-gradient(160deg, oklch(0.97 0.02 340) 0%, oklch(0.94 0.04 300) 50%, oklch(0.97 0.02 260) 100%)";

function AvatarFallback({ name }: { name: string }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
      {initial}
    </div>
  );
}

export default function PartnerStatusConsent() {
  usePageTitle("パートナーステータスの確認依頼 - 恋人証明");

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") ?? "";
  const isDeclineMode = urlParams.get("decline") === "true";

  const [responded, setResponded] = useState(false);
  const [responseResult, setResponseResult] = useState<{
    consented: boolean;
    result?: string;
    resultLabel?: string;
    resultDescription?: string;
  } | null>(null);
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);

  const { data: inquiry, isLoading, error } = trpc.partnerStatus.getInquiryByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const respondToInquiry = trpc.partnerStatus.respondToInquiry.useMutation({
    onSuccess: (data) => {
      setResponded(true);
      setResponseResult(data);
    },
  });

  // ─── トークンなし ───
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-800">無効なリンクです</p>
          <p className="text-sm text-gray-500 mt-1">URLが正しくありません。メールのリンクを再度ご確認ください。</p>
        </div>
      </div>
    );
  }

  // ─── ローディング ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ─── エラー ───
  if (error || !inquiry) {
    const isExpired = error?.message?.includes("期限");
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {isExpired ? "リンクの有効期限が切れています" : "無効なリンクです"}
          </h2>
          <p className="text-sm text-gray-500">
            {isExpired
              ? "このリンクは72時間で失効します。依頼者に再送を依頼してください。"
              : error?.message ?? "このリンクは無効または既に使用済みです。"}
          </p>
          <Link href="/"><Button variant="outline" className="mt-6">トップページへ</Button></Link>
        </div>
      </div>
    );
  }

  // ─── 回答済み（サーバー側でエラーを返すためここには到達しないが、安全のため残す）
  // inquiry.status は常に "pending" のみ返る（それ以外はサーバー側で TRPCError）

  // ─── 回答完了後 ───
  if (responded && responseResult) {
    const result = responseResult.result as keyof typeof STATUS_COLORS | undefined;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          {responseResult.consented ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">開示が完了しました</h2>
              {result && (
                <div className={`text-4xl font-black my-4 ${STATUS_COLORS[result] ?? "text-gray-600"}`}>
                  {STATUS_ICONS[result] ?? "⚪"} {responseResult.resultLabel}
                </div>
              )}
              <p className="text-sm text-gray-500 mb-2">{responseResult.resultDescription}</p>
              <p className="text-xs text-gray-400 mb-6">この結果は依頼者に通知されました。</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">拒否しました</h2>
              <p className="text-sm text-gray-500 mb-6">依頼者には「回答なし」と表示されます。</p>
            </>
          )}
          <Link href="/"><Button variant="outline" className="w-full">トップページへ</Button></Link>
        </div>
      </div>
    );
  }

  // ─── メインの同意フォーム ───
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 py-12"
      style={{ background: BG }}
    >
      {/* ロゴ */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-800">恋人証明</span>
      </Link>

      <div className="max-w-md w-full space-y-4">
        {/* ─── 依頼者カード ─── */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* 依頼者アバター */}
          <div className="flex flex-col items-center text-center mb-6">
            {inquiry.requesterAvatarUrl ? (
              <img
                src={inquiry.requesterAvatarUrl}
                alt={inquiry.requesterName}
                className="w-20 h-20 rounded-full object-cover shadow-lg mb-3 border-4 border-white ring-2 ring-purple-200"
              />
            ) : (
              <div className="mb-3">
                <AvatarFallback name={inquiry.requesterName} />
              </div>
            )}
            <p className="text-xs text-purple-600 font-semibold tracking-wide uppercase mb-1">確認依頼</p>
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-purple-700">{inquiry.requesterName}</span> さんから
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              あなたのパートナーステータスの確認依頼が届いています
            </p>
          </div>

          {/* なぜこの情報が必要か */}
          <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 mb-5">
            <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-purple-500 text-purple-500" />
              なぜこの確認が必要なのか？
            </p>
            <p className="text-sm text-purple-800 leading-relaxed">
              {inquiry.requesterName} さんはあなたとの交際を真剣に考えており、
              誠実な関係を築くために、事前にパートナーの有無を確認したいと考えています。
              <strong className="text-purple-900">恋人証明</strong> は、この確認を安全・匿名で行うためのサービスです。
            </p>
          </div>

          {/* 開示内容の説明 */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-600 mb-3">開示される情報（3段階）</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                <span className="text-xl">🟢</span>
                <div>
                  <p className="text-sm font-bold text-green-800">シングル</p>
                  <p className="text-xs text-green-600">現在パートナーなし</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-xl">🟡</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">イエロー</p>
                  <p className="text-xs text-amber-600">90日以内に交際解消あり</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <span className="text-xl">🔴</span>
                <div>
                  <p className="text-sm font-bold text-red-800">レッド</p>
                  <p className="text-xs text-red-600">現在交際中</p>
                </div>
              </div>
            </div>
          </div>

          {/* プライバシー保護の説明（トグル式） */}
          <button
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-left mb-5"
            onClick={() => setShowPrivacyDetail((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">プライバシー保護について</span>
            </div>
            {showPrivacyDetail ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showPrivacyDetail && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5 text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p>✅ 氏名・住所・電話番号などの個人情報は一切開示されません</p>
              <p>✅ 開示されるのは「パートナーの有無」のみです</p>
              <p>✅ 同意しなかった場合、依頼者には「回答なし」とだけ表示されます</p>
              <p>✅ 恋人証明のデータは暗号化されて保管されています</p>
              <p>✅ このリンクは72時間後に自動的に無効になります</p>
            </div>
          )}

          {/* 有効期限 */}
          {inquiry.expiresAt && (
            <p className="text-xs text-gray-400 text-center mb-5">
              有効期限: {new Date(inquiry.expiresAt).toLocaleString("ja-JP")}
            </p>
          )}

          {/* ボタン */}
          <div className="space-y-3">
            <Button
              className="w-full h-14 text-base font-bold rounded-2xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #9333ea, #ec4899)", color: "white" }}
              onClick={() => respondToInquiry.mutate({ token, consent: true })}
              disabled={respondToInquiry.isPending || isDeclineMode}
            >
              {respondToInquiry.isPending && !isDeclineMode ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />処理中...</>
              ) : (
                <><CheckCircle className="w-5 h-5 mr-2" />同意してステータスを開示する</>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-11 text-sm text-gray-400 hover:text-gray-600"
              onClick={() => respondToInquiry.mutate({ token, consent: false })}
              disabled={respondToInquiry.isPending}
            >
              {respondToInquiry.isPending && isDeclineMode ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />処理中...</>
              ) : (
                <><XCircle className="w-4 h-4 mr-1.5 text-gray-400" />開示しない（拒否する）</>
              )}
            </Button>
          </div>
        </div>

        {/* 信頼性バッジ */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="w-3.5 h-3.5 text-purple-500" />
          <span>恋人証明 — 本人確認済みユーザーのみ利用可能なサービスです</span>
        </div>
      </div>
    </div>
  );
}
