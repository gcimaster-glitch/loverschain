import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const TOKUSHO_ITEMS = [
  { label: "販売事業者名", value: "株式会社 国際資源" },
  { label: "英語名", value: "International Natural Resources And Energy" },
  { label: "代表者名", value: "代表取締役社長 / CEO　岩間 哲士" },
  { label: "本店所在地", value: "〒105-0023 東京都港区芝浦1-13-10" },
  { label: "電話番号", value: "03-4595-0191（平日 10:00〜18:00）" },
  { label: "メールアドレス", value: "info@inre.co.jp" },
  { label: "ウェブサイト", value: "http://www.inre.co.jp/" },
  { label: "設立", value: "昭和58年7月28日（1983年）" },
  { label: "資本金", value: "1億2,100万円" },
  { label: "決算期", value: "6月末日" },
  {
    label: "販売価格",
    value: "各料金プランページに表示された金額（税込）",
  },
  {
    label: "支払方法",
    value: "クレジットカード（Visa / Mastercard / American Express / JCB）",
  },
  {
    label: "支払時期",
    value:
      "月次サブスクリプション：毎月自動更新時に課金\n年次サブスクリプション：契約開始時に一括課金",
  },
  {
    label: "サービス提供時期",
    value: "決済完了後、即時ご利用いただけます。",
  },
  {
    label: "返品・キャンセル",
    value:
      "サブスクリプションはいつでも解約可能です。解約後は当該請求期間の末日までサービスをご利用いただけます。日割り返金は行いません。",
  },
  {
    label: "動作環境",
    value:
      "最新版のChrome / Firefox / Safari / Edge を推奨します。Internet Explorerは非対応です。",
  },
  {
    label: "損害賠償の制限",
    value:
      "当社の責に帰すべき事由によりユーザーに損害が生じた場合、当社の賠償責任は当該損害が発生した月の月額利用料金（または証明書発行手数料の1回分）を上限とします。当社は、いかなる場合においても、間接損害・特別損害・逸失利益・データ損失その他の予見不可能な損害について責任を負いません。本サービスは交際関係の記録・証明を目的としたプラットフォームであり、当事者間のトラブル・関係破綻・精神的損害等について当社は一切関与せず、責任を負いません。",
  },
];

export default function Tokusho() {
  usePageTitle("特定商取引法に基づく表示 | 恋人証明");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            トップへ戻る
          </button>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          特定商取引法に基づく表示
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          特定商取引に関する法律（昭和51年法律第57号）第11条に基づく表示
        </p>

        <div className="border border-border rounded-2xl overflow-hidden">
          {TOKUSHO_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col sm:flex-row ${
                i % 2 === 0 ? "bg-muted/30" : "bg-background"
              } border-b border-border last:border-0`}
            >
              <dt className="w-full sm:w-48 shrink-0 px-5 py-4 text-sm font-semibold text-foreground sm:border-r border-border">
                {item.label}
              </dt>
              <dd className="px-5 py-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {item.value}
              </dd>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          最終更新日：2025年6月1日
        </p>
      </div>
    </div>
  );
}
