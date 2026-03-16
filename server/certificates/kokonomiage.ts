/**
 * 婚姻届風恋人証明書 生成モジュール
 *
 * A4横向き（2480×1754px @300dpi）の婚姻届風デザインの証明書画像を
 * @napi-rs/canvas を使って生成する。
 *
 * デザインコンセプト：
 * - 和紙テクスチャ風の温かみのある背景（クリーム色）
 * - 朱色の印鑑・封印
 * - 官庁風の格調あるレイアウト
 * - NotoSerifCJK-JP フォント使用
 */
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";

// ─── フォント登録（初回のみ） ─────────────────────────────────────────────────
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  try {
    GlobalFonts.loadFontsFromDir("/usr/share/fonts/opentype/noto");
    GlobalFonts.loadFontsFromDir("/usr/share/fonts/truetype/noto");
    fontsLoaded = true;
  } catch {
    // フォント読み込み失敗は無視（フォールバックフォントを使用）
  }
}

// ─── 型定義 ──────────────────────────────────────────────────────────────────
export interface KokonomiageCertData {
  user1Name: string;
  user2Name: string;
  user1Furigana?: string;
  user2Furigana?: string;
  certId: string;           // "KS-00000001" 形式
  startedAt: Date;
  planType: "lover" | "engagement" | "student";
  blockchainTxHash?: string | null;
  blockchainRegisteredAt?: Date | null;
  issuedAt?: Date;
  user1AvatarUrl?: string | null;
  user2AvatarUrl?: string | null;
}

// ─── 定数 ────────────────────────────────────────────────────────────────────
// A4横向き @300dpi: 297mm × 210mm → 3508 × 2480px
// 生成コストを抑えるため @150dpi: 1754 × 1240px
const W = 1754;
const H = 1240;

const SERIF_FONT = "Noto Serif CJK JP";
const SANS_FONT = "Noto Sans CJK JP";

// ─── ヘルパー関数 ─────────────────────────────────────────────────────────────
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

function formatDateJapaneseEra(date: Date): string {
  // 令和換算
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (y >= 2019) {
    const reiwa = y - 2018;
    return `令和${reiwa}年${m}月${d}日`;
  }
  return `${y}年${m}月${d}日`;
}

function calcElapsedDays(startedAt: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
}

// 印鑑を描画する
function drawHanko(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  radius: number,
  text: string,
  color = "#c0392b",
  rotation = -0.15
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // 外枠（二重円）
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // 印鑑テキスト（縦書き風に1文字ずつ配置）
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(radius * 0.42)}px "${SERIF_FONT}", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = Array.from(text);
  const lineH = radius * 0.48;
  const totalH = (chars.length - 1) * lineH;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, 0, -totalH / 2 + i * lineH);
  });

  ctx.restore();
}

