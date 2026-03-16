import { CategoryLP } from "./ForCategory";

export default function ForHighschool() {
  return (
    <CategoryLP
      config={{
        slug: "highschool",
        emoji: "🌸",
        title: "高校生カップルへ",
        subtitle: "青春の恋を、証明しよう。",
        tagline: "高校生・10代カップル向け",
        heroDesc:
          "初めての恋愛だからこそ、誠実に。本人確認で「本物の交際」を証明して、二人の青春をブロックチェーンに刻みましょう。",
        accentColor: "from-rose-400 to-pink-500",
        borderColor: "border-rose-400/30",
        bgColor: "from-rose-500/20 to-pink-500/10",
        benefits: [
          {
            icon: "🔒",
            title: "不誠実な交際を防ぐ",
            desc: "「付き合ってる」と言いながら他にも交際している人を技術的に防止。本物の誠実さを証明できます。",
          },
          {
            icon: "📜",
            title: "青春の記念に",
            desc: "交際期間が長くなるほど証明書のランクが上がります。二人の歩みが証明書に刻まれていきます。",
          },
          {
            icon: "💌",
            title: "LINEで簡単招待",
            desc: "パートナーへの招待はLINEで送るだけ。難しい操作は一切ありません。",
          },
        ],
        faqs: [
          {
            q: "未成年でも使えますか？",
            a: "18歳未満の方は保護者の同意が必要です。本人確認の際に保護者の確認書類も提出いただきます。",
          },
          {
            q: "学校に知られますか？",
            a: "いいえ。恋人証明は個人のサービスであり、学校や保護者に通知されることはありません。",
          },
          {
            q: "別れたらどうなりますか？",
            a: "二人の合意または一方からの申請で証明を解消できます。解消後は新しいパートナーと証明を結べます。",
          },
        ],
        cta: "青春の恋を、本物にしよう。",
      }}
    />
  );
}
