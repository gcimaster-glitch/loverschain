/**
 * カテゴリー別LP 共通テンプレート
 * /for/highschool, /for/college, /for/konkatsu, /for/agency,
 * /for/naien, /for/lgbt, /for/nokekkon
 */
import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Heart } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";

export interface CategoryConfig {
  slug: string;
  emoji: string;
  title: string;
  subtitle: string;
  tagline: string;
  heroDesc: string;
  accentColor: string; // Tailwind gradient class e.g. "from-pink-500 to-rose-600"
  borderColor: string; // e.g. "border-pink-500/30"
  bgColor: string;     // e.g. "from-pink-500/20 to-rose-500/10"
  benefits: { icon: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  cta: string;
}

export function CategoryLP({ config }: { config: CategoryConfig }) {
  usePageTitle(`${config.title} - 恋人証明`);

  // JSON-LD WebPage構造化データ
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${config.title} - 恋人証明`,
      description: config.heroDesc,
      url: `https://koibitoshm-hwkz9ewq.manus.space/for/${config.slug}`,
      inLanguage: "ja",
      isPartOf: {
        "@type": "WebSite",
        name: "恋人証明",
        url: "https://koibitoshm-hwkz9ewq.manus.space",
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `category-jsonld-${config.slug}`;
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById(`category-jsonld-${config.slug}`);
      if (el) el.remove();
    };
  }, [config.slug, config.title, config.heroDesc]);

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />

      {/* ─── HERO ─── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config.bgColor} opacity-40`}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 bg-white/10 border ${config.borderColor} rounded-full px-4 py-1.5 mb-6`}
          >
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              {config.tagline}
            </span>
          </div>
          <div className="text-6xl mb-4">{config.emoji}</div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            {config.title}
          </h1>
          <p className="text-xl text-white/60 mb-4">{config.subtitle}</p>
          <p className="text-white/40 text-base max-w-xl mx-auto mb-10">
            {config.heroDesc}
          </p>
          <a href={getLoginUrl()}>
            <Button
              className={`bg-gradient-to-r ${config.accentColor} text-white font-bold px-10 py-6 rounded-full text-base hover:opacity-90 transition-opacity`}
              size="lg"
            >
              無料で始める <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            {config.title}に選ばれる理由
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {config.benefits.map((b, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 bg-gradient-to-br ${config.bgColor} border ${config.borderColor}`}
              >
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="font-bold text-white mb-2">{b.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            たった3ステップ
          </h2>
          <div className="space-y-0">
            {[
              { step: "01", title: "アカウント登録", desc: "メールアドレスで無料登録。数分で完了します。" },
              { step: "02", title: "本人確認（eKYC）", desc: "マイナンバーカードや運転免許証で本人確認。最短数分で完了。" },
              { step: "03", title: "パートナーを招待", desc: "専用リンクをLINEで送るだけ。二人の証明書が発行されます。" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 py-8 border-b border-white/10 last:border-0">
                <div className="text-5xl font-black text-white/10 w-16 shrink-0 leading-none pt-1">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            よくある質問
          </h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/10">
            {config.faqs.map((faq, i) => (
              <div key={i} className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <p className="text-white font-semibold text-sm">{faq.q}</p>
                </div>
                <p className="text-white/50 text-sm leading-relaxed ml-8">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/faq" className="text-pink-400 text-sm hover:underline">
              すべてのFAQを見る →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-[#1a0a2e] to-[#0d0d1a] border border-white/10 p-12">
            <Heart className="w-12 h-12 text-pink-500 fill-pink-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-3">{config.cta}</h2>
            <p className="text-white/50 text-sm mb-8">
              今すぐ無料で始めて、二人の愛を証明しましょう。
            </p>
            <a href={getLoginUrl()}>
              <Button
                className={`bg-gradient-to-r ${config.accentColor} text-white font-bold px-10 py-6 rounded-full text-base hover:opacity-90`}
                size="lg"
              >
                無料で始める <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
