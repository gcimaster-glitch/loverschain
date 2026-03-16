import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Heart,
  Fingerprint,
  Link2,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Copy,
  ExternalLink,
  XCircle,
  AlertCircle,
  HandshakeIcon,
  Undo2,
  Sparkles,
  History,
  ChevronRight,
  Star,
  CalendarDays,
  Lock,
  CreditCard,
  GraduationCap,
  Gem,
  Users,
  Search,
  Mail,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { MilestoneCountdown } from "@/components/MilestoneCountdown";
import { calcElapsedDays } from "@shared/milestone";
import { PLAN_PRICES } from "@shared/ranks";
import { PartnerStatusResultModal } from "@/components/PartnerStatusResultModal";
import { PartnerStatusTimeline } from "@/components/PartnerStatusTimeline";

// ─── ハートアニメーション ─────────────────────────────────────────
function FloatingHearts() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            opacity: 0.08 + i * 0.02,
            fontSize: `${10 + i * 4}px`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i}s`,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  );
}

// ─── 交際日数カウンター ───────────────────────────────────────────
function LoveCounter({
  startedAt,
  partnerName,
  myName,
  myAvatarUrl,
  partnerAvatarUrl,
  onAvatarChange,
}: {
  startedAt: Date | string;
  partnerName: string;
  myName: string;
  myAvatarUrl?: string | null;
  partnerAvatarUrl?: string | null;
  onAvatarChange?: () => void;
}) {
  const days = calcElapsedDays(new Date(startedAt));
  const startDate = new Date(startedAt);
  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success("写真を更新しました");
      onAvatarChange?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast.error("画像サイズは2MB以内にしてください");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        uploadAvatar.mutate({ dataUrl });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 text-white text-center"
      style={{
        background: "linear-gradient(135deg, #c2185b 0%, #9c27b0 50%, #673ab7 100%)",
      }}
    >
      <FloatingHearts />
      <div className="relative z-10">
        {/* 二人の名前・アバター */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* 自分のアバター（クリックで変更可） */}
          <div className="text-center">
            <button
              onClick={handleAvatarClick}
              disabled={uploadAvatar.isPending}
              className="relative w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1 border-2 border-white/40 hover:border-white/70 transition-all group overflow-hidden cursor-pointer"
              title="写真を変更"
            >
              {uploadAvatar.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : myAvatarUrl ? (
                <>
                  <img src={myAvatarUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">変更</span>
                  </div>
                </>
              ) : (
                <>
                  <User className="w-7 h-7 text-white" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">写真</span>
                  </div>
                </>
              )}
            </button>
            <p className="text-sm font-medium text-white/90 max-w-[80px] truncate">{myName}</p>
          </div>
          <div className="flex flex-col items-center">
            <Heart className="w-8 h-8 text-pink-300 fill-pink-300 animate-pulse" />
          </div>
          {/* パートナーのアバター（表示のみ） */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1 border-2 border-white/40 overflow-hidden">
              {partnerAvatarUrl ? (
                <img src={partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <p className="text-sm font-medium text-white/90 max-w-[80px] truncate">{partnerName}</p>
          </div>
        </div>
        {/* 交際日数 */}
        <div className="mb-2">
          <span
            className="font-black text-white"
            style={{ fontSize: "clamp(3rem, 15vw, 5rem)", lineHeight: 1 }}
          >
            {days.toLocaleString("ja-JP")}
          </span>
          <span className="text-2xl font-bold text-white/80 ml-2">日目</span>
        </div>
        <p className="text-white/70 text-sm">
          {startDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })} から
        </p>
        {/* 写真変更ヒント */}
        {!myAvatarUrl && (
          <p className="text-white/40 text-xs mt-2">↑ アイコンをタップして写真を設定</p>
        )}
      </div>
    </div>
  );
}

// ─── 証明書ステータスカード ───────────────────────────────────────
function CertificateStatusCard({ partnership }: { partnership: NonNullable<PartnershipData> }) {
  if (partnership.blockchainTxHash && partnership.certificateUrl) {
    return (
      <Link href={`/certificate/${partnership.id}`}>
        <div className="group cursor-pointer rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">ブロックチェーン証明書</p>
                <p className="text-xs text-emerald-600">発行済み・改ざん不可</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span className="text-xs font-medium">証明書を見る</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <div>
          <p className="font-semibold text-amber-800 text-sm">証明書を発行中...</p>
          <p className="text-xs text-amber-600">ブロックチェーンに記録しています。しばらくお待ちください。</p>
        </div>
      </div>
    </div>
  );
}

// ─── 解消ステータスバナー ────────────────────────────────────────────
function DissolutionStatusBanner({
  partnershipStatus,
  isRequester,
  dissolutionType,
  coolingOffEndsAt,
  onConfirm,
  onCancel,
  isConfirmPending,
  isCancelPending,
}: {
  partnershipStatus: string;
  isRequester: boolean;
  dissolutionType?: string | null;
  coolingOffEndsAt?: Date | null;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirmPending: boolean;
  isCancelPending: boolean;
}) {
  if (partnershipStatus === "white") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600">パートナーシップ解消済み</p>
            <p className="text-xs text-gray-400 mt-0.5">
              新しいパートナーと証明を始められます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (partnershipStatus === "gray") {
    const coolingEnd = coolingOffEndsAt ? new Date(coolingOffEndsAt) : null;
    const daysLeft = coolingEnd
      ? Math.max(0, Math.ceil((coolingEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">合意解消 — クーリングオフ期間中</p>
            <p className="text-xs text-blue-700 mt-1">
              {isRequester ? "あなたが合意解消を申請しました。" : "パートナーが合意解消を申請しました。"}
              {daysLeft !== null && <span className="font-semibold"> 残り{daysLeft}日</span>}
              でパートナーシップが解消されます。
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isRequester ? (
            <Button size="sm" variant="outline" className="text-blue-700 border-blue-300" onClick={onCancel} disabled={isCancelPending}>
              <Undo2 className="w-3 h-3 mr-1.5" />申請を取り消す
            </Button>
          ) : (
            <>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onConfirm} disabled={isConfirmPending}>
                <CheckCircle className="w-3 h-3 mr-1.5" />解消に同意する
              </Button>
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-300" onClick={onCancel} disabled={isCancelPending}>
                <Undo2 className="w-3 h-3 mr-1.5" />取り消しを要請する
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (partnershipStatus === "yellow") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">一方的解消申請中</p>
            <p className="text-xs text-amber-700 mt-1">
              {isRequester
                ? "あなたが一方的解消を申請しました。パートナーの承認を待っています。"
                : "パートナーが一方的解消を申請しました。承認するか、取り消しを要請できます。"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isRequester ? (
            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={onCancel} disabled={isCancelPending}>
              <Undo2 className="w-3 h-3 mr-1.5" />申請を取り消す
            </Button>
          ) : (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={onConfirm} disabled={isConfirmPending}>
              <CheckCircle className="w-3 h-3 mr-1.5" />解消に同意する
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── 解消ダイアログ ────────────────────────────────────────────────
function DissolutionDialog({
  open,
  onClose,
  type,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  type: "mutual" | "unilateral";
  onSubmit: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const isMutual = type === "mutual";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMutual ? (
              <><HandshakeIcon className="w-5 h-5 text-blue-500" />合意解消の申請</>
            ) : (
              <><AlertTriangle className="w-5 h-5 text-amber-500" />一方的解消の申請</>
            )}
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-1">
            {isMutual ? (
              <>
                <p><strong>合意解消</strong>は、二人で話し合って解消する方法です。</p>
                <p className="text-sm">申請後、<strong>14日間のクーリングオフ期間</strong>が設けられます。期間中は双方が申請を取り消すことができます。</p>
              </>
            ) : (
              <>
                <p><strong>一方的解消</strong>は、相手の同意なしに解消を申請する方法です。</p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  ⚠️ 一方的解消は証明書の記録に残ります。可能であれば合意解消をお選びください。
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">解消理由（任意）</Label>
            <Textarea
              id="reason"
              placeholder={isMutual ? "例：お互いの合意のもと、円満に解消することにしました。" : "例：連絡が取れなくなりました。"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{reason.length}/500</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>キャンセル</Button>
          <Button
            onClick={() => onSubmit(reason)}
            disabled={isPending}
            className={isMutual ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
          >
            {isPending ? "申請中..." : isMutual ? "合意解消を申請する" : "一方的解消を申請する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── パートナーシップデータ型 ─────────────────────────────────────
type PartnershipData = {
  id: number;
  status: string;
  user1Id: number;
  user2Id: number;
  startedAt: Date;
  endedAt?: Date | null;
  blockchainTxHash?: string | null;
  certificateUrl?: string | null;
  dissolutionRequestedBy?: number | null;
  dissolutionType?: string | null;
  coolingOffEndsAt?: Date | null;
  partner?: {
    id: number;
    displayName?: string | null;
    avatarUrl?: string | null;
    kycStatus: string;
  } | null;
} | null;

// ─── アクティブパートナーシップビュー ────────────────────────
function ActivePartnershipView({
  partnership,
  currentUserId,
  myName,
  myAvatarUrl,
  onAvatarChange,
  pendingPlanType,
  onOpenPlanDialog,
  isCheckoutPending,
}: {
  partnership: NonNullable<PartnershipData>;
  currentUserId?: number;
  myName: string;
  myAvatarUrl?: string | null;
  onAvatarChange?: () => void;
  pendingPlanType?: string | null;
  onOpenPlanDialog?: () => void;
  isCheckoutPending?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"mutual" | "unilateral">("mutual");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const createInvitation = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      toast.success("招待キーを発行しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const requestDissolution = trpc.partnership.requestDissolution.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.partnership.mine.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmDissolution = trpc.partnership.confirmDissolution.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.partnership.mine.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelDissolution = trpc.partnership.cancelDissolution.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.partnership.mine.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("クリップボードにコピーしました");
  };

  const isRequester = partnership.dissolutionRequestedBy === currentUserId;
  const isDissolving = partnership.status === "yellow" || partnership.status === "gray";
  const isActive = partnership.status === "green";
  const partnerName = partnership.partner?.displayName ?? "パートナー";

  return (
    <div className="space-y-4">
      {/* 解消ステータスバナー */}
      {(isDissolving || partnership.status === "white") && (
        <DissolutionStatusBanner
          partnershipStatus={partnership.status}
          isRequester={isRequester}
          dissolutionType={partnership.dissolutionType}
          coolingOffEndsAt={partnership.coolingOffEndsAt}
          onConfirm={() => confirmDissolution.mutate()}
          onCancel={() => cancelDissolution.mutate()}
          isConfirmPending={confirmDissolution.isPending}
          isCancelPending={cancelDissolution.isPending}
        />
      )}

      {/* 交際日数ヒーロー */}
      {isActive && (
        <LoveCounter
          startedAt={partnership.startedAt}
          myName={myName}
          partnerName={partnerName}
          myAvatarUrl={myAvatarUrl}
          partnerAvatarUrl={partnership.partner?.avatarUrl}
          onAvatarChange={onAvatarChange}
        />
      )}

      {/* 節目カウントダウン */}
      {isActive && (
        <MilestoneCountdown
          startedAt={partnership.startedAt}
          partnershipId={partnership.id}
        />
      )}

      {/* 証明書ステータス */}
      {partnership.status !== "white" && (
        <CertificateStatusCard partnership={partnership} />
      )}

      {/* パートナー情報 */}
      {partnership.partner && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">パートナー</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              {partnership.partner.avatarUrl ? (
                <img src={partnership.partner.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {partnership.partner.displayName ?? "名前未設定"}
              </p>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                {partnership.partner.kycStatus === "verified" ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> 本人確認済み
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="w-3 h-3" /> 本人確認中
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 招待URL表示 */}
      {inviteUrl && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">招待URL（パートナーに共有してください）</p>
          <div className="flex items-center gap-2">
            <code className="text-xs flex-1 truncate text-foreground bg-background rounded-lg px-3 py-2 border">{inviteUrl}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(inviteUrl)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="grid grid-cols-2 gap-3">
        {partnership.status !== "white" && (
          <Link href={`/certificate/${partnership.id}`} className="col-span-2 sm:col-span-1">
            <Button variant="outline" className="w-full rounded-xl h-11" size="sm">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              証明書を見る
            </Button>
          </Link>
        )}
        {isActive && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => { setDialogType("mutual"); setDialogOpen(true); }}
              disabled={requestDissolution.isPending}
            >
              <HandshakeIcon className="w-4 h-4 mr-1.5" />
              合意解消
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => { setDialogType("unilateral"); setDialogOpen(true); }}
              disabled={requestDissolution.isPending}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              一方的解消
            </Button>
          </>
        )}
        {partnership.status === "white" && (
          pendingPlanType ? (
            <>
              <Button
                id="invite-section"
                size="sm"
                className="col-span-2 rounded-xl h-11 bg-primary text-primary-foreground"
                onClick={() => createInvitation.mutate({ origin: window.location.origin })}
                disabled={createInvitation.isPending}
              >
                <Link2 className="w-4 h-4 mr-2" />
                {createInvitation.isPending ? "発行中..." : "全額招待リンクを発行"}
              </Button>
              <Button
                size="sm"
                className="col-span-2 rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                onClick={() => createInvitation.mutate({ origin: window.location.origin, isSplitPayment: true })}
                disabled={createInvitation.isPending}
              >
                <Users className="w-4 h-4 mr-2" />
                {createInvitation.isPending ? "発行中..." : "割り勘招待リンクを発行"}
              </Button>
            </>
          ) : (
            <Button
              id="invite-section"
              size="sm"
              className="col-span-2 rounded-xl h-11"
              variant="outline"
              onClick={() => onOpenPlanDialog?.()}
              disabled={isCheckoutPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isCheckoutPending ? "処理中..." : "プランを選んで新しいパートナーを招待"}
            </Button>
          )
        )}
      </div>

      <DissolutionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={dialogType}
        onSubmit={(reason) => requestDissolution.mutate(
          { type: dialogType, reason: reason || undefined },
          { onSuccess: () => setDialogOpen(false) }
        )}
        isPending={requestDissolution.isPending}
      />
    </div>
  );
}

// ─── プラン選択ダイアログ ──────────────────────────────────────────
function PlanSelectDialog({
  open,
  onClose,
  onSelect,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (planType: "lover" | "engagement" | "student") => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState<"lover" | "engagement" | "student">("lover");

  const plans: { key: "lover" | "engagement" | "student"; icon: React.ReactNode; color: string; badge?: string }[] = [
    {
      key: "lover",
      icon: <Heart className="w-5 h-5" />,
      color: "border-pink-300 bg-pink-50 text-pink-700",
    },
    {
      key: "engagement",
      icon: <Gem className="w-5 h-5" />,
      color: "border-purple-300 bg-purple-50 text-purple-700",
      badge: "特別",
    },
    {
      key: "student",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "border-blue-300 bg-blue-50 text-blue-700",
      badge: "割引",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-pink-500" />
            プランを選択してください
          </DialogTitle>
          <DialogDescription>
            招待リンクを発行するには、先にプランのお支払いが必要です。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {plans.map((plan) => {
            const price = PLAN_PRICES[plan.key];
            const isSelected = selected === plan.key;
            return (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-50 shadow-sm"
                    : "border-border bg-card hover:border-pink-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${plan.color}`}>
                      {plan.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">{price.label}</p>
                        {plan.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{price.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-base font-black text-foreground">¥{price.pairPrice.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">ペア・税込</p>
                  </div>
                </div>
                {plan.key === "student" && (
                  <p className="text-[10px] text-blue-600 mt-1.5 pl-11">{PLAN_PRICES.student.studentNote}</p>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>キャンセル</Button>
          <Button
            onClick={() => onSelect(selected)}
            disabled={isPending}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
          >
            {isPending ? "処理中..." : `¥${PLAN_PRICES[selected].pairPrice.toLocaleString()} で決済する →`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 「次の一歩」カード（未パートナー状態） ───────────────────────
function NextActionCard({
  kycStatus,
  pendingPlanType,
  onCreateInvite,
  isCreatingInvite,
  onOpenPlanDialog,
  isCheckoutPending,
}: {
  kycStatus?: string;
  pendingPlanType?: string | null;
  onCreateInvite: () => void;
  isCreatingInvite: boolean;
  onOpenPlanDialog: () => void;
  isCheckoutPending: boolean;
}) {
  const [, navigate] = useLocation();

  if (!kycStatus || kycStatus === "unverified" || kycStatus === "not_started" || kycStatus === "failed") {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)" }}
      >
        <FloatingHearts />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">愛の証明を始めましょう</h2>
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            まず、あなたが本人であることを確認します。<br />
            身分証1枚で、約3〜5分で完了します。
          </p>
          <Button
            size="lg"
            className="bg-white text-pink-700 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
            onClick={() => navigate("/kyc")}
          >
            本人確認を始める →
          </Button>
        </div>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-500 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <h2 className="text-xl font-bold text-blue-800 mb-2">本人確認の審査中です</h2>
        <p className="text-blue-600 text-sm mb-4">通常1〜3分で完了します。このページは自動的に更新されます。</p>
        <Link href="/kyc">
          <Button variant="outline" className="border-blue-300 text-blue-700 rounded-full">
            審査状況を確認する
          </Button>
        </Link>
      </div>
    );
  }

  // KYC済み・決済済み → 招待リンクを作る
  if (pendingPlanType) {
    const planLabel = PLAN_PRICES[pendingPlanType as "lover" | "engagement" | "student"]?.label ?? "プラン";
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, #c2185b 0%, #9c27b0 50%, #673ab7 100%)" }}
      >
        <FloatingHearts />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">{planLabel} — 決済完了</span>
          </div>
          <h2 className="text-2xl font-black mb-2">大切な人を招待しましょう</h2>
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            招待リンクをLINEやメールで送るだけ。<br />
            パートナーが登録すると、二人の証明書が発行されます。
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-700 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
            onClick={onCreateInvite}
            disabled={isCreatingInvite}
            id="invite-section"
          >
            <Heart className="w-4 h-4 mr-2 fill-current" />
            {isCreatingInvite ? "発行中..." : "招待リンクを作る →"}
          </Button>
          <p className="text-white/60 text-xs mt-3">
            または <Link href="/invite" className="underline text-white/80">招待コードを入力する</Link>
          </p>
        </div>
      </div>
    );
  }

  // KYC済み・未決済 → プラン選択へ誘導
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 text-white"
      style={{ background: "linear-gradient(135deg, #c2185b 0%, #9c27b0 50%, #673ab7 100%)" }}
    >
      <FloatingHearts />
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black mb-2">プランを選んで証明書を発行</h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          本人確認が完了しました。<br />
          プランを選択して決済すると、招待リンクが発行されます。
        </p>
        <Button
          size="lg"
          className="bg-white text-purple-700 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
          onClick={onOpenPlanDialog}
          disabled={isCheckoutPending}
          id="invite-section"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {isCheckoutPending ? "処理中..." : "プランを選んで決済する →"}
        </Button>
        <p className="text-white/60 text-xs mt-3">
          または <Link href="/invite" className="underline text-white/80">招待コードを入力する</Link>
        </p>
      </div>
    </div>
  );
}

// ─── メインページ ────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  usePageTitle("マイページ - 恋人証明");
  const [, navigate] = useLocation();

  const { data: profile, refetch: refetchProfile } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: partnership } = trpc.partnership.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: pastPartnerships } = trpc.partnership.pastList.useQuery(undefined, { enabled: isAuthenticated });
  const { data: subscriptionData, refetch: refetchSubscription } = trpc.payment.subscriptionStatus.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  // プラン選択ダイアログ
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  // 招待URLの表示用state（決済完了後に自動生成したもの）
  const [autoInviteUrl, setAutoInviteUrl] = useState<string | null>(null);
  // パートナーステータス確認ダイアログ
  const [partnerStatusDialogOpen, setPartnerStatusDialogOpen] = useState(false);
  const [partnerStatusEmail, setPartnerStatusEmail] = useState("");
  const [partnerStatusSent, setPartnerStatusSent] = useState(false);
  // 改善案1: ビジュアルカードモーダル
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] = useState<{
    result: "single" | "yellow" | "red" | "not_registered";
    targetEmail: string;
    checkedAt: Date;
  } | null>(null);
  // 改善案3: KYC誘導モーダル
  const [kycGuideModalOpen, setKycGuideModalOpen] = useState(false);
  const requestPartnerStatusCheck = trpc.partnerStatus.requestCheck.useMutation({
    onSuccess: () => {
      setPartnerStatusSent(true);
      toast.success("確認メールを送信しました");
      refetchInquiries();
    },
    onError: (e) => toast.error(e.message),
  });
  // ポーリング: ダイアログ外でも常時有効（KYC済みユーザーはpending中は30秒ごとに再取得）
  const [hasPendingInquiry, setHasPendingInquiry] = useState(false);
  // 未読結果バッジ: 既読みになっていないconsentedの問い合わせ数
  const [unreadResultCount, setUnreadResultCount] = useState(0);
  const [seenResultIds, setSeenResultIds] = useState<Set<number>>(new Set());
  const { data: myPartnerStatusInquiries, refetch: refetchInquiries } = trpc.partnerStatus.getMyInquiries.useQuery(
    undefined,
    {
      // KYC済みユーザーは常時有効（ダイアログ開閉に関わらず）
      enabled: isAuthenticated && profile?.kycStatus === "verified",
      // pending中は30秒ごとにポーリング
      refetchInterval: hasPendingInquiry ? 30_000 : false,
    }
  );
  // hasPendingInquiryをmyPartnerStatusInquiriesの変化に応じて更新
  useEffect(() => {
    const pending = myPartnerStatusInquiries?.some((inq) => inq.status === "pending") ?? false;
    setHasPendingInquiry(pending);
  }, [myPartnerStatusInquiries]);
  // 未読結果バッジ数を更新（seenResultIdsに含まれていないconsentedの数）
  useEffect(() => {
    if (!myPartnerStatusInquiries) return;
    const count = myPartnerStatusInquiries.filter(
      (inq) => inq.status === "consented" && inq.result && !seenResultIds.has(inq.id)
    ).length;
    setUnreadResultCount(count);
  }, [myPartnerStatusInquiries, seenResultIds]);
  // 前回のデータと比較して、pendingがconsentedに変わった瞬間にビジュアルカードを自動表示
  const prevInquiriesRef = useRef<typeof myPartnerStatusInquiries>(undefined);
  useEffect(() => {
    if (!myPartnerStatusInquiries || !prevInquiriesRef.current) {
      prevInquiriesRef.current = myPartnerStatusInquiries;
      return;
    }
    const prev = prevInquiriesRef.current;
    for (const inq of myPartnerStatusInquiries) {
      const prevInq = prev.find((p) => p.id === inq.id);
      if (prevInq?.status === "pending" && inq.status === "consented" && inq.result) {
        // pending → consented に変化 → ビジュアルカードを自動表示
        setResultModalData({
          result: inq.result as "single" | "yellow" | "red" | "not_registered",
          targetEmail: inq.targetEmail,
          checkedAt: new Date(inq.createdAt),
        });
        setResultModalOpen(true);
        toast.success(`${inq.targetEmail} の判定結果が届きました！`);
      }
    }
    prevInquiriesRef.current = myPartnerStatusInquiries;
  }, [myPartnerStatusInquiries]);

  const createPortalSession = trpc.payment.createPortalSession.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e) => toast.error(e.message),
  });

  const createSubscriptionCheckout = trpc.payment.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data?.url) {
        toast.info("Stripeの決済ページに移動します");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  // パートナーシップ決済Checkout
  const createPartnershipCheckout = trpc.payment.createPartnershipCheckout.useMutation({
    onSuccess: (data) => {
      setPlanDialogOpen(false);
      toast.info("Stripeの決済ページに移動します");
      window.open(data.url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  const createInvitationForBanner = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      setAutoInviteUrl(data.inviteUrl);
      toast.success("招待リンクを発行しました！パートナーに送ってください");
      navigator.clipboard.writeText(data.inviteUrl).catch(() => {});
      toast.info("招待URLをクリップボードにコピーしました");
    },
    onError: (e) => toast.error(e.message),
  });

  // 決済完了後のリダイレクト検知（?payment=success&plan=xxx または ?subscription=success）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const planParam = params.get("plan");
    const subscriptionStatus = params.get("subscription");
    if ((paymentStatus === "success" && planParam && isAuthenticated) || (subscriptionStatus === "success" && isAuthenticated)) {
      // URLパラメータをクリア
      navigate("/dashboard", { replace: true });
      // サブスクリプション状態を再取得
      refetchSubscription();
      // profileを再取得してpendingPlanTypeが設定されているか確認
      refetchProfile().then((result) => {
        const freshProfile = result.data;
        if (subscriptionStatus === "success") {
          toast.success("サブスクリプションが有効になりました！");
        } else if (freshProfile?.pendingPlanType) {
          toast.success("決済が完了しました！招待リンクを発行できます");
        } else {
          toast.success("決済が完了しました！");
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const hasActivePartnership = partnership && partnership.status !== "white";
  const myName = profile?.displayName ?? user?.name ?? "あなた";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #e91e8c, #9c27b0)" }}
        >
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-black text-foreground">恋人証明</h1>
        <p className="text-muted-foreground text-center">ログインして、二人の愛を証明しましょう</p>
        <a href={getLoginUrl()}>
          <Button size="lg" className="bg-primary text-primary-foreground rounded-full px-8 font-bold">
            ログイン / 新規登録
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-6 max-w-lg mx-auto space-y-5">

        {/* ── アクティブパートナーシップ表示 ── */}
        {hasActivePartnership ? (
          <>
            <ActivePartnershipView
              partnership={partnership as NonNullable<PartnershipData>}
              currentUserId={user?.id ? Number(user.id) : undefined}
              myName={myName}
              myAvatarUrl={profile?.avatarUrl}
              onAvatarChange={() => utils.user.me.invalidate()}
              pendingPlanType={profile?.pendingPlanType}
              onOpenPlanDialog={() => setPlanDialogOpen(true)}
              isCheckoutPending={createPartnershipCheckout.isPending}
            />
            <PlanSelectDialog
              open={planDialogOpen}
              onClose={() => setPlanDialogOpen(false)}
              onSelect={(planType) => createPartnershipCheckout.mutate({ planType, origin: window.location.origin })}
              isPending={createPartnershipCheckout.isPending}
            />
          </>
        ) : (
          /* ── 次のアクションカード（パートナーなし） ── */
          <>
            <NextActionCard
              kycStatus={profile?.kycStatus}
              pendingPlanType={profile?.pendingPlanType}
              onCreateInvite={() => createInvitationForBanner.mutate({ origin: window.location.origin })}
              isCreatingInvite={createInvitationForBanner.isPending}
              onOpenPlanDialog={() => setPlanDialogOpen(true)}
              isCheckoutPending={createPartnershipCheckout.isPending}
            />
            {/* パートナーステータス事前確認ボタン */}
            {profile?.kycStatus === "verified" ? (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors text-left relative"
                onClick={() => {
                  // ダイアログを開く: 結果があれば即度タイムライン表示、なければ入力画面
                  const hasResults = myPartnerStatusInquiries && myPartnerStatusInquiries.length > 0;
                  setPartnerStatusSent(hasResults ? true : false);
                  setPartnerStatusEmail("");
                  setPartnerStatusDialogOpen(true);
                  // バッジをクリア（見た結果を既読みにする）
                  if (myPartnerStatusInquiries) {
                    const newSeen = new Set(seenResultIds);
                    myPartnerStatusInquiries
                      .filter((inq) => inq.status === "consented" && inq.result)
                      .forEach((inq) => newSeen.add(inq.id));
                    setSeenResultIds(newSeen);
                  }
                }}
              >
                {/* 未読バッジ */}
                {unreadResultCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1 z-10 shadow-md animate-bounce">
                    {unreadResultCount}
                  </span>
                )}
                {hasPendingInquiry && unreadResultCount === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white z-10 animate-pulse" />
                )}
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-800">パートナーステータスの事前確認</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    {unreadResultCount > 0
                      ? `🟢 ${unreadResultCount}件の判定結果が届いています！`
                      : hasPendingInquiry
                      ? "⏳ 回答待ちの問い合わせがあります"
                      : "相手がシングルか確認できます（相手の同意が必要）"
                    }
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
              </button>
            ) : (
              /* 改善案3: KYC未完了ユーザー向けグレーアウトボタン */
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setKycGuideModalOpen(true)}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 relative">
                  <Search className="w-4 h-4 text-gray-400" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-400">パートナーステータスの事前確認</p>
                  <p className="text-xs text-gray-400 mt-0.5">本人確認（eKYC）が完了すると利用できます</p>
                </div>
                <Lock className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            )}

            {/* 決済完了後に自動生成された招待URL表示 */}
            {autoInviteUrl && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">招待URL（パートナーに共有してください）</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate text-foreground bg-background rounded-lg px-3 py-2 border">{autoInviteUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(autoInviteUrl); toast.success("コピーしました"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <PlanSelectDialog
              open={planDialogOpen}
              onClose={() => setPlanDialogOpen(false)}
              onSelect={(planType) => createPartnershipCheckout.mutate({ planType, origin: window.location.origin })}
              isPending={createPartnershipCheckout.isPending}
            />
          </>
        )}

        {/* パートナーステータス事前確認ダイアログ */}
        <Dialog open={partnerStatusDialogOpen} onOpenChange={(open) => { setPartnerStatusDialogOpen(open); if (!open) { setPartnerStatusSent(false); setPartnerStatusEmail(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-600" />
                パートナーステータスの事前確認
              </DialogTitle>
              <DialogDescription>
                相手のメールアドレスに確認メールを送信します。相手が同意すると、シングル／イエロー／レッドの判定結果が開示されます。
              </DialogDescription>
            </DialogHeader>
            {!partnerStatusSent ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="partner-email">確認したい相手のメールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="partner-email"
                      type="email"
                      placeholder="partner@example.com"
                      value={partnerStatusEmail}
                      onChange={(e) => setPartnerStatusEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-700 space-y-1">
                  <p className="font-semibold">判定基準：</p>
                  <p>🟢 <strong>シングル</strong>：現在パートナーなし</p>
                  <p>🟡 <strong>イエロー</strong>：90日以内に交際解消あり</p>
                  <p>🔴 <strong>レッド</strong>：現在交際中</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPartnerStatusDialogOpen(false)}>キャンセル</Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => requestPartnerStatusCheck.mutate({ targetEmail: partnerStatusEmail, origin: window.location.origin })}
                    disabled={!partnerStatusEmail || requestPartnerStatusCheck.isPending}
                  >
                    {requestPartnerStatusCheck.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
                    ) : (
                      <><Mail className="w-4 h-4 mr-2" />確認メールを送る</>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* 改善案2: タイムライン進行状況 */}
                {myPartnerStatusInquiries && myPartnerStatusInquiries.length > 0 && (() => {
                  // 最新の問い合わせをタイムライン表示
                  const latest = myPartnerStatusInquiries[0];
                  return (
                    <PartnerStatusTimeline
                      targetEmail={latest.targetEmail}
                      status={latest.status as "pending" | "consented" | "declined" | "expired"}
                      result={latest.result as "single" | "yellow" | "red" | "not_registered" | null}
                      resultLabel={latest.resultLabel}
                      expiresAt={new Date(latest.expiresAt)}
                      onViewResult={() => {
                        if (latest.result) {
                          setResultModalData({
                            result: latest.result as "single" | "yellow" | "red" | "not_registered",
                            targetEmail: latest.targetEmail,
                            checkedAt: new Date(latest.createdAt),
                          });
                          setResultModalOpen(true);
                        }
                      }}
                    />
                  );
                })()}
                {/* 過去の問い合わせ履歴（最新以外） */}
                {myPartnerStatusInquiries && myPartnerStatusInquiries.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">過去の問い合わせ履歴</p>
                    {myPartnerStatusInquiries.slice(1, 5).map((inq) => (
                      <button
                        key={inq.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-sm hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          if (inq.result) {
                            setResultModalData({
                              result: inq.result as "single" | "yellow" | "red" | "not_registered",
                              targetEmail: inq.targetEmail,
                              checkedAt: new Date(inq.createdAt),
                            });
                            setResultModalOpen(true);
                          }
                        }}
                        disabled={!inq.result}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs text-muted-foreground">{inq.targetEmail}</p>
                          <p className="text-xs mt-0.5">
                            {inq.status === "pending" && <span className="text-amber-600">回答待ち</span>}
                            {inq.status === "consented" && (
                              <span className={`font-bold ${
                                inq.result === "single" ? "text-green-600" :
                                inq.result === "yellow" ? "text-amber-600" :
                                inq.result === "red" ? "text-red-600" : "text-gray-600"
                              }`}>
                                {inq.result === "single" && "🟢 "}
                                {inq.result === "yellow" && "🟡 "}
                                {inq.result === "red" && "🔴 "}
                                {inq.resultLabel}
                              </span>
                            )}
                            {inq.status === "declined" && <span className="text-gray-500">拒否されました</span>}
                            {inq.status === "expired" && <span className="text-gray-400">期限切れ</span>}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">{new Date(inq.createdAt).toLocaleDateString("ja-JP")}</p>
                      </button>
                    ))}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setPartnerStatusSent(false); setPartnerStatusEmail(""); }}>別のアドレスを確認</Button>
                  <Button onClick={() => setPartnerStatusDialogOpen(false)}>閉じる</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── 本人確認済みバッジ（パートナーあり時のみ表示） ── */}
        {hasActivePartnership && profile?.kycStatus === "verified" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-700 font-medium">本人確認済み</span>
          </div>
        )}

        {/* ── プッシュ通知バナー ── */}
        <PushNotificationBanner />

        {/* ── プラン情報 ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {subscriptionData?.hasSubscription
                    ? subscriptionData.planName
                    : profile?.pendingPlanType
                    ? ({
                        lover: "恋人証明プラン（支払い済み）",
                        engagement: "婚約証明プラン（支払い済み）",
                        student: "学生割引プラン（支払い済み）",
                      }[profile.pendingPlanType] ?? "支払い済みプラン")
                    : "無料プラン"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscriptionData?.hasSubscription
                    ? `次回更新: ${subscriptionData.currentPeriodEnd ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString("ja-JP") : "—"}`
                    : profile?.pendingPlanType
                    ? "招待リンクを発行してパートナーを招待できます"
                    : "プレミアムでさらに特典が増えます"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Link href="/plans">
                <button className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                  プラン詳細 →
                </button>
              </Link>
              {subscriptionData?.hasSubscription ? (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={createPortalSession.isPending}
                  onClick={() => createPortalSession.mutate({ returnUrl: window.location.href })}
                >
                  {createPortalSession.isPending ? "読み込み中..." : "プラン管理"}
                </button>
              ) : (
                <button
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg"
                  disabled={createSubscriptionCheckout.isPending}
                  onClick={() => createSubscriptionCheckout.mutate({ origin: window.location.origin })}
                >
                  {createSubscriptionCheckout.isPending ? "処理中..." : "アップグレード"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── クイックメニュー ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: "/kyc", icon: <Fingerprint className="w-5 h-5" />, label: "本人確認", color: "text-orange-500 bg-orange-50" },
            { href: "/profile", icon: <User className="w-5 h-5" />, label: "プロフィール", color: "text-blue-500 bg-blue-50" },
            { href: "/verify", icon: <Shield className="w-5 h-5" />, label: "証明書確認", color: "text-emerald-500 bg-emerald-50" },
            { href: "/affiliates", icon: <Star className="w-5 h-5" />, label: "特典", color: "text-purple-500 bg-purple-50" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all cursor-pointer active:scale-95">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <p className="text-xs font-medium text-foreground text-center leading-tight">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 過去のパートナーシップ履歴 ── */}
        {pastPartnerships && pastPartnerships.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 px-1">
              <History className="w-4 h-4" />
              過去の証明履歴
            </h2>
            <div className="space-y-2">
              {pastPartnerships.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {(p as { partner?: { displayName?: string | null } | null }).partner?.displayName ?? "不明"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.startedAt).toLocaleDateString("ja-JP")}
                          {p.endedAt && ` 〜 ${new Date(p.endedAt).toLocaleDateString("ja-JP")}`}
                        </p>
                      </div>
                    </div>
                    {p.certificateUrl && (
                      <Link href={`/certificate/${p.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs shrink-0">
                          証明書 <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── セキュリティ表示 ── */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Lock className="w-3 h-3 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground/50">ブロックチェーンで保護されています</p>
        </div>

      </div>

      {/* 改善案1: パートナーステータス ビジュアルカードモーダル */}
      <PartnerStatusResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={resultModalData?.result ?? null}
        targetEmail={resultModalData?.targetEmail ?? ""}
        checkedAt={resultModalData?.checkedAt}
      />

      {/* 改善案3: KYC未完了ユーザー向け誘導モーダル */}
      <Dialog open={kycGuideModalOpen} onOpenChange={setKycGuideModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-500" />
              本人確認が必要です
            </DialogTitle>
            <DialogDescription>
              パートナーステータスの事前確認機能を使うには、本人確認（eKYC）が必要です。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 機能のプレビュー */}
            <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">この機能でできること</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🟢</span>
                  <div>
                    <p className="text-xs font-semibold text-purple-700">シングル判定</p>
                    <p className="text-xs text-purple-600">相手にパートナーがいないことを確認</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🟡</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-700">イエロー判定</p>
                    <p className="text-xs text-amber-600">90日以内に解消歴歴ありを確認</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <p className="text-xs font-semibold text-rose-700">レッド判定</p>
                    <p className="text-xs text-rose-600">現在交際中であることを確認</p>
                  </div>
                </div>
              </div>
            </div>
            {/* 所要時間 */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">所要時間：約3分</p>
                <p className="text-xs text-muted-foreground">マイナンバーカードで簡単に完了できます</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycGuideModalOpen(false)}>キャンセル</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => { setKycGuideModalOpen(false); navigate("/kyc"); }}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              今すぐ本人確認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
