/**
 * shared/milestone.ts のユニットテスト
 * getMilestoneInfo・calcElapsedDays・getOgpMilestoneTheme を検証する。
 */
import { describe, expect, it } from "vitest";
import {
  getMilestoneInfo,
  calcElapsedDays,
  getOgpMilestoneTheme,
  getNextMilestone,
} from "../shared/milestone";

describe("calcElapsedDays", () => {
  it("今日を開始日にすると 1 日目", () => {
    const today = new Date();
    expect(calcElapsedDays(today)).toBe(1);
  });

  it("昨日を開始日にすると 2 日目", () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
    expect(calcElapsedDays(yesterday)).toBe(2);
  });

  it("未来日を開始日にすると 1 日目（最小値）", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    expect(calcElapsedDays(future)).toBe(1);
  });

  it("99日前を開始日にすると 100 日目", () => {
    const d = new Date(Date.now() - 1000 * 60 * 60 * 24 * 99);
    expect(calcElapsedDays(d)).toBe(100);
  });
});

describe("getMilestoneInfo", () => {
  it("50日はデフォルト（isMilestone = false）", () => {
    const info = getMilestoneInfo(50);
    expect(info.isMilestone).toBe(false);
    expect(info.label).toBe("");
  });

  it("100日は節目（100日記念）", () => {
    const info = getMilestoneInfo(100);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("100日記念");
    expect(info.emoji).toBe("🎉");
  });

  it("200日は節目（200日記念）", () => {
    const info = getMilestoneInfo(200);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("200日記念");
  });

  it("300日は節目（300日記念）", () => {
    const info = getMilestoneInfo(300);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("300日記念");
  });

  it("365日は節目（1周年記念）", () => {
    const info = getMilestoneInfo(365);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("1周年記念");
    expect(info.emoji).toBe("🎊");
  });

  it("730日は節目（2周年記念）", () => {
    const info = getMilestoneInfo(730);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("2周年記念");
  });

  it("1095日は節目（3周年記念）", () => {
    const info = getMilestoneInfo(1095);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("3周年記念");
  });

  it("1825日は節目（5周年記念）", () => {
    const info = getMilestoneInfo(1825);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("5周年記念");
    expect(info.emoji).toBe("💎");
  });

  it("3650日は節目（10周年記念）", () => {
    const info = getMilestoneInfo(3650);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("10周年記念");
    expect(info.emoji).toBe("🏆");
  });

  it("節目の前日（99日）はデフォルト", () => {
    const info = getMilestoneInfo(99);
    expect(info.isMilestone).toBe(false);
  });

  it("節目の翌日（101日）は100日記念テーマを維持", () => {
    const info = getMilestoneInfo(101);
    expect(info.isMilestone).toBe(true);
    expect(info.label).toBe("100日記念");
  });

  it("elapsedDays が返り値に含まれる", () => {
    const info = getMilestoneInfo(150);
    expect(info.elapsedDays).toBe(150);
  });

  it("bannerColors は長さ 2 の配列", () => {
    const info = getMilestoneInfo(365);
    expect(info.bannerColors).toHaveLength(2);
  });
});

describe("getOgpMilestoneTheme", () => {
  it("50日はデフォルトテーマ（label = ''）", () => {
    const theme = getOgpMilestoneTheme(50);
    expect(theme.label).toBe("");
  });

  it("100日は100日記念テーマ", () => {
    const theme = getOgpMilestoneTheme(100);
    expect(theme.label).toBe("100日記念");
  });

  it("3650日は10周年記念テーマ", () => {
    const theme = getOgpMilestoneTheme(3650);
    expect(theme.label).toBe("10周年記念");
  });

  it("bgColors は長さ 3 の配列", () => {
    const theme = getOgpMilestoneTheme(365);
    expect(theme.bgColors).toHaveLength(3);
  });

  it("pattern は有効な値", () => {
    const validPatterns = ["dots", "stars", "sparkles", "rings", "diamonds"];
    for (const days of [50, 100, 200, 300, 365, 730, 1095, 1825, 3650]) {
      const theme = getOgpMilestoneTheme(days);
      expect(validPatterns).toContain(theme.pattern);
    }
  });
});

describe("getNextMilestone", () => {
  it("交際1日目の次の節目は100日記念", () => {
    const next = getNextMilestone(1);
    expect(next).not.toBeNull();
    expect(next!.targetDays).toBe(100);
    expect(next!.label).toBe("100日記念");
    expect(next!.daysLeft).toBe(99);
  });

  it("交際50日目の次の節目は100日記念で残り50日", () => {
    const next = getNextMilestone(50);
    expect(next).not.toBeNull();
    expect(next!.targetDays).toBe(100);
    expect(next!.daysLeft).toBe(50);
  });

  it("進捗率は0〜1の範囲内に収まる", () => {
    const next = getNextMilestone(50);
    expect(next!.progress).toBeGreaterThanOrEqual(0);
    expect(next!.progress).toBeLessThanOrEqual(1);
  });

  it("交際99日目の進捗率は99%近い", () => {
    const next = getNextMilestone(99);
    expect(next!.progress).toBeCloseTo(0.99, 1);
  });

  it("交際100日目の次の節目は200日記念", () => {
    const next = getNextMilestone(100);
    expect(next).not.toBeNull();
    expect(next!.targetDays).toBe(200);
    expect(next!.label).toBe("200日記念");
  });

  it("交際365日目の次の節目は730日（2周年）", () => {
    const next = getNextMilestone(365);
    expect(next).not.toBeNull();
    expect(next!.targetDays).toBe(730);
    expect(next!.label).toBe("2周年記念");
  });

  it("交際3650日目（10年）の次の節目はnull（全節目達成）", () => {
    const next = getNextMilestone(3650);
    expect(next).toBeNull();
  });

  it("超長期（3700日）の次の節目はnull", () => {
    const next = getNextMilestone(3700);
    expect(next).toBeNull();
  });

  it("bannerColorsは長さ2の配列", () => {
    const next = getNextMilestone(50);
    expect(next!.bannerColors).toHaveLength(2);
  });

  it("fromDaysは前の節目の日数（50日目の前は0）", () => {
    const next = getNextMilestone(50);
    expect(next!.fromDays).toBe(0);
  });

  it("fromDaysは前の節目の日数（150日目の前は100）", () => {
    const next = getNextMilestone(150);
    expect(next!.fromDays).toBe(100);
  });
});
