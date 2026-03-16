/**
 * 管理画面：通知送信履歴
 * 節目プッシュ通知の送信履歴を一覧表示する。
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Bell, AlertCircle, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function AdminNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [partnershipIdInput, setPartnershipIdInput] = useState("");
  const [filterPartnershipId, setFilterPartnershipId] = useState<number | undefined>(undefined);

  // 再送ダイアログの状態
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendPartnershipId, setResendPartnershipId] = useState<number | null>(null);
  const [resendLabel, setResendLabel] = useState("");
  const [resendPartnershipIdInput, setResendPartnershipIdInput] = useState("");

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.listNotificationLogs.useQuery(
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      partnershipId: filterPartnershipId,
    },
    { enabled: !!user && user.role === "admin" }
  );

  const resendMutation = trpc.admin.resendNotification.useMutation({
    onSuccess: (result) => {
      setResendDialogOpen(false);
      setResendPartnershipId(null);
      setResendLabel("");
      setResendPartnershipIdInput("");
      utils.admin.listNotificationLogs.invalidate();
      toast.success(
        `再送完了: パートナーシップ #${result.partnershipId}（${result.label}）へ通知を送信しました。成功: ${result.sentCount}件 / 失敗: ${result.failedCount}件`
      );
    },
    onError: (err) => {
      toast.error(`再送失敗: ${err.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-semibold text-foreground">
          管理者権限が必要です
        </p>
        <Link href="/">
          <Button variant="outline">トップへ戻る</Button>
        </Link>
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleFilter() {
    const id = parseInt(partnershipIdInput, 10);
    setFilterPartnershipId(isNaN(id) ? undefined : id);
    setPage(0);
  }

  function handleClearFilter() {
    setPartnershipIdInput("");
    setFilterPartnershipId(undefined);
    setPage(0);
  }

  function openResendDialog(partnershipId?: number) {
    setResendPartnershipId(partnershipId ?? null);
    setResendPartnershipIdInput(partnershipId ? String(partnershipId) : "");
    setResendLabel("");
    setResendDialogOpen(true);
  }

  function handleResendConfirm() {
    const pid = resendPartnershipId ?? parseInt(resendPartnershipIdInput, 10);
    if (!pid || isNaN(pid)) {
      toast.error("入力エラー: パートナーシップIDを正しく入力してください");
      return;
    }
    resendMutation.mutate({
      partnershipId: pid,
      milestoneLabel: resendLabel.trim() || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                管理画面
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">通知送信履歴</h1>
            </div>
          </div>
          {/* 手動再送ボタン */}
          <Button
            onClick={() => openResendDialog()}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            手動再送
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                総送信数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {total.toLocaleString("ja-JP")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                成功（このページ）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">
                {logs.filter((l) => l.status === "sent").length.toLocaleString("ja-JP")}
                <span className="text-sm text-muted-foreground ml-1">
                  / {logs.length}件
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                失敗（このページ）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">
                {logs.filter((l) => l.status === "failed").length.toLocaleString("ja-JP")}
                <span className="text-sm text-muted-foreground ml-1">
                  / {logs.length}件
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                placeholder="パートナーシップID でフィルタ"
                value={partnershipIdInput}
                onChange={(e) => setPartnershipIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                className="max-w-xs"
              />
              <Button onClick={handleFilter} size="sm">
                絞り込む
              </Button>
              {filterPartnershipId !== undefined && (
                <>
                  <Button onClick={handleClearFilter} variant="outline" size="sm">
                    クリア
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    パートナーシップ #{filterPartnershipId} のみ表示中
                  </span>
                  <Button
                    onClick={() => openResendDialog(filterPartnershipId)}
                    variant="outline"
                    size="sm"
                    className="gap-1 ml-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    このIDへ再送
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* テーブル */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                読み込み中...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Bell className="w-10 h-10 opacity-30" />
                <p>送信履歴がありません</p>
                {filterPartnershipId !== undefined && (
                  <p className="text-sm">
                    パートナーシップ #{filterPartnershipId} の履歴は存在しません
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>節目</TableHead>
                      <TableHead className="w-24">日数</TableHead>
                      <TableHead className="w-32">パートナーシップ</TableHead>
                      <TableHead className="w-24">ユーザー</TableHead>
                      <TableHead className="w-20">ステータス</TableHead>
                      <TableHead>送信日時</TableHead>
                      <TableHead>エラー</TableHead>
                      <TableHead className="w-20">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-xs">
                          #{log.id}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{log.milestoneLabel}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {log.milestoneDays.toLocaleString("ja-JP")}日
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/certificate/${log.partnershipId}`}
                            className="text-primary hover:underline text-sm"
                          >
                            #{log.partnershipId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          #{log.userId}
                        </TableCell>
                        <TableCell>
                          {log.status === "sent" ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950"
                            >
                              送信済
                            </Badge>
                          ) : (
                            <Badge variant="destructive">失敗</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-xs truncate">
                          {log.errorMessage ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => openResendDialog(log.partnershipId)}
                            title={`パートナーシップ #${log.partnershipId} へ再送`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            再送
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString("ja-JP")} 件中{" "}
              {(page * PAGE_SIZE + 1).toLocaleString("ja-JP")} -{" "}
              {Math.min((page + 1) * PAGE_SIZE, total).toLocaleString("ja-JP")}{" "}
              件を表示
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                前へ
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* 再送確認ダイアログ */}
      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              通知を再送する
            </DialogTitle>
            <DialogDescription>
              指定したパートナーシップのユーザー双方へプッシュ通知を送信します。
              節目ラベルを空欄にすると現在の交際日数から自動判定します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                パートナーシップ ID <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="例: 42"
                value={resendPartnershipIdInput}
                onChange={(e) => {
                  setResendPartnershipIdInput(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  setResendPartnershipId(isNaN(n) ? null : n);
                }}
                disabled={resendMutation.isPending}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                節目ラベル（任意）
              </label>
              <Input
                placeholder="例: 100日記念（空欄で自動判定）"
                value={resendLabel}
                onChange={(e) => setResendLabel(e.target.value)}
                disabled={resendMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                空欄の場合、現在の交際日数から節目を自動判定します
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setResendDialogOpen(false)}
              disabled={resendMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleResendConfirm}
              disabled={resendMutation.isPending || !resendPartnershipIdInput}
              className="gap-2"
            >
              {resendMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  送信する
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
