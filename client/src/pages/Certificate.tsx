/**
 * Certificate.tsx
 *
 * 証明書ページ。2種類の証明書を切り替えて表示する。
 * ① 婚姻届風証明書（大判横向き・サーバーサイド生成PNG）
 * ② スマホ最適化証明書（縦型カード・写真あり/なし・html2canvas保存）
 */
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Heart,
  CheckCircle,
  ExternalLink,
  Link2,
  User,
  Calendar,
  Hash,
  ArrowLeft,
  Download,
  Copy,
  Share2,
  Scroll,
  Smartphone,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Link, useParams } from "wouter";
import { PartnershipStatusBadge } from "@/components/PartnershipStatusBadge";
import { useEffect, useState } from "react";
import MilestoneBanner from "@/components/MilestoneBanner";
import { calcElapsedDays, getMilestoneInfo } from "../../../shared/milestone";
import SmartphoneCertCard from "@/components/SmartphoneCertCard";

// ─── OGP メタタグを動的に設定するユーティリティ ────────────────────────────────
function setMetaTag(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setNameMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

type CertTab = "kokonomiage" | "smartphone";

export default function Certificate() {
  const params = useParams<{ id: string }>();
  const partnershipId = parseInt(params.id ?? "0", 10);
  usePageTitle("パートナーシップ証明書 - ブロックチェーン認証済み");
  const [activeTab, setActiveTab] = useState<CertTab>("smartphone");
  const [isDownloadingKokonomiage, setIsDownloadingKokonomiage] = useState(false);

  const { data: cert, isLoading, error } = trpc.partnership.certificate.useQuery(
    { partnershipId },
    { enabled: !!partnershipId && !isNaN(partnershipId) }
  );

  // ── 証明書データが取得できたら OGP メタタグを動的設定
  useEffect(() => {
    if (!cert) return;

    const certId = `KS-${String(cert.id).padStart(8, "0")}`;
    const user1Name = cert.user1?.displayName ?? "ユーザー";
    const user2Name = cert.user2?.displayName ?? "ユーザー";
    const title = `${user1Name} × ${user2Name} の恋愛証明書 | 恋人証明`;
    const description = `証明書番号 ${certId}。${user1Name}さんと${user2Name}さんの恋愛関係をブロックチェーンで証明しています。`;
    const ogpImageUrl = `https://loverschain.jp/api/ogp/certificate/${cert.id}`;
    const pageUrl = `https://loverschain.jp/certificate/${cert.id}`;

    document.title = title;
    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:image", ogpImageUrl);
    setMetaTag("og:url", pageUrl);
    setMetaTag("og:type", "article");
    setMetaTag("og:site_name", "恋人証明 | LoversChain");
    setNameMetaTag("twitter:card", "summary_large_image");
    setNameMetaTag("twitter:title", title);
    setNameMetaTag("twitter:description", description);
    setNameMetaTag("twitter:image", ogpImageUrl);

    return () => {
      document.title = "恋人証明 | LoversChain";
      setMetaTag("og:title", "恋人証明 | LoversChain");
      setMetaTag("og:description", "eKYCとブロックチェーンで証明する、日本最高水準のパートナーシップ証明プラットフォーム");
      setMetaTag("og:image", "https://loverschain.jp/ogp-default.png");
      setMetaTag("og:url", "https://loverschain.jp/");
    };
  }, [cert]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Heart className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">証明書が見つかりません</h1>
        <p className="text-muted-foreground text-sm">
          {error?.message ?? "指定された証明書は存在しないか、アクセスできません。"}
        </p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            トップに戻る
          </Button>
        </Link>
      </div>
    );
  }

  const isActive = cert.status === "green";
  const isEngaged = cert.status === "engaged";
  const certId = `KS-${String(cert.id).padStart(8, "0")}`;
  const user1Name = cert.user1?.displayName ?? "名前未設定";
  const user2Name = cert.user2?.displayName ?? "名前未設定";

  const milestoneInfo = cert.startedAt
    ? getMilestoneInfo(calcElapsedDays(new Date(cert.startedAt)))
    : null;
  const shareButtonText = milestoneInfo?.isMilestone
    ? `🎉 ${milestoneInfo.label}をシェアする`
    : "シェア";

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://loverschain.jp/certificate/${cert.id}`;
  const shareText = isEngaged
    ? `${user1Name}さんと${user2Name}さんの婚約を証明します。 #恋人証明 #婚約中`
    : milestoneInfo?.isMilestone
      ? `${user1Name}さんと${user2Name}さんの${milestoneInfo.label}を証明します。 #恋人証明`
      : `${user1Name}さんと${user2Name}さんの恋愛関係をブロックチェーンで証明します。 #恋人証明`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  // 婚姻届風証明書のダウンロード
  const handleDownloadKokonomiage = async () => {
    setIsDownloadingKokonomiage(true);
    try {
      const res = await fetch(`/api/ogp/kokonomiage/${cert.id}`);
      if (!res.ok) throw new Error("生成に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `婚姻届風証明書_${certId}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("婚姻届風証明書の生成に失敗しました。しばらくしてから再試行してください。");
    } finally {
      setIsDownloadingKokonomiage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-10 max-w-2xl mx-auto">
        {/* 節目バナー */}
        {cert.startedAt && (
          <MilestoneBanner startedAt={new Date(cert.startedAt)} />
        )}

        {/* ─── タブ切り替え ─────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setActiveTab("smartphone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "smartphone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>スマホ証明書</span>
              <span className="text-xs opacity-60">待ち受け用</span>
            </button>
            <button
              onClick={() => setActiveTab("kokonomiage")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "kokonomiage"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scroll className="w-4 h-4" />
              <span>婚姻届風証明書</span>
              <span className="text-xs opacity-60">大判印刷用</span>
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {activeTab === "smartphone"
              ? "スマホの待ち受け画面に最適化した縦型カードです。写真を追加してオリジナルにカスタマイズできます。"
              : "婚姻届をイメージした大判横向きの公式証明書です。ブロックチェーン情報が記録されます。"}
          </p>
        </div>

        {/* ─── スマホ証明書タブ ─────────────────────────────────────── */}
        {activeTab === "smartphone" && (
          <>
            <SmartphoneCertCard
              certId={certId}
              partnershipId={cert.id}
              user1={cert.user1 ?? null}
              user2={cert.user2 ?? null}
              startedAt={new Date(cert.startedAt)}
              status={cert.status}
              planType={cert.planType ?? (cert.status === "engaged" ? "engagement" : "lover")}
              blockchainTxHash={cert.blockchainTxHash}
              couplePhotoUrl={cert.couplePhotoUrl}
            />

            {/* シェアセクション */}
            <div className="mt-6 print:hidden">
              <div className="text-center mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {isEngaged ? "💍 婚約を皆に報告しよう" : "❤️ 二人の証明をシェアする"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  名前は表示名のみ。プライバシーを守りながらシェアできます
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <a
                  href={xShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "#000000" }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X（旧Twitter）でシェア
                </a>
                <a
                  href={lineShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "#06C755" }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINEでシェア
                </a>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: isEngaged ? "婚約証明書" : "恋人証明書", text: shareText, url: shareUrl });
                      } catch (_) { /* キャンセルは無視 */ }
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      alert("証明書URLをコピーしました");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  {shareButtonText}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("証明書URLをコピーしました");
                  }}
                >
                  <Copy className="w-4 h-4" />
                  URLコピー
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ─── 婚姻届風証明書タブ ──────────────────────────────────── */}
        {activeTab === "kokonomiage" && (
          <div className="space-y-6">
            {/* 説明カード */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Scroll className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">婚姻届風証明書とは</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    婚姻届をモチーフにした大判横向き（A4サイズ）の公式証明書です。
                    和紙テクスチャ・印鑑・封印が施された格調あるデザインで、
                    ブロックチェーン証明情報も記載されます。
                    印刷して飾ったり、大切な記念として保存するのに最適です。
                  </p>
                </div>
              </div>
            </div>

            {/* 証明書情報サマリー */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
              {/* ヘッダー */}
              <div
                className="p-6 text-center"
                style={{
                  background: isEngaged
                    ? "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #8b6914 100%)"
                    : "linear-gradient(135deg, #6b4c2a 0%, #8b6340 50%, #5a3d22 100%)",
                }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    {isEngaged ? (
                      <span className="text-2xl">💍</span>
                    ) : (
                      <Heart className="w-8 h-8 fill-white text-white" />
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {isEngaged ? "婚約証明書" : "恋人証明書"}
                </h2>
                <p className="text-xs text-white/70 mb-2">
                  {isEngaged ? "Engagement Certificate" : "Koibito Shomei Certificate"}
                </p>
                <PartnershipStatusBadge status={cert.status} />
              </div>

              {/* 本文 */}
              <div className="bg-white p-6 space-y-5">
                {/* 証明書番号 */}
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">証明書番号</p>
                  <p className="text-lg font-bold text-foreground font-mono">{certId}</p>
                </div>

                {/* 当事者情報 */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">当事者</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[cert.user1, cert.user2].map((u, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-3 bg-muted rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          {u?.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground text-center">
                          {u?.displayName ?? "名前未設定"}
                        </p>
                        {u?.kycStatus === "verified" && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>本人確認済み</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 日付情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 交際開始日
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(cert.startedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {cert.endedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 解消日
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(cert.endedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* ブロックチェーン情報 */}
                {cert.blockchainTxHash ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-green-800">ブロックチェーン証明済み</span>
                      <Badge className="bg-green-100 text-green-700 border-green-300 text-xs ml-auto">
                        Polygon
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-700 mb-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> トランザクションハッシュ
                        </p>
                        <p className="text-xs font-mono text-green-800 break-all">
                          {cert.blockchainTxHash}
                        </p>
                      </div>
                      {cert.blockchainRegisteredAt && (
                        <p className="text-xs text-green-700">
                          記録日時: {new Date(cert.blockchainRegisteredAt).toLocaleString("ja-JP")}
                        </p>
                      )}
                      {cert.certificateUrl && (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                        >
                          <Link2 className="w-3 h-3" />
                          j-agreement.comで証明書を確認
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                    ブロックチェーン証明書を発行中です。しばらくお待ちください。
                  </div>
                )}

                {/* 発行機関 */}
                <div className="text-center pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">発行: 恋人証明 (Koibito Shomei)</p>
                  <p className="text-xs text-muted-foreground">ブロックチェーン証明: j-agreement.com</p>
                </div>
              </div>
            </div>

            {/* 婚姻届風証明書ダウンロードボタン */}
            <div className="space-y-3">
              <Button
                className="w-full gap-2 bg-amber-700 hover:bg-amber-800 text-white"
                onClick={handleDownloadKokonomiage}
                disabled={isDownloadingKokonomiage}
              >
                {isDownloadingKokonomiage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    婚姻届風証明書を生成中...（数秒かかります）
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    婚姻届風証明書をダウンロード（PNG）
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const prevTitle = document.title;
                  document.title = `${isEngaged ? "婚約証明書" : "恋人証明書"}_${certId}`;
                  window.print();
                  document.title = prevTitle;
                }}
              >
                <Download className="w-4 h-4" />
                PDFとして保存（印刷ダイアログ）
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                「婚姻届風証明書をダウンロード」→A4横向きのPNG画像。「PDFとして保存」→印刷ダイアログで「宛先をPDFに保存」。
              </p>
            </div>

            {/* シェアセクション */}
            <div className="print:hidden">
              <div className="text-center mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {isEngaged ? "💍 婚約を皆に報告しよう" : "❤️ 二人の証明をシェアする"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <a
                  href={xShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "#000000" }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X（旧Twitter）でシェア
                </a>
                <a
                  href={lineShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "#06C755" }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINEでシェア
                </a>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: isEngaged ? "婚約証明書" : "恋人証明書", text: shareText, url: shareUrl });
                      } catch (_) { /* キャンセルは無視 */ }
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      alert("証明書URLをコピーしました");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  {shareButtonText}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("証明書URLをコピーしました");
                  }}
                >
                  <Copy className="w-4 h-4" />
                  URLコピー
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