// 封印スタンプを描画する
function drawSeal(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.08);

  const color = "#c0392b";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // 外枠の六角形
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = Math.cos(angle) * size;
    const py = Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 内側の六角形
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = Math.cos(angle) * (size - 8);
    const py = Math.sin(angle) * (size - 8);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 中央テキスト「証」
  ctx.font = `bold ${Math.floor(size * 0.7)}px "${SERIF_FONT}", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("証", 0, 0);

  ctx.restore();
}

// 罫線を描画する
function drawRuledLine(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = "#8b7355",
  width = 1
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// テキストを中央揃えで描画する
function drawCenteredText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── メイン生成関数 ───────────────────────────────────────────────────────────
// ─── アバター画像を円形にクリップして描画するヘルパー ──────────────────────────
async function drawCircleAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string | null | undefined,
  cx: number,
  cy: number,
  radius: number
): Promise<void> {
  ctx.save();
  // 円形クリップ
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (url) {
    try {
      const img = await loadImage(url);
      ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
    } catch {
      // 画像取得失敗時はプレースホルダー
      ctx.fillStyle = "#d4b896";
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.fillStyle = "#8b6340";
      ctx.font = `bold ${radius * 0.6}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("人", cx, cy);
    }
  } else {
    // アバターなし：プレースホルダー
    ctx.fillStyle = "#e8d8c0";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#8b6340";
    ctx.font = `bold ${radius * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("人", cx, cy);
  }

  ctx.restore();

  // 円形の枠線
  ctx.save();
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export async function generateKokonomiageCert(data: KokonomiageCertData): Promise<Buffer> {
  ensureFonts();

  // アバター画像を事前ロード（並列）
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const isEngagement = data.planType === "engagement";
  const titleText = isEngagement ? "婚約証明書" : "恋人証明書";
  const subtitleText = isEngagement
    ? "ENGAGEMENT CERTIFICATE"
    : "LOVER CERTIFICATE";

  // ─── 背景（和紙テクスチャ風） ─────────────────────────────────────────────
  // ベースカラー：温かみのあるクリーム色
  ctx.fillStyle = "#fdf8f0";
  ctx.fillRect(0, 0, W, H);

  // 和紙風のノイズテクスチャ（薄い横線）
  ctx.strokeStyle = "rgba(180, 160, 120, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ─── 外枠（二重枠） ───────────────────────────────────────────────────────
  const margin = 40;
  const innerMargin = 58;

  // 外枠
  ctx.strokeStyle = "#6b4c2a";
  ctx.lineWidth = 4;
  ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);

  // 内枠
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2);

  // 四隅の装飾（小さな正方形）
  const cornerSize = 12;
  const corners = [
    [margin - cornerSize / 2, margin - cornerSize / 2],
    [W - margin - cornerSize / 2, margin - cornerSize / 2],
    [margin - cornerSize / 2, H - margin - cornerSize / 2],
    [W - margin - cornerSize / 2, H - margin - cornerSize / 2],
  ];
  ctx.fillStyle = "#6b4c2a";
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, cornerSize, cornerSize);
  });

  // ─── ヘッダーエリア ────────────────────────────────────────────────────────
  const headerY = 80;

  // 発行機関名（左上）
  ctx.save();
  ctx.font = `14px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("発行機関：恋人証明 (Koibito Shomei)", innerMargin + 20, headerY);
  ctx.fillText("ブロックチェーン証明：j-agreement.com", innerMargin + 20, headerY + 22);
  ctx.restore();

  // 証明書番号（右上）
  ctx.save();
  ctx.font = `14px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`証明書番号：${data.certId}`, W - innerMargin - 20, headerY);
  ctx.fillText(`発行日：${formatDateJapaneseEra(data.issuedAt ?? new Date())}`, W - innerMargin - 20, headerY + 22);
  ctx.restore();

  // ─── タイトル ──────────────────────────────────────────────────────────────
  const titleY = 175;

  // タイトル上下の飾り線
  drawRuledLine(ctx, innerMargin + 20, titleY - 28, W - innerMargin - 20, titleY - 28, "#8b6340", 1.5);
  drawRuledLine(ctx, innerMargin + 20, titleY - 24, W - innerMargin - 20, titleY - 24, "#8b6340", 0.5);

  // メインタイトル
  ctx.save();
  ctx.font = `bold 72px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#3d2b1a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 文字間隔を広げるために1文字ずつ描画
  const titleChars = Array.from(titleText);
  const titleCharW = 80;
  const titleTotalW = titleChars.length * titleCharW;
  titleChars.forEach((ch, i) => {
    ctx.fillText(ch, W / 2 - titleTotalW / 2 + titleCharW * i + titleCharW / 2, titleY);
  });
  ctx.restore();

  // サブタイトル（英語）
  ctx.save();
  ctx.font = `18px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#8b6340";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(subtitleText, W / 2, titleY + 44);
  ctx.restore();

  // タイトル下の飾り線
  drawRuledLine(ctx, innerMargin + 20, titleY + 72, W - innerMargin - 20, titleY + 72, "#8b6340", 0.5);
  drawRuledLine(ctx, innerMargin + 20, titleY + 76, W - innerMargin - 20, titleY + 76, "#8b6340", 1.5);

  // ─── メインコンテンツエリア ────────────────────────────────────────────────
  const contentTop = titleY + 100;
  const contentH = H - contentTop - 160;
  const leftColX = innerMargin + 60;
  const rightColX = W / 2 + 40;
  const colW = W / 2 - innerMargin - 100;

  // ─── 左カラム：当事者情報 ─────────────────────────────────────────────────
  // 「甲」（第一当事者）
  const col1LabelX = leftColX;
  const col1ValueX = leftColX + 80;
  let rowY = contentTop;

  // 甲ラベル
  ctx.save();
  ctx.font = `bold 18px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("甲（第一当事者）", col1LabelX, rowY + 12);
  ctx.restore();

  drawRuledLine(ctx, col1LabelX, rowY + 30, leftColX + colW, rowY + 30, "#8b6340", 0.8);
  rowY += 50;

  // 氏名
  ctx.save();
  ctx.font = `14px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("氏　名", col1LabelX, rowY + 12);
  ctx.restore();

  // 名前ボックス
  ctx.save();
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 1;
  ctx.strokeRect(col1ValueX, rowY, colW - 80, 36);
  ctx.restore();

  // フリガナ（小さく上部に）
  if (data.user1Furigana) {
    ctx.save();
    ctx.font = `11px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#8b6340";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(data.user1Furigana, col1ValueX + 8, rowY + 8);
    ctx.restore();
  }

  ctx.save();
  ctx.font = `bold 22px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#1a0f00";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(data.user1Name, col1ValueX + 8, rowY + (data.user1Furigana ? 24 : 18));
  ctx.restore();

  rowY += 55;

  // 「乙」（第二当事者）
  ctx.save();
  ctx.font = `bold 18px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("乙（第二当事者）", col1LabelX, rowY + 12);
  ctx.restore();

  drawRuledLine(ctx, col1LabelX, rowY + 30, leftColX + colW, rowY + 30, "#8b6340", 0.8);
  rowY += 50;

  // 氏名
  ctx.save();
  ctx.font = `14px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("氏　名", col1LabelX, rowY + 12);
  ctx.restore();

  // 名前ボックス
  ctx.save();
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 1;
  ctx.strokeRect(col1ValueX, rowY, colW - 80, 36);
  ctx.restore();

  if (data.user2Furigana) {
    ctx.save();
    ctx.font = `11px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#8b6340";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(data.user2Furigana, col1ValueX + 8, rowY + 8);
    ctx.restore();
  }

  ctx.save();
  ctx.font = `bold 22px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#1a0f00";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(data.user2Name, col1ValueX + 8, rowY + (data.user2Furigana ? 24 : 18));
  ctx.restore();

  rowY += 55;

  // 交際開始日
  ctx.save();
  ctx.font = `14px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("交際開始日", col1LabelX, rowY + 12);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 1;
  ctx.strokeRect(col1ValueX, rowY, colW - 80, 36);
  ctx.restore();

  ctx.save();
  ctx.font = `bold 20px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#1a0f00";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(formatDateJapaneseEra(data.startedAt), col1ValueX + 8, rowY + 18);
  ctx.restore();

  rowY += 55;

  // 交際日数
  const elapsedDays = calcElapsedDays(data.startedAt);
  ctx.save();
  ctx.font = `14px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("交際日数", col1LabelX, rowY + 12);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#8b6340";
  ctx.lineWidth = 1;
  ctx.strokeRect(col1ValueX, rowY, colW - 80, 36);
  ctx.restore();

  ctx.save();
  ctx.font = `bold 20px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#1a0f00";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${elapsedDays}日`, col1ValueX + 8, rowY + 18);
  ctx.restore();

  // ─── 中央縦線 ─────────────────────────────────────────────────────────────
  drawRuledLine(ctx, W / 2, contentTop - 10, W / 2, H - 160, "#8b6340", 1);

  // ─── 右カラム：証明文・ブロックチェーン情報 ──────────────────────────────
  let rightRowY = contentTop;

  // 証明文
  ctx.save();
  ctx.font = `bold 18px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("証　明　事　項", rightColX, rightRowY + 12);
  ctx.restore();

  drawRuledLine(ctx, rightColX, rightRowY + 30, rightColX + colW + 20, rightRowY + 30, "#8b6340", 0.8);
  rightRowY += 50;

  // 証明文本文
  const certText = isEngagement
    ? [
        "上記の甲及び乙は、",
        "誠実な交際を経て婚約関係にあることを",
        "ここに厳粛に証明いたします。",
        "",
        "本証明書は、両当事者の合意のもと",
        "ブロックチェーン技術により",
        "改ざん不可能な形で記録されています。",
      ]
    : [
        "上記の甲及び乙は、",
        "相互の合意のもと交際関係にあることを",
        "ここに証明いたします。",
        "",
        "本証明書は、両当事者の合意のもと",
        "ブロックチェーン技術により",
        "改ざん不可能な形で記録されています。",
      ];

  ctx.save();
  ctx.font = `16px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#3d2b1a";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  certText.forEach((line, i) => {
    ctx.fillText(line, rightColX, rightRowY + i * 26);
  });
  ctx.restore();

  rightRowY += certText.length * 26 + 30;

  // ブロックチェーン情報
  if (data.blockchainTxHash) {
    drawRuledLine(ctx, rightColX, rightRowY, rightColX + colW + 20, rightRowY, "#8b6340", 0.8);
    rightRowY += 20;

    ctx.save();
    ctx.font = `bold 14px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#5a4030";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("ブロックチェーン証明", rightColX, rightRowY);
    ctx.restore();

    rightRowY += 22;

    ctx.save();
    ctx.font = `11px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#5a4030";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("ネットワーク：Polygon", rightColX, rightRowY);
    ctx.restore();

    rightRowY += 18;

    // ハッシュ（折り返し表示）
    ctx.save();
    ctx.font = `10px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#5a4030";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hashLabel = "Tx Hash：";
    ctx.fillText(hashLabel, rightColX, rightRowY);
    const hash = data.blockchainTxHash;
    const maxHashW = colW + 20;
    const hashLine1 = hash.slice(0, 42);
    const hashLine2 = hash.slice(42);
    ctx.fillText(hashLine1, rightColX, rightRowY + 14);
    if (hashLine2) ctx.fillText(hashLine2, rightColX, rightRowY + 26);
    ctx.restore();

    rightRowY += 50;

    if (data.blockchainRegisteredAt) {
      ctx.save();
      ctx.font = `11px "${SANS_FONT}", sans-serif`;
      ctx.fillStyle = "#5a4030";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `記録日時：${new Date(data.blockchainRegisteredAt).toLocaleString("ja-JP")}`,
        rightColX,
        rightRowY
      );
      ctx.restore();
    }
  } else {
    // ブロックチェーン未登録の場合
    ctx.save();
    ctx.font = `13px "${SANS_FONT}", sans-serif`;
    ctx.fillStyle = "#8b6340";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("※ブロックチェーン証明書は発行手続き中です", rightColX, rightRowY);
    ctx.restore();
  }

  // ─── フッターエリア ────────────────────────────────────────────────────────
  const footerY = H - 150;

  drawRuledLine(ctx, innerMargin + 20, footerY, W - innerMargin - 20, footerY, "#8b6340", 1);

  // 左フッター：発行機関
  ctx.save();
  ctx.font = `14px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("発行機関", innerMargin + 30, footerY + 20);
  ctx.restore();

  ctx.save();
  ctx.font = `bold 20px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#3d2b1a";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("恋人証明 (Koibito Shomei)", innerMargin + 30, footerY + 42);
  ctx.restore();

  ctx.save();
  ctx.font = `12px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#8b6340";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("https://loverschain.jp", innerMargin + 30, footerY + 70);
  ctx.restore();

  // 中央フッター：QRコード代替テキスト
  ctx.save();
  ctx.font = `12px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#8b6340";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("本証明書の真正性は上記URLで確認できます", W / 2, footerY + 20);
  ctx.fillText(`証明書ID: ${data.certId}`, W / 2, footerY + 40);
  ctx.restore();

  // ─── 印鑑・封印 ───────────────────────────────────────────────────────────
  // 発行機関の印鑑（右下）
  drawHanko(ctx, W - innerMargin - 120, footerY + 60, 50, "恋人証明", "#c0392b", -0.12);

  // 封印スタンプ（右下、印鑑の左）
  drawSeal(ctx, W - innerMargin - 220, footerY + 55, 38);

  // ─── 顔写真欄（左カラム下部） ─────────────────────────────────────────
  // 左カラムの下部に二人の顔写真を並べて表示する
  const photoRadius = 48;
  const photoY = H - 220; // フッターの上方
  const photo1X = leftColX + colW / 4;
  const photo2X = leftColX + (colW * 3) / 4;

  // 顔写真欄のラベル
  ctx.save();
  ctx.font = `12px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#5a4030";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("甲の写真", photo1X, photoY - photoRadius - 6);
  ctx.fillText("乙の写真", photo2X, photoY - photoRadius - 6);
  ctx.restore();

  // 顔写真描画（非同期処理のためawait使用）
  await drawCircleAvatar(ctx, data.user1AvatarUrl, photo1X, photoY, photoRadius);
  await drawCircleAvatar(ctx, data.user2AvatarUrl, photo2X, photoY, photoRadius);

  // 顔写真欄の下に氏名を表示
  ctx.save();
  ctx.font = `11px "${SANS_FONT}", sans-serif`;
  ctx.fillStyle = "#8b6340";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(data.user1Name, photo1X, photoY + photoRadius + 6);
  ctx.fillText(data.user2Name, photo2X, photoY + photoRadius + 6);
  ctx.restore();

  // ─── 透かし（背景） ───────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.font = `bold 200px "${SERIF_FONT}", serif`;
  ctx.fillStyle = "#8b6340";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.rotate(-0.3);
  ctx.fillText("証", W / 2 - 100, H / 2 + 100);
  ctx.restore();

  return canvas.toBuffer("image/png");
}
