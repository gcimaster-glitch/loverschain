import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { getKycErrorMessage } from "../../../shared/kycErrors";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Fingerprint,
  Heart,
  Shield,
  XCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

/* ─── CDN イラスト ─── */
const ILLUST = {
  step1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/kyc_step1_docs-g7UNyXdCqEpkrevVEWt4BX.webp",
  step2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/kyc_step2_scan-a7NffQnhXj8rPUa2Dng429.webp",
  step3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/kyc_step3_review-3DJV22SNxe8duCZ9rE2knG.webp",
  step4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/kyc_step4_complete-C8BWx3Ao4QRWKR45wuQbwN.webp",
};

/* ─── ステップ定義 ─── */
const STEPS = [
  { id: 1, label: "書類を準備" },
  { id: 2, label: "本人確認" },
  { id: 3, label: "審査中" },
  { id: 4, label: "完了" },
];

function getActiveStep(kycStatus: string): number {
  if (kycStatus === "verified") return 4;
  if (kycStatus === "pending") return 3;
  if (kycStatus === "failed") return 1;
  return 1; // not_started
}

/* ─── 進捗バー ─── */
function StepBar({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = step.id < active;
        const current = step.id === active;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? "bg-pink-500 border-pink-500 text-white"
                    : current
                    ? "bg-transparent border-pink-500 text-pink-400"
                    : "bg-transparent border-white/20 text-muted-foreground/60"
                }`}
              >
                {done ? <CheckCircle className="w-5 h-5" /> : step.id}
              </div>
              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  done || current ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                  done ? "bg-pink-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── STEP 1: 書類準備ガイド ─── */
function Step1Guide({ onStart, isPending }: { onStart: () => void; isPending: boolean }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="space-y-6">

      {/* ── 同意チェックボックス（最上部・目立つ位置） ── */}
      <div className={`rounded-2xl border-2 p-5 transition-all ${
        agreed
          ? "bg-green-500/10 border-green-500/50"
          : "bg-pink-500/10 border-pink-500/50"
      }`}>
        <p className="text-foreground font-bold text-sm mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-pink-400" />
          まず、以下に同意してください
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-pink-500 shrink-0 cursor-pointer"
          />
          <span className="text-foreground/80 text-sm leading-relaxed">
            <Link href="/legal/terms" target="_blank" className="text-pink-400 underline hover:text-pink-300 font-semibold">利用規約</Link>
            および
            <Link href="/legal/privacy" target="_blank" className="text-pink-400 underline hover:text-pink-300 font-semibold ml-1">プライバシーポリシー</Link>
            に同意します。本人確認に使用する個人情報は、本人確認の目的のみに使用されます。
          </span>
        </label>
        {agreed && (
          <div className="flex items-center gap-2 mt-3 text-green-400 text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            同意しました。下のボタンから本人確認を開始できます。
          </div>
        )}
        {!agreed && (
          <p className="text-pink-300/70 text-xs mt-3">
            ※ チェックを入れないと本人確認を開始できません
          </p>
        )}
      </div>

      {/* イラスト */}
      <div className="flex justify-center">
        <img
          src={ILLUST.step1}
          alt="本人確認書類"
          className="w-40 h-40 object-contain rounded-2xl"
        />
      </div>

      {/* タイトル */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground mb-2">本人確認書類と顔写真を準備してください</h2>
        <p className="text-muted-foreground text-sm">
          書類1点の撮影に加え、顔写真（セルフィー）も撮影します。本人であることを確認するためです。
        </p>
      </div>

      {/* 使える書類 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "🪪", label: "マイナンバーカード", note: "表面のみ" },
          { icon: "🚗", label: "運転免許証", note: "表裏両面" },
          { icon: "📘", label: "パスポート", note: "顔写真ページ" },
        ].map((doc) => (
          <div
            key={doc.label}
            className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl text-center"
          >
            <span className="text-3xl">{doc.icon}</span>
            <span className="font-semibold text-muted-foreground text-xs">{doc.label}</span>
            <span className="text-muted-foreground text-xs">{doc.note}</span>
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <AlertTriangle className="w-4 h-4" />
          撮影時の注意事項
        </div>
        {[
          "書類全体が画面に収まるように撮影してください",
          "文字がはっきり読めるよう、明るい場所で撮影してください",
          "反射・ぼやけ・切れがないことを確認してください",
          "有効期限内の書類をご使用ください",
          "顔写真撮影時は明るい場所で正面を向いてください（メガネ・マスク不可）",
        ].map((note, i) => (
          <div key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
            <span className="text-amber-400 mt-0.5">•</span>
            {note}
          </div>
        ))}
      </div>

      {/* 所要時間 */}
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
        <Clock className="w-5 h-5 text-pink-400 shrink-0" />
        <div>
          <p className="text-foreground font-semibold text-sm">所要時間：約3〜5分</p>
          <p className="text-muted-foreground text-xs mt-0.5">審査結果は通常1〜3営業日以内にお知らせします</p>
        </div>
      </div>

      {/* セキュリティ説明 */}
      <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
        <div className="flex items-center gap-2 text-white/70 font-semibold text-sm mb-3">
          <Shield className="w-4 h-4 text-pink-400" />
          プライバシーとセキュリティ
        </div>
        {[
          "本人確認はStripe Identityを通じて安全に処理されます",
          "書類画像は暗号化されて保存され、確認完了後に自動削除されます",
          "書類情報は本人確認の目的のみに使用され、第三者提供はありません",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-muted-foreground text-xs">
            <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
            {item}
          </div>
        ))}
      </div>

      {/* 開始ボタン */}
      <Button
        onClick={onStart}
        disabled={isPending || !agreed}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 font-bold py-6 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed"
        size="lg"
      >
        <Fingerprint className="w-5 h-5 mr-2" />
        {isPending ? "処理中..." : "本人確認を開始する"}
        <ChevronRight className="w-5 h-5 ml-1" />
      </Button>

      {!agreed && (
        <p className="text-center text-pink-300/60 text-xs">
          ↑ 上の「同意する」にチェックを入れてから開始できます
        </p>
      )}
    </div>
  );
}

/* ─── STEP 2: 確認中（Stripe遷移後の待機） ─── */
function Step2Guide({ onStart, isPending }: { onStart: () => void; isPending: boolean }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <img src={ILLUST.step2} alt="スマホで撮影" className="w-48 h-48 object-contain rounded-2xl" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground mb-2">書類を撮影してください</h2>
        <p className="text-muted-foreground text-sm">
          「本人確認を開始する」をタップすると、Stripe Identityの確認画面が開きます。
          画面の指示に従って書類を撮影してください。
        </p>
      </div>
      <div className="space-y-3">
        {[
          { step: "1", text: "「本人確認を開始する」をタップ" },
          { step: "2", text: "新しいタブでStripeの確認画面が開く" },
          { step: "3", text: "書類の種類を選択して撮影" },
          { step: "4", text: "撮影完了後、このページに戻る" },
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 font-bold text-sm shrink-0">
              {item.step}
            </div>
            <p className="text-white/70 text-sm">{item.text}</p>
          </div>
        ))}
      </div>
      <Button
        onClick={onStart}
        disabled={isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 font-bold py-6 rounded-2xl text-base"
        size="lg"
      >
        <Fingerprint className="w-5 h-5 mr-2" />
        {isPending ? "処理中..." : "本人確認を開始する"}
        <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}

/* ─── STEP 3: 審査中 ─── */
function Step3Guide({ onMockVerify, isMockPending, isPolling }: { onMockVerify: () => void; isMockPending: boolean; isPolling?: boolean }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <img src={ILLUST.step3} alt="審査中" className="w-48 h-48 object-contain rounded-2xl" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground mb-2">審査中です</h2>
        <p className="text-muted-foreground text-sm">
          書類を受け付けました。担当チームが内容を確認しています。
          審査結果はメールでお知らせします。
        </p>
      </div>
      {/* ポーリングインジケーター */}
      {isPolling && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
          <p className="text-blue-300 text-sm font-medium">審査結果を確認中……完了次第自動で画面が更新されます</p>
        </div>
      )}

      {/* 審査期間 */}
      <div className="flex items-center gap-3 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
        <Clock className="w-8 h-8 text-amber-400 shrink-0" />
        <div>
          <p className="font-bold text-amber-300">通常1〜3営業日</p>
          <p className="text-muted-foreground text-xs mt-0.5">混雑時は最大5営業日かかる場合があります</p>
        </div>
      </div>

      {/* 審査中FAQ */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">よくある質問</p>
        {[
          {
            q: "審査中に何かすることはありますか？",
            a: "特に何もする必要はありません。審査が完了するとメールでご連絡します。",
          },
          {
            q: "審査が長引いている場合は？",
            a: "5営業日を過ぎても連絡がない場合は、support@loverschain.jp までお問い合わせください。",
          },
          {
            q: "審査中にアプリは使えますか？",
            a: "本人確認が必要な機能（証明書発行）以外はご利用いただけます。",
          },
        ].map((faq, i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <p className="text-foreground font-semibold text-sm">{faq.q}</p>
            </div>
            <p className="text-muted-foreground text-xs ml-6">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* 開発環境用（本番環境では非表示） */}
      {import.meta.env.DEV && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-xs text-blue-400 font-medium mb-2">⚙️ 開発環境用：審査を即時完了させる</p>
          <Button
            size="sm"
            onClick={onMockVerify}
            disabled={isMockPending}
            className="bg-blue-500 hover:bg-blue-600 text-muted-foreground text-xs"
          >
            {isMockPending ? "処理中..." : "審査完了にする（テスト用）"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── STEP 4: 完了 ─── */
function Step4Complete() {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <img src={ILLUST.step4} alt="本人確認完了" className="w-48 h-48 object-contain rounded-2xl" />
      </div>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-1.5 mb-4">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-semibold">本人確認済み</span>
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">本人確認が完了しました！</h2>
        <p className="text-muted-foreground text-sm">
          あなたの身元が確認されました。パートナーを招待して、
          二人の絆をブロックチェーンで証明しましょう。
        </p>
      </div>

      {/* 次のステップ */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">次にすること</p>
        {[
          { icon: "💌", title: "パートナーを招待", desc: "専用リンクをLINEやメールで送る", href: "/dashboard" },
          { icon: "🎖️", title: "証明書を確認", desc: "発行済みの証明書をチェック", href: "/dashboard" },
          { icon: "💎", title: "プランをアップグレード", desc: "より多くの特典を解放する", href: "/plans" },
        ].map((item) => (
          <Link key={item.title} href={item.href}>
            <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors cursor-pointer group">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-foreground font-semibold text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <Link href="/dashboard">
        <Button
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 font-bold py-6 rounded-2xl text-base"
          size="lg"
        >
          <Heart className="w-5 h-5 mr-2 fill-white" />
          マイページへ進む
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

/* ─── 審査不合格 ─── */
function FailedGuide({
  onRetry,
  isPending,
  errorCode,
}: {
  onRetry: () => void;
  isPending: boolean;
  errorCode?: string | null;
}) {
  const errorInfo = getKycErrorMessage(errorCode);
  return (
    <div className="space-y-6">
      {/* エラー詳細バナー */}
      <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
        <XCircle className="w-8 h-8 text-red-400 shrink-0" />
        <div>
          <p className="font-bold text-red-300 mb-1">{errorInfo.title}</p>
          <p className="text-muted-foreground text-sm mb-2">{errorInfo.detail}</p>
          <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">{errorInfo.action}</p>
          </div>
        </div>
      </div>

      {/* 一般的な原因リスト（エラーコードがない場合のみ表示） */}
      {!errorCode && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">よくある不合格の原因</p>
          {[
            "書類の文字がぼやけていた・反射していた",
            "書類の一部が切れていた",
            "有効期限が切れた書類を使用した",
            "顔写真と書類の人物が一致しなかった",
          ].map((reason, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-card border border-border rounded-xl text-sm text-muted-foreground">
              <span className="text-red-400 mt-0.5">•</span>
              {reason}
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={onRetry}
        disabled={isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 font-bold py-6 rounded-2xl text-base"
        size="lg"
      >
        <Fingerprint className="w-5 h-5 mr-2" />
        {isPending ? "処理中..." : "再度、本人確認を申請する"}
      </Button>
    </div>
  );
}

/* ─── メインコンポーネント ─── */
export default function Kyc() {
  const { isAuthenticated, loading } = useAuth();
  usePageTitle("本人確認（eKYC）- 恋人証明");
  const { data: profile, refetch } = trpc.user.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // kycStatus=pendingの間、5秒間隔でポーリングして審査結果を自動反映する
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kycStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentStatus = profile?.kycStatus;
    kycStatusRef.current = currentStatus;

    if (currentStatus === "pending") {
      // pendingになったらポーリング開始
      if (!pollingRef.current) {
        setIsPolling(true);
        pollingRef.current = setInterval(async () => {
          const result = await refetch();
          const newStatus = result.data?.kycStatus;
          if (newStatus && newStatus !== "pending") {
            // 審査完了（verified/failed/not_started）でポーリング停止
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setIsPolling(false);
          }
        }, 5000);
      }
    } else {
      // pending以外のステータスになったらポーリング停止
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsPolling(false);
    }

    return () => {
      // コンポーネントアンマウント時にポーリングをクリーンアップ
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [profile?.kycStatus, refetch]);

  const [, navigate] = useLocation();

  // Stripe Identity完了後の返遷検知（?kyc_completed=1）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("kyc_completed") === "1") {
      // URLクリーンアップ
      window.history.replaceState({}, "", window.location.pathname);
      toast.success("本人確認を受け付けました。審査完了までしばらくお待ちください。", { duration: 6000 });
      refetch();
    }
  }, [refetch]);

  const startKyc = trpc.user.startKyc.useMutation({
    onSuccess: (data) => {
      if (data.mock) {
        toast.success("本人確認申請を受け付けました（開発環境：モックモード）");
        refetch();
      } else {
        toast.success("Stripeの本人確認画面に移動します");
        // Stripe Identity: 同じタブで開く（完了後に return_url で此ページに戻る）
        const stripeUrl = data.url ?? `https://verify.stripe.com/start/${data.clientSecret}`;
        window.location.href = stripeUrl;
      }
    },
    onError: (e) => {
      const msg = e.message;
      // Stripe Identity機能未有効の場合
      if (msg.includes("identity") || msg.includes("Identity") || msg.includes("verification")) {
        toast.error(
          "Stripe本人確認機能が有効化されていません。Stripeダッシュボードで Identity Verification を有効にしてください。",
          { duration: 8000 }
        );
      } else {
        // サーバーエラーのメッセージにエラーコードが含まれている場合は日本語メッセージに変換
        const errorCodeMatch = msg.match(/: ([a-z_]+)$/);
        const errorCode = errorCodeMatch?.[1];
        const errorInfo = getKycErrorMessage(errorCode);
        toast.error(`${errorInfo.title}: ${errorInfo.action}`, { duration: 8000 });
      }
    },
  });

  const mockVerify = trpc.user.mockVerifyKyc.useMutation({
    onSuccess: () => {
      toast.success("本人確認が完了しました");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <Heart className="w-16 h-16 text-pink-500 fill-pink-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">ログインが必要です</h1>
          <p className="text-muted-foreground text-sm mb-8">本人確認を行うにはログインしてください。</p>
          <a href={getLoginUrl("/kyc")}>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-foreground font-bold px-8 py-6 rounded-2xl">
              ログイン / 登録
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const kycStatus = profile?.kycStatus ?? "not_started";
  const activeStep = getActiveStep(kycStatus);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* ページタイトル */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-1.5 mb-4">
            <Fingerprint className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-xs font-semibold uppercase tracking-wider">eKYC</span>
          </div>
          <h1 className="text-3xl font-black text-foreground">本人確認</h1>
          <p className="text-muted-foreground text-sm mt-2">
            証明書の発行には、本人確認が必要です。
          </p>
        </div>

        {/* 進捗バー */}
        {kycStatus !== "failed" && <StepBar active={activeStep} />}

        {/* ステップコンテンツ */}
        {kycStatus === "verified" && <Step4Complete />}

        {kycStatus === "pending" && (
          <Step3Guide
            onMockVerify={() => mockVerify.mutate()}
            isMockPending={mockVerify.isPending}
            isPolling={isPolling}
          />
        )}

        {kycStatus === "failed" && (
          <FailedGuide
            onRetry={() => startKyc.mutate({ origin: window.location.origin })}
            isPending={startKyc.isPending}
            errorCode={profile?.kycErrorCode}
          />
        )}

        {kycStatus === "not_started" && (
          <Step1Guide
            onStart={() => startKyc.mutate({ origin: window.location.origin })}
            isPending={startKyc.isPending}
          />
        )}
      </div>
    </div>
  );
}
