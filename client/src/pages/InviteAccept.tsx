import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getGoogleLoginUrl, getLineLoginUrl, getLoginUrl } from "@/const";
import { Heart, User, CheckCircle, AlertTriangle, Loader2, Shield, CreditCard, Users } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function InviteAccept() {
  const params = useParams<{ key: string }>();
  const invitationKey = params.key ?? "";
  const { isAuthenticated, loading: authLoading } = useAuth();
  usePageTitle("招待を受け入れる - パートナーシップ成立");
  const [, navigate] = useLocation();
  const [accepted, setAccepted] = useState(false);
  const [kycWarningOpen, setKycWarningOpen] = useState(false);

  // URLパラメータで割り勘支払い完了を検知
  const urlParams = new URLSearchParams(window.location.search);
  const splitPaid = urlParams.get("split_paid") === "true";

  const { data: invite, isLoading, error } = trpc.invitation.verify.useQuery(
    { key: invitationKey },
    { enabled: !!invitationKey }
  );

  // ログイン済みユーザーのプロフィール（KYC状態確認用）
  const { data: myProfile } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });

  // 割り勘承認者用Checkout
  const createSplitAccepterCheckout = trpc.payment.createSplitAccepterCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Stripeの決済ページに移動します（割り勘・承認者分）");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(`決済エラー: ${err.message}`),
  });

  const acceptPartnership = trpc.partnership.create.useMutation({
    onSuccess: (data) => {
      setAccepted(true);
      toast.success(data.message);
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  // パートナーシップ成立ボタンを押したときの処理
  const handleAcceptClick = () => {
    // KYC未完了の場合はモーダルで警告
    if (myProfile && myProfile.kycStatus !== "verified") {
      setKycWarningOpen(true);
      return;
    }
    acceptPartnership.mutate({ invitationKey });
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4"
      style={{ background: "linear-gradient(160deg, oklch(0.97 0.02 340) 0%, oklch(0.94 0.04 300) 50%, oklch(0.97 0.02 260) 100%)" }}>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Heart className="w-6 h-6 text-primary fill-primary" />
        <span className="text-xl font-bold text-foreground">恋人証明</span>
      </Link>

      {/* KYC未完了警告モーダル */}
      <Dialog open={kycWarningOpen} onOpenChange={setKycWarningOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Shield className="w-5 h-5" />
              本人確認が必要です
            </DialogTitle>
            <DialogDescription className="text-left space-y-2 mt-2">
              <p>パートナーシップを成立させるには、先に<strong>本人確認（eKYC）</strong>を完了する必要があります。</p>
              <p className="text-sm text-muted-foreground">
                身分証1枚で約3〜5分で完了します。本人確認後、再度この招待リンクから手続きを進めてください。
              </p>
              {myProfile?.kycStatus === "pending" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  現在審査中です。通常1〜3分で完了します。
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {myProfile?.kycStatus !== "pending" && (
              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={() => {
                  setKycWarningOpen(false);
                  navigate("/kyc");
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                本人確認を始める →
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => setKycWarningOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {accepted ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  パートナーシップ成立！
                </h1>
                <p className="text-muted-foreground text-sm">
                  マイページに移動しています...
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-2">
                  招待が無効です
                </h1>
                <p className="text-muted-foreground text-sm">
                  {error.message}
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" className="w-full">トップに戻る</Button>
              </Link>
            </>
          ) : invite ? (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                {invite.inviterAvatarUrl ? (
                  <img src={invite.inviterAvatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">招待が届いています</p>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {invite.inviterName}さんから
                </h1>
                <p className="text-muted-foreground text-sm">
                  パートナーシップの招待が届いています。
                  承認するとブロックチェーン証明書が発行されます。
                </p>
              </div>

              <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground">
                有効期限: {new Date(invite.expiresAt).toLocaleDateString("ja-JP")}
              </div>

              {/* KYC未完了の場合は警告バナーを表示 */}
              {isAuthenticated && myProfile && myProfile.kycStatus !== "verified" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 text-left">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Shield className="w-4 h-4" />
                    本人確認が必要です
                  </div>
                  <p className="text-xs">
                    パートナーシップを成立させるには、先に本人確認（eKYC）を完了してください。
                    {myProfile.kycStatus === "pending" ? "現在審査中です。" : ""}
                  </p>
                </div>
              )}

              {/* 割り勘招待の場合: 承認者の半額支払いUI */}
              {isAuthenticated && invite && (invite as { isSplitPayment?: boolean }).isSplitPayment && !splitPaid && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700 mb-2">
                    <Users className="w-4 h-4" />
                    割り勘招待です
                  </div>
                  <p className="text-xs text-emerald-600 mb-3">
                    この招待は割り勘決済です。パートナーシップを成立させるには、あなたの分（半額）をお支払いください。
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 hover:opacity-90"
                    onClick={() => createSplitAccepterCheckout.mutate({
                      invitationKey,
                      origin: window.location.origin,
                    })}
                    disabled={createSplitAccepterCheckout.isPending}
                  >
                    {createSplitAccepterCheckout.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />処理中...</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-2" />割り勘分を支払う</>  
                    )}
                  </Button>
                </div>
              )}

              {/* 割り勘支払い完了後のパートナーシップ成立ボタン */}
              {isAuthenticated && invite && (invite as { isSplitPayment?: boolean }).isSplitPayment && splitPaid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="font-semibold">支払い完了！パートナーシップを成立します。</p>
                </div>
              )}

              {/* 割り勘招待で未支払いの場合はパートナーシップ成立ボタンを非表示 */}
              {isAuthenticated && invite && (invite as { isSplitPayment?: boolean }).isSplitPayment && !splitPaid ? null : (
              <>  
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    招待を受け入れるにはログインが必要です
                  </p>
                  <a href={getGoogleLoginUrl(invitationKey ? `/invite/${invitationKey}` : "/invite")} className="block">
                    <Button className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Googleでログインして招待を受け入れる
                    </Button>
                  </a>
                  <a href={getLineLoginUrl(invitationKey ? `/invite/${invitationKey}` : "/invite")} className="block">
                    <Button className="w-full bg-[#06C755] hover:bg-[#05b34d] text-white flex items-center justify-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      LINEでログインして招待を受け入れる
                    </Button>
                  </a>
                  <a href={getLoginUrl(invitationKey ? `/invite/${invitationKey}` : "/invite")} className="block">
                    <Button variant="outline" className="w-full">
                      メールでログイン / 登録
                    </Button>
                  </a>
                </div>
              ) : (
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={handleAcceptClick}
                  disabled={acceptPartnership.isPending}
                >
                  {acceptPartnership.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />処理中...</>
                  ) : (
                    <><Heart className="w-4 h-4 mr-2 fill-white" />パートナーシップを成立させる</>
                  )}
                </Button>
              )}
              </>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
