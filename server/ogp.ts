/**
 * OGP画像動的生成ヘルパー
 * Canvas APIを使用して証明書番号・ユーザー名・交際開始日・経過日数を埋め込んだ
 * 1200x630pxのOGP画像をサーバーサイドで生成する。
 * 節目テーマは shared/milestone.ts の getOgpMilestoneTheme を使用する。
 */
import { createCanvas, type Canvas as NapiCanvas } from "@napi-rs/canvas";
import { getPartnershipById, getUserById } from "./db";
import { calcElapsedDays, getOgpMilestoneTheme, type OgpMilestoneTheme } from "../shared/milestone";

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export interface OgpData {
  user1Name: string;
  user2Name: string;
  certId: string;       // "KS-00000001" 形式
  startedAt: Date;
  rank: string;
  status?: string;      // "green" | "engaged" | "yellow" | "grey" など
}

// ─── getMilestoneTheme の後方互換エクスポート ─────────────────────────────────
// テストファイルが直接インポートしているため維持する
export { getOgpMilestoneTheme as getMilestoneTheme } from "../shared/milestone";

// ─── ランク表示名マッピング ──────────────────────────────────────────────────

const RANK_LABELS: Record<string, string> = {
  bronze:       "Bronze",
  silver_3d:    "Silver",
  silver_1m:    "Silver",
  silver_3m:    "Silver",
  silver_6m:    "Silver",
  gold_10m:     "Gold",
  gold_12m:     "Gold",
  gold_15m:     "Gold",
  platinum_20m: "Platinum",
  platinum_24m: "Platinum",
  diamond_30m:  "Diamond",
  diamond_36m:  "Diamond",
  legend_40m:   "Legend",
};

const RANK_COLORS: Record<string, string> = {
  bronze:       "#cd7f32",
  silver_3d:    "#c0c0c0",
  silver_1m:    "#c0c0c0",
  silver_3m:    "#c0c0c0",
  silver_6m:    "#c0c0c0",
  gold_10m:     "#ffd700",
  gold_12m:     "#ffd700",
  gold_15m:     "#ffd700",
  platinum_20m: "#e5e4e2",
  platinum_24m: "#e5e4e2",
  diamond_30m:  "#b9f2ff",
  diamond_36m:  "#b9f2ff",
  legend_40m:   "#ff69b4",
};

// ─── DB から OGP データを取得 ─────────────────────────────────────────────────

export async function getOgpDataForPartnership(
  partnershipId: number
): Promise<OgpData | null> {
  const partnership = await getPartnershipById(partnershipId);
  if (!partnership) return null;

  const [user1, user2] = await Promise.all([
    getUserById(partnership.user1Id),
    getUserById(partnership.user2Id),
  ]);

  if (!user1 || !user2) return null;

  return {
    user1Name: user1.name ?? "ユーザー",
    user2Name: user2.name ?? "ユーザー",
    certId: `KS-${String(partnership.id).padStart(8, "0")}`,
    startedAt: partnership.startedAt,
    rank: partnership.currentRank,
    status: partnership.status,
  };
}

// ─── 装飾パターン描画ヘルパー ─────────────────────────────────────────────────

function drawPattern(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  pattern: OgpMilestoneTheme["pattern"],
  width: number,
  height: number
) {
  ctx.save();
  switch (pattern) {
    case "dots":
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let x = 0; x < width; x += 40) {
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case "stars": {
      const starPositions = [
        [120, 90], [300, 150], [500, 80], [700, 120], [900, 90], [1100, 160],
        [200, 300], [450, 200], [650, 350], [850, 250], [1050, 320],
        [150, 500], [380, 450], [600, 520], [800, 480], [1000, 510],
      ];
      for (const [sx, sy] of starPositions) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy);
        ctx.lineTo(sx + 8, sy);
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx, sy + 8);
        ctx.stroke();
      }
      break;
    }

    case "sparkles": {
      const sparklePositions = [
        [100, 100], [250, 180], [450, 100], [650, 150], [850, 100], [1050, 180],
        [180, 400], [400, 350], [600, 420], [800, 380], [1000, 420],
        [120, 550], [350, 500], [580, 560], [780, 520], [980, 560],
      ];
      for (const [sx, sy] of sparklePositions) {
        const size = 6;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy - size);
        ctx.lineTo(sx + size * 0.3, sy - size * 0.3);
        ctx.lineTo(sx + size, sy);
        ctx.lineTo(sx + size * 0.3, sy + size * 0.3);
        ctx.lineTo(sx, sy + size);
        ctx.lineTo(sx - size * 0.3, sy + size * 0.3);
        ctx.lineTo(sx - size, sy);
        ctx.lineTo(sx - size * 0.3, sy - size * 0.3);
        ctx.closePath();
        ctx.stroke();
      }
      break;
    }

    case "rings": {
      const ringPositions: [number, number, number][] = [
        [150, 150, 60], [1050, 150, 80], [150, 480, 70], [1050, 480, 60],
        [600, 100, 40], [600, 530, 40],
      ];
      for (const [rx, ry, r] of ringPositions) {
        for (let i = 1; i <= 3; i++) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 / i})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(rx, ry, r * i, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }

    case "diamonds": {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.06)";
      ctx.lineWidth = 0.5;
      const spacing = 60;
      for (let x = 0; x < width + spacing; x += spacing) {
        for (let y = 0; y < height + spacing; y += spacing) {
          const s = 15;
          ctx.beginPath();
          ctx.moveTo(x, y - s);
          ctx.lineTo(x + s, y);
          ctx.lineTo(x, y + s);
          ctx.lineTo(x - s, y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }
  }
  ctx.restore();
}

