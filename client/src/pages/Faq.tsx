import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";

/* ─── FAQ データ ─── */
const FAQ_CATEGORIES = [
  {
    category: "サービスについて",
    icon: "💡",
    items: [
      {
        q: "恋人証明とは何ですか？",
        a: "恋人証明は、eKYC（本人確認）とブロックチェーン技術を使って、二人の交際関係を公式に証明するサービスです。婚姻届が夫婦の絆を証明するように、恋人証明はカップルの関係を技術的に記録・証明します。",
      },
      {
        q: "なぜ恋人証明が必要なのですか？",
        a: "結婚詐欺、不倫、不同意性交など、日本で毎年多くの恋愛トラブルが発生しています。恋人証明は「二人が合意して交際している」という事実をブロックチェーンに記録することで、こうした問題を技術で防ぎます。また、証明書があることで二人の関係に安心感と誠実さが生まれます。",
      },
      {
        q: "どのような人が使えますか？",
        a: "年齢・性別・性的指向を問わず、すべてのカップルが利用できます。高校生カップル（保護者同意あり）、婚活中のカップル、LGBTQ+カップル、内縁関係、遠距離恋愛など、あらゆる関係性に対応しています。",
      },
    ],
  },
  {
    category: "本人確認（eKYC）について",
    icon: "🪪",
    items: [
      {
        q: "なぜ本人確認が必要なのですか？",
        a: "証明書の信頼性を担保するため、および結婚詐欺・なりすましを防ぐために必要です。身元不明の相手とは証明を結べない仕組みにすることで、サービスの安全性を確保しています。",
      },
      {
        q: "本人確認に使える書類は何ですか？",
        a: "マイナンバーカード（表面）、運転免許証（表裏）、パスポート（顔写真ページ）の3種類に対応しています。いずれも有効期限内のものをご使用ください。",
      },
      {
        q: "本人確認の審査にはどのくらいかかりますか？",
        a: "通常1〜3営業日です。混雑時は最大5営業日かかる場合があります。審査完了後、登録メールアドレスにご連絡します。",
      },
      {
        q: "本人確認の情報はどのように管理されますか？",
        a: "本人確認はStripe Identityを通じて処理されます。書類の画像は暗号化されて保存され、確認完了後に自動削除されます。情報は本人確認の目的のみに使用され、第三者に提供されることはありません。",
      },
    ],
  },
  {
    category: "証明書について",
    icon: "📜",
    items: [
      {
        q: "証明書はどのように発行されますか？",
        a: "二人ともeKYCを完了した後、パートナーを招待します。パートナーが招待を承認すると、二人の合意がPolygonブロックチェーンに記録され、デジタル証明書が発行されます。",
      },
      {
        q: "証明書のランクとは何ですか？",
        a: "交際期間に応じて証明書のデザインとランクが自動的に進化します。3日（🌸）から5年以上（💎）まで13段階のランクがあり、長く続く関係ほど希少なランクになります。",
      },
      {
        q: "証明書は第三者に見せることができますか？",
        a: "はい。証明書には固有のURLが発行され、そのURLを共有することで第三者が証明書の真正性をブロックチェーン上で確認できます。SNSでのシェアも可能です。",
      },
      {
        q: "証明書を額装して郵送してもらえますか？",
        a: "はい、オプションで本物の証明書を印刷・額装して郵送するサービスをご用意しています。記念日や誕生日のプレゼントにも最適です。",
      },
    ],
  },
  {
    category: "別れた場合・解消について",
    icon: "💔",
    items: [
      {
        q: "別れた場合、証明書はどうなりますか？",
        a: "二人の合意による「合意解消」または一方からの「一方的解消申請」によって証明を終了できます。合意解消の場合は即時に証明が無効化されます。一方的解消の場合は、相手に通知が届き、一定期間（7日間）異議がなければ解消されます。ブロックチェーン上には「解消済み」として記録が残ります。",
      },
      {
        q: "一方的に解消された場合、どうなりますか？",
        a: "解消申請が来た場合、メールで通知されます。7日以内に異議申し立てができます。異議がない場合は自動的に解消されます。解消後は、それぞれが新しいパートナーと証明を結べるようになります。",
      },
      {
        q: "解消後、過去の証明書の記録は残りますか？",
        a: "ブロックチェーンの性質上、記録は永久に残ります。ただし、証明のステータスは「解消済み」と表示されます。過去の証明書は当事者のみが閲覧できます。",
      },
    ],
  },
  {
    category: "独身証明・重複防止について",
    icon: "🛡️",
    items: [
      {
        q: "なぜシングルだと証明できるのですか？",
        a: "恋人証明では、グリーンステータス（有効な証明書あり）の間は、技術的に他の誰とも新しい証明を結べない仕組みになっています。逆に言えば、現在証明書を持っていない人は「証明された交際相手がいない」ことを証明できます。",
      },
      {
        q: "他に彼女・彼氏がいないと保証できますか？",
        a: "はい。恋人証明の重複防止システムにより、一人のユーザーが同時に複数の有効な証明書を持つことは技術的に不可能です。eKYCで本人確認を行っているため、別アカウントでの回避も防いでいます。",
      },
      {
        q: "既婚者は利用できますか？",
        a: "既婚者の方も利用できますが、配偶者以外の方との証明書発行は利用規約で禁止しています。不倫目的での利用が発覚した場合はアカウントを停止します。",
      },
    ],
  },
  {
    category: "料金・プランについて",
    icon: "💳",
    items: [
      {
        q: "料金はいくらですか？",
        a: "月額980円（税込）のサブスクリプションです。初回発行手数料は無料で、いつでも解約できます。詳細は料金ページをご確認ください。",
      },
      {
        q: "支払い方法は何がありますか？",
        a: "クレジットカード（Visa・Mastercard・JCB・American Express）、デビットカードに対応しています。Stripeを通じた安全な決済処理を行っています。",
      },
      {
        q: "返金はできますか？",
        a: "証明書発行後の返金は原則お受けできません。ただし、システムの不具合による発行失敗の場合は全額返金いたします。詳細は利用規約をご確認ください。",
      },
    ],
  },
];

