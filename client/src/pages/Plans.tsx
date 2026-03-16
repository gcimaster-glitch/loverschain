import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Crown, GraduationCap, Heart, CheckCircle2, Sparkles,
  CreditCard, Landmark, Clock, Info
} from "lucide-react";
import { PLAN_PRICES } from "../../../shared/ranks";
import type { PlanType } from "../../../shared/ranks";

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  lover: <Heart className="w-8 h-8" />,
  engagement: <Crown className="w-8 h-8" />,
  student: <GraduationCap className="w-8 h-8" />,
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  lover: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "デジタル証明書発行",
    "交際ランクアップシステム",
    "タイアップ特典利用可能",
    `年間更新 ¥${PLAN_PRICES.lover.renewalPrice.toLocaleString()}（税込）/ペア`,
  ],
  engagement: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "婚約専用プレミアムデザイン証明書",
    "婚約指輪・指輪写真掲載オプション",
    "タイアップ特典利用可能",
    `年間更新 ¥${PLAN_PRICES.engagement.renewalPrice.toLocaleString()}（税込）/ペア`,
  ],
  student: [
    "eKYC本人確認済み証明",
    "ブロックチェーン記録（改ざん不可）",
    "デジタル証明書発行",
    "交際ランクアップシステム",
    "学生証確認が必要（片方でも可）",
    `年間更新 ¥${PLAN_PRICES.student.renewalPrice.toLocaleString()}（税込）/ペア`,
  ],
};

const PLAN_COLORS: Record<PlanType, { gradient: string; ring: string; popular?: boolean }> = {
  lover: {
    gradient: "from-rose-400 to-pink-500",
    ring: "ring-2 ring-rose-300",
    popular: true,
  },
  engagement: {
    gradient: "from-amber-400 to-yellow-500",
    ring: "",
  },
  student: {
    gradient: "from-violet-400 to-purple-500",
    ring: "",
  },
};

const PLAN_ORDER: PlanType[] = ["lover", "engagement", "student"];

