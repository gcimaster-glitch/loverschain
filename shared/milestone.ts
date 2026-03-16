/**
 * 節目（記念日）判定ロジック
 * サーバー（OGP 画像生成）とクライアント（証明書ページバナー）の両方で使用する。
 */

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export interface MilestoneInfo {
  /** 節目ラベル（例: "100日記念"）。該当なしは "" */
  label: string;
  /** 節目かどうか */
  isMilestone: boolean;
  /** 経過日数 */
  elapsedDays: number;
  /** バナー背景グラデーション（CSS linear-gradient 用の色配列） */
  bannerColors: [string, string];
  /** バナーテキスト色 */
  bannerTextColor: string;
  /** バナーボーダー色 */
  bannerBorderColor: string;
  /** 絵文字アイコン */
  emoji: string;
  /** サブメッセージ */
  subMessage: string;
}

// ─── 節目定義 ────────────────────────────────────────────────────────────────

interface MilestoneDefinition {
  days: number;
  label: string;
  bannerColors: [string, string];
  bannerTextColor: string;
  bannerBorderColor: string;
  emoji: string;
  subMessage: string;
}

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    days: 3650,
    label: "10周年記念",
    bannerColors: ["oklch(0.25 0.08 60)", "oklch(0.18 0.06 50)"],
    bannerTextColor: "oklch(0.90 0.18 80)",
    bannerBorderColor: "oklch(0.75 0.18 80)",
    emoji: "🏆",
    subMessage: "10年間、愛を育んできたお二人に最大の敬意を。",
  },
  {
    days: 1825,
    label: "5周年記念",
    bannerColors: ["oklch(0.22 0.12 300)", "oklch(0.18 0.10 280)"],
    bannerTextColor: "oklch(0.88 0.15 300)",
    bannerBorderColor: "oklch(0.70 0.18 300)",
    emoji: "💎",
    subMessage: "5年間の愛の歩みを、心よりお祝い申し上げます。",
  },
  {
    days: 1095,
    label: "3周年記念",
    bannerColors: ["oklch(0.20 0.10 185)", "oklch(0.16 0.08 175)"],
    bannerTextColor: "oklch(0.88 0.14 185)",
    bannerBorderColor: "oklch(0.68 0.18 185)",
    emoji: "🌊",
    subMessage: "3年間、共に歩んできたお二人の絆を証明します。",
  },
  {
    days: 730,
    label: "2周年記念",
    bannerColors: ["oklch(0.22 0.14 350)", "oklch(0.18 0.12 340)"],
    bannerTextColor: "oklch(0.90 0.16 350)",
    bannerBorderColor: "oklch(0.70 0.20 350)",
    emoji: "🌹",
    subMessage: "2年間の愛の証明。これからも末永く。",
  },
  {
    days: 365,
    label: "1周年記念",
    bannerColors: ["oklch(0.20 0.12 140)", "oklch(0.16 0.10 130)"],
    bannerTextColor: "oklch(0.88 0.16 140)",
    bannerBorderColor: "oklch(0.68 0.20 140)",
    emoji: "🎊",
    subMessage: "交際1周年おめでとうございます！素晴らしい節目です。",
  },
  {
    days: 300,
    label: "300日記念",
    bannerColors: ["oklch(0.22 0.10 55)", "oklch(0.18 0.08 45)"],
    bannerTextColor: "oklch(0.90 0.16 60)",
    bannerBorderColor: "oklch(0.72 0.18 60)",
    emoji: "✨",
    subMessage: "300日間、一緒にいてくれてありがとう。",
  },
  {
    days: 200,
    label: "200日記念",
    bannerColors: ["oklch(0.20 0.10 220)", "oklch(0.16 0.08 210)"],
    bannerTextColor: "oklch(0.88 0.14 220)",
    bannerBorderColor: "oklch(0.68 0.18 220)",
    emoji: "💙",
    subMessage: "200日間の愛の歩み。これからも一緒に。",
  },
  {
    days: 100,
    label: "100日記念",
    bannerColors: ["oklch(0.22 0.14 320)", "oklch(0.18 0.12 310)"],
    bannerTextColor: "oklch(0.90 0.16 320)",
    bannerBorderColor: "oklch(0.70 0.20 320)",
    emoji: "🎉",
    subMessage: "交際100日おめでとうございます！",
  },
];

