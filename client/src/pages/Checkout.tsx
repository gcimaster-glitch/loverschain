import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  Crown, GraduationCap, Heart, CheckCircle2, Sparkles,
  CreditCard, Landmark, ArrowLeft, ShieldCheck, Lock, Info
} from "lucide-react";
import { PLAN_PRICES } from "../../../shared/ranks";
import type { PlanType } from "../../../shared/ranks";
import { useState } from "react";
import { Users } from "lucide-react";

const PAYPAY_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/paypay-logo_2b9bd101.png";

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  lover: <Heart className="w-6 h-6" />,
  engagement: <Crown className="w-6 h-6" />,
  student: <GraduationCap className="w-6 h-6" />,
};

const PLAN_COLORS: Record<PlanType, { gradient: string; bg: string }> = {
  lover: { gradient: "from-rose-400 to-pink-500", bg: "bg-rose-50" },
  engagement: { gradient: "from-amber-400 to-yellow-500", bg: "bg-amber-50" },
  student: { gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50" },
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  lover: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "デジタル証明書発行",
    "交際ランクアップシステム",
    "タイアップ特典利用可能",
  ],
  engagement: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "婚約専用プレミアムデザイン証明書",
    "婚約指輪・指輪写真掲載オプション",
    "タイアップ特典利用可能",
  ],
  student: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "デジタル証明書発行",
    "交際ランクアップシステム",
    "学生証確認が必要（片方でも可）",
  ],
};

