import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import {
  Heart,
  Users,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Link2,
  BarChart3,
  Coins,
  Tag,
  TrendingUp,
  Bell,
  FileText,
  Banknote,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { PartnershipStatusBadge } from "@/components/PartnershipStatusBadge";
import { getKycErrorMessage, KYC_ERROR_MESSAGES } from "../../../shared/kycErrors";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-primary/10 rounded-xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function KycStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    not_started: { label: "未申請", cls: "bg-gray-100 text-gray-600" },
    pending: { label: "審査中", cls: "bg-yellow-100 text-yellow-700" },
    verified: { label: "承認済み", cls: "bg-green-100 text-green-700" },
    failed: { label: "却下", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? map.not_started;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  usePageTitle("管理者ダッシュボード");
  const [, navigate] = useLocation();

  const { data: usersData, refetch: refetchUsers } = trpc.user.adminList.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: paymentStatsData } = trpc.payment.adminRevenueStats.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: affiliatesData, refetch: refetchAffiliates } = trpc.payment.affiliateList.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  // addAffiliate: 管理者UIからのタイアップ追加（将来実装）

  const { data: singleCertStats } = trpc.admin.singleCertStats.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: kycStats } = trpc.admin.kycStats.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: partnershipsData } = trpc.partnership.adminList.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const reviewKyc = trpc.user.adminReviewKyc.useMutation({
    onSuccess: () => {
      toast.success("eKYCステータスを更新しました");
      refetchUsers();
    },
    onError: (e) => toast.error(e.message),
  });

  // 銀行振込後の手動プラン設定
  const [planDialogUser, setPlanDialogUser] = useState<{ id: number; name: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"lover" | "engagement" | "student" | "reset">("lover");

  // eKYC却下理由コード選択ダイアログ
  const [rejectDialogUser, setRejectDialogUser] = useState<{ id: number; name: string } | null>(null);
  const [selectedRejectCode, setSelectedRejectCode] = useState<string>("document_unverified_other");

  const setPendingPlanMutation = trpc.admin.setPendingPlan.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setPlanDialogUser(null);
      refetchUsers();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">アクセス権限がありません</h1>
        <Link href="/dashboard">
          <Button variant="outline">マイページに戻る</Button>
        </Link>
      </div>
    );
  }

  const pendingKyc = usersData?.users.filter((u) => u.kycStatus === "pending") ?? [];
  const verifiedUsers = usersData?.users.filter((u) => u.kycStatus === "verified").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-8 space-y-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          管理者ダッシュボード
        </h1>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-primary" />}
            label="総ユーザー数"
            value={usersData?.total ?? 0}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            label="eKYC承認済み"
            value={verifiedUsers}
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-primary fill-primary" />}
            label="総パートナーシップ"
            value={partnershipsData?.total ?? 0}
          />
          <StatCard
            icon={<Link2 className="w-5 h-5 text-blue-500" />}
            label="交際中"
            value={partnershipsData?.activeCount ?? 0}
          />
          <StatCard
            icon={<Coins className="w-5 h-5 text-amber-500" />}
            label="総売上（円）"
            value={`¥${(paymentStatsData?.totalRevenue ?? 0).toLocaleString()}`}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            label="総注文数"
            value={paymentStatsData?.totalOrders ?? 0}
          />
        </div>

        {/* タブ */}
        <Tabs defaultValue="kyc">
          <TabsList>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              eKYC審査
              {pendingKyc.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1 px-1.5 py-0">
                  {pendingKyc.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              ユーザー一覧
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              パートナーシップ
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              タイアップ
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              売上・コイン
            </TabsTrigger>
            <TabsTrigger value="single-certs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              独身証明書
              {(singleCertStats?.pending ?? 0) > 0 && (
                <Badge className="bg-amber-500 text-white text-xs ml-1 px-1.5 py-0">
                  {singleCertStats?.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kyc-stats" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              eKYC統計
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              通知履歴
            </TabsTrigger>
            <TabsTrigger value="partner-status" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              ステータス問い合わせ
            </TabsTrigger>
          </TabsList>

          {/* eKYC審査タブ */}
          <TabsContent value="kyc" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">eKYC審査待ち ({pendingKyc.length}件)</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingKyc.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    審査待ちのユーザーはいません
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingKyc.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 border border-border rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {u.displayName ?? u.name ?? "名前未設定"}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground">
                            申請日: {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                          </p>
                          {u.kycErrorCode && (
                            <p className="text-xs text-red-400 mt-1">
                              エラー: {getKycErrorMessage(u.kycErrorCode).title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() =>
                              reviewKyc.mutate({ userId: u.id, status: "verified" })
                            }
                            disabled={reviewKyc.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => {
                              setRejectDialogUser({ id: u.id, name: u.displayName ?? u.name ?? `ID:${u.id}` });
                              setSelectedRejectCode(u.kycErrorCode ?? "document_unverified_other");
                            }}
                            disabled={reviewKyc.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            却下
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ユーザー一覧タブ */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  ユーザー一覧 ({usersData?.total ?? 0}名)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-muted-foreground font-medium">ID</th>
                        <th className="pb-3 text-muted-foreground font-medium">名前</th>
                        <th className="pb-3 text-muted-foreground font-medium">eKYC</th>
                        <th className="pb-3 text-muted-foreground font-medium">エラー原因</th>
                        <th className="pb-3 text-muted-foreground font-medium">ステータス</th>
                        <th className="pb-3 text-muted-foreground font-medium">決済プラン</th>
                        <th className="pb-3 text-muted-foreground font-medium">登録日</th>
                        <th className="pb-3 text-muted-foreground font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(usersData?.users ?? []).map((u) => (
                        <tr key={u.id} className="py-2">
                          <td className="py-3 text-muted-foreground">{u.id}</td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {u.displayName ?? u.name ?? "未設定"}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <KycStatusBadge status={u.kycStatus} />
                          </td>
                          <td className="py-3">
                            {u.kycErrorCode ? (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 cursor-help"
                                title={getKycErrorMessage(u.kycErrorCode).detail}
                              >
                                {getKycErrorMessage(u.kycErrorCode).title}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <PartnershipStatusBadge status={u.partnershipStatus} />
                          </td>
                          <td className="py-3">
                            {u.pendingPlanType ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                                {u.pendingPlanType === "lover" ? "恋人" : u.pendingPlanType === "engagement" ? "婚約" : "学生"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">未設定</span>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 gap-1"
                              onClick={() => {
                                setPlanDialogUser({ id: u.id, name: u.displayName ?? u.name ?? `ID:${u.id}` });
                                setSelectedPlan(u.pendingPlanType as "lover" | "engagement" | "student" ?? "lover");
                              }}
                            >
                              <Banknote className="w-3 h-3" />
                              振込確認
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 銀行振込後の手動プラン設定ダイアログ */}
                  <Dialog open={!!planDialogUser} onOpenChange={(open) => !open && setPlanDialogUser(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-rose-500" />
                          銀行振込確認：プラン設定
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                          ユーザー: <span className="font-semibold text-foreground">{planDialogUser?.name}</span>
                        </p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">設定するプラン</label>
                          <Select
                            value={selectedPlan}
                            onValueChange={(v) => setSelectedPlan(v as "lover" | "engagement" | "student" | "reset")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lover">恋人証明（新規 ¥6,600）</SelectItem>
                              <SelectItem value="engagement">婚約証明（新規 ¥16,500）</SelectItem>
                              <SelectItem value="student">学生割引（新規 ¥3,300）</SelectItem>
                              <SelectItem value="reset">リセット（未設定に戻す）</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                          ⚠️ 銀行振込の入金を確認した後に設定してください。設定後、ユーザーは招待リンクを生成できるようになります。
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPlanDialogUser(null)}>キャンセル</Button>
                        <Button
                          className="bg-rose-500 hover:bg-rose-600 text-white"
                          disabled={setPendingPlanMutation.isPending}
                          onClick={() => {
                            if (!planDialogUser) return;
                            if (selectedPlan === "reset") {
                              setPendingPlanMutation.mutate({ userId: planDialogUser.id, planType: null, paidAt: null });
                            } else {
                              setPendingPlanMutation.mutate({ userId: planDialogUser.id, planType: selectedPlan, paidAt: new Date().toISOString() });
                            }
                          }}
                        >
                          {setPendingPlanMutation.isPending ? "設定中...​" : "プランを設定する"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* eKYC却下理由コード選択ダイアログ */}
          <Dialog open={!!rejectDialogUser} onOpenChange={(open) => !open && setRejectDialogUser(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  eKYC却下：理由を選択
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  ユーザー: <span className="font-semibold text-foreground">{rejectDialogUser?.name}</span>
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">却下理由</label>
                  <Select value={selectedRejectCode} onValueChange={setSelectedRejectCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KYC_ERROR_MESSAGES).map(([code, msg]) => (
                        <SelectItem key={code} value={code}>
                          {msg.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRejectCode && KYC_ERROR_MESSAGES[selectedRejectCode] && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                      {KYC_ERROR_MESSAGES[selectedRejectCode].action}
                    </p>
                  )}
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ 却下後、ユーザーのeKYC画面に却下理由が表示されます。
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogUser(null)}>キャンセル</Button>
                <Button
                  className="bg-destructive hover:bg-destructive/90 text-white"
                  disabled={reviewKyc.isPending}
                  onClick={() => {
                    if (!rejectDialogUser) return;
                    reviewKyc.mutate(
                      { userId: rejectDialogUser.id, status: "failed", kycErrorCode: selectedRejectCode },
                      { onSuccess: () => setRejectDialogUser(null) }
                    );
                  }}
                >
                  {reviewKyc.isPending ? "処理中...​" : "却下する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* パートナーシップタブ */}
          <TabsContent value="partnerships" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  パートナーシップ一覧 ({partnershipsData?.total ?? 0}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-muted-foreground font-medium">ID</th>
                        <th className="pb-3 text-muted-foreground font-medium">ステータス</th>
                        <th className="pb-3 text-muted-foreground font-medium">ブロックチェーン</th>
                        <th className="pb-3 text-muted-foreground font-medium">開始日</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(partnershipsData?.partnerships ?? []).map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 text-muted-foreground">
                            <Link href={`/certificate/${p.id}`} className="hover:text-primary">
                              KS-{String(p.id).padStart(8, "0")}
                            </Link>
                          </td>
                          <td className="py-3">
                            <PartnershipStatusBadge status={p.status} />
                          </td>
                          <td className="py-3">
                            {p.blockchainTxHash ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                記録済み
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                発行中
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {new Date(p.startedAt).toLocaleDateString("ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* タイアップ管理タブ */}
          <TabsContent value="affiliates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>タイアップパートナー ({affiliatesData?.partners?.length ?? 0}件)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(affiliatesData?.partners ?? []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · {p.discountDescription}</p>
                      </div>
                      <Badge className={p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {p.isActive ? "有効" : "無効"}
                      </Badge>
                    </div>
                  ))}
                  {(affiliatesData?.partners ?? []).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      タイアップパートナーはまだ登録されていません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 売上・コイン統計タブ */}
          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">売上サマリー</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">総売上</span>
                    <span className="font-bold">¥{(paymentStatsData?.totalRevenue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">総注文数</span>
                    <span className="font-bold">{paymentStatsData?.totalOrders ?? 0}件</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">注文種別内訳</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(paymentStatsData?.byType ?? []).map((item) => (
                    <div key={item.type} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.type}</span>
                      <span className="font-bold">{item.count}件 / ¥{item.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                  {(paymentStatsData?.byType ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* 独身証明書審査タブ */}
          <TabsContent value="single-certs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    独身証明書審査
                    {(singleCertStats?.pending ?? 0) > 0 && (
                      <Badge className="bg-amber-500 text-white text-xs">
                        {singleCertStats?.pending}件 審査待ち
                      </Badge>
                    )}
                  </span>
                  <Link href="/admin/single-certificates">
                    <Button variant="outline" size="sm">
                      審査ページへ
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{singleCertStats?.pending ?? 0}</p>
                    <p className="text-xs text-amber-600 mt-1">審査待ち</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{singleCertStats?.approved ?? 0}</p>
                    <p className="text-xs text-green-600 mt-1">承認済み</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{singleCertStats?.rejected ?? 0}</p>
                    <p className="text-xs text-red-600 mt-1">却下済み</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  婚活中ユーザーが提出した独身証明書を審査します。詳細な審査は「審査ページへ」ボタンから行ってください。
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* eKYC統計ダッシュボードタブ */}
          <TabsContent value="kyc-stats" className="mt-6">
            <div className="space-y-6">
              {/* ステータス別カウント */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-3xl font-bold text-gray-700">{kycStats?.statusCounts.not_started ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">未申請</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-3xl font-bold text-yellow-700">{kycStats?.statusCounts.pending ?? 0}</p>
                  <p className="text-xs text-yellow-600 mt-1">審査中</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-3xl font-bold text-green-700">{kycStats?.statusCounts.verified ?? 0}</p>
                  <p className="text-xs text-green-600 mt-1">承認済み</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-3xl font-bold text-red-700">{kycStats?.statusCounts.failed ?? 0}</p>
                  <p className="text-xs text-red-600 mt-1">却下</p>
                </div>
              </div>

              {/* 承認率・平均審査時間 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />承認率</CardTitle></CardHeader>
                  <CardContent>
                    {(() => {
                      const total = (kycStats?.statusCounts.verified ?? 0) + (kycStats?.statusCounts.failed ?? 0);
                      const rate = total > 0 ? Math.round(((kycStats?.statusCounts.verified ?? 0) / total) * 100) : null;
                      return (
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold text-foreground">{rate !== null ? `${rate}%` : "--"}</span>
                          <span className="text-sm text-muted-foreground mb-1">（審査完了 {total}件中）</span>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />平均審査時間</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {kycStats?.avgReviewHours != null ? `${Math.round(kycStats.avgReviewHours)}h` : "--"}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">（申請〜承認）</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* エラーコード内訳 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    却下理由の内訳
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(kycStats?.errorCodeBreakdown ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">却下されたユーザーはいません</p>
                  ) : (
                    <div className="space-y-2">
                      {(kycStats?.errorCodeBreakdown ?? []).map((item) => {
                        const msg = getKycErrorMessage(item.errorCode);
                        const total = kycStats?.statusCounts.failed ?? 1;
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={item.errorCode} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground font-medium">{msg.title}</span>
                              <span className="text-muted-foreground">{item.count}件 ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-rose-400 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{item.errorCode}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 最近の失敗ユーザー */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    最近の却下ユーザー（最新10件）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(kycStats?.recentFailed ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">却下されたユーザーはいません</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-2 text-muted-foreground font-medium">ID</th>
                            <th className="pb-2 text-muted-foreground font-medium">名前</th>
                            <th className="pb-2 text-muted-foreground font-medium">エラー</th>
                            <th className="pb-2 text-muted-foreground font-medium">日時</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(kycStats?.recentFailed ?? []).map((u) => {
                            const msg = getKycErrorMessage(u.kycErrorCode);
                            return (
                              <tr key={u.id}>
                                <td className="py-2 text-muted-foreground text-xs">{u.id}</td>
                                <td className="py-2 text-foreground">{u.name ?? "--"}</td>
                                <td className="py-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    {msg.title}
                                  </span>
                                </td>
                                <td className="py-2 text-muted-foreground text-xs">
                                  {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString("ja-JP") : "--"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 通知送信履歴タブ */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>通知送信履歴</span>
                  <Link href="/admin/notifications">
                    <Button variant="outline" size="sm">
                      詳細ページへ
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  節目プッシュ通知の送信履歴を確認できます。詳細な履歴は「詳細ページへ」ボタンから確認してください。
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* パートナーステータス問い合わせ管理タブ */}
          <TabsContent value="partner-status" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>パートナーステータス問い合わせ管理</span>
                  <Link href="/admin/partner-status-inquiries">
                    <Button variant="outline" size="sm">
                      詳細ページへ
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  シングル/イエロー/レッド判定の問い合わせ履歴を確認できます。スパム検知（日次問い合わせ数ランキング）や問い合わせの強制キャンセルも可能です。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
