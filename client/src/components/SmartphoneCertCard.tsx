/**
 * スマホ最適化証明書カード（②）
 *
 * スマートフォンの待ち受け画面に最適化した縦型（9:16比率）の証明書カード。
 * 写真ありモード：二人の写真を背景に証明書情報をオーバーレイ
 * 写真なしモード：ブライダルカラーグラデーション＋証明書情報
 * html2canvas でPNG保存可能。
 */
import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, CheckCircle, User, ImageDown, Camera, X, Upload, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CertUser {
  displayName?: string | null;
  avatarUrl?: string | null;
  kycStatus?: string | null;
}

interface SmartphoneCertCardProps {
  certId: string;
  partnershipId?: number;
  user1: CertUser | null;
  user2: CertUser | null;
  startedAt: Date;
  status: string;
  planType?: "lover" | "engagement" | "student";
  blockchainTxHash?: string | null;
  couplePhotoUrl?: string | null; // S3に保存済みのカップル写真
}

export default function SmartphoneCertCard({
  certId,
  partnershipId,
  user1,
  user2,
  startedAt,
  status,
  planType = "lover",
  blockchainTxHash,
  couplePhotoUrl: initialCouplePhotoUrl,
}: SmartphoneCertCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // S3保存済み写真があれば初期値として設定
  const [withPhoto, setWithPhoto] = useState(!!initialCouplePhotoUrl);
  const [bgPhoto, setBgPhoto] = useState<string | null>(initialCouplePhotoUrl ?? null);
  const [savedToS3, setSavedToS3] = useState(!!initialCouplePhotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadCouplePhoto = trpc.partnership.uploadCouplePhoto.useMutation();
  const deleteCouplePhoto = trpc.partnership.deleteCouplePhoto.useMutation();
  const utils = trpc.useUtils();

  // ファイルをS3にアップロードする
  const handleUploadToS3 = useCallback(async () => {
    if (!bgPhoto || !partnershipId || savedToS3) return;
    setIsUploading(true);
    try {
      const result = await uploadCouplePhoto.mutateAsync({
        dataUrl: bgPhoto,
        partnershipId,
      });
      setBgPhoto(result.couplePhotoUrl);
      setSavedToS3(true);
      toast.success("写真を保存しました。次回からも自動表示されます。");
      await utils.partnership.certificate.invalidate();
    } catch {
      toast.error("写真の保存に失敗しました。");
    } finally {
      setIsUploading(false);
    }
  }, [bgPhoto, partnershipId, savedToS3, uploadCouplePhoto, utils]);

  // 写真を削除する
  const handleDeletePhoto = useCallback(async () => {
    if (!partnershipId) {
      setBgPhoto(null);
      setWithPhoto(false);
      setSavedToS3(false);
      return;
    }
    try {
      await deleteCouplePhoto.mutateAsync({ partnershipId });
      setBgPhoto(null);
      setWithPhoto(false);
      setSavedToS3(false);
      toast.success("写真を削除しました。");
      await utils.partnership.certificate.invalidate();
    } catch {
      toast.error("写真の削除に失敗しました。");
    }
  }, [partnershipId, deleteCouplePhoto, utils]);

  const isEngaged = status === "engaged";
  const isActive = status === "green";
  const user1Name = user1?.displayName ?? "名前未設定";
  const user2Name = user2?.displayName ?? "名前未設定";

  const elapsedDays = Math.floor(
    (new Date().getTime() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatDateJP = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if (y >= 2019) return `令和${y - 2018}年${m}月${d}日`;
    return `${y}年${m}月${d}日`;
  };

  // Canvas APIで画像をリサイズしてDataURLを返す（最大2048px・JPEG品質0.85）
  const resizeImage = (dataUrl: string, maxSize = 2048): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 50MB超えは拒否（リサイズ前の上限）
    if (file.size > 50 * 1024 * 1024) {
      toast.error("写真は50MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result as string;
      // 大きい画像はリサイズしてS3アップロード時の負荷を軽減
      const resized = file.size > 2 * 1024 * 1024
        ? await resizeImage(rawDataUrl)
        : rawDataUrl;
      setBgPhoto(resized);
      setWithPhoto(true);
      setSavedToS3(false);
    };
    reader.readAsDataURL(file);
    // inputをリセットして同じファイルを再選択できるようにする
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3, // 高解像度（待ち受け画面用）
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `恋人証明書_${certId}_スマホ用.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("証明書画像を保存しました。写真アルバムに追加してください。");
    } catch {
      toast.error("画像の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // グラデーション設定
  const gradientStyle = isEngaged
    ? "linear-gradient(160deg, #b8860b 0%, #daa520 30%, #8b6914 60%, #6b4c2a 100%)"
    : isActive
    ? "linear-gradient(160deg, #8b1a4a 0%, #c2185b 30%, #7b1fa2 70%, #4a148c 100%)"
    : "linear-gradient(160deg, #455a64 0%, #546e7a 50%, #37474f 100%)";

  return (
    <div className="space-y-4">
      {/* 写真あり/なし切り替えコントロール */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
          <button
            onClick={() => setWithPhoto(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !withPhoto
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted-foreground/10"
            }`}
          >
            写真なし
          </button>
          <button
            onClick={() => {
              if (!bgPhoto) {
                fileInputRef.current?.click();
              } else {
                setWithPhoto(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              withPhoto
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted-foreground/10"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {bgPhoto ? "写真あり" : "写真を選択"}
          </button>
          {bgPhoto && !savedToS3 && partnershipId && (
            <button
              onClick={handleUploadToS3}
              disabled={isUploading}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" />写真を保存</>
              )}
            </button>
          )}
          {savedToS3 && (
            <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />保存済み
            </span>
          )}
          {bgPhoto && (
            <button
              onClick={handleDeletePhoto}
              className={`${savedToS3 ? "" : "ml-auto"} text-xs text-muted-foreground hover:text-destructive flex items-center gap-1`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {bgPhoto && !savedToS3 && partnershipId && (
          <p className="text-xs text-amber-600 px-1">
            ⚠️ 写真はまだ保存されていません。「写真を保存」を押すと次回からも自動表示されます。
          </p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* 証明書カード本体（9:16比率 = 360×640px相当） */}
      <div
        ref={cardRef}
        className="relative mx-auto overflow-hidden rounded-3xl shadow-2xl"
        style={{
          width: "360px",
          height: "640px",
          background: withPhoto && bgPhoto ? "transparent" : gradientStyle,
        }}
      >
        {/* 背景写真（写真ありモード） */}
        {withPhoto && bgPhoto && (
          <>
            <img
              src={bgPhoto}
              alt="背景写真"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 写真の上にグラデーションオーバーレイ */}
            <div
              className="absolute inset-0"
              style={{
                background: isEngaged
                  ? "linear-gradient(to bottom, rgba(139,105,20,0.6) 0%, rgba(107,76,42,0.85) 100%)"
                  : isActive
                  ? "linear-gradient(to bottom, rgba(139,26,74,0.55) 0%, rgba(74,20,140,0.85) 100%)"
                  : "linear-gradient(to bottom, rgba(69,90,100,0.6) 0%, rgba(55,71,79,0.85) 100%)",
              }}
            />
          </>
        )}

        {/* 写真なしモードの装飾パターン */}
        {!withPhoto && (
          <div className="absolute inset-0 overflow-hidden">
            {/* 大きな円形装飾 */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15"
              style={{ background: "rgba(255,255,255,0.25)" }}
            />
            {/* 小さなドット装飾 */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-20"
                style={{
                  width: `${4 + (i % 3) * 3}px`,
                  height: `${4 + (i % 3) * 3}px`,
                  background: "rgba(255,255,255,0.6)",
                  top: `${10 + (i * 7) % 80}%`,
                  left: `${5 + (i * 13) % 90}%`,
                }}
              />
            ))}
          </div>
        )}

        {/* コンテンツ */}
        <div className="relative z-10 h-full flex flex-col p-6">
          {/* ヘッダー */}
          <div className="text-center mb-4">
            {/* アイコン */}
            <div className="flex justify-center mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {isEngaged ? (
                  <span className="text-2xl">💍</span>
                ) : (
                  <Heart className="w-8 h-8 fill-white text-white" />
                )}
              </div>
            </div>

            {/* タイトル */}
            <h2 className="text-2xl font-bold text-white mb-1">
              {isEngaged ? "婚約証明書" : "恋人証明書"}
            </h2>
            <p className="text-xs text-white/70">
              {isEngaged ? "Engagement Certificate" : "Koibito Shomei Certificate"}
            </p>
          </div>

          {/* 証明書番号 */}
          <div
            className="text-center py-2 px-4 rounded-xl mb-4"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <p className="text-xs text-white/70 mb-0.5">証明書番号</p>
            <p className="text-base font-bold text-white font-mono">{certId}</p>
          </div>

          {/* 当事者情報 */}
          <div className="flex items-center gap-3 mb-4">
            {/* ユーザー1 */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40">
                {user1?.avatarUrl ? (
                  <img src={user1.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-white/70" />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white text-center leading-tight">{user1Name}</p>
              {user1?.kycStatus === "verified" && (
                <div className="flex items-center gap-0.5 text-xs text-green-300">
                  <CheckCircle className="w-3 h-3" />
                  <span>認証済</span>
                </div>
              )}
            </div>

            {/* ハートアイコン */}
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-6 h-6 fill-pink-300 text-pink-300" />
              <div className="w-px h-6 bg-white/30" />
              <Heart className="w-6 h-6 fill-pink-300 text-pink-300" />
            </div>

            {/* ユーザー2 */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40">
                {user2?.avatarUrl ? (
                  <img src={user2.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-white/70" />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white text-center leading-tight">{user2Name}</p>
              {user2?.kycStatus === "verified" && (
                <div className="flex items-center gap-0.5 text-xs text-green-300">
                  <CheckCircle className="w-3 h-3" />
                  <span>認証済</span>
                </div>
              )}
            </div>
          </div>

          {/* 日付情報 */}
          <div
            className="rounded-xl p-3 mb-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/70">交際開始日</span>
              <span className="text-sm font-semibold text-white">
                {formatDateJP(new Date(startedAt))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/70">交際日数</span>
              <span className="text-sm font-semibold text-white">{elapsedDays}日</span>
            </div>
          </div>

          {/* ブロックチェーン証明バッジ */}
          <div className="flex justify-center mb-3">
            {blockchainTxHash ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-green-300"
                style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)" }}
              >
                <Shield className="w-3.5 h-3.5" />
                ブロックチェーン証明済み
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-yellow-300"
                style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)" }}
              >
                <Shield className="w-3.5 h-3.5" />
                証明書発行中
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="mt-auto text-center">
            <p className="text-xs text-white/50">恋人証明 | loverschain.jp</p>
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <Button
        className="w-full gap-2"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            画像を生成中...
          </>
        ) : (
          <>
            <ImageDown className="w-4 h-4" />
            待ち受け用画像として保存
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        PNG画像をダウンロード後、スマホの壁紙・待ち受けに設定できます
      </p>
    </div>
  );
}
