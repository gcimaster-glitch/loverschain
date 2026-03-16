import { usePageTitle } from "@/hooks/usePageTitle";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Building2,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Heart,
  Star,
  Globe,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ForBusiness() {
  usePageTitle("法人向け・結婚相談所OEM - 恋人証明ビジネスプラン");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const notifyOwner = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("資料請求を受け付けました。担当者よりご連絡いたします。");
    },
    onError: () => toast.error("送信に失敗しました。再度お試しください。"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.email) {
      toast.error("会社名とメールアドレスは必須です");
      return;
    }
    notifyOwner.mutate({
      title: `【法人資料請求】${form.companyName}`,
      content: `会社名: ${form.companyName}\n担当者: ${form.contactName}\nメール: ${form.email}\n電話: ${form.phone}\nメッセージ: ${form.message}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container relative max-w-4xl mx-auto text-center">
          <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm px-4 py-1.5">
            結婚相談所・ブライダル事業者様へ
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            恋人証明を、
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              あなたのサービスに。
            </span>
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            恋人証明のプラットフォームをOEM/ODM提供します。
            あなたのブランドで、成立カップルの関係を守り、
            トラブルを未然に防ぐ付加価値サービスを展開できます。
          </p>
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90 font-bold px-8 py-6 text-base rounded-full"
            onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            無料で資料請求する
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* 課題セクション */}
      <section className="py-24 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            結婚相談所が抱える「複数登録問題」
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            複数の結婚相談所に同時登録し、複数の異性と同時にお付き合いするトラブルは業界全体の課題です。
            恋人証明は、この問題を技術で解決します。
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-8 h-8 text-red-500" />,
                title: "複数登録トラブル",
                desc: "同一人物が複数の相談所に登録し、複数の異性と同時交際するケースが後を絶ちません。",
              },
              {
                icon: <Lock className="w-8 h-8 text-amber-500" />,
                title: "誠実性の証明困難",
                desc: "口頭での約束だけでは、交際の誠実さを客観的に証明する手段がありませんでした。",
              },
              {
                icon: <Shield className="w-8 h-8 text-blue-500" />,
                title: "成婚後のトラブル",
                desc: "婚約期間中の浮気や、成婚直前の関係破綻が相談所の信頼を傷つけます。",
              },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ソリューション */}
      <section className="py-24">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            恋人証明OEMで解決できること
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            成立カップルに「恋人証明」を誓約条件として導入するだけで、業界全体の信頼性が向上します。
          </p>
          <div className="space-y-4">
            {[
              "eKYCによる本人確認で、なりすましや虚偽登録を排除",
              "ブロックチェーン証明で、交際関係を改ざん不能な形で記録",
              "「グリーンステータス」中は新たな証明を結べない仕組みで複数交際を技術的にブロック",
              "別れた場合は解消申請で証明を解除。次のステップへ進める",
              "あなたのブランド名・ロゴで提供できるホワイトラベル対応",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金モデル */}
      <section className="py-24 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            収益モデル
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            成立カップル1組あたりの初回発行料金から、代理店様に50%の手数料をお支払いします。
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/30 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <Heart className="w-10 h-10 text-primary mx-auto fill-primary" />
                <h3 className="text-xl font-bold text-foreground">初回発行</h3>
                <div className="text-4xl font-bold text-foreground">
                  ¥30,000
                  <span className="text-base font-normal text-muted-foreground"> / カップル</span>
                </div>
                <p className="text-sm text-muted-foreground">（¥15,000 × 2名）</p>
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <p className="text-sm font-bold text-primary">代理店様の収益</p>
                  <p className="text-2xl font-bold text-primary">¥15,000 / カップル</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <TrendingUp className="w-10 h-10 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-foreground">年次更新</h3>
                <div className="text-4xl font-bold text-foreground">
                  継続収益
                  <span className="text-base font-normal text-muted-foreground"> / 年</span>
                </div>
                <p className="text-sm text-muted-foreground">年間更新のたびに手数料が発生</p>
                <div className="p-4 bg-green-50 rounded-2xl">
                  <p className="text-sm font-bold text-green-700">ストック型ビジネスモデル</p>
                  <p className="text-sm text-green-600 mt-1">カップル数が増えるほど安定収益に</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-24">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            OEMパートナーの特典
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Globe className="w-6 h-6 text-primary" />, title: "ホワイトラベル対応", desc: "貴社のブランド名・ロゴ・カラーで証明書を発行。ユーザーには貴社サービスとして見えます。" },
              { icon: <Shield className="w-6 h-6 text-primary" />, title: "セキュリティ・法的対応", desc: "eKYC・ブロックチェーン・個人情報保護法対応は恋人証明側で完全対応。導入コストゼロ。" },
              { icon: <Star className="w-6 h-6 text-primary" />, title: "専任サポート", desc: "導入から運用まで専任担当者がサポート。API連携・システム統合も柔軟に対応します。" },
              { icon: <Building2 className="w-6 h-6 text-primary" />, title: "業界横断ネットワーク", desc: "他の提携相談所との連携により、複数登録チェックが業界横断で機能します。" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 資料請求フォーム */}
      <section id="contact-form" className="py-24 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">無料資料請求・お問い合わせ</h2>
          <p className="text-center text-white/70 mb-10">
            詳細な料金体系・導入事例・契約条件をまとめた資料を無料でお送りします。
            担当者より3営業日以内にご連絡いたします。
          </p>

          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold">資料請求を受け付けました</h3>
              <p className="text-white/70">担当者より3営業日以内にご連絡いたします。</p>
              <Link href="/">
                <Button variant="outline" className="mt-4 border-white/30 text-white hover:bg-white/10">
                  トップページへ戻る
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-1 block">会社名・相談所名 *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
                    placeholder="株式会社〇〇結婚相談所"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">担当者名</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
                    placeholder="山田 太郎"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-1 block">メールアドレス *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">電話番号</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
                    placeholder="03-0000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1 block">ご質問・ご要望</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 resize-none"
                  placeholder="導入規模・現在の課題・ご質問などをご記入ください"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={notifyOwner.isPending}
                className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold py-6 rounded-xl text-base"
              >
                {notifyOwner.isPending ? "送信中..." : "無料で資料請求する"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-xs text-white/40 text-center">
                送信いただいた情報は資料送付・お問い合わせ対応のみに使用します。
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