// ─── 経過日数計算 ─────────────────────────────────────────────────────────────

/**
 * 交際開始日から当日までの経過日数を計算する（+1日目起算）。
 * 未来日の場合は 1 を返す。
 */
export function calcElapsedDays(startedAt: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const raw = Math.floor((Date.now() - startedAt.getTime()) / msPerDay) + 1;
  return Math.max(1, raw);
}

// ─── 節目情報取得 ─────────────────────────────────────────────────────────────

/**
 * 経過日数から節目情報を取得する。
 * 節目に該当しない場合は isMilestone = false のオブジェクトを返す。
 */
export function getMilestoneInfo(elapsedDays: number): MilestoneInfo {
  for (const def of MILESTONE_DEFINITIONS) {
    if (elapsedDays >= def.days) {
      return {
        label: def.label,
        isMilestone: true,
        elapsedDays,
        bannerColors: def.bannerColors,
        bannerTextColor: def.bannerTextColor,
        bannerBorderColor: def.bannerBorderColor,
        emoji: def.emoji,
        subMessage: def.subMessage,
      };
    }
  }
  return {
    label: "",
    isMilestone: false,
    elapsedDays,
    bannerColors: ["oklch(0.20 0.10 290)", "oklch(0.16 0.08 280)"],
    bannerTextColor: "oklch(0.88 0.12 290)",
    bannerBorderColor: "oklch(0.65 0.15 290)",
    emoji: "❤️",
    subMessage: "",
  };
}

// ─── 次の節目情報取得 ──────────────────────────────────────────────────────────

export interface NextMilestoneInfo {
  /** 次の節目の日数（例: 100） */
  targetDays: number;
  /** 次の節目のラベル（例: "100日記念"） */
  label: string;
  /** 次の節目の絵文字 */
  emoji: string;
  /** 次の節目まであと何日 */
  daysLeft: number;
  /** 現在の節目区間での進捗率（0〜1） */
  progress: number;
  /** 現在の節目区間の開始日数（前の節目の日数） */
  fromDays: number;
  /** バナー色（節目テーマに合わせる） */
  bannerColors: [string, string];
  /** テキスト色 */
  bannerTextColor: string;
  /** ボーダー色 */
  bannerBorderColor: string;
}

/**
 * 経過日数から「次の節目」情報を返す。
 * 全節目（10年）を超えた場合は null を返す。
 */
export function getNextMilestone(elapsedDays: number): NextMilestoneInfo | null {
  // 節目を昇順に並べて次の節目を探す
  const sorted = [...MILESTONE_DEFINITIONS].sort((a, b) => a.days - b.days);

  for (let i = 0; i < sorted.length; i++) {
    const def = sorted[i];
    if (elapsedDays < def.days) {
      // 前の節目（または 0）から現在の節目までの区間での進捗
      const fromDays = i === 0 ? 0 : sorted[i - 1].days;
      const span = def.days - fromDays;
      const elapsed = elapsedDays - fromDays;
      const progress = Math.min(1, Math.max(0, elapsed / span));

      return {
        targetDays: def.days,
        label: def.label,
        emoji: def.emoji,
        daysLeft: def.days - elapsedDays,
        progress,
        fromDays,
        bannerColors: def.bannerColors,
        bannerTextColor: def.bannerTextColor,
        bannerBorderColor: def.bannerBorderColor,
      };
    }
  }

  // 全節目（10年）を超えた場合
  return null;
}

// ─── OGP 画像生成用テーマ（後方互換エクスポート） ─────────────────────────────