export default function Plans() {
  const { isAuthenticated } = useAuth();
  usePageTitle("料金プラン - 恋人証明");

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <AppHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* タイトル */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-rose-600 text-xs font-semibold uppercase tracking-wider">Pricing</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">料金プラン</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            お二人の関係に合ったプランをお選びください。<br />
            すべてのプランにeKYC本人確認とブロックチェーン証明が含まれます。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>料金は<strong>ペアあたり</strong>の金額です。招待リンクを送る前にお支払いいただきます。</span>
          </div>
        </div>

        {/* プランカード */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_ORDER.map((key) => {
              const plan = PLAN_PRICES[key];
              const colors = PLAN_COLORS[key];
              return (
                <div
                  key={key}
                  className={`relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${colors.ring}`}
                >
                  {colors.popular && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs px-3 py-1 rounded-bl-xl font-medium z-10">
                      人気 No.1
                    </div>
                  )}
                  {/* ヘッダー */}
                  <div className={`bg-gradient-to-br ${colors.gradient} p-6 text-white`}>
                    <div className="mb-3">{PLAN_ICONS[key]}</div>
                    <h3 className="text-xl font-bold mb-1">{plan.label}</h3>
                    <p className="text-sm opacity-80 mb-3">{plan.description}</p>
                    {/* 新規価格 */}
                    <div className="bg-white/20 rounded-xl p-3">
                      <div className="text-xs opacity-80 mb-0.5">新規発行（年間）</div>
                      <div className="text-3xl font-black">
                        ¥{plan.pairPrice.toLocaleString()}
                        <span className="text-sm font-normal opacity-80">/ペア（税込）</span>
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        税別 ¥{plan.pairPriceExTax.toLocaleString()}
                      </div>
                    </div>
                    {/* 更新価格 */}
                    <div className="mt-2 text-sm opacity-80">
                      更新: ¥{plan.renewalPrice.toLocaleString()}（税込）/ ¥{plan.renewalPriceExTax.toLocaleString()}（税別）
                    </div>
                    {plan.studentNote && (
                      <div className="mt-2 text-xs bg-white/20 rounded-lg px-2 py-1">
                        ※ {plan.studentNote}
                      </div>
                    )}
                  </div>

                  {/* 特典リスト */}
                  <div className="p-5">
                    {/* 支払い方法バッジ */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">支払い方法:</span>
                      <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5">
                        <CreditCard className="w-3 h-3" />カード
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/paypay-logo_2b9bd101.png" alt="PayPay" className="w-3 h-3 object-contain" />PayPay
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5">
                        <Landmark className="w-3 h-3" />銀行振込
                      </span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {PLAN_FEATURES[key].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isAuthenticated ? (
                      <Link href={`/checkout?plan=${key}`}>
                        <Button
                          className={`w-full bg-gradient-to-r ${colors.gradient} text-white border-0 hover:opacity-90 rounded-xl`}
                        >
                          このプランで始める
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/checkout?plan=${key}`}>
                        <Button
                          className={`w-full bg-gradient-to-r ${colors.gradient} text-white border-0 hover:opacity-90 rounded-xl`}
                        >
                          ログインして始める
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 料金比較表 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">料金比較</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-rose-50">
                    <th className="text-left p-4 text-gray-600 font-semibold">プラン</th>
                    <th className="text-right p-4 text-gray-600 font-semibold">新規（税込）</th>
                    <th className="text-right p-4 text-gray-600 font-semibold">新規（税別）</th>
                    <th className="text-right p-4 text-gray-600 font-semibold">更新（税込）</th>
                    <th className="text-right p-4 text-gray-600 font-semibold">更新（税別）</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_ORDER.map((key, i) => {
                    const plan = PLAN_PRICES[key];
                    return (
                      <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-rose-50/30"}>
                        <td className="p-4 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-rose-500">{PLAN_ICONS[key]}</span>
                            {plan.label}
                            {plan.studentNote && (
                              <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">学生割引</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-gray-800">¥{plan.pairPrice.toLocaleString()}</td>
                        <td className="p-4 text-right text-gray-500">¥{plan.pairPriceExTax.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-gray-800">¥{plan.renewalPrice.toLocaleString()}</td>
                        <td className="p-4 text-right text-gray-500">¥{plan.renewalPriceExTax.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="p-3 text-xs text-gray-400 text-center">
                      ※ 上記はすべてペアあたりの金額です。招待リンクを送る前に招待者がお支払いいただきます。
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* 支払い方法 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-500" />
            お支払い方法
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* カード決済 */}
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">クレジット・デビットカード</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">利用可能</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Visa・Mastercard・JCB・American Express対応。Stripeの安全な決済システムを使用しています。
              </p>
            </div>

            {/* 銀行振込 */}
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">銀行振込</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">利用可能</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">銀行名</span>
                    <span className="font-semibold text-gray-800">GMOあおぞらネット銀行</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">支店名</span>
                    <span className="font-semibold text-gray-800">法人営業部</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">口座種別</span>
                    <span className="font-semibold text-gray-800">普通</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">口座番号</span>
                    <span className="font-semibold text-gray-800">1268592</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">口座名義</span>
                    <span className="font-semibold text-gray-800">（カ）コクサイシゲン</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">振込後、<a href="mailto:support@loverschain.jp" className="text-rose-500 underline">support@loverschain.jp</a> まで入金者名・金額・選択プランをご連絡ください。確認後にアカウントを有効化します。
                </p>
              </div>
            </div>

            {/* PayPay（利用可能） */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/paypay-logo_2b9bd101.png" alt="PayPay" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">PayPay</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">利用可能</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">QRコードをスキャンするだけで簡単決済。PayPay残高・PayPayカードで支払えます。</p>
              <p className="text-xs text-gray-400 mt-2">※ チェックアウト画面でPayPayを選択してください</p>
            </div>

            {/* 後払い（予定） */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-70">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-600">後払い決済</h3>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit">
                    <Clock className="w-3 h-3" />導入予定
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">後払い決済（コンビニ払い等）は近日中に対応予定です。</p>
            </div>
          </div>
        </section>

        {/* 事業者バナー */}
        <section className="bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl p-8 mb-16 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">For Business</div>
              <h2 className="text-2xl font-bold mb-3">パートナーシップ証明を、あなたのビジネスに。</h2>
              <p className="text-white/80 text-sm">
                結婚相談所・ブライダルサロン・山荘などの事業者様向けに、ホワイトラベル・OEM/ODMプランをご用意しています。
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/for-business">
                <Button size="lg" className="bg-white text-rose-600 hover:bg-white/90 font-bold px-8 rounded-full shadow">
                  事業者様はこちら →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* よくある質問 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">よくある質問</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: "学生割引はどちらが学生でも適用されますか？",
                a: "はい。ペアのどちらか一方が学生であれば適用されます。学生証の写真をアップロードして確認後に適用されます。"
              },
              {
                q: "支払いはいつ行いますか？",
                a: "招待リンクを送る前にお支払いいただきます。決済完了後に招待リンクが生成されます。"
              },
              {
                q: "年間更新を忘れた場合はどうなりますか？",
                a: "更新期限から30日間は猶予期間があります。その後は証明書がグレーアウトし、パートナーにも通知されます。"
              },
              {
                q: "銀行振込の場合、いつ証明書が発行されますか？",
                a: "ご入金確認後、1〜2営業日以内に招待リンクを発行いたします。support@loverschain.jp までご連絡ください。"
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 border border-rose-100">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-500 pl-5">A. {faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* フッター */}
      <div className="border-t border-rose-100 py-8 px-6 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-rose-500 transition-colors">ホーム</Link>
          <Link href="/faq" className="hover:text-rose-500 transition-colors">FAQ</Link>
          <Link href="/for-business" className="hover:text-rose-500 transition-colors">事業者向け</Link>
          <Link href="/legal/terms" className="hover:text-rose-500 transition-colors">利用規約</Link>
          <Link href="/legal/privacy" className="hover:text-rose-500 transition-colors">プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  );
}
