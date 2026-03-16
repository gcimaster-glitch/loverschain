import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";

const MANGA_IMAGES = {
  scene1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/manga_scene1_cce55669.png",
  scene2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/manga_scene2_d1c03b8a.png",
  scene3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/manga_scene3_824f0d6e.png",
  scene4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/Hwkz9ewQw48rtHqsLPREaH/manga_scene4_cef75856.png",
};

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div ref={ref} className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}>
      {children}
    </div>
  );
}

// 漫画コマコンポーネント
function MangaPanel({
  image, title, caption, speechBubble, align = "left", bgColor = "bg-white"
}: {
  image: string;
  title: string;
  caption: string;
  speechBubble?: string;
  align?: "left" | "right";
  bgColor?: string;
}) {
  return (
    <FadeSection>
      <div className={`grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${bgColor}`}>
        {/* 画像 */}
        <div className={`relative ${align === "right" ? "md:order-2" : ""}`}>
          <img
            src={image}
            alt={title}
            className="w-full h-72 md:h-full object-cover"
          />
          {/* 漫画風オーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* テキスト */}
        <div className={`p-8 md:p-12 flex flex-col justify-center bg-white ${align === "right" ? "md:order-1" : ""}`}>
          {speechBubble && (
            <div className="relative mb-6 inline-block">
              <div className="bg-yellow-50 border-2 border-gray-800 rounded-2xl px-5 py-3 text-gray-800 font-bold text-lg leading-snug max-w-xs">
                {speechBubble}
              </div>
              {/* 吹き出しの尻尾 */}
              <div className={`absolute bottom-[-12px] ${align === "left" ? "left-8" : "right-8"} w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-gray-800`} />
            </div>
          )}
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-tight">{title}</h3>
          <p className="text-gray-600 leading-relaxed text-base">{caption}</p>
        </div>
      </div>
    </FadeSection>
  );
}

// 統計カード
function StatCard({ number, label, sub }: { number: string; label: string; sub: string }) {
  return (
    <FadeSection>
      <div className="text-center p-6 rounded-2xl bg-red-50 border border-red-100">
        <div className="text-4xl font-black text-red-600 mb-2">{number}</div>
        <div className="font-bold text-gray-800 mb-1">{label}</div>
        <div className="text-sm text-gray-500">{sub}</div>
      </div>
    </FadeSection>
  );
}

