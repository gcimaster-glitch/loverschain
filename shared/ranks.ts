// ============================================================
// 恋人証明 ランク定義
// ============================================================

export type RankKey =
  | "bronze"
  | "silver_3d"
  | "silver_1m"
  | "silver_3m"
  | "silver_6m"
  | "gold_10m"
  | "gold_12m"
  | "gold_15m"
  | "platinum_20m"
  | "platinum_24m"
  | "diamond_30m"
  | "diamond_36m"
  | "legend_40m";

export type PlanType =
  | "lover"       // 恋人証明（一般）
  | "engagement"  // 婚約証明
  | "student";    // 学生割引（片方が学生）

export interface RankDefinition {
  key: RankKey;
  label: string;          // 表示名
  labelEn: string;        // 英語名
  minDays: number;        // 最低交際日数
  color: string;          // メインカラー (OKLCH)
  gradientFrom: string;
  gradientTo: string;
  badgeColor: string;     // バッジ背景色
  badgeText: string;      // バッジテキスト色
  description: string;    // 節目の説明
  emoji: string;
}

export const RANKS: RankDefinition[] = [
  {
    key: "bronze",
    label: "ブロンズ",
    labelEn: "Bronze",
    minDays: 0,
    color: "oklch(0.65 0.12 50)",
    gradientFrom: "oklch(0.70 0.14 55)",
    gradientTo: "oklch(0.55 0.10 40)",
    badgeColor: "#CD7F32",
    badgeText: "#fff",
    description: "交際スタート",
    emoji: "🤎",
  },
  {
    key: "silver_3d",
    label: "シルバー 3日",
    labelEn: "Silver 3 Days",
    minDays: 3,
    color: "oklch(0.75 0.04 260)",
    gradientFrom: "oklch(0.80 0.05 260)",
    gradientTo: "oklch(0.65 0.04 250)",
    badgeColor: "#A8A9AD",
    badgeText: "#fff",
    description: "3日間の絆",
    emoji: "🩶",
  },
  {
    key: "silver_1m",
    label: "シルバー 1ヶ月",
    labelEn: "Silver 1 Month",
    minDays: 30,
    color: "oklch(0.78 0.05 255)",
    gradientFrom: "oklch(0.82 0.06 255)",
    gradientTo: "oklch(0.68 0.04 245)",
    badgeColor: "#C0C0C0",
    badgeText: "#333",
    description: "1ヶ月記念",
    emoji: "🩶",
  },
  {
    key: "silver_3m",
    label: "シルバー 3ヶ月",
    labelEn: "Silver 3 Months",
    minDays: 90,
    color: "oklch(0.80 0.06 250)",
    gradientFrom: "oklch(0.84 0.07 250)",
    gradientTo: "oklch(0.70 0.05 240)",
    badgeColor: "#B8B8B8",
    badgeText: "#333",
    description: "3ヶ月記念",
    emoji: "🩶",
  },
  {
    key: "silver_6m",
    label: "シルバー 半年",
    labelEn: "Silver 6 Months",
    minDays: 180,
    color: "oklch(0.82 0.07 245)",
    gradientFrom: "oklch(0.86 0.08 245)",
    gradientTo: "oklch(0.72 0.06 235)",
    badgeColor: "#A9A9A9",
    badgeText: "#fff",
    description: "半年記念",
    emoji: "🩶",
  },
  {
    key: "gold_10m",
    label: "ゴールド 10ヶ月",
    labelEn: "Gold 10 Months",
    minDays: 300,
    color: "oklch(0.80 0.18 85)",
    gradientFrom: "oklch(0.85 0.20 90)",
    gradientTo: "oklch(0.70 0.16 75)",
    badgeColor: "#FFD700",
    badgeText: "#333",
    description: "10ヶ月記念",
    emoji: "💛",
  },
  {
    key: "gold_12m",
    label: "ゴールド 1周年",
    labelEn: "Gold 1 Year",
    minDays: 365,
    color: "oklch(0.82 0.20 88)",
    gradientFrom: "oklch(0.87 0.22 92)",
    gradientTo: "oklch(0.72 0.18 78)",
    badgeColor: "#FFC200",
    badgeText: "#333",
    description: "1周年記念 🎉",
    emoji: "🏆",
  },
  {
    key: "gold_15m",
    label: "ゴールド 15ヶ月",
    labelEn: "Gold 15 Months",
    minDays: 456,
    color: "oklch(0.84 0.21 90)",
    gradientFrom: "oklch(0.88 0.23 94)",
    gradientTo: "oklch(0.74 0.19 80)",
    badgeColor: "#FFB800",
    badgeText: "#333",
    description: "15ヶ月記念",
    emoji: "💛",
  },
  {
    key: "platinum_20m",
    label: "プラチナ 20ヶ月",
    labelEn: "Platinum 20 Months",
    minDays: 608,
    color: "oklch(0.72 0.08 200)",
    gradientFrom: "oklch(0.78 0.10 205)",
    gradientTo: "oklch(0.62 0.07 195)",
    badgeColor: "#E5E4E2",
    badgeText: "#333",
    description: "20ヶ月記念",
    emoji: "🤍",
  },
  {
    key: "platinum_24m",
    label: "プラチナ 2周年",
    labelEn: "Platinum 2 Years",
    minDays: 730,
    color: "oklch(0.74 0.09 202)",
    gradientFrom: "oklch(0.80 0.11 207)",
    gradientTo: "oklch(0.64 0.08 197)",
    badgeColor: "#D4D4D4",
    badgeText: "#333",
    description: "2周年記念 ✨",
    emoji: "🤍",
  },
  {
    key: "diamond_30m",
    label: "ダイヤモンド 30ヶ月",
    labelEn: "Diamond 30 Months",
    minDays: 912,
    color: "oklch(0.65 0.22 310)",
    gradientFrom: "oklch(0.70 0.25 315)",
    gradientTo: "oklch(0.55 0.20 305)",
    badgeColor: "#B9F2FF",
    badgeText: "#333",
    description: "30ヶ月記念",
    emoji: "💎",
  },
  {
    key: "diamond_36m",
    label: "ダイヤモンド 3周年",
    labelEn: "Diamond 3 Years",
    minDays: 1095,
    color: "oklch(0.67 0.24 312)",
    gradientFrom: "oklch(0.72 0.27 317)",
    gradientTo: "oklch(0.57 0.22 307)",
    badgeColor: "#A8EDFF",
    badgeText: "#333",
    description: "3周年記念 💎",
    emoji: "💎",
  },
  {
    key: "legend_40m",
    label: "レジェンド 40ヶ月〜",
    labelEn: "Legend 40+ Months",
    minDays: 1216,
    color: "oklch(0.55 0.28 340)",
    gradientFrom: "oklch(0.60 0.30 345)",
    gradientTo: "oklch(0.45 0.26 330)",
    badgeColor: "#FF69B4",
    badgeText: "#fff",
    description: "レジェンドカップル 🌟",
    emoji: "🌟",
  },
];