// ─── 角丸矩形ヘルパー ─────────────────────────────────────────────────────────

function roundRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── 婚約中専用 OGP 画像生成 ─────────────────────────────────────────────────

function generateEngagedOgpImage(
  data: OgpData,
  canvas: NapiCanvas,
  ctx: ReturnType<NapiCanvas["getContext"]>,
  WIDTH: number,
  HEIGHT: number
): Buffer {
  // ゴールドシャンパン背景
  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGrad.addColorStop(0, "#2c1810");
  bgGrad.addColorStop(0.4, "#4a2c0a");
  bgGrad.addColorStop(0.7, "#3d2408");
  bgGrad.addColorStop(1, "#1a0f05");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ゴールドの光彩円（右上）
  const glow1 = ctx.createRadialGradient(980, 80, 0, 980, 80, 320);
  glow1.addColorStop(0, "rgba(255, 200, 50, 0.25)");
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ゴールドの光彩円（左下）
  const glow2 = ctx.createRadialGradient(180, 560, 0, 180, 560, 260);
  glow2.addColorStop(0, "rgba(255, 180, 30, 0.20)");
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ダイヤモンドパターン
  ctx.strokeStyle = "rgba(255, 215, 0, 0.06)";
  ctx.lineWidth = 0.5;
  const spacing = 60;
  for (let x = 0; x < WIDTH + spacing; x += spacing) {
    for (let y = 0; y < HEIGHT + spacing; y += spacing) {
      const s = 15;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // フレーム
  const frameX = 60, frameY = 60, frameW = WIDTH - 120, frameH = HEIGHT - 120, frameR = 24;
  ctx.save();
  roundRect(ctx, frameX, frameY, frameW, frameH, frameR);
  ctx.fillStyle = "rgba(255, 215, 0, 0.04)";
  ctx.fill();
  const borderGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
  borderGrad.addColorStop(0, "#ffd700");
  borderGrad.addColorStop(0.5, "#ffe066");
  borderGrad.addColorStop(1, "#ffd700");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // 婚約バッジ（左上）
  const badgeW = 180, badgeH = 30, badgeX = frameX + 20, badgeY = frameY - 15;
  ctx.save();
  const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
  badgeGrad.addColorStop(0, "#ffd700");
  badgeGrad.addColorStop(1, "#ffe066");
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 15);
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#3d2408";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("✨ 婚約証明書 ✨", badgeX + badgeW / 2, badgeY + 21);

  // ロゴ
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("恋人証明", 100, 130);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 138);
  ctx.lineTo(220, 138);
  ctx.stroke();

  // 中央上テキスト
  ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ENGAGEMENT CERTIFICATE", WIDTH / 2, 120);

  // リングアイコン（中央）
  const ringX = WIDTH / 2, ringY = 230;
  ctx.save();
  // 外側の輪
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(ringX - 22, ringY, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ringX + 22, ringY, 28, 0, Math.PI * 2);
  ctx.stroke();
  // 宝石（中央の輪に）
  const gemGrad = ctx.createRadialGradient(ringX + 22, ringY - 10, 0, ringX + 22, ringY - 10, 12);
  gemGrad.addColorStop(0, "#ffffff");
  gemGrad.addColorStop(0.3, "#ffe066");
  gemGrad.addColorStop(1, "#ffd700");
  ctx.fillStyle = gemGrad;
  ctx.beginPath();
  ctx.arc(ringX + 22, ringY - 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 二人の名前
  const nameY = 340;
  ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
  ctx.textAlign = "center";
  const fullName = `${data.user1Name}  ×  ${data.user2Name}`;
  let fontSize = 42;
  ctx.font = `bold ${fontSize}px sans-serif`;
  while (ctx.measureText(fullName).width > frameW - 120 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillText(fullName, WIDTH / 2, nameY);
  ctx.fillStyle = "rgba(255, 215, 0, 0.65)";
  ctx.font = "16px sans-serif";
  ctx.fillText("の婚約を証明します", WIDTH / 2, nameY + 36);

  // 婚約日バッジ
  const dateStr = data.startedAt.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  const daysBadgeW = 280, daysBadgeH = 40, daysBadgeR = 20;
  const daysBadgeX = WIDTH / 2 - daysBadgeW / 2;
  const daysBadgeY = nameY + 52;
  ctx.save();
  const daysBadgeGrad = ctx.createLinearGradient(daysBadgeX, daysBadgeY, daysBadgeX + daysBadgeW, daysBadgeY);
  daysBadgeGrad.addColorStop(0, "rgba(255, 215, 0, 0.25)");
  daysBadgeGrad.addColorStop(1, "rgba(255, 224, 102, 0.25)");
  roundRect(ctx, daysBadgeX, daysBadgeY, daysBadgeW, daysBadgeH, daysBadgeR);
  ctx.fillStyle = daysBadgeGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`交際開始日：${dateStr}`, WIDTH / 2, daysBadgeY + 26);

  // 証明書番号
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
  ctx.font = "13px sans-serif";
  ctx.fillText(`証明書番号：${data.certId}`, 100, HEIGHT - 90);

  // ドメイン
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 215, 0, 0.35)";
  ctx.font = "13px sans-serif";
  ctx.fillText("loverschain.jp", WIDTH - 90, HEIGHT - 82);

  return canvas.toBuffer("image/png");
}

