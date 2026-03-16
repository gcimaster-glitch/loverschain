import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowRight, ChevronDown, Heart, Shield, Lock, CheckCircle, Users, Hourglass, HelpCircle, Smartphone, CreditCard, Clock, Star } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";

/* ─── Scroll-triggered fade-in hook ─── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── CDN URLs ─── */
const CDN = {
  certificateSample: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/certificate_sample_5d5b1017.png",
  lifestyle1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/lifestyle_couple1_93d3fd43.png",
  lifestyle2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/lifestyle_couple2_c2edbd63.png",
  lifestyle3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/lifestyle_couple3_6b7fd017.png",
};

/* ─── Rank badge ─── */
const RANKS = [
  { days: 3,    label: "3日",    color: "#f9a8d4", emoji: "🌸" },
  { days: 30,   label: "1ヶ月",  color: "#fbbf24", emoji: "🌼" },
  { days: 90,   label: "3ヶ月",  color: "#34d399", emoji: "🍀" },
  { days: 180,  label: "半年",   color: "#60a5fa", emoji: "💎" },
  { days: 365,  label: "1年",    color: "#a78bfa", emoji: "🌙" },
  { days: 730,  label: "2年",    color: "#f97316", emoji: "🔥" },
  { days: 1095, label: "3年",    color: "#ec4899", emoji: "💍" },
  { days: 1825, label: "5年",    color: "#eab308", emoji: "👑" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  usePageTitle("ホーム - 二人の絆をブロックチェーンで証明");
  const [scrollY, setScrollY] = useState(0);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "register" | "login" }>({ open: false, mode: "register" });
  const openRegister = () => setAuthModal({ open: true, mode: "register" });
  const openLogin = () => setAuthModal({ open: true, mode: "login" });

  // ログイン済みでもTOPページを閲覧可能（強制リダイレクトを削除）
  // ダッシュボードへのリンクはヘッダーとCTAボタンで案内する

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showFloatingCta = scrollY > 700;

  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#2d1f1f] overflow-x-hidden">

      {/* ── Floating CTA ── */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
          showFloatingCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        {isAuthenticated ? (
          <Link href="/dashboard">
            <button className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-xl shadow-rose-200 hover:scale-105 transition-transform text-sm">
              <Heart className="w-4 h-4 fill-white" />
              マイページへ
            </button>
          </Link>
        ) : (
          <button
            onClick={openRegister}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-xl shadow-rose-200 hover:scale-105 transition-transform text-sm"
          >
            <Heart className="w-4 h-4 fill-white" />
            無料で始める
          </button>
        )}
      </div>

      {/* ── Transparent header ── */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <AppHeader transparent />
      </div>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 pb-16">
        {/* 背景：白〜ベージュ〜ローズの爽やかグラデーション */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50 to-pink-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(251,207,232,0.5),transparent)]" />
          {/* 花びら風の装飾ドット */}
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-rose-200/40 animate-pulse"
              style={{
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          {/* ── キャッチコピー ── */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-200 bg-white/70 backdrop-blur-sm text-sm text-rose-500 mb-8 shadow-sm">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>スマホ1台・身分証1枚・5分で発行</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-6" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              <span className="block text-[#2d1f1f]">二人の愛を、</span>
              <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 bg-clip-text text-transparent">
                公式に証明する。
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#7a5c5c] max-w-xl mx-auto leading-relaxed">
              婚姻届が夫婦を証明するように、<br />
              恋人証明は交際を証明します。
            </p>
          </div>

          {/* ── 中段：証明書サンプル + 4ステップ ── */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            {/* 証明書サンプル */}
            <div className="relative order-2 md:order-1">
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-200/50 to-pink-200/50 rounded-3xl blur-2xl" />
              <div className="relative">
                <img
                  src={CDN.certificateSample}
                  alt="恋人証明書サンプル"
                  className="rounded-2xl w-full shadow-2xl shadow-rose-100 border border-rose-100"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-rose-100 shadow-sm">
                  <p className="text-rose-600 text-xs font-semibold">📄 これが手に入ります</p>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-rose-100 shadow-sm">
                  <p className="text-rose-600 text-xs font-semibold">🔗 改ざん不可・永久保存</p>
                </div>
              </div>
            </div>

            {/* 4ステップ概要 */}
            <div className="order-1 md:order-2 space-y-4">
              <p className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-6">4ステップ・約5分で完了</p>
              {[
                { step: "1", icon: <Smartphone className="w-5 h-5" />, title: "アカウント登録", time: "1分", desc: "メールアドレスまたはSNSで登録" },
                { step: "2", icon: <CreditCard className="w-5 h-5" />, title: "身分証で本人確認", time: "3〜5分", desc: "マイナンバーカード・免許証・パスポートで確認" },
                { step: "3", icon: <Heart className="w-5 h-5" />, title: "パートナーを招待", time: "1分", desc: "LINEやメールでリンクを送るだけ" },
                { step: "4", icon: <Star className="w-5 h-5" />, title: "証明書が発行される", time: "即時", desc: "二人のスマホに証明書が届きます" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 border border-rose-100 hover:border-rose-200 transition-colors shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-400">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#2d1f1f] text-sm">{item.title}</span>
                      <span className="text-xs bg-rose-50 border border-rose-200 text-rose-500 px-2 py-0.5 rounded-full shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[#9a7a7a] text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <div className="text-rose-200 font-black text-2xl shrink-0">{item.step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-10 py-6 rounded-full text-base transition-transform hover:scale-105 shadow-xl shadow-rose-200"
                  >
                    マイページへ <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button
                    size="lg"
                    onClick={openRegister}
                    className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-10 py-6 rounded-full text-base transition-transform hover:scale-105 shadow-xl shadow-rose-200"
                  >
                    無料で始める <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={openLogin}
                    className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 font-bold px-10 py-6 rounded-full text-base transition-transform hover:scale-105"
                  >
                    ログイン
                  </Button>
                </div>
              )}
              <Link href="/verify">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-rose-200 text-rose-500 hover:bg-rose-50 px-10 py-6 rounded-full text-base bg-white/80"
                >
                  証明書を確認する
                </Button>
              </Link>
            </div>
            <p className="text-[#9a7a7a] text-xs">
              ※ 本人確認（eKYC）とは：身分証を使ったオンライン本人確認のことです。銀行口座開設でも使われている安全な方法です。
            </p>
          </div>
        </div>

        {/* スクロールインジケーター */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-rose-300 animate-bounce">
          <span className="text-xs tracking-widest uppercase">詳しく見る</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING BAR
      ═══════════════════════════════════════ */}
      <section className="py-5 px-6 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-y border-rose-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-center">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#2d1f1f]">月額</span>
              <span className="text-4xl font-black bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">980</span>
              <span className="text-xl font-black text-[#2d1f1f]">円</span>
              <span className="text-[#9a7a7a] text-sm ml-1">（税込）</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-rose-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-left">
                <p className="text-[#2d1f1f] font-bold text-sm leading-tight">初回発行手数料は無料</p>
                <p className="text-[#9a7a7a] text-xs">証明書の初回発行にかかる手数料は0円</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-rose-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-[#2d1f1f] font-bold text-sm leading-tight">いつでも解約OK</p>
                <p className="text-[#9a7a7a] text-xs">縛りなし・違約金なし</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-rose-200" />
            <Link href="/plans">
              <div className="flex items-center gap-1.5 text-rose-400 hover:text-rose-500 transition-colors cursor-pointer group">
                <span className="text-sm font-semibold">料金プランの詳細</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHAT YOU GET
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-rose-400 uppercase tracking-widest mb-4">What You Get</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              お金を払うと、<br />何が手に入るの？
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "📄",
                title: "二人だけの証明書",
                price: "初回 ¥3,000/人",
                items: [
                  "二人の名前・交際開始日が記載",
                  "スマホでいつでも確認できる",
                  "ブロックチェーンで永久保存",
                  "改ざん・偽造が技術的に不可能",
                ],
                highlight: true,
              },
              {
                emoji: "🛡️",
                title: "浮気防止の安心感",
                price: "含まれています",
                items: [
                  "重複登録を技術的にブロック",
                  "別の人が登録しようとすると検知",
                  "イエローアカウント制度で透明性確保",
                  "円満解除は2ステップで完了",
                ],
                highlight: false,
              },
              {
                emoji: "🎁",
                title: "カップル特典・記念日通知",
                price: "含まれています",
                items: [
                  "100日・1周年などの記念日通知",
                  "提携店舗での割引・特典",
                  "証明書をSNSでシェア可能",
                  "ランクが上がるほど証明書が進化",
                ],
                highlight: false,
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className={`rounded-3xl p-7 h-full flex flex-col ${
                  item.highlight
                    ? "bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 shadow-lg shadow-rose-100"
                    : "bg-[#fdf8f5] border border-rose-100"
                }`}>
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h3 className="text-xl font-black text-[#2d1f1f] mb-1">{item.title}</h3>
                  <p className={`text-xs font-bold mb-5 ${item.highlight ? "text-rose-400" : "text-[#9a7a7a]"}`}>{item.price}</p>
                  <ul className="space-y-2 flex-1">
                    {item.items.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-[#7a5c5c]">
                        <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={400} className="text-center mt-10">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-10 py-5 rounded-full transition-transform hover:scale-105 shadow-lg shadow-rose-200">
                  今すぐ始める <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={openRegister} className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-10 py-5 rounded-full transition-transform hover:scale-105 shadow-lg shadow-rose-200">
                無料で始める <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PREPARE
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#fdf8f5]">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-[#9a7a7a] uppercase tracking-widest mb-4">Before You Start</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              まず、これだけ<br />用意してください。
            </h2>
            <p className="text-[#7a5c5c] text-base max-w-lg mx-auto">
              それだけで、5分後には証明書が手元に届きます。
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "スマートフォン",
                desc: "iPhoneでもAndroidでも対応。カメラが使えればOKです。",
                tag: "必須",
                tagColor: "bg-rose-50 border-rose-200 text-rose-500",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "身分証（1種類）",
                desc: "マイナンバーカード・運転免許証・パスポートのいずれか1枚。",
                tag: "必須",
                tagColor: "bg-rose-50 border-rose-200 text-rose-500",
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "約5分の時間",
                desc: "登録から証明書発行まで、最短5分で完了します。",
                tag: "必須",
                tagColor: "bg-rose-50 border-rose-200 text-rose-500",
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "パートナーのLINE/メール",
                desc: "招待リンクを送るために必要です。パートナーも同じ手順で登録します。",
                tag: "必須",
                tagColor: "bg-rose-50 border-rose-200 text-rose-500",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-rose-100 shadow-sm">
                  <div className="text-rose-400 shrink-0 mt-1">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-black text-[#2d1f1f] text-lg">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.tagColor}`}>{item.tag}</span>
                    </div>
                    <p className="text-[#7a5c5c] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={400}>
            <div className="rounded-3xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-8 text-center shadow-sm">
              <p className="text-[#7a5c5c] text-sm mb-2">用意できたら、このボタンを押してください</p>
              <p className="text-[#2d1f1f] font-bold text-lg mb-6">4ステップ・約5分で証明書が発行されます</p>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-12 py-6 rounded-full text-base transition-transform hover:scale-105 shadow-lg shadow-rose-200">
                    <Heart className="w-5 h-5 mr-2 fill-white" />
                    マイページへ進む
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={openRegister} className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-12 py-6 rounded-full text-base transition-transform hover:scale-105 shadow-lg shadow-rose-200">
                  <Heart className="w-5 h-5 mr-2 fill-white" />
                  無料で始める → 証明書を発行する
                </Button>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LIFESTYLE PHOTOS
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              証明が、日常を変える。
            </h2>
            <p className="text-[#7a5c5c] text-base max-w-xl mx-auto">
              「付き合ってる」が証明できると、二人の関係はもっと安心で、もっと深くなる。
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-4">
            <FadeIn delay={0}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group">
                <img src={CDN.lifestyle1} alt="桜の下で手をつなぐカップル" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1f1f]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm">桜の下で、永遠を誓う</p>
                  <p className="text-white/70 text-xs mt-1">交際1年・ランク「月」</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={120}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group">
                <img src={CDN.lifestyle2} alt="カフェで証明書を確認するカップル" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1f1f]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm">スマホで証明書を確認</p>
                  <p className="text-white/70 text-xs mt-1">いつでも・どこでも</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={240}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group">
                <img src={CDN.lifestyle3} alt="夜の銀座で手をつなぐカップル" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1f1f]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm">証明された愛は、強い</p>
                  <p className="text-white/70 text-xs mt-1">交際3年・ランク「炎」</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CHEATING PREVENTION
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#fdf8f5]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-widest mb-4">Trust & Safety</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              「本当に付き合ってる？」<br />
              <span className="text-[#9a7a7a]">その不安を、技術で解消する。</span>
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                color: "from-rose-50 to-pink-50",
                border: "border-rose-200",
                accent: "text-rose-400",
                title: "重複登録は不可能",
                body: "証明書を持っている間は、技術的に他の誰とも証明を結べません。もし相手が別の人と登録しようとすると、「この人はすでに登録済みです」と表示されます。",
                tag: "浮気防止",
              },
              {
                icon: <Hourglass className="w-6 h-6" />,
                color: "from-amber-50 to-orange-50",
                border: "border-amber-200",
                accent: "text-amber-500",
                title: "イエローアカウント制度",
                body: "一方が解消を申請しても、相手が同意しなければ「待機期間」が発生します。この間はイエローアカウントになり、新しい相手への登録ができません。嘘をついていないことが証明できます。",
                tag: "透明性",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                color: "from-green-50 to-emerald-50",
                border: "border-green-200",
                accent: "text-green-500",
                title: "円満解除は2ステップ",
                body: "二人が合意すれば、スムーズに解除できます。解除後はシングルステータスに戻り、新しい出会いに向けて再スタートできます。",
                tag: "円満解除",
              },
              {
                icon: <Users className="w-6 h-6" />,
                color: "from-blue-50 to-indigo-50",
                border: "border-blue-200",
                accent: "text-blue-400",
                title: "婚活中の独身証明",
                body: "婚活中の方は「独身証明書」をアップロードすることで「婚約中」ステータスを取得できます。既婚者が結婚相談所に登録したり、婚約しているふりをすることを技術的に防ぎます。",
                tag: "婚活支援",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className={`rounded-3xl p-7 bg-gradient-to-br ${item.color} border ${item.border} h-full shadow-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${item.accent}`}>{item.icon}</div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${item.border} ${item.accent} font-medium bg-white/60`}>
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2d1f1f] mb-3">{item.title}</h3>
                  <p className="text-[#7a5c5c] leading-relaxed text-sm">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          RANK SYSTEM
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-rose-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              交際が続くほど、<br />証明書が進化する。
            </h2>
            <p className="text-[#7a5c5c] text-base max-w-xl mx-auto">
              3日〜5年以上、13段階のランクで愛の深さを証明します。
            </p>
          </FadeIn>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {RANKS.map((rank, i) => (
              <FadeIn key={rank.days} delay={i * 80}>
                <div
                  className="rounded-2xl p-4 text-center border border-rose-100 hover:scale-105 transition-transform cursor-default bg-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${rank.color}22, white)` }}
                >
                  <div className="text-2xl mb-1">{rank.emoji}</div>
                  <div className="text-xs font-bold text-[#2d1f1f]">{rank.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PLANS TEASER
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#fdf8f5]">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <p className="text-sm font-semibold text-rose-400 uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-5xl font-black text-[#2d1f1f] mb-6" style={{ fontFamily: "'Noto Serif JP', serif" }}>シンプルな料金。</h2>
            <p className="text-[#7a5c5c] text-lg mb-12 max-w-xl mx-auto">
              お二人で月額換算 約250円から。<br />
              高校生は半額。婚約カップルは無料キャンペーン対象。
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                { label: "スタンダード", price: "¥3,000", unit: "/人・初回", sub: "年間更新 ¥2,000/人", color: "from-rose-50 to-pink-50", border: "border-rose-200" },
                { label: "高校生プラン", price: "¥500", unit: "/人・初回", sub: "学生証確認が必要", color: "from-purple-50 to-indigo-50", border: "border-purple-200" },
                { label: "婚約プラン", price: "無料*", unit: "SNSシェアで", sub: "*キャンペーン適用時", color: "from-amber-50 to-orange-50", border: "border-amber-200" },
              ].map((plan, i) => (
                <div key={i} className={`rounded-2xl p-6 bg-gradient-to-br ${plan.color} border ${plan.border} shadow-sm`}>
                  <div className="text-[#7a5c5c] text-sm mb-2">{plan.label}</div>
                  <div className="text-4xl font-black text-[#2d1f1f] mb-1">{plan.price}</div>
                  <div className="text-[#9a7a7a] text-xs mb-1">{plan.unit}</div>
                  <div className="text-[#9a7a7a] text-xs">{plan.sub}</div>
                </div>
              ))}
            </div>
            <Link href="/plans">
              <Button variant="outline" className="border-rose-200 text-rose-500 hover:bg-rose-50 rounded-full px-8 bg-white">
                すべての料金プランを見る <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SHARE
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="rounded-3xl overflow-hidden border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-10 md:p-14 shadow-sm">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] mb-4 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                  「付き合ってる」を、<br />シェアしよう。
                </h2>
                <p className="text-[#7a5c5c] text-base max-w-xl mx-auto">
                  証明書をSNSでシェアして、二人の関係をアピールできます。
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: "🔒", title: "名前は非公開でOK", desc: "相手の名前を非公開にできます。プライバシーを守りながら、シングルでないことだけを証明できます。" },
                  { icon: "✅", title: "シングルでないことの証明", desc: "相手がいないと証明書は発行されません。証明書を持っていること自体が「本当に付き合っている」証明です。" },
                  { icon: "🎁", title: "カップル特典を使う", desc: "証明書を提示することで、提携店舗での割引や特典が受けられます。映画・レストラン・アクセサリーショップなど。" },
                  { icon: "📅", title: "記念日リマインダー", desc: "100日・200日・1周年・2周年など、節目の記念日にプッシュ通知でお知らせします。" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white border border-rose-100 rounded-2xl shadow-sm">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-[#2d1f1f] text-sm mb-1">{item.title}</h4>
                      <p className="text-[#7a5c5c] text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3 PILLARS
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#fdf8f5]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#2d1f1f] leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              愛を守る、3つの仕組み。
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                color: "from-rose-50 to-pink-50",
                accent: "text-rose-400",
                border: "border-rose-200",
                title: "本人確認（eKYC）",
                body: "マイナンバーカード・運転免許証による厳格な本人確認。身元不明の相手とは証明を結べません。結婚詐欺を技術で防ぎます。\n\n※ eKYC = 身分証を使ったオンライン本人確認のことです。",
              },
              {
                icon: <Lock className="w-8 h-8" />,
                color: "from-purple-50 to-indigo-50",
                accent: "text-purple-400",
                border: "border-purple-200",
                title: "ブロックチェーン記録",
                body: "Polygonブロックチェーンに刻まれた証明は、誰にも改ざんできません。二人の合意が、永遠に記録されます。\n\n※ ブロックチェーン = 誰も書き換えられない分散型データ保存技術です。",
              },
              {
                icon: <Heart className="w-8 h-8" />,
                color: "from-amber-50 to-orange-50",
                accent: "text-amber-500",
                border: "border-amber-200",
                title: "重複防止システム",
                body: "グリーンステータス中は、技術的に他の誰とも証明を結べません。不倫・複数交際をシステムが防ぎます。",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className={`rounded-3xl p-8 bg-gradient-to-br ${item.color} border ${item.border} h-full shadow-sm`}>
                  <div className={`${item.accent} mb-6`}>{item.icon}</div>
                  <h3 className="text-2xl font-black text-[#2d1f1f] mb-4">{item.title}</h3>
                  <p className="text-[#7a5c5c] leading-relaxed whitespace-pre-line">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          GLOSSARY
      ═══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-[#9a7a7a] uppercase tracking-widest mb-4">Glossary</p>
            <h2 className="text-4xl font-black text-[#2d1f1f] mb-4" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              わかりにくい言葉を、<br />やさしく解説。
            </h2>
            <p className="text-[#7a5c5c] text-sm max-w-lg mx-auto">
              専門用語が多いと感じたら、ここで確認してください。
            </p>
          </FadeIn>
          <div className="space-y-3">
            {[
              {
                term: "本人確認（eKYC）",
                simple: "身分証を使ったオンライン本人確認",
                detail: "eKYCとは「電子的本人確認」の略です。マイナンバーカードや運転免許証を撮影することで、銀行口座開設などと同じ方法でオンラインで本人確認ができます。「KYC」という言葉は難しく聞こえますが、要は「あなたが本当にあなたであることを確認する手続き」です。",
              },
              {
                term: "ブロックチェーン記録",
                simple: "誰も書き換えられない、永久保存の記録技術",
                detail: "ブロックチェーンとは、データを複数の場所に分散して保存する技術です。一度記録されると誰も書き換えられないため、証明書の内容が永久に保証されます。仮想通貨（ビットコインなど）でも使われている技術です。",
              },
              {
                term: "グリーンステータス",
                simple: "正常な交際中の状態",
                detail: "証明書が有効で、二人が正常に交際中であることを示すステータスです。グリーン中は他の誰とも証明を結べません。",
              },
              {
                term: "イエローアカウント",
                simple: "解消申請中の待機状態",
                detail: "一方が解消を申請したが、相手がまだ同意していない状態です。この期間は新しい相手への登録ができません。新しい恋人候補に「あと何日かで登録できる」と説明でき、相手が嘘をついていないことが確認できます。",
              },
              {
                term: "独身証明書",
                simple: "婚姻していないことを証明する公的書類",
                detail: "市区町村の役所で発行できる書類です。「結婚していないこと」を公的に証明します。本籍地の市区町村窓口またはコンビニのマルチコピー機で取得できます（手数料：300〜450円程度）。婚活中の方が「婚約中」ステータスを取得するために必要です。",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <details className="group rounded-2xl bg-[#fdf8f5] border border-rose-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-rose-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold text-[#2d1f1f] text-sm">{item.term}</span>
                        <span className="text-[#9a7a7a] text-xs ml-3">= {item.simple}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-rose-300 group-open:rotate-180 transition-transform shrink-0" />
                  </summary>
                  <div className="px-5 pb-5 pt-0">
                    <div className="pt-4 border-t border-rose-100">
                      <p className="text-[#7a5c5c] text-sm leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BUSINESS BANNER
      ═══════════════════════════════════════ */}
      <section className="py-16 px-6 bg-[#fdf8f5]">
        <FadeIn>
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="flex-1">
              <div className="text-xs font-semibold text-rose-300 uppercase tracking-widest mb-2">For Business</div>
              <h3 className="text-2xl font-black text-[#2d1f1f] mb-2">パートナーシップ証明を、ビジネスに。</h3>
              <p className="text-[#7a5c5c] text-sm">結婚相談所・ブライダル事業者向けのOEM/ODMプランをご用意しています。</p>
            </div>
            <Link href="/for-business">
              <Button className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold rounded-full px-8 shrink-0 shadow-md shadow-rose-200">
                事業者様はこちら <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(251,207,232,0.5),transparent)]" />
        <FadeIn className="relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-black text-[#2d1f1f] mb-6 leading-tight" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            今日から、<br />
            <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
              証明しよう。
            </span>
          </h2>
          <p className="text-[#7a5c5c] text-lg mb-12">
            スマホ1台・身分証1枚・5分で証明書が手元に届きます。
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-12 py-7 rounded-full text-lg transition-transform hover:scale-105 shadow-xl shadow-rose-200">
                マイページへ <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button size="lg" onClick={openRegister} className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold px-12 py-7 rounded-full text-lg transition-transform hover:scale-105 shadow-xl shadow-rose-200">
                無料で始める <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={openLogin} className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 font-bold px-12 py-7 rounded-full text-lg transition-transform hover:scale-105">
                ログイン
              </Button>
            </div>
          )}
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="bg-[#2d1f1f] border-t border-rose-900/30 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                <span className="text-white font-bold text-lg">恋人証明</span>
              </div>
              <p className="text-white/40 text-sm max-w-xs">
                ブロックチェーンとeKYCで、<br />すべての愛を守るプラットフォーム。
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div>
                <div className="text-white/40 font-semibold mb-3 uppercase text-xs tracking-wider">サービス</div>
                <ul className="space-y-2">
                  <li><Link href="/plans" className="text-white/30 hover:text-white transition-colors">料金プラン</Link></li>
                  <li><Link href="/verify" className="text-white/30 hover:text-white transition-colors">証明書確認</Link></li>
                  <li><Link href="/affiliates" className="text-white/30 hover:text-white transition-colors">特典・提携</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-white/40 font-semibold mb-3 uppercase text-xs tracking-wider">ストーリー</div>
                <ul className="space-y-2">
                  <li><Link href="/why" className="text-white/30 hover:text-white transition-colors">なぜ生まれたか</Link></li>
                  <li><Link href="/for-business" className="text-white/30 hover:text-white transition-colors">事業者向け</Link></li>
                  <li><Link href="/referral" className="text-white/30 hover:text-white transition-colors">紹介プログラム</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-white/40 font-semibold mb-3 uppercase text-xs tracking-wider">サポート</div>
                <ul className="space-y-2">
                  <li><a href="mailto:support@loverschain.jp" className="text-white/30 hover:text-white transition-colors">お問い合わせ</a></li>
                  <li><Link href="/plans#faq" className="text-white/30 hover:text-white transition-colors">よくある質問</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-white/40 font-semibold mb-3 uppercase text-xs tracking-wider">法的情報</div>
                <ul className="space-y-2">
                  <li><Link href="/legal/privacy" className="text-white/30 hover:text-white transition-colors">プライバシーポリシー</Link></li>
                  <li><Link href="/legal/terms" className="text-white/30 hover:text-white transition-colors">利用規約</Link></li>
                  <li><Link href="/legal/tokusho" className="text-white/30 hover:text-white transition-colors">特定商取引法に基づく表示</Link></li>
                </ul>
              </div>
            </div>
          </div>
          {/* 支払い方法ロゴ */}
          <div className="border-t border-white/10 pt-6 mb-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-white/30 text-xs">支払い方法:</span>
              {/* Visa */}
              <div className="bg-white/10 rounded px-2 py-1 flex items-center">
                <svg viewBox="0 0 48 16" className="h-4 w-auto" fill="none">
                  <text x="0" y="13" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">ⓋΙЅА</text>
                </svg>
                <span className="text-white/60 text-xs font-bold tracking-widest">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="bg-white/10 rounded px-2 py-1 flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-red-500 opacity-80"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-400 opacity-80 -ml-2"></div>
                <span className="text-white/60 text-xs ml-1">Mastercard</span>
              </div>
              {/* JCB */}
              <div className="bg-white/10 rounded px-2 py-1">
                <span className="text-white/60 text-xs font-bold">JCB</span>
              </div>
              {/* AMEX */}
              <div className="bg-white/10 rounded px-2 py-1">
                <span className="text-white/60 text-xs font-bold">AMEX</span>
              </div>
              {/* PayPay */}
              <div className="bg-white/10 rounded px-2 py-1 flex items-center gap-1">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/paypay-logo_2b9bd101.png" alt="PayPay" className="h-4 w-auto object-contain" />
                <span className="text-white/60 text-xs">PayPay</span>
              </div>
              {/* 銀行振込 */}
              <div className="bg-white/10 rounded px-2 py-1">
                <span className="text-white/60 text-xs">🏦 銀行振込</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs">© 2025 恋人証明 / loverschain.jp. All rights reserved.</p>
            <div className="flex items-center gap-4 text-white/20 text-xs">
              <span>🔗 Powered by Polygon Blockchain</span>
              <span>🫋 eKYC by Stripe Identity</span>
              <span>🔒 Secured by Stripe</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 認証モーダル */}
      <AuthModal
        open={authModal.open}
        mode={authModal.mode}
        onClose={() => setAuthModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