export default function Why() {
  const { isAuthenticated } = useAuth();
  usePageTitle("なぜ恋人証明が生まれたのか - 社会問題と解決策");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* ヒーロー */}
      <section className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(180,60,120,0.2),transparent)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-sm text-white/70 mb-8">
            なぜ恋人証明が生まれたのか
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            愛を守るために、
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              技術が必要になった。
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            日本で毎年起きている恋愛にまつわる社会問題。
            それを解決するために、恋人証明は生まれました。
          </p>
        </div>
      </section>

      {/* 社会問題の数字 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <h2 className="text-3xl font-black text-gray-900 text-center mb-4">
              これが、日本の現実です。
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
              「付き合ってる」という言葉だけでは守れない、たくさんの人たちがいます。
            </p>
          </FadeSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard number="年間数千件" label="結婚詐欺被害" sub="身元不明の相手による詐欺" />
            <StatCard number="約4割" label="既婚者の不倫経験率" sub="複数交際トラブルの温床" />
            <StatCard number="年間6,000件超" label="不同意性交等罪の認知件数" sub="2023年改正後の統計" />
            <StatCard number="LGBT人口" label="約10人に1人" sub="法的保護が不十分な現状" />
          </div>
        </div>
      </section>

      {/* 漫画ストーリー */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <FadeSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100 text-pink-700 text-sm font-semibold mb-4">
                📖 恋人証明が解決する4つのストーリー
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                あなたの周りにも、
                <br />
                こんなことが起きていませんか？
              </h2>
            </div>
          </FadeSection>

          {/* ストーリー1: 結婚詐欺 */}
          <div className="space-y-2">
            <FadeSection>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white font-black flex items-center justify-center text-sm">1</div>
                <h3 className="text-xl font-black text-gray-800">結婚詐欺から守る</h3>
              </div>
            </FadeSection>
            <MangaPanel
              image={MANGA_IMAGES.scene1}
              title="「本当に独身なの？」という不安"
              caption="マッチングアプリで出会った相手。プロフィールは独身、会社員、35歳。でも本当のことを、どうやって確認すればいいの？恋人証明なら、eKYCで本人確認済みの相手とだけ証明を結べます。身元不明の相手に騙されるリスクをゼロにします。"
              speechBubble="「俺、独身だよ。信じてくれる？」"
              align="left"
            />
          </div>

          {/* ストーリー2: 不倫防止 */}
          <div className="space-y-2">
            <FadeSection>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-sm">2</div>
                <h3 className="text-xl font-black text-gray-800">不倫・複数交際を防ぐ</h3>
              </div>
            </FadeSection>
            <MangaPanel
              image={MANGA_IMAGES.scene2}
              title="「他に誰かいるんじゃないか」という疑念"
              caption="付き合って半年。でも彼の行動が怪しい。別の女性と連絡を取っているのかも。恋人証明のグリーンステータス中は、技術的に他の誰とも証明を結ぶことができません。システムが誠実さを担保します。"
              speechBubble="「あなただけだよ」"
              align="right"
              bgColor="bg-orange-50"
            />
          </div>

          {/* ストーリー3: 不同意性交防止 */}
          <div className="space-y-2">
            <FadeSection>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-sm">3</div>
                <h3 className="text-xl font-black text-gray-800">合意を証明する</h3>
              </div>
            </FadeSection>
            <MangaPanel
              image={MANGA_IMAGES.scene3}
              title="「同意があった」という証明"
              caption="交際の合意をブロックチェーンに記録することで、二人の関係が証明されます。万が一のトラブル時にも、改ざん不能な記録が事実を証明します。証明書は二人のスマートフォンでいつでも確認できます。"
              speechBubble="「ちゃんと証明できる関係でいたい」"
              align="left"
              bgColor="bg-blue-50"
            />
          </div>

          {/* ストーリー4: ジェンダー */}
          <div className="space-y-2">
            <FadeSection>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-sm">4</div>
                <h3 className="text-xl font-black text-gray-800">すべての愛を平等に</h3>
              </div>
            </FadeSection>
            <MangaPanel
              image={MANGA_IMAGES.scene4}
              title="法律が追いつかない愛のかたち"
              caption="同性カップル、トランスジェンダーのカップル。法律はまだ追いついていないけれど、二人の愛は本物です。恋人証明は性別・性的指向に関わらず、すべてのカップルが平等に利用できます。"
              speechBubble="「私たちの愛も、証明したい」"
              align="right"
              bgColor="bg-purple-50"
            />
          </div>
        </div>
      </section>

      {/* 解決策の提示 */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <FadeSection>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              だから、
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                恋人証明が生まれた。
              </span>
            </h2>
            <p className="text-white/60 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              婚姻届が夫婦の関係を公的に証明するように、
              恋人証明は交際関係を私的に証明します。
              eKYCによる本人確認とブロックチェーンによる改ざん不能な記録が、
              すべての人の愛を守ります。
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: "🪪", title: "eKYC本人確認", desc: "身元不明の相手とは証明を結べない" },
                { icon: "🔗", title: "ブロックチェーン記録", desc: "改ざん不能な証明書が永遠に残る" },
                { icon: "🛡️", title: "重複防止システム", desc: "グリーン中は他の証明を結べない" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-10 py-6 rounded-full">
                    マイページへ <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-10 py-6 rounded-full">
                    無料で始める <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
              <Link href="/">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 rounded-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> TOPに戻る
                </Button>
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>
    </div>
  );
}