/* ─── アコーディオンアイテム ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-rose-100 last:border-0">
      <button
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-gray-700 font-semibold text-sm leading-relaxed group-hover:text-rose-500 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-rose-300 shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-5 text-gray-500 text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  usePageTitle("よくある質問（FAQ）- 恋人証明");

  // JSON-LD FAQPage構造化データ
  useEffect(() => {
    const faqItems = FAQ_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    );
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-jsonld";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("faq-jsonld");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 text-gray-800">
      <AppHeader />

      {/* ヒーロー */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-rose-600 text-xs font-semibold uppercase tracking-wider">FAQ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4 leading-tight">
            よくある質問
          </h1>
          <p className="text-gray-500 text-base">
            恋人証明についての疑問にお答えします。
            <br />
            解決しない場合は、お気軽にお問い合わせください。
          </p>
        </div>
      </section>

      {/* FAQ本体 */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="text-lg font-black text-gray-700">{cat.category}</h2>
              </div>
              <div className="rounded-2xl bg-white border border-rose-100 shadow-sm px-6">
                {cat.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 p-10 shadow-lg">
            <Heart className="w-10 h-10 text-white fill-white mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3">まだ疑問がありますか？</h2>
            <p className="text-white/80 text-sm mb-6">
              お気軽にサポートチームまでお問い合わせください。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@loverschain.jp">
                <Button variant="outline" className="border-white/60 text-white hover:bg-white/20 rounded-full bg-transparent">
                  メールで問い合わせる
                </Button>
              </a>
              <a href={getLoginUrl()}>
                <Button className="bg-white text-rose-600 hover:bg-white/90 font-bold rounded-full shadow">
                  無料で始める <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* フッターナビ */}
      <div className="border-t border-rose-100 py-8 px-6 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-rose-500 transition-colors">ホーム</Link>
          <Link href="/plans" className="hover:text-rose-500 transition-colors">料金プラン</Link>
          <Link href="/for-business" className="hover:text-rose-500 transition-colors">事業者向け</Link>
          <Link href="/legal/terms" className="hover:text-rose-500 transition-colors">利用規約</Link>
          <Link href="/legal/privacy" className="hover:text-rose-500 transition-colors">プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  );
}
