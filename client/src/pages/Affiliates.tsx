import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Heart, MapPin, ExternalLink, Tag, Film, UtensilsCrossed, Gem, Music, Hotel, Plane } from "lucide-react";

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  movie: { label: "映画館", icon: <Film className="w-4 h-4" />, color: "bg-red-100 text-red-700" },
  restaurant: { label: "レストラン", icon: <UtensilsCrossed className="w-4 h-4" />, color: "bg-orange-100 text-orange-700" },
  jewelry: { label: "ジュエリー", icon: <Gem className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
  event: { label: "イベント", icon: <Music className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  hotel: { label: "ホテル", icon: <Hotel className="w-4 h-4" />, color: "bg-teal-100 text-teal-700" },
  travel: { label: "旅行", icon: <Plane className="w-4 h-4" />, color: "bg-sky-100 text-sky-700" },
  other: { label: "その他", icon: <Tag className="w-4 h-4" />, color: "bg-gray-100 text-gray-700" },
};

// Sample data for display when no DB data
const SAMPLE_PARTNERS = [
  { id: 1, name: "TOHOシネマズ", category: "movie", description: "全国のTOHOシネマズでご利用いただけます", discountDescription: "映画チケット2枚で10%割引", discountCode: "KOIBITO10", websiteUrl: "https://tohotheater.jp", isActive: true, sortOrder: 1 },
  { id: 2, name: "レストランサンプル", category: "restaurant", description: "記念日ディナーにおすすめ", discountDescription: "コース料理15%割引", discountCode: "LOVE15", websiteUrl: "#", isActive: true, sortOrder: 2 },
  { id: 3, name: "ジュエリーサンプル", category: "jewelry", description: "ペアリング・ネックレスが特別価格", discountDescription: "ペアアクセサリー20%割引", discountCode: "PAIR20", websiteUrl: "#", isActive: true, sortOrder: 3 },
  { id: 4, name: "イベントサンプル", category: "event", description: "カップル向けイベントを特別価格で", discountDescription: "チケット代10%割引", discountCode: "EVENT10", websiteUrl: "#", isActive: true, sortOrder: 4 },
];

export default function Affiliates() {
  const { isAuthenticated } = useAuth();
  usePageTitle("タイアップ特典 - 恋人証明で受けられる優待");
  const { data } = trpc.payment.affiliateList.useQuery();

  const partners = (data?.partners && data.partners.length > 0) ? data.partners : SAMPLE_PARTNERS;

  const categories = Array.from(new Set(partners.map((p) => p.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              トップへ
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="font-bold text-rose-600">タイアップ特典</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4 fill-rose-500" />
            恋人証明提示で特典適用
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">タイアップ特典</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            恋人証明書をご提示いただくと、提携店舗・サービスで特別割引をご利用いただけます。
            {!isAuthenticated && (
              <span className="block mt-2 text-rose-600 font-medium">
                ※割引コードの閲覧にはログインが必要です
              </span>
            )}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => {
            const catInfo = CATEGORY_LABELS[cat];
            return (
              <Badge
                key={cat}
                className={`${catInfo?.color ?? "bg-gray-100 text-gray-700"} cursor-pointer px-3 py-1.5 text-sm`}
              >
                <span className="flex items-center gap-1.5">
                  {catInfo?.icon}
                  {catInfo?.label ?? cat}
                </span>
              </Badge>
            );
          })}
        </div>

        {/* Partner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {partners.map((partner) => {
            const catInfo = CATEGORY_LABELS[partner.category];
            return (
              <Card key={partner.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-rose-400 to-pink-500" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{partner.name}</h3>
                      <Badge className={`${catInfo?.color ?? "bg-gray-100"} text-xs mt-1`}>
                        <span className="flex items-center gap-1">
                          {catInfo?.icon}
                          {catInfo?.label ?? partner.category}
                        </span>
                      </Badge>
                    </div>
                    {partner.websiteUrl && partner.websiteUrl !== "#" && (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {partner.description && (
                    <p className="text-sm text-gray-600 mb-4">{partner.description}</p>
                  )}

                  <div className="bg-rose-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-1">
                      <Tag className="w-4 h-4" />
                      特典内容
                    </div>
                    <p className="text-rose-800 font-bold">{partner.discountDescription}</p>
                  </div>

                  {partner.discountCode && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center">
                      {isAuthenticated ? (
                        <>
                          <p className="text-xs text-gray-500 mb-1">割引コード</p>
                          <p className="font-mono font-bold text-gray-800 text-lg tracking-widest">
                            {partner.discountCode}
                          </p>
                        </>
                      ) : (
                        <Link href="/login">
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700">
                            ログインして割引コードを見る
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA for businesses */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">タイアップのご提案</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            恋人証明のユーザーに向けて特典を提供しませんか？
            映画館・レストラン・ジュエリーショップ・ホテルなど、カップル向けビジネスのご担当者様はお気軽にお問い合わせください。
          </p>
          <a href="mailto:partner@koibito-shomei.jp">
            <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 font-bold px-8">
              タイアップのお問い合わせ
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