export interface OgpMilestoneTheme {
  label: string;
  bgColors: [string, string, string];
  glowColor1: string;
  glowColor2: string;
  frameColors: [string, string];
  daysBadgeColors: [string, string];
  daysTextColor: string;
  dateTextColor: string;
  heartColor: string;
  pattern: "dots" | "stars" | "sparkles" | "rings" | "diamonds";
}

const OGP_MILESTONE_THEMES: Array<{ days: number; theme: OgpMilestoneTheme }> = [
  {
    days: 3650,
    theme: {
      label: "10周年記念",
      bgColors: ["#0a0a0a", "#1a0a00", "#0d0500"],
      glowColor1: "rgba(255, 215, 0, 0.40)",
      glowColor2: "rgba(255, 165, 0, 0.30)",
      frameColors: ["rgba(255, 215, 0, 1.0)", "rgba(255, 140, 0, 0.9)"],
      daysBadgeColors: ["rgba(255, 215, 0, 0.35)", "rgba(255, 140, 0, 0.35)"],
      daysTextColor: "rgba(255, 240, 180, 1.0)",
      dateTextColor: "rgba(255, 215, 0, 1.0)",
      heartColor: "rgba(255, 215, 0, 0.95)",
      pattern: "diamonds",
    },
  },
  {
    days: 1825,
    theme: {
      label: "5周年記念",
      bgColors: ["#0d0020", "#1a0035", "#0a001a"],
      glowColor1: "rgba(200, 100, 255, 0.40)",
      glowColor2: "rgba(150, 50, 255, 0.30)",
      frameColors: ["rgba(200, 100, 255, 0.9)", "rgba(150, 50, 255, 0.8)"],
      daysBadgeColors: ["rgba(200, 100, 255, 0.35)", "rgba(150, 50, 255, 0.35)"],
      daysTextColor: "rgba(230, 180, 255, 1.0)",
      dateTextColor: "rgba(200, 150, 255, 0.95)",
      heartColor: "rgba(200, 100, 255, 0.90)",
      pattern: "sparkles",
    },
  },
  {
    days: 1095,
    theme: {
      label: "3周年記念",
      bgColors: ["#001a1a", "#003030", "#001010"],
      glowColor1: "rgba(0, 220, 200, 0.35)",
      glowColor2: "rgba(0, 180, 160, 0.25)",
      frameColors: ["rgba(0, 220, 200, 0.85)", "rgba(0, 180, 160, 0.75)"],
      daysBadgeColors: ["rgba(0, 220, 200, 0.30)", "rgba(0, 180, 160, 0.30)"],
      daysTextColor: "rgba(180, 255, 250, 1.0)",
      dateTextColor: "rgba(0, 220, 200, 0.95)",
      heartColor: "rgba(0, 220, 200, 0.85)",
      pattern: "rings",
    },
  },
  {
    days: 730,
    theme: {
      label: "2周年記念",
      bgColors: ["#1a0010", "#300020", "#100010"],
      glowColor1: "rgba(255, 50, 150, 0.35)",
      glowColor2: "rgba(200, 50, 100, 0.25)",
      frameColors: ["rgba(255, 100, 180, 0.85)", "rgba(200, 50, 150, 0.75)"],
      daysBadgeColors: ["rgba(255, 100, 180, 0.30)", "rgba(200, 50, 150, 0.30)"],
      daysTextColor: "rgba(255, 200, 230, 1.0)",
      dateTextColor: "rgba(255, 120, 180, 0.95)",
      heartColor: "rgba(255, 80, 150, 0.90)",
      pattern: "stars",
    },
  },
  {
    days: 365,
    theme: {
      label: "1周年記念",
      bgColors: ["#0a1a00", "#152800", "#081000"],
      glowColor1: "rgba(100, 220, 50, 0.35)",
      glowColor2: "rgba(200, 255, 100, 0.25)",
      frameColors: ["rgba(150, 255, 80, 0.85)", "rgba(100, 200, 50, 0.75)"],
      daysBadgeColors: ["rgba(150, 255, 80, 0.30)", "rgba(100, 200, 50, 0.30)"],
      daysTextColor: "rgba(220, 255, 180, 1.0)",
      dateTextColor: "rgba(150, 255, 80, 0.95)",
      heartColor: "rgba(150, 255, 80, 0.85)",
      pattern: "sparkles",
    },
  },
  {
    days: 300,
    theme: {
      label: "300日記念",
      bgColors: ["#1a1000", "#2a1800", "#100a00"],
      glowColor1: "rgba(255, 180, 50, 0.35)",
      glowColor2: "rgba(255, 140, 30, 0.25)",
      frameColors: ["rgba(255, 200, 80, 0.85)", "rgba(255, 160, 40, 0.75)"],
      daysBadgeColors: ["rgba(255, 200, 80, 0.30)", "rgba(255, 160, 40, 0.30)"],
      daysTextColor: "rgba(255, 240, 180, 1.0)",
      dateTextColor: "rgba(255, 200, 80, 0.95)",
      heartColor: "rgba(255, 180, 50, 0.85)",
      pattern: "stars",
    },
  },
  {
    days: 200,
    theme: {
      label: "200日記念",
      bgColors: ["#001020", "#001830", "#000a15"],
      glowColor1: "rgba(50, 180, 255, 0.35)",
      glowColor2: "rgba(30, 140, 220, 0.25)",
      frameColors: ["rgba(80, 200, 255, 0.85)", "rgba(40, 160, 220, 0.75)"],
      daysBadgeColors: ["rgba(80, 200, 255, 0.30)", "rgba(40, 160, 220, 0.30)"],
      daysTextColor: "rgba(180, 230, 255, 1.0)",
      dateTextColor: "rgba(80, 200, 255, 0.95)",
      heartColor: "rgba(50, 180, 255, 0.85)",
      pattern: "rings",
    },
  },
  {
    days: 100,
    theme: {
      label: "100日記念",
      bgColors: ["#1a0020", "#280030", "#100015"],
      glowColor1: "rgba(255, 120, 220, 0.35)",
      glowColor2: "rgba(220, 80, 200, 0.25)",
      frameColors: ["rgba(255, 150, 230, 0.85)", "rgba(220, 100, 210, 0.75)"],
      daysBadgeColors: ["rgba(255, 150, 230, 0.30)", "rgba(220, 100, 210, 0.30)"],
      daysTextColor: "rgba(255, 210, 250, 1.0)",
      dateTextColor: "rgba(255, 150, 230, 0.95)",
      heartColor: "rgba(255, 120, 220, 0.85)",
      pattern: "sparkles",
    },
  },
];

const DEFAULT_OGP_THEME: OgpMilestoneTheme = {
  label: "",
  bgColors: ["#1a0a2e", "#16213e", "#0d0d2b"],
  glowColor1: "rgba(180, 100, 255, 0.25)",
  glowColor2: "rgba(255, 100, 180, 0.20)",
  frameColors: ["rgba(212, 175, 55, 0.8)", "rgba(255, 215, 0, 0.6)"],
  daysBadgeColors: ["rgba(255, 100, 150, 0.30)", "rgba(180, 80, 220, 0.30)"],
  daysTextColor: "rgba(255, 200, 220, 0.95)",
  dateTextColor: "rgba(212, 175, 55, 0.85)",
  heartColor: "rgba(255, 100, 150, 0.85)",
  pattern: "dots",
};

/** OGP 画像生成用：経過日数からテーマを取得する */
export function getOgpMilestoneTheme(elapsedDays: number): OgpMilestoneTheme {
  for (const { days, theme } of OGP_MILESTONE_THEMES) {
    if (elapsedDays >= days) return theme;
  }
  return DEFAULT_OGP_THEME;
}
