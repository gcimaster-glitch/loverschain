/**
 * 管理者向け 独身証明書審査ページ
 * - 審査待ち一覧（画像プレビュー・承認/却下ダイアログ）
 * - 審査済み履歴（承認・却下・却下理由）
 * - 統計カード（審査待ち件数・承認済み件数・却下件数）
 */
import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  ArrowLeft,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ZoomIn,
  BookOpen,
  ChevronRight,
  Info,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getLoginUrl } from "@/const";

// ─── 審査ガイドラインモーダル ─────────────────────────────────────────────────────────────
const APPROVAL_CHECKLIST = [
  {
    id: 1,
    label: "書類の種類と内容",
    items: [
      "「独身証明書」または「婚姻履歴なし証明書」であること",
      "市区町村長の印鑑または電子証明があること",
      "発行日から3ヶ月以内の書類であること",
    ],
  },
  {
    id: 2,
    label: "画像の品質",
    items: [
      "文字が髮明に読み取れること（ピンボケ・暗すぎ・切れていない）",
      "全体が撕れなく写っていること（折り目・指で隐れていない）",
      "反射・光りがなく内容が見えること",
    ],
  },
  {
    id: 3,
    label: "氏名の一致",
    items: [
      "登録名義と書類の氏名が一致すること",
      "旧姓の場合は戻り名履歴証明書などの追加書類があること",
    ],
  },
  {
    id: 4,
    label: "改ざん・合成の有無",
    items: [
      "画像に明らかな編集・合成の痕跡がないこと",
      "印鑑・署名・日付に不局な点がないこと",
    ],
  },
];

const REJECTION_EXAMPLES = [
  {
    reason: "画像が不鮮明で文字が読めない",
    template:
      "提出いただいた書類の画像が不鮮明で、文字の判読ができませんでした。明るい場所で全体が鮮明に撕れるよう再撮影し、再度アップロードしてください。",
  },
  {
    reason: "発行日が3ヶ月以上前",
    template:
      "提出いただいた書類の発行日が3ヶ月以上前のものです。最新の独身証明書（3ヶ月以内に発行されたもの）を再度取得して提出してください。",
  },
  {
    reason: "氏名不一致",
    template:
      "登録されたお名前と書類の氏名が一致していませんでした。改姓された場合は戻り名履歴証明書を併せて提出してください。",
  },
  {
    reason: "書類の種類が不正",
    template:
      "提出いただいた書類が独身証明書または婚姻履歴なし証明書以外の書類です。市区町村長発行の「独身証明書」または「婚姻履歴なし証明書」を再度提出してください。",
  },
  {
    reason: "画像の一部が欠けている",
    template:
      "提出いただいた画像の一部が欠けているか、切れています。書類全体が撕れるよう再度撮影してアップロードしてください。",
  },
];

function ReviewGuidelineModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<"checklist" | "rejection" | "faq">("checklist");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("クリップボードにコピーしました");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("コピーに失敗しました。手動でテキストを選択してください。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* ヘッダー */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            審査ガイドライン
          </DialogTitle>
          <DialogDescription className="text-left text-sm">
            独身証明書の審査にあたって、以下の基準を参考にしてください。複数の管理者が一貫した審査を行うための共通基準です。
          </DialogDescription>
        </DialogHeader>

        {/* セクションナビゲーション */}
        <div className="flex border-b border-border shrink-0">
          <button
            onClick={() => setActiveSection("checklist")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeSection === "checklist"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            承認基準
          </button>
          <button
            onClick={() => setActiveSection("rejection")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeSection === "rejection"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            却下文例
          </button>
          <button
            onClick={() => setActiveSection("faq")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeSection === "faq"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            よくあるQ&A
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 承認基準チェックリスト */}
          {activeSection === "checklist" && (
            <div className="space-y-5">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <Info className="w-4 h-4 inline mr-1.5" />
                以下の全ての項目を満たす場合に「承認」してください。一つでも満たさない場合は「却下」とし、理由を明記してください。
              </div>
              {APPROVAL_CHECKLIST.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {section.id}
                    </span>
                    {section.label}
                  </h3>
                  <ul className="space-y-1.5 pl-7">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium mb-1">審査の判断が難しい場合</p>
                <p className="text-xs text-amber-600">
                  判断が困難な場合は却下を選び、「再確認が必要です」等の理由を記載してください。ユーザーは再提出できます。
                </p>
              </div>
            </div>
          )}

          {/* 却下文例 */}
          {activeSection === "rejection" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Info className="w-4 h-4 inline mr-1.5" />
                却下時に使える文例です。却下理由の入力欄にコピーしてご利用ください。
              </div>
              {REJECTION_EXAMPLES.map((ex, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-red-50 border-b border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-red-700">{ex.reason}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(ex.template, i)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-all shrink-0 ${
                        copiedIndex === i
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-white border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {copiedIndex === i ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          コピー済み
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          コピー
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-2">文例文</p>
                    <p className="text-sm text-foreground leading-relaxed">{ex.template}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FAQ */}
          {activeSection === "faq" && (
            <div className="space-y-4">
              {[
                {
                  q: "印鑑がこすれている場合は？",
                  a: "印鑑の内容が判読できる場合は承認可能です。内容が判読できない場合は却下し、「印鑑が不鮮明なため再提出をお願いします」と伝えてください。",
                },
                {
                  q: "スマートフォンで撮影した画像は有効ですか？",
                  a: "文字が鮮明に読めることが条件です。スマートフォンで撮影した画像でも、鮮明であれば有効です。",
                },
                {
                  q: "外国語の書類は受け付けていますか？",
                  a: "現時点では日本の市区町村長発行の書類のみ受け付けています。外国語の書類は却下し、「日本の市区町村長発行の独身証明書を提出してください」と伝えてください。",
                },
                {
                  q: "承認後に偶然不正が判明した場合は？",
                  a: "管理者メニューからユーザーの独身証明書ステータスを手動で却下に変更できます。不正が確認された場合は即座に対応してください。",
                },
                {
                  q: "審査にかかる標準時間は？",
                  a: "ユーザーには「アップロードから3唄5唄4以内に審査されます」と案内しています。審査待ち件数が多い場合は優先度を上げて対応してください。",
                },
              ].map((faq, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 統計カード ─────────────────────────────────────────────────────────────
function StatsCards() {  const { data: stats, isLoading } = trpc.admin.singleCertStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-5">
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats?.pending ?? 0}</p>
              <p className="text-xs text-amber-600">審査待ち</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats?.approved ?? 0}</p>
              <p className="text-xs text-green-600">承認済み</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats?.rejected ?? 0}</p>
              <p className="text-xs text-red-600">却下済み</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 画像プレビューモーダル ────────────────────────────────────
function ImagePreviewModal({
  url,
  open,
  onClose,
}: {
  url: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-2">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            独身証明書 プレビュー
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <img
            src={url}
            alt="独身証明書"
            className="w-full object-contain max-h-[70vh]"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%236b7280' font-size='14'%3E画像を読み込めませんでした%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
        <div className="px-4 pb-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            元の画像を新しいタブで開く →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 審査ダイアログ ────────────────────────────────────────────
function ReviewDialog({
  open,
  onClose,
  userId,
  userName,
  approved,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  approved: boolean;
  onSuccess: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const utils = trpc.useUtils();

  const review = trpc.admin.reviewSingleCert.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.admin.listPendingSingleCerts.invalidate();
      utils.admin.listReviewedSingleCerts.invalidate();
      utils.admin.singleCertStats.invalidate();
      onSuccess();
      onClose();
      setRejectReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    review.mutate({
      userId,
      approved,
      rejectReason: approved ? undefined : rejectReason || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {approved ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                独身証明書を承認する
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                独身証明書を却下する
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-left pt-1">
            <span className="font-semibold">{userName}</span> さんの独身証明書を
            {approved ? "承認" : "却下"}します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        {!approved && (
          <div className="space-y-2 py-2">
            <Label htmlFor="rejectReason" className="text-sm font-medium">
              却下理由（任意・ユーザーに通知されます）
            </Label>
            <Textarea
              id="rejectReason"
              placeholder="例：書類が不鮮明です。再度、鮮明な画像をアップロードしてください。"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {rejectReason.length}/500
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              却下理由を入力すると、ユーザーが再申請時に参照できます。
            </div>
          </div>
        )}

        {approved && (
          <div className="py-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
              承認すると、ユーザーは婚活プロフィールに「独身証明済み」バッジが表示されます。
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={review.isPending}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={review.isPending}
            className={
              approved
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          >
            {review.isPending
              ? "処理中..."
              : approved
              ? "承認する"
              : "却下する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 審査待ちカード ────────────────────────────────────────────
type UserCert = {
  id: number;
  name: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  singleCertificateUrl: string | null;
  singleCertificateStatus: string;
  singleCertificateUploadedAt: Date | null;
  singleCertificateReviewedAt: Date | null;
  singleCertificateRejectReason: string | null;
  kycStatus: string;
  phoneVerified: boolean;
  emailVerified: boolean;
};

function PendingCertCard({
  user,
  onReviewed,
}: {
  user: UserCert;
  onReviewed: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewApproved, setReviewApproved] = useState(true);

  const openReview = (approved: boolean) => {
    setReviewApproved(approved);
    setReviewOpen(true);
  };

  const displayName = user.displayName ?? user.name ?? `ユーザー #${user.id}`;

  return (
    <>
      <Card className="border border-amber-200 bg-amber-50/30">
        <CardContent className="py-5 px-5">
          <div className="flex items-start gap-4">
            {/* アバター */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-foreground">{displayName}</p>
                {/* 認証バッジ */}
                {user.kycStatus === "verified" && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                    eKYC済
                  </Badge>
                )}
                {user.phoneVerified && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                    SMS認証済
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 bg-purple-50">
                    メール認証済
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {user.email ?? "メール未設定"}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  申請日:{" "}
                  {user.singleCertificateUploadedAt
                    ? new Date(user.singleCertificateUploadedAt).toLocaleString("ja-JP")
                    : "不明"}
                </span>
              </div>
            </div>
          </div>

          {/* 証明書画像サムネイル */}
          {user.singleCertificateUrl && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">提出書類</p>
              <div
                className="relative w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer group border border-border"
                onClick={() => setPreviewOpen(true)}
              >
                <img
                  src={user.singleCertificateUrl}
                  alt="独身証明書"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs">画像を読み込めませんでした</div>';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="bg-white/90 rounded-full p-2">
                    <ZoomIn className="w-5 h-5 text-foreground" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(true)}
                className="mt-1 text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                拡大して確認する
              </button>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => openReview(true)}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              承認する
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => openReview(false)}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              却下する
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 画像プレビューモーダル */}
      {user.singleCertificateUrl && (
        <ImagePreviewModal
          url={user.singleCertificateUrl}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* 審査ダイアログ */}
      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        userId={user.id}
        userName={displayName}
        approved={reviewApproved}
        onSuccess={onReviewed}
      />
    </>
  );
}

// ─── 審査済みカード ────────────────────────────────────────────
function ReviewedCertCard({ user }: { user: UserCert }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const displayName = user.displayName ?? user.name ?? `ユーザー #${user.id}`;
  const isApproved = user.singleCertificateStatus === "approved";

  return (
    <>
      <Card
        className={`border ${
          isApproved
            ? "border-green-200 bg-green-50/30"
            : "border-red-200 bg-red-50/30"
        }`}
      >
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-3">
            {/* アバター */}
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-medium text-foreground text-sm">{displayName}</p>
                <Badge
                  className={`text-xs ${
                    isApproved
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                  variant="outline"
                >
                  {isApproved ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      承認済み
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      却下済み
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.email ?? "メール未設定"}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>
                  審査日:{" "}
                  {user.singleCertificateReviewedAt
                    ? new Date(user.singleCertificateReviewedAt).toLocaleString("ja-JP")
                    : "不明"}
                </span>
              </div>

              {/* 却下理由 */}
              {!isApproved && user.singleCertificateRejectReason && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <span className="font-medium">却下理由：</span>
                  {user.singleCertificateRejectReason}
                </div>
              )}

              {/* 証明書サムネイル */}
              {user.singleCertificateUrl && (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  提出書類を確認する
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {user.singleCertificateUrl && (
        <ImagePreviewModal
          url={user.singleCertificateUrl}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

// ─── メインページ ────────────────────────────────────────────
export default function AdminSingleCertificates() {
  usePageTitle("独身証明書審査 - 管理者");
  const { user, isAuthenticated, loading } = useAuth();
  const [reviewedOffset, setReviewedOffset] = useState(0);
  const REVIEWED_LIMIT = 20;
  const [guidelineOpen, setGuidelineOpen] = useState(false);

  const {
    data: pendingList,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = trpc.admin.listPendingSingleCerts.useQuery();

  const {
    data: reviewedList,
    isLoading: reviewedLoading,
  } = trpc.admin.listReviewedSingleCerts.useQuery({
    limit: REVIEWED_LIMIT,
    offset: reviewedOffset,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <p className="text-muted-foreground">ログインが必要です</p>
        <a href={getLoginUrl()}>
          <Button>ログイン</Button>
        </a>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-lg font-semibold text-foreground">管理者権限が必要です</p>
        <Link href="/dashboard">
          <Button variant="outline">マイページへ戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-8 max-w-3xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              管理画面へ
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              独身証明書 審査
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ユーザーが提出した独身証明書を確認し、承認または却下してください。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuidelineOpen(true)}
            className="shrink-0 flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
          >
            <BookOpen className="w-4 h-4" />
            審査ガイドライン
          </Button>
        </div>

        {/* 審査ガイドラインモーダル */}
        <ReviewGuidelineModal
          open={guidelineOpen}
          onClose={() => setGuidelineOpen(false)}
        />

        {/* 統計カード */}
        <StatsCards />

        {/* タブ */}
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              <Clock className="w-4 h-4 mr-1.5" />
              審査待ち
              {pendingList && pendingList.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {pendingList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex-1">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              審査済み
            </TabsTrigger>
          </TabsList>

          {/* 審査待ちタブ */}
          <TabsContent value="pending" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pendingLoading
                  ? "読み込み中..."
                  : `${pendingList?.length ?? 0} 件の審査待ち`}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetchPending()}
                disabled={pendingLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${pendingLoading ? "animate-spin" : ""}`} />
                更新
              </Button>
            </div>

            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-5">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-32" />
                          <div className="h-3 bg-muted rounded w-48" />
                          <div className="h-32 bg-muted rounded mt-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingList && pendingList.length > 0 ? (
              <div className="space-y-4">
                {pendingList.map((u) => (
                  <PendingCertCard
                    key={u.id}
                    user={u as UserCert}
                    onReviewed={() => refetchPending()}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-base font-medium text-foreground">
                    審査待ちの書類はありません
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    すべての独身証明書が審査済みです。
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 審査済みタブ */}
          <TabsContent value="reviewed" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {reviewedLoading
                  ? "読み込み中..."
                  : `${reviewedList?.length ?? 0} 件表示中`}
              </p>
            </div>

            {reviewedLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-32" />
                          <div className="h-3 bg-muted rounded w-48" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviewedList && reviewedList.length > 0 ? (
              <>
                <div className="space-y-3">
                  {reviewedList.map((u) => (
                    <ReviewedCertCard key={u.id} user={u as UserCert} />
                  ))}
                </div>

                {/* ページネーション */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewedOffset === 0}
                    onClick={() =>
                      setReviewedOffset(Math.max(0, reviewedOffset - REVIEWED_LIMIT))
                    }
                  >
                    前へ
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {reviewedOffset + 1} 〜 {reviewedOffset + (reviewedList.length ?? 0)} 件
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(reviewedList?.length ?? 0) < REVIEWED_LIMIT}
                    onClick={() => setReviewedOffset(reviewedOffset + REVIEWED_LIMIT)}
                  >
                    次へ
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-base font-medium text-foreground">
                    審査済みの書類はありません
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    審査を完了すると、ここに履歴が表示されます。
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
