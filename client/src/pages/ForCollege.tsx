import { CategoryLP } from "./ForCategory";

export default function ForCollege() {
  return (
    <CategoryLP
      config={{
        slug: "college",
        emoji: "🎓",
        title: "大学生カップルへ",
        subtitle: "本物の恋愛を、証明しよう。",
        tagline: "大学生・20代カップル向け",
        heroDesc:
          "マッチングアプリが溢れる時代だからこそ、本物の誠実さが輝く。eKYCで身元を確認し、二人の関係をブロックチェーンに記録しましょう。",
        accentColor: "from-violet-500 to-purple-600",
        borderColor: "border-violet-500/30",
        bgColor: "from-violet-500/20 to-purple-500/10",
        benefits: [
          {
            icon: "🎯",
            title: "マッチングアプリの嘘を防ぐ",
            desc: "「彼女いない」と言いながらマッチングアプリを使う人を技術的に防止。証明書が誠実さの証になります。",
          },
          {
            icon: "🏆",
            title: "就活・社会人になっても続く",
            desc: "交際期間が長くなるほど証明書のランクが進化。大学時代から続く関係の重みを証明できます。",
          },
          {
            icon: "🔗",
            title: "SNSでシェアできる",
            desc: "証明書のURLをSNSでシェア。二人の関係を世界に宣言できます。",
          },
        ],
        faqs: [
          {
            q: "マッチングアプリと恋人証明の違いは？",
            a: "マッチングアプリは出会いのツールです。恋人証明は交際が始まった後、その関係の誠実さを証明するサービスです。",
          },
          {
            q: "遠距離恋愛でも使えますか？",
            a: "はい。オンラインで完結するため、遠距離カップルにも最適です。",
          },
          {
            q: "証明書を見せれば浮気防止になりますか？",
            a: "証明書があることで「他に交際相手がいない」ことを技術的に証明できます。重複証明は技術的に不可能です。",
          },
        ],
        cta: "本物の恋愛を、証明しよう。",
      }}
    />
  );
}