type PaymentMethod = "card" | "paypay" | "bank";
type PaymentMode = "full" | "split";

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const planParam = params.get("plan") as PlanType | null;
  const plan: PlanType = (planParam && ["lover", "engagement", "student"].includes(planParam))
    ? planParam
    : "lover";

  usePageTitle(`${PLAN_PRICES[plan].label} - お支払い確認 | 恋人証明`);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("full");

  const createPartnershipCheckout = trpc.payment.createPartnershipCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Stripeの決済ページに移動します");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(`決済エラー: ${err.message}`),
  });

  const createPartnershipSplitCheckout = trpc.payment.createPartnershipSplitCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Stripeの決済ページに移動します（割り勘・招待者分）");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(`決済エラー: ${err.message}`),
  });

  const planData = PLAN_PRICES[plan];
  const colors = PLAN_COLORS[plan];

  // PayPay/カード共通のStripe Checkout呼び出し（PayPayはStripe側で自動表示）
  const handleCardOrPayPayCheckout = () => {
    createPartnershipCheckout.mutate({ planType: plan, origin: window.location.origin });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <AppHeader />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Lock className="w-12 h-12 text-rose-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">ログインが必要です</h2>
          <p className="text-gray-500 mb-6">お支払いを行うにはログインしてください。</p>
          <Link href="/plans">
            <Button variant="outline" className="mr-3">プランに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* 戻るリンク */}
        <Link href="/plans">
          <button className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" />
            プラン選択に戻る
          </button>
        </Link>

        {/* タイトル */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-rose-600 text-xs font-semibold uppercase tracking-wider">Checkout</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">お支払い確認</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* 左：プラン詳細 */}
          <div className="md:col-span-3 space-y-4">

            {/* 選択プランカード */}
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
              <div className={`bg-gradient-to-br ${colors.gradient} p-5 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  {PLAN_ICONS[plan]}
                  <h2 className="text-xl font-bold">{planData.label}</h2>
                </div>
                <p className="text-sm opacity-80">{planData.description}</p>
              </div>
              <div className="p-5">
                <ul className="space-y-2 mb-4">
                  {PLAN_FEATURES[plan].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                  年間更新: ¥{planData.renewalPrice.toLocaleString()}（税込）/ペア
                </div>
              </div>
            </div>

            {/* 支払い方法選択 */}
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" />
                お支払い方法を選択
              </h3>
              <div className="space-y-3">

                {/* クレジット・デビットカード */}
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "card"
                      ? "border-rose-400 bg-rose-50"
                      : "border-gray-200 hover:border-rose-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "card" ? "bg-rose-100" : "bg-gray-100"
                  }`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-rose-500" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">クレジット・デビットカード</div>
                    <div className="text-xs text-gray-500 mt-0.5">Visa・Mastercard・JCB・American Express</div>
                    <div className="flex gap-1 mt-1.5">
                      {["VISA", "MC", "JCB", "AMEX"].map(b => (
                        <span key={b} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    paymentMethod === "card" ? "border-rose-400 bg-rose-400" : "border-gray-300"
                  }`}>
                    {paymentMethod === "card" && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                {/* PayPay */}
                <button
                  onClick={() => setPaymentMethod("paypay")}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "paypay"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-red-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                    paymentMethod === "paypay" ? "bg-red-50" : "bg-gray-50"
                  }`}>
                    <img src={PAYPAY_LOGO} alt="PayPay" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      PayPay
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">利用可能</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">QRコード決済・残高払い</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Stripe決済ページでPayPayを選択してください
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    paymentMethod === "paypay" ? "border-red-400 bg-red-400" : "border-gray-300"
                  }`}>
                    {paymentMethod === "paypay" && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                {/* 銀行振込 */}
                <button
                  onClick={() => setPaymentMethod("bank")}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "bank"
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "bank" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Landmark className={`w-5 h-5 ${paymentMethod === "bank" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">銀行振込</div>
                    <div className="text-xs text-gray-500 mt-0.5">GMOあおぞらネット銀行</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    paymentMethod === "bank" ? "border-blue-400 bg-blue-400" : "border-gray-300"
                  }`}>
                    {paymentMethod === "bank" && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* 銀行振込詳細 */}
              {paymentMethod === "bank" && (
                <div className="mt-4 bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="font-semibold text-blue-800 mb-2">振込先口座</div>
                  {[
                    ["銀行名", "GMOあおぞらネット銀行"],
                    ["支店名", "法人営業部"],
                    ["口座種別", "普通"],
                    ["口座番号", "1268592"],
                    ["口座名義", "（カ）コクサイシゲン"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-blue-200">
                    振込後、<a href="mailto:support@loverschain.jp" className="text-rose-500 underline">support@loverschain.jp</a> まで入金者名・金額・選択プランをご連絡ください。確認後にアカウントを有効化します。
                  </p>
                </div>
              )}

              {/* PayPay説明 */}
              {paymentMethod === "paypay" && (
                <div className="mt-4 bg-red-50 rounded-xl p-4 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={PAYPAY_LOGO} alt="PayPay" className="w-5 h-5 object-contain" />
                    <span className="font-semibold text-red-800">PayPayでのお支払い方法</span>
                  </div>
                  <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                    <li>「PayPayで支払う」ボタンをタップ</li>
                    <li>Stripeの決済ページが開きます</li>
                    <li>「PayPay」を選択してQRコードを表示</li>
                    <li>PayPayアプリでスキャンして支払い完了</li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* 右：金額サマリー */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 sticky top-6">
              <h3 className="font-bold text-gray-800 mb-4">お支払い金額</h3>

              {/* 支払いモード選択 */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMode("full")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    paymentMode === "full" ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className={`w-4 h-4 ${paymentMode === "full" ? "text-rose-500" : "text-gray-400"}`} />
                    <span className="text-xs font-bold text-gray-800">全額支払い</span>
                  </div>
                  <div className="text-xs text-gray-500">招待者が全額負担</div>
                </button>
                <button
                  onClick={() => setPaymentMode("split")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    paymentMode === "split" ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-4 h-4 ${paymentMode === "split" ? "text-emerald-500" : "text-gray-400"}`} />
                    <span className="text-xs font-bold text-gray-800">割り勘決済</span>
                  </div>
                  <div className="text-xs text-gray-500">二人で半額ずつ負担</div>
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {paymentMode === "full" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{planData.label}（新規・年間）</span>
                      <span className="font-semibold text-gray-800">¥{planData.pairPriceExTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">消費税（10%）</span>
                      <span className="text-gray-600">¥{(planData.pairPrice - planData.pairPriceExTax).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="font-bold text-gray-800">合計（税込）</span>
                      <span className="text-2xl font-black text-rose-500">¥{planData.pairPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-right">ペアあたり / 年間</div>
                  </>
                ) : (
                  <>
                    {/* 割り勘フロー説明 */}
                    <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700 mb-2">
                      <div className="font-semibold mb-2 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        割り勘決済の流れ
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">1</span>
                          <div>
                            <div className="font-medium">あなた（招待者）が半額を支払い</div>
                            <div className="text-emerald-600 mt-0.5">¥{Math.ceil(planData.pairPrice / 2).toLocaleString()} を今すぐ支払います</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">2</span>
                          <div>
                            <div className="font-medium">割り勘専用の招待リンクを取得</div>
                            <div className="text-emerald-600 mt-0.5">支払い完了後にリンクが発行されます</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">3</span>
                          <div>
                            <div className="font-medium">パートナーに招待リンクを送信</div>
                            <div className="text-emerald-600 mt-0.5">LINEやメールで共有できます</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">4</span>
                          <div>
                            <div className="font-medium">パートナーが残り半額を支払い</div>
                            <div className="text-emerald-600 mt-0.5">¥{Math.ceil(planData.pairPrice / 2).toLocaleString()} をパートナーが支払い後、パートナーシップ成立！</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">招待者分（半額）</span>
                      <span className="font-semibold text-gray-800">¥{Math.ceil(planData.pairPriceExTax / 2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">消費税（10%）</span>
                      <span className="text-gray-600">¥{(Math.ceil(planData.pairPrice / 2) - Math.ceil(planData.pairPriceExTax / 2)).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="font-bold text-gray-800">今回のお支払い（税込）</span>
                      <span className="text-2xl font-black text-emerald-500">¥{Math.ceil(planData.pairPrice / 2).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-right">パートナーが残り半額を別途支払い</div>
                  </>
                )}
              </div>

              {/* 決済ボタン */}
              {paymentMode === "full" ? (
                paymentMethod === "card" || paymentMethod === "paypay" ? (
                  <Button
                    onClick={handleCardOrPayPayCheckout}
                    disabled={createPartnershipCheckout.isPending}
                    className={`w-full ${
                      paymentMethod === "paypay"
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : `bg-gradient-to-r ${colors.gradient}`
                    } text-white border-0 hover:opacity-90 rounded-xl py-6 text-base font-bold`}
                  >
                    {createPartnershipCheckout.isPending ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        処理中...
                      </span>
                    ) : paymentMethod === "paypay" ? (
                      <span className="flex items-center gap-2 justify-center">
                        <img src={PAYPAY_LOGO} alt="PayPay" className="w-5 h-5 object-contain brightness-0 invert" />
                        PayPayで支払う（全額）
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <CreditCard className="w-5 h-5" />
                        カードで支払う（全額）
                      </span>
                    )}
                  </Button>
                ) : (
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Landmark className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-blue-800">上記の口座にお振込ください</p>
                    <p className="text-xs text-blue-600 mt-1">確認後にアカウントを有効化します</p>
                  </div>
                )
              ) : (
                <Button
                  onClick={() => createPartnershipSplitCheckout.mutate({
                    planType: plan,
                    origin: window.location.origin,
                  })}
                  disabled={createPartnershipSplitCheckout.isPending}
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 hover:opacity-90 rounded-xl py-6 text-base font-bold"
                >
                  {createPartnershipSplitCheckout.isPending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      処理中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Users className="w-5 h-5" />
                      割り勘で招待者分を支払う
                    </span>
                  )}
                </Button>
              )}

              {/* セキュリティバッジ */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  <span>Stripe安全決済 · SSL暗号化</span>
                </div>
                {/* 支払い方法ロゴ */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {["VISA", "MC", "JCB", "AMEX"].map(b => (
                    <span key={b} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium border border-gray-200">{b}</span>
                  ))}
                  <img src={PAYPAY_LOGO} alt="PayPay" className="h-5 object-contain" />
                </div>
              </div>

              {/* プラン変更リンク */}
              <div className="mt-3 text-center">
                <Link href="/plans">
                  <button className="text-xs text-rose-400 hover:text-rose-600 underline">
                    プランを変更する
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