/** 交際日数からランクを計算する */
export function calcRank(startedAt: Date): RankKey {
  const days = Math.floor(
    (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  // 降順で最初にマッチするランクを返す
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (days >= RANKS[i].minDays) {
      return RANKS[i].key;
    }
  }
  return "bronze";
}

/** 次のランクアップまでの日数を返す */
export function daysToNextRank(startedAt: Date): { nextRank: RankDefinition | null; daysLeft: number } {
  const days = Math.floor(
    (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  for (const rank of RANKS) {
    if (rank.minDays > days) {
      return { nextRank: rank, daysLeft: rank.minDays - days };
    }
  }
  return { nextRank: null, daysLeft: 0 };
}

/** ランクキーからRankDefinitionを取得 */
export function getRankDef(key: RankKey): RankDefinition {
  return RANKS.find((r) => r.key === key) ?? RANKS[0];
}

// ============================================================
// 料金設定（円）
// ============================================================
// ペアあたりの料金（税込）
export const PLAN_PRICES: Record<PlanType, {
  pairPrice: number;        // 新規発行 税込（ペア）
  pairPriceExTax: number;   // 新規発行 税別（ペア）
  renewalPrice: number;     // 更新 税込（ペア）
  renewalPriceExTax: number; // 更新 税別（ペア）
  label: string;
  description: string;
  studentNote?: string;
}> = {
  lover: {
    pairPrice: 6600,
    pairPriceExTax: 6000,
    renewalPrice: 4400,
    renewalPriceExTax: 4000,
    label: "恋人証明",
    description: "交際中のカップル向けブロックチェーン証明書",
  },
  engagement: {
    pairPrice: 16500,
    pairPriceExTax: 15000,
    renewalPrice: 11000,
    renewalPriceExTax: 10000,
    label: "婚約証明",
    description: "婚約カップル向け特別証明書（婚約指輪・指輪写真付き）",
  },
  student: {
    pairPrice: 3300,
    pairPriceExTax: 3000,
    renewalPrice: 2200,
    renewalPriceExTax: 2000,
    label: "学生割引",
    description: "片方が学生であれば適用（学生証確認あり）",
    studentNote: "ペアのどちらか一方が学生であれば適用されます",
  },
};

// 後方互換性のためのエイリアス（旧コードが参照する場合用）
export const RENEWAL_PRICE_PER_PERSON = 2000; // 旧: 年間更新 お一人様 2,000円（非推奨）

// コイン換算
export const COIN_TO_YEN = 500; // 1コイン = 500円

// 物理証明書価格
export const PHYSICAL_CERT_PRICES = {
  print_a4: 1500,
  frame_a4: 5000,
  frame_a3: 12000,
  digital_nft: 3000,
} as const;

// OEM手数料デフォルト
export const DEFAULT_OEM_COMMISSION_RATE = 50; // 50%

// 紹介報酬
export const REFERRAL_REWARD_COINS = 2; // 2コイン = 1,000円相当
