import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { ArrowLeft, Heart, Trophy, Star, Calendar, RefreshCw, Package, Share2 } from "lucide-react";
import { RANKS, getRankDef } from "../../../shared/ranks";
import type { RankKey } from "../../../shared/ranks";

const RANK_TIER_LABELS: Record<string, string> = {
  bronze: "ブロンズ",
  silver_3d: "シルバー",
  silver_1m: "シルバー",
  silver_3m: "シルバー",
  silver_6m: "シルバー",
  gold_10m: "ゴールド",
  gold_12m: "ゴールド",
  gold_15m: "ゴールド",
  platinum_20m: "プラチナ",
  platinum_24m: "プラチナ",
  diamond_30m: "ダイヤモンド",
  diamond_36m: "ダイヤモンド",
  legend_40m: "レジェンド",
};

export default function RankCertificate() {
  const params = useParams<{ id: string }>();
  const partnershipId = parseInt(params.id ?? "0");
  const { isAuthenticated } = useAuth();
  usePageTitle("ランク証明書 - 交際の節目を祝う");

  const { data, isLoading } = trpc.payment.rankInfo.useQuery(
    { partnershipId },
    { enabled: isAuthenticated && partnershipId > 0 }
  );

  const createRenewalCheckout = trpc.payment.createRenewalCheckout.useMutation({
    onSuccess: (d) => {
      toast.info("Stripeの決済ページに移動します");
      window.open(d.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const submitSnsShare = trpc.payment.submitSnsShare.useMutation({
    onSuccess: (d) => toast.success(d.message),
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Link href="/login"><Button>ログイン</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-400">読み込み中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">パートナーシップが見つかりません</p>
          <Link href="/dashboard"><Button>マイページへ</Button></Link>
        </div>
      </div>
    );
  }

  const { currentRank, totalDays, nextRank, daysToNextRank, renewalCount, renewalDueAt } = data;
  const rankIndex = RANKS.findIndex((r) => r.key === currentRank.key);
  const progressToNext = nextRank
    ? Math.round(((totalDays - currentRank.minDays) / (nextRank.minDays - currentRank.minDays)) * 100)
    : 100;

  const tierLabel = RANK_TIER_LABELS[currentRank.key] ?? currentRank.label;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              マイページへ
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="font-bold text-rose-600">ランク証明書</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Certificate Card */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl mb-8"
          style={{
            background: `linear-gradient(135deg, ${currentRank.gradientFrom}, ${currentRank.gradientTo})`,
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/2" />

          <div className="relative p-8 md:p-12 text-white">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-white/70 text-sm uppercase tracking-widest mb-1">恋人証明書</p>
                <h1 className="text-4xl md:text-5xl font-black mb-2">
                  {currentRank.emoji} {tierLabel}
                </h1>
                <p className="text-white/80 text-lg">{currentRank.label}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black">{totalDays}</div>
                <div className="text-white/70 text-sm">交際日数</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div
                className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: currentRank.badgeColor, color: currentRank.badgeText }}
              >
                {currentRank.description}
              </div>
              {renewalCount > 0 && (
                <Badge className="bg-white/20 text-white border-white/30">
                  {renewalCount}回更新済み
                </Badge>
              )}
            </div>

            <div className="text-sm text-white/60">
              証明書ID: KS-{String(partnershipId).padStart(8, "0")}
            </div>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-gray-800">次のランクまで</span>
                </div>
                <span className="text-sm text-gray-500">
                  あと <strong className="text-rose-600">{daysToNextRank}日</strong>
                </span>
              </div>
              <Progress value={progressToNext} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{currentRank.emoji} {currentRank.label}</span>
                <span>{nextRank.emoji} {nextRank.label}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rank Timeline */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              ランクロードマップ
            </h2>
            <div className="space-y-2">
              {RANKS.map((rank, i) => {
                const isUnlocked = totalDays >= rank.minDays;
                const isCurrent = rank.key === currentRank.key;
                return (
                  <div
                    key={rank.key}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-rose-50 border border-rose-200"
                        : isUnlocked
                        ? "bg-green-50 border border-green-100"
                        : "bg-gray-50 border border-gray-100 opacity-60"
                    }`}
                  >
                    <div className="text-2xl">{rank.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isCurrent ? "text-rose-700" : isUnlocked ? "text-green-700" : "text-gray-500"}`}>
                          {rank.label}
                        </span>
                        {isCurrent && <Badge className="bg-rose-500 text-white text-xs">現在</Badge>}
                        {isUnlocked && !isCurrent && <Badge className="bg-green-500 text-white text-xs">達成</Badge>}
                      </div>
                      <div className="text-xs text-gray-500">{rank.description} · {rank.minDays}日〜</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 年間更新 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">年間更新</h3>
              <p className="text-sm text-gray-500 mb-3">
                {renewalDueAt
                  ? `更新期限: ${new Date(renewalDueAt).toLocaleDateString("ja-JP")}`
                  : "更新で証明書を継続"}
              </p>
              <Button
                onClick={() => createRenewalCheckout.mutate({ partnershipId })}
                disabled={createRenewalCheckout.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                ¥2,000で更新
              </Button>
            </CardContent>
          </Card>

          {/* 証明書郵送 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5 text-center">
              <Package className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">証明書を注文</h3>
              <p className="text-sm text-gray-500 mb-3">印刷・額装・NFTで手元に</p>
              <Link href={`/certificate/${partnershipId}/order`}>
                <Button variant="outline" className="w-full border-purple-300 text-purple-700" size="sm">
                  注文ページへ
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* SNSシェア */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5 text-center">
              <Share2 className="w-8 h-8 text-pink-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">SNSシェアキャンペーン</h3>
              <p className="text-sm text-gray-500 mb-3">シェアで証明書が無料に</p>
              <Button
                onClick={() => {
                  const url = `${window.location.origin}/verify/${partnershipId}`;
                  navigator.clipboard.writeText(url).then(() => toast.success("URLをコピーしました"));
                }}
                variant="outline"
                className="w-full border-pink-300 text-pink-700"
                size="sm"
              >
                URLをコピー
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SNS Share Submit */}
        <Card className="mt-6 border-0 shadow-md bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Share2 className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1">SNSシェアで証明書無料キャンペーン 🎉</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Instagram・TikTok・Facebookで証明書をシェアして申請すると、次回の証明書発行が無料になります。
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["instagram", "tiktok", "facebook", "twitter"] as const).map((platform) => (
                    <Button
                      key={platform}
                      size="sm"
                      variant="outline"
                      className="capitalize"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/verify/${partnershipId}`;
                        const text = `私たちの恋人証明書 🩷 #恋人証明 #koibitoshomei`;
                        const urls: Record<string, string> = {
                          instagram: `https://www.instagram.com/`,
                          tiktok: `https://www.tiktok.com/`,
                          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
                        };
                        window.open(urls[platform], "_blank");
                      }}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
