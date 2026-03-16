import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  Upload,
  FileText,
  AlertTriangle,
  Heart,
  Loader2,
  Info,
  XCircle,
} from "lucide-react";

type CertStatus = "not_uploaded" | "pending" | "approved" | "rejected";

/* ─── ステータスバッジ ─── */
function StatusBadge({ status }: { status: CertStatus }) {
  const map = {
    not_uploaded: { label: "未提出", variant: "outline" as const, className: "text-gray-500 border-gray-300" },
    pending: { label: "審査中", variant: "outline" as const, className: "text-amber-600 border-amber-300 bg-amber-50" },
    approved: { label: "承認済み", variant: "default" as const, className: "bg-green-600 text-white" },
    rejected: { label: "却下", variant: "destructive" as const, className: "" },
  };
  const s = map[status];
  return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
}

/* ─── 独身証明書アップロードカード ─── */
export function SingleCertificateCard({
  certStatus,
  certUrl,
  onUploaded,
}: {
  certStatus: CertStatus;
  certUrl?: string | null;
  onUploaded?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.partnership.uploadSingleCertificate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onUploaded?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズは10MB以下にしてください");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("JPEG・PNG・WebP・PDFのみアップロード可能です");
      return;
    }

    setUploading(true);
    try {
      // FormDataでサーバーにアップロード
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/single-certificate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "アップロードに失敗しました" }));
        throw new Error(err.message ?? "アップロードに失敗しました");
      }

      const { url } = await res.json();
      await uploadMutation.mutateAsync({ fileUrl: url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "アップロードに失敗しました";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            独身証明書
          </CardTitle>
          <StatusBadge status={certStatus} />
        </div>
        <CardDescription className="text-sm">
          婚活中の方は、独身証明書をアップロードすることで「婚約中」ステータスを取得できます。
          既婚者の不正登録を防ぐ仕組みです。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 説明ボックス */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
            <Info className="w-4 h-4" />
            独身証明書とは？
          </div>
          <p className="text-xs text-purple-600 leading-relaxed">
            市区町村の役所で発行できる公的書類です。「婚姻していないこと」を証明します。
            本籍地の市区町村窓口またはコンビニのマルチコピー機で取得できます（手数料：300〜450円程度）。
          </p>
        </div>

        {/* ステータス別表示 */}
        {certStatus === "not_uploaded" && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">アップロード可能なファイル形式</p>
              <p>JPEG・PNG・WebP・PDF（最大10MB）</p>
              <p>発行から3ヶ月以内のものをご使用ください</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || uploadMutation.isPending}
            >
              {uploading || uploadMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />アップロード中...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />独身証明書をアップロード</>
              )}
            </Button>
          </div>
        )}

        {certStatus === "pending" && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">審査中です</p>
              <p className="text-xs text-amber-700 mt-1">
                書類を受け付けました。通常1〜3営業日以内に審査結果をお知らせします。
              </p>
              {certUrl && (
                <a
                  href={certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:underline mt-2 inline-block"
                >
                  アップロード済みファイルを確認する →
                </a>
              )}
            </div>
          </div>
        )}

        {certStatus === "approved" && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">承認されました</p>
              <p className="text-xs text-green-700 mt-1">
                独身証明書が承認されました。パートナーも承認されると「婚約中」ステータスに昇格できます。
              </p>
            </div>
          </div>
        )}

        {certStatus === "rejected" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">却下されました</p>
                <p className="text-xs text-red-700 mt-1">
                  書類の内容が確認できませんでした。以下を確認の上、再度アップロードしてください。
                </p>
                <ul className="text-xs text-red-600 mt-2 space-y-1">
                  <li>• 発行から3ヶ月以内の書類か</li>
                  <li>• 文字がはっきり読めるか</li>
                  <li>• 書類全体が写っているか</li>
                </ul>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || uploadMutation.isPending}
            >
              {uploading || uploadMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />アップロード中...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />再度アップロードする</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── 婚約申請カード ─── */
export function EngagementRequestCard({
  partnershipStatus,
  myCertStatus,
  partnerCertStatus,
  onRequested,
}: {
  partnershipStatus: string;
  myCertStatus: CertStatus;
  partnerCertStatus?: CertStatus;
  onRequested?: () => void;
}) {
  const requestEngagement = trpc.partnership.requestEngagement.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onRequested?.();
    },
    onError: (e) => toast.error(e.message),
  });

  // 婚約中ならすでに完了
  if (partnershipStatus === "engaged") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-4 flex items-center gap-3">
          <Heart className="w-5 h-5 text-amber-600 fill-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">婚約中ステータス</p>
            <p className="text-xs text-amber-700 mt-0.5">
              おめでとうございます！二人の独身証明書が承認され、婚約中ステータスになりました。
            </p>
          </div>
          <Badge className="ml-auto bg-amber-600 text-white shrink-0">💍 婚約中</Badge>
        </CardContent>
      </Card>
    );
  }

  // green状態のみ表示
  if (partnershipStatus !== "green") return null;

  const myApproved = myCertStatus === "approved";
  const partnerApproved = partnerCertStatus === "approved";
  const bothApproved = myApproved && partnerApproved;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-amber-500" />
          婚約中ステータスへの昇格
        </CardTitle>
        <CardDescription className="text-sm">
          二人とも独身証明書が承認されると、「婚約中」ステータスに昇格できます。
          既婚者の不正を防ぐ、婚活専用の機能です。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 条件チェック */}
        <div className="space-y-2">
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${myApproved ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
            {myApproved ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className={myApproved ? "text-green-700" : "text-gray-500"}>
              あなたの独身証明書：{myApproved ? "承認済み" : "未承認"}
            </span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${partnerApproved ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
            {partnerApproved ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className={partnerApproved ? "text-green-700" : "text-gray-500"}>
              パートナーの独身証明書：{partnerApproved ? "承認済み" : "未承認"}
            </span>
          </div>
        </div>

        {bothApproved ? (
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => requestEngagement.mutate()}
            disabled={requestEngagement.isPending}
          >
            {requestEngagement.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />申請中...</>
            ) : (
              <><Heart className="w-4 h-4 mr-2 fill-white" />婚約中ステータスに昇格する</>
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            二人とも独身証明書が承認されると、このボタンが有効になります。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
