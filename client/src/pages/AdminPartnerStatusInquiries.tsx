/**
 * 管理画面：パートナーステータス問い合わせ管理
 * - 問い合わせ一覧（ページネーション・ステータスフィルター）
 * - スパム検知（日次問い合わせ数ランキング）
 * - 問い合わせの強制キャンセル
 * admin ロールのみアクセス可能。
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Ban,
  RefreshCw,
  BarChart3,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "回答待ち", variant: "secondary" },
  consented: { label: "同意済み", variant: "default" },
  declined: { label: "拒否", variant: "outline" },
  expired: { label: "期限切れ", variant: "outline" },
};

const RESULT_LABELS: Record<string, string> = {
  single: "🟢 シングル",
  yellow: "🟡 イエロー",
  red: "🔴 レッド",
  not_registered: "⚪ 未登録",
};

export default function AdminPartnerStatusInquiries() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "consented" | "declined" | "expired">("all");
  const [spamDays, setSpamDays] = useState(7);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.admin.listPartnerStatusInquiries.useQuery(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE, status: statusFilter },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: spamData, isLoading: spamLoading } = trpc.admin.partnerStatusSpamReport.useQuery(
    { days: spamDays },
    { enabled: !!user && user.role === "admin" }
  );

  const cancelMutation = trpc.admin.cancelPartnerStatusInquiry.useMutation({
    onSuccess: () => {
      toast.success("問い合わせをキャンセルしました");
      setCancelDialogOpen(false);
      setCancelTargetId(null);
      utils.admin.listPartnerStatusInquiries.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) return null;
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">管理者権限が必要です</p>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              管理画面
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-bold">パートナーステータス問い合わせ管理</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="list">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="list" className="gap-2">
              <Search className="w-4 h-4" />
              問い合わせ一覧
            </TabsTrigger>
            <TabsTrigger value="spam" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              スパム検知
            </TabsTrigger>
          </TabsList>

          {/* ─── 問い合わせ一覧タブ ─── */}
          <TabsContent value="list" className="space-y-4">
            {/* フィルター */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as typeof statusFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="pending">回答待ち</SelectItem>
                  <SelectItem value="consented">同意済み</SelectItem>
                  <SelectItem value="declined">拒否</SelectItem>
                  <SelectItem value="expired">期限切れ</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                更新
              </Button>
              <span className="text-sm text-muted-foreground ml-auto">
                合計 {data?.total ?? 0} 件
              </span>
            </div>

            {/* テーブル */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>依頼者</TableHead>
                      <TableHead>問い合わせ先メール</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>判定結果</TableHead>
                      <TableHead>作成日時</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          読み込み中...
                        </TableCell>
                      </TableRow>
                    ) : data?.inquiries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          該当する問い合わせがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.inquiries.map((inq) => {
                        const statusInfo = STATUS_LABELS[inq.status] ?? { label: inq.status, variant: "outline" as const };
                        return (
                          <TableRow key={inq.id}>
                            <TableCell className="font-mono text-xs">{inq.id}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{inq.requesterName ?? "不明"}</p>
                                <p className="text-xs text-muted-foreground">{inq.requesterEmail ?? ""}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{inq.targetEmail}</TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {inq.result ? RESULT_LABELS[inq.result] ?? inq.result : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(inq.createdAt).toLocaleString("ja-JP")}
                            </TableCell>
                            <TableCell>
                              {inq.status === "pending" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setCancelTargetId(inq.id);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  <Ban className="w-3 h-3" />
                                  キャンセル
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ─── スパム検知タブ ─── */}
          <TabsContent value="spam" className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold">問い合わせ数ランキング（スパム検知）</h2>
              <Select
                value={String(spamDays)}
                onValueChange={(v) => setSpamDays(Number(v))}
              >
                <SelectTrigger className="w-32 ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">過去1日</SelectItem>
                  <SelectItem value="7">過去7日</SelectItem>
                  <SelectItem value="14">過去14日</SelectItem>
                  <SelectItem value="30">過去30日</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  {spamData?.since
                    ? `${new Date(spamData.since).toLocaleDateString("ja-JP")} 以降の問い合わせ数`
                    : "集計中..."}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>順位</TableHead>
                      <TableHead>ユーザー</TableHead>
                      <TableHead>問い合わせ数</TableHead>
                      <TableHead>判定</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spamLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          読み込み中...
                        </TableCell>
                      </TableRow>
                    ) : spamData?.report.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          データがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      spamData?.report.map((row, idx) => {
                        const count = Number(row.inquiryCount);
                        const isHighRisk = count >= 10;
                        const isMediumRisk = count >= 5 && count < 10;
                        return (
                          <TableRow key={row.requesterId} className={isHighRisk ? "bg-red-50" : isMediumRisk ? "bg-amber-50" : ""}>
                            <TableCell className="font-bold text-center w-12">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{row.requesterName ?? "不明"}</p>
                                <p className="text-xs text-muted-foreground">{row.requesterEmail ?? ""}</p>
                                <p className="text-xs text-muted-foreground">ID: {row.requesterId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`text-2xl font-black ${isHighRisk ? "text-red-600" : isMediumRisk ? "text-amber-600" : "text-foreground"}`}>
                                {count}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">件</span>
                            </TableCell>
                            <TableCell>
                              {isHighRisk ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  高リスク
                                </Badge>
                              ) : isMediumRisk ? (
                                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3" />
                                  要注意
                                </Badge>
                              ) : (
                                <Badge variant="outline">正常</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 現在のルール説明 */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">現在の制限ルール</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 同一メールアドレスへの問い合わせは24時間以内に1回のみ</li>
                  <li>• eKYC完了ユーザーのみ利用可能</li>
                  <li>• グローバル日次上限（全メール合計）は将来的に追加予定</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* キャンセル確認ダイアログ */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" />
              問い合わせをキャンセル
            </DialogTitle>
            <DialogDescription>
              この問い合わせ（ID: {cancelTargetId}）を強制的にキャンセルします。
              相手には「期限切れ」として表示されます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              戻る
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelTargetId && cancelMutation.mutate({ inquiryId: cancelTargetId })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "処理中..." : "キャンセルする"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
