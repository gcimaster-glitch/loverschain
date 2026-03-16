import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Heart, Users, Copy, Gift, CheckCircle2, Coins } from "lucide-react";
import { REFERRAL_REWARD_COINS, COIN_TO_YEN } from "../../../shared/ranks";
import { getLoginUrl } from "@/const";

export default function Referral() {
  const { user, isAuthenticated } = useAuth();
  usePageTitle("紹介コード - 友達に恋人証明を紹介する");

  const getOrCreateCode = trpc.payment.getOrCreateReferralCode.useMutation({
    onSuccess: () => {
      toast.success("紹介コードを発行しました");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: historyData } = trpc.payment.referralHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: coinData } = trpc.payment.coinBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">紹介システムを利用するにはログインが必要です</p>
          <a href={getLoginUrl()}>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white">ログイン</Button>
          </a>
        </div>
      </div>
    );
  }

  const referralCode = (user as { referralCode?: string })?.referralCode;
  const referralUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label}をコピーしました`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              マイページへ
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="font-bold text-rose-600">紹介システム</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">友達を紹介する</h1>
          <p className="text-gray-600">
            紹介したカップルが恋人証明を成立させると、
            <strong className="text-rose-600"> {REFERRAL_REWARD_COINS}コイン（¥{(REFERRAL_REWARD_COINS * COIN_TO_YEN).toLocaleString()}相当）</strong>
            をプレゼント！
          </p>
        </div>

        {/* Coin Balance */}
        <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-gray-600">現在のコイン残高</p>
                <p className="text-2xl font-black text-amber-600">{coinData?.balance ?? 0} コイン</p>
              </div>
            </div>
            <Link href="/plans">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700">
                コインを購入
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Referral Code */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-500" />
              あなたの紹介コード
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralCode ? (
              <div className="space-y-4">
                {/* Code Display */}
                <div className="bg-rose-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">紹介コード</p>
                    <p className="font-mono font-black text-2xl text-rose-700 tracking-widest">
                      {referralCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralCode, "紹介コード")}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    コピー
                  </Button>
                </div>

                {/* URL Display */}
                {referralUrl && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">紹介URL</p>
                      <p className="text-sm text-gray-700 truncate">{referralUrl}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralUrl, "紹介URL")}
                      className="gap-2 ml-2 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      コピー
                    </Button>
                  </div>
                )}

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      const text = `恋人証明を使ってみて！私の紹介コード: ${referralCode}\n${referralUrl}`;
                      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    LINEで送る
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `恋人証明を使ってみて！ #恋人証明 #koibitoshomei`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl ?? "")}`, "_blank");
                    }}
                  >
                    X（Twitter）でシェア
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">まだ紹介コードが発行されていません</p>
                <Button
                  onClick={() => getOrCreateCode.mutate()}
                  disabled={getOrCreateCode.isPending}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                >
                  紹介コードを発行する
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">紹介の仕組み</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: "1", title: "紹介コードをシェア", desc: "友人・知人に紹介URLまたはコードを送る" },
                { step: "2", title: "友人が登録", desc: "紹介URLから登録し、パートナーシップを成立させる" },
                { step: "3", title: "コイン獲得", desc: `パートナーシップ成立後、${REFERRAL_REWARD_COINS}コイン（¥${(REFERRAL_REWARD_COINS * COIN_TO_YEN).toLocaleString()}相当）が付与される` },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                紹介履歴
              </span>
              {historyData && historyData.totalRewardCoins > 0 && (
                <Badge className="bg-amber-100 text-amber-700">
                  合計 {historyData.totalRewardCoins} コイン獲得
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!historyData || historyData.referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>まだ紹介実績がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          紹介ユーザー #{ref.refereeId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(ref.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ref.status === "rewarded" ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {ref.rewardCoins}コイン獲得
                        </Badge>
                      ) : ref.status === "completed" ? (
                        <Badge className="bg-blue-100 text-blue-700">成立済み</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">待機中</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
