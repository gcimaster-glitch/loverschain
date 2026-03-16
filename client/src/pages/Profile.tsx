import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Bell, BellOff, BellRing, AlertCircle, CheckCircle, Shield, User, Camera } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePushNotification } from "@/hooks/usePushNotification";
import { EmailVerificationCard, SmsVerificationCard } from "@/components/VerificationCards";
import { SingleCertificateCard, EngagementRequestCard } from "@/components/SingleCertificateCard";
import { CertSettingsCard } from "@/components/CertSettingsCard";
import { DatePicker } from "@/components/DateTimePicker";

export default function Profile() {
  const { isAuthenticated } = useAuth();
  usePageTitle("プロフィール設定");
  const { data: profile, refetch } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: partnership } = trpc.partnership.mine.useQuery(undefined, { enabled: isAuthenticated });

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");

  // 通知設定
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    vapidConfigured,
    subscribe,
    unsubscribe,
  } = usePushNotification();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? profile.name ?? "");
      setGender(profile.gender ?? "");
      setBirthDate(profile.birthDate ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success("プロフィール写真を更新しました");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("画像サイズは2MB以内にしてください"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadAvatar.mutate({ dataUrl });
    };
    reader.readAsDataURL(file);
    // 同じファイルを再選択できるよう値をリセット
    e.target.value = "";
  };

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateProfile.mutate({
      displayName: displayName || undefined,
      gender: (gender as "male" | "female" | "other" | "prefer_not_to_say") || undefined,
      birthDate: birthDate || undefined,
      phone: phone || undefined,
    });
  };

  // 通知ステータスのラベル・バッジ
  const notificationStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />非対応</Badge>;
    }
    if (permission === "denied") {
      return <Badge variant="destructive" className="gap-1"><BellOff className="w-3 h-3" />ブロック中</Badge>;
    }
    if (isSubscribed && permission === "granted") {
      return <Badge className="gap-1 bg-green-600 text-white"><BellRing className="w-3 h-3" />オン</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Bell className="w-3 h-3" />オフ</Badge>;
  };

  const notificationDescription = () => {
    if (!isSupported) return "このブラウザはプッシュ通知に対応していません。";
    if (permission === "denied") return "ブラウザの設定から通知を許可してください。";
    if (!vapidConfigured) return "通知機能の設定が完了していません。";
    if (isSubscribed) return "節目（100日・1周年など）に通知が届きます。";
    return "節目の記念日にプッシュ通知でお知らせします。";
  };

  // 認証ステータスのサマリー
  const verificationSummary = () => {
    const items = [
      { label: "本人確認", done: profile?.kycStatus === "verified" },
      { label: "メール認証", done: profile?.emailVerified },
      { label: "SMS認証", done: profile?.phoneVerified },
    ];
    const doneCount = items.filter((i) => i.done).length;
    return { items, doneCount, total: items.length };
  };

  const summary = verificationSummary();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-8 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              マイページ
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-foreground">プロフィール設定</h1>

        {/* 認証ステータスサマリー */}
        <Card className={summary.doneCount === summary.total ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 shrink-0 ${summary.doneCount === summary.total ? "text-green-600" : "text-orange-500"}`} />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${summary.doneCount === summary.total ? "text-green-800" : "text-orange-800"}`}>
                  認証状況：{summary.doneCount}/{summary.total} 完了
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {summary.items.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        item.done
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {item.done ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── 基本情報 ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* アバター写真 */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={uploadAvatar.isPending}
              />
              <label
                htmlFor="avatar-upload"
                className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border hover:border-primary transition-all group overflow-hidden cursor-pointer"
                title="写真を変更"
              >
                {uploadAvatar.isPending ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : profile?.avatarUrl ? (
                  <>
                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <User className="w-8 h-8 text-muted-foreground" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </>
                )}
              </label>
              <p className="text-xs text-muted-foreground">
                {profile?.avatarUrl ? "タップして写真を変更" : "タップして写真を追加（2MB以内）"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名 <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名を入力してください"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">証明書に表示される名前です</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                  <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>生年月日</Label>
              <DatePicker
                value={birthDate}
                onChange={setBirthDate}
                placeholder="生年月日を選択"
                toDate={new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="090-0000-0000"
                maxLength={20}
              />
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSave}
              disabled={updateProfile.isPending || !displayName}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? "保存中..." : "保存する"}
            </Button>
          </CardContent>
        </Card>

        {/* ─── メール認証 ─── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            本人認証
          </h2>
          <div className="space-y-3">
            <EmailVerificationCard
              emailVerified={profile?.emailVerified ?? false}
              onVerified={() => refetch()}
              initialEmail={profile?.email ?? ""}
            />
            <SmsVerificationCard
              phoneVerified={profile?.phoneVerified ?? false}
              onVerified={() => refetch()}
              initialPhone={phone}
            />
          </div>
        </div>

        {/* ─── 独身証明書（婚活中の方向け） ─── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            婚活・婚約中の方向け
          </h2>
          <div className="space-y-3">
            <SingleCertificateCard
              certStatus={(profile?.singleCertificateStatus as "not_uploaded" | "pending" | "approved" | "rejected") ?? "not_uploaded"}
              certUrl={profile?.singleCertificateUrl}
              onUploaded={() => refetch()}
            />
            {partnership && (
              <EngagementRequestCard
                partnershipStatus={partnership.status}
                myCertStatus={(profile?.singleCertificateStatus as "not_uploaded" | "pending" | "approved" | "rejected") ?? "not_uploaded"}
                partnerCertStatus={
                  (partnership as { partnerCertStatus?: string }).partnerCertStatus as "not_uploaded" | "pending" | "approved" | "rejected" | undefined
                }
                onRequested={() => {
                  refetch();
                }}
              />
            )}
          </div>
        </div>

        {/* ─── 証明書表示設定 ─── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            証明書の表示設定
          </h2>
          <CertSettingsCard
            prefecture={profile?.prefecture}
            showPrefectureOnCert={profile?.showPrefectureOnCert ?? false}
            showNameOnCert={profile?.showNameOnCert ?? true}
            onSaved={() => refetch()}
          />
        </div>

        {/* ─── 通知設定 ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  通知設定
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {notificationDescription()}
                </CardDescription>
              </div>
              {notificationStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {!isSupported ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {/iPhone|iPad|iPod/.test(navigator.userAgent)
                    ? "iOSでは「Safari」のみプッシュ通知に対応しています。Safariで開き、「ホーム画面に追加」してから通知を設定してください。"
                    : "Chrome・Edge・Firefox などのブラウザをお試しください。"}
                </p>
              </div>
            ) : permission === "denied" ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                通知がブロックされています。ブラウザのアドレスバー横の鍵アイコン → 通知 → 許可 に変更してからページを再読み込みしてください。
              </div>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  記念日の節目（100日・200日・1周年・2周年など）に、このデバイスへプッシュ通知が届きます。
                </p>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={unsubscribe}
                  disabled={pushLoading}
                >
                  <BellOff className="w-4 h-4" />
                  {pushLoading ? "処理中..." : "通知をオフにする"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  記念日の節目（100日・200日・1周年・2周年など）に、このデバイスへプッシュ通知でお知らせします。
                </p>
                <Button
                  className="w-full gap-2 bg-primary text-primary-foreground"
                  onClick={subscribe}
                  disabled={pushLoading || !vapidConfigured}
                >
                  <BellRing className="w-4 h-4" />
                  {pushLoading ? "設定中..." : "通知をオンにする"}
                </Button>
                {!vapidConfigured && (
                  <p className="text-xs text-muted-foreground text-center">
                    通知機能は現在準備中です。
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
