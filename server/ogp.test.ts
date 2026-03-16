/**
 * OGP 画像生成ヘルパーのユニットテスト
 */
import { describe, expect, it } from "vitest";
import { generateOgpImage, getMilestoneTheme } from "./ogp";

describe("generateOgpImage", () => {
  const baseData = {
    user1Name: "田中 太郎",
    user2Name: "山田 花子",
    certId: "KS-00000001",
    startedAt: new Date("2024-04-01"),
    rank: "gold_12m",
  };

  it("PNG バッファを返す", async () => {
    const buf = await generateOgpImage(baseData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000); // 最低 10KB 以上
  });

  it("PNG シグネチャが正しい", async () => {
    const buf = await generateOgpImage(baseData);
    // PNG ファイルは 0x89 0x50 0x4E 0x47 で始まる
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // 'P'
    expect(buf[2]).toBe(0x4e); // 'N'
    expect(buf[3]).toBe(0x47); // 'G'
  });

  it("長い名前でもエラーにならない", async () => {
    const longNameData = {
      ...baseData,
      user1Name: "とても長い名前のユーザーさん",
      user2Name: "これもとても長い名前のユーザーさん",
    };
    const buf = await generateOgpImage(longNameData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  it("各ランクで正常に生成できる", async () => {
    const ranks = ["bronze", "silver_3d", "gold_12m", "platinum_20m", "diamond_30m", "legend_40m"];
    for (const rank of ranks) {
      const buf = await generateOgpImage({ ...baseData, rank });
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(10000);
    }
  });

  it("未知のランクでもエラーにならない（Bronzeにフォールバック）", async () => {
    const buf = await generateOgpImage({ ...baseData, rank: "unknown_rank" });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  it("交際開始日が未来日でもエラーにならない（経過日数 = 1日目扱い）", async () => {
    const futureData = {
      ...baseData,
      startedAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30日後
    };
    const buf = await generateOgpImage(futureData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  it("長期交際（10年以上）でも正常に生成できる", async () => {
    const longTermData = {
      ...baseData,
      startedAt: new Date("2010-01-01"),
      rank: "legend_40m",
    };
    const buf = await generateOgpImage(longTermData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  // ── 節目テーマのテスト
  it("各節目で正常にOGP画像を生成できる", async () => {
    const milestones = [100, 200, 300, 365, 730, 1095, 1825, 3650];
    for (const days of milestones) {
      const startedAt = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      const buf = await generateOgpImage({ ...baseData, startedAt });
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(10000);
    }
  });
});

describe("generateOgpImage (engaged)", () => {
  const engagedData = {
    user1Name: "田中 太郎",
    user2Name: "山田 花子",
    certId: "KS-00000002",
    startedAt: new Date("2023-01-01"),
    rank: "gold_12m",
    status: "engaged",
  };

  it("婚約中ステータスでPNGバッファを返す", async () => {
    const buf = await generateOgpImage(engagedData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  it("婚約中ステータスでPNGシグネチャが正しい", async () => {
    const buf = await generateOgpImage(engagedData);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // 'P'
    expect(buf[2]).toBe(0x4e); // 'N'
    expect(buf[3]).toBe(0x47); // 'G'
  });

  it("婚約中の長い名前でもエラーにならない", async () => {
    const buf = await generateOgpImage({
      ...engagedData,
      user1Name: "とても長い名前の婚約者さん",
      user2Name: "これもとても長い名前の婚約者さん",
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });

  it("交際中ステータスは通常デザインで生成される", async () => {
    const buf = await generateOgpImage({
      ...engagedData,
      status: "green",
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(10000);
  });
});

describe("getMilestoneTheme", () => {
  it("50日はデフォルトテーマ（ラベルなし）", () => {
    const theme = getMilestoneTheme(50);
    expect(theme.label).toBe("");
  });

  it("100日は「100日記念」テーマ", () => {
    const theme = getMilestoneTheme(100);
    expect(theme.label).toBe("100日記念");
  });

  it("200日は「200日記念」テーマ", () => {
    const theme = getMilestoneTheme(200);
    expect(theme.label).toBe("200日記念");
  });

  it("300日は「300日記念」テーマ", () => {
    const theme = getMilestoneTheme(300);
    expect(theme.label).toBe("300日記念");
  });

  it("365日は「1周年記念」テーマ", () => {
    const theme = getMilestoneTheme(365);
    expect(theme.label).toBe("1周年記念");
  });

  it("730日は「2周年記念」テーマ", () => {
    const theme = getMilestoneTheme(730);
    expect(theme.label).toBe("2周年記念");
  });

  it("1095日は「3周年記念」テーマ", () => {
    const theme = getMilestoneTheme(1095);
    expect(theme.label).toBe("3周年記念");
  });

  it("1825日は「5周年記念」テーマ", () => {
    const theme = getMilestoneTheme(1825);
    expect(theme.label).toBe("5周年記念");
  });

  it("3650日は「10周年記念」テーマ", () => {
    const theme = getMilestoneTheme(3650);
    expect(theme.label).toBe("10周年記念");
  });

  it("3651日（10年超）は「10周年記念」テーマ（最大節目を維持）", () => {
    const theme = getMilestoneTheme(3651);
    expect(theme.label).toBe("10周年記念");
  });

  it("節目の前日（99日）はデフォルトテーマ", () => {
    const theme = getMilestoneTheme(99);
    expect(theme.label).toBe("");
  });

  it("節目の翌日（101日）は100日記念テーマを維持", () => {
    const theme = getMilestoneTheme(101);
    expect(theme.label).toBe("100日記念");
  });
});