// ─── Canvas OGP 画像生成 ──────────────────────────────────────────────────────

export async function generateOgpImage(data: OgpData): Promise<Buffer> {
  const WIDTH = 1200;
  const HEIGHT = 630;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // ── 婚約中は専用ゴールドデザイン
  if (data.status === "engaged") {
    return generateEngagedOgpImage(data, canvas, ctx, WIDTH, HEIGHT);
  }

  // ── 経過日数の計算（shared ロジックを使用）
  const elapsedDays = calcElapsedDays(data.startedAt);

  // ── 節目テーマを取得（shared ロジックを使用）
  const theme = getOgpMilestoneTheme(elapsedDays);
  const isMilestone = theme.label !== "";

  // ── 背景グラデーション
  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGrad.addColorStop(0, theme.bgColors[0]);
  bgGrad.addColorStop(0.5, theme.bgColors[1]);
  bgGrad.addColorStop(1, theme.bgColors[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── 装飾：右上の光彩円
  const glowGrad1 = ctx.createRadialGradient(950, 100, 0, 950, 100, 300);
  glowGrad1.addColorStop(0, theme.glowColor1);
  glowGrad1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── 装飾：左下の光彩円
  const glowGrad2 = ctx.createRadialGradient(200, 530, 0, 200, 530, 250);
  glowGrad2.addColorStop(0, theme.glowColor2);
  glowGrad2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── 装飾パターン
  drawPattern(ctx, theme.pattern, WIDTH, HEIGHT);

  // ── 証明書フレーム（角丸矩形）
  const frameX = 60;
  const frameY = 60;
  const frameW = WIDTH - 120;
  const frameH = HEIGHT - 120;
  const frameR = 24;

  ctx.save();
  roundRect(ctx, frameX, frameY, frameW, frameH, frameR);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fill();

  const borderGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
  borderGrad.addColorStop(0, theme.frameColors[0]);
  borderGrad.addColorStop(0.5, theme.frameColors[1]);
  borderGrad.addColorStop(1, theme.frameColors[0]);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isMilestone ? 2.5 : 1.5;
  ctx.stroke();
  ctx.restore();

  // ── 節目ラベル（左上コーナーバッジ）
  if (isMilestone) {
    const mlBadgeW = 160;
    const mlBadgeH = 28;
    const mlBadgeX = frameX + 20;
    const mlBadgeY = frameY - 14;

    ctx.save();
    const mlGrad = ctx.createLinearGradient(mlBadgeX, mlBadgeY, mlBadgeX + mlBadgeW, mlBadgeY);
    mlGrad.addColorStop(0, theme.frameColors[0]);
    mlGrad.addColorStop(1, theme.frameColors[1]);
    roundRect(ctx, mlBadgeX, mlBadgeY, mlBadgeW, mlBadgeH, 14);
    ctx.fillStyle = mlGrad;
    ctx.fill();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`🎉 ${theme.label}`, mlBadgeX + mlBadgeW / 2, mlBadgeY + 19);
  }

  // ── 左側：ロゴ・サービス名
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("恋人証明", 100, 130);

  ctx.strokeStyle = theme.frameColors[0];
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 138);
  ctx.lineTo(220, 138);
  ctx.stroke();

  // ── 中央上：「CERTIFICATE OF LOVE」
  ctx.fillStyle = theme.dateTextColor;
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CERTIFICATE OF LOVE", WIDTH / 2, 120);

  // ── 中央：ハートマーク
  const heartX = WIDTH / 2;
  const heartY = 230;
  const heartSize = isMilestone ? 32 : 28;

  ctx.save();
  ctx.fillStyle = theme.heartColor;
  ctx.beginPath();
  ctx.moveTo(heartX, heartY + heartSize * 0.4);
  ctx.bezierCurveTo(
    heartX, heartY - heartSize * 0.2,
    heartX - heartSize * 1.2, heartY - heartSize * 0.2,
    heartX - heartSize * 1.2, heartY + heartSize * 0.4
  );
  ctx.bezierCurveTo(
    heartX - heartSize * 1.2, heartY + heartSize,
    heartX, heartY + heartSize * 1.4,
    heartX, heartY + heartSize * 1.8
  );
  ctx.bezierCurveTo(
    heartX, heartY + heartSize * 1.4,
    heartX + heartSize * 1.2, heartY + heartSize,
    heartX + heartSize * 1.2, heartY + heartSize * 0.4
  );
  ctx.bezierCurveTo(
    heartX + heartSize * 1.2, heartY - heartSize * 0.2,
    heartX, heartY - heartSize * 0.2,
    heartX, heartY + heartSize * 0.4
  );
  ctx.fill();
  ctx.restore();

  // ── 中央：二人の名前
  const nameY = 340;
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.textAlign = "center";

  const fullName = `${data.user1Name}  ×  ${data.user2Name}`;
  let fontSize = 42;
  ctx.font = `bold ${fontSize}px sans-serif`;
  while (ctx.measureText(fullName).width > frameW - 120 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillText(fullName, WIDTH / 2, nameY);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "16px sans-serif";
  ctx.fillText("の恋愛を証明します", WIDTH / 2, nameY + 36);

  // ── 経過日数バッジ
  const daysBadgeW = isMilestone ? 260 : 220;
  const daysBadgeH = 40;
  const daysBadgeR = 20;
  const daysBadgeX = WIDTH / 2 - daysBadgeW / 2;
  const daysBadgeY = nameY + 52;

  ctx.save();
  const daysBadgeGrad = ctx.createLinearGradient(daysBadgeX, daysBadgeY, daysBadgeX + daysBadgeW, daysBadgeY);
  daysBadgeGrad.addColorStop(0, theme.daysBadgeColors[0]);
  daysBadgeGrad.addColorStop(1, theme.daysBadgeColors[1]);
  roundRect(ctx, daysBadgeX, daysBadgeY, daysBadgeW, daysBadgeH, daysBadgeR);
  ctx.fillStyle = daysBadgeGrad;
  ctx.fill();
  ctx.strokeStyle = theme.daysTextColor.replace("1.0", "0.50").replace("0.95", "0.50");
  ctx.lineWidth = isMilestone ? 1.5 : 1;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.daysTextColor;
  ctx.font = `bold ${isMilestone ? 20 : 18}px sans-serif`;
  ctx.fillText(`交際 ${elapsedDays.toLocaleString("ja-JP")} 日目`, WIDTH / 2, daysBadgeY + 26);

  // ── 交際開始日
  const dateStr = data.startedAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillStyle = theme.dateTextColor;
  ctx.font = "14px sans-serif";
  ctx.fillText(`交際開始日：${dateStr}`, WIDTH / 2, daysBadgeY + daysBadgeH + 22);

  // ── 証明書番号（左下）
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "13px sans-serif";
  ctx.fillText(`証明書番号：${data.certId}`, 100, HEIGHT - 90);

  // ── ランクバッジ（右下）
  const rankLabel = RANK_LABELS[data.rank] ?? "Bronze";
  const rankColor = RANK_COLORS[data.rank] ?? "#cd7f32";
  const badgeW = 130;
  const badgeH = 32;
  const badgeR = 16;
  const badgeX = WIDTH - 90 - badgeW;
  const badgeY = HEIGHT - 125;

  ctx.save();
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = `${rankColor}33`;
  ctx.fill();
  ctx.strokeStyle = rankColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = rankColor;
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`★ ${rankLabel}`, badgeX + badgeW / 2, badgeY + 21);

  // ── ドメイン（右下）
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "13px sans-serif";
  ctx.fillText("loverschain.jp", WIDTH - 90, HEIGHT - 82);

  return canvas.toBuffer("image/png");
}
