/**
 * 節目チェックバッチのユニットテスト
 * runMilestoneCheck の動作を DB モックを使って検証する。
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { runMilestoneCheck } from "./batch/checkMilestones";

// DB ヘルパーをモック
vi.mock("./db", () => ({
  getAllActivePartnershipsWithStartedAt: vi.fn(),
  insertNotificationLog: vi.fn().mockResolvedValue(undefined),
}));

// push 送信をモック（実際には送信しない）
vi.mock("./push", () => ({
  sendPushToUser: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

import { getAllActivePartnershipsWithStartedAt, insertNotificationLog } from "./db";
import { sendPushToUser } from "./push";

const mockGetPartnerships = getAllActivePartnershipsWithStartedAt as ReturnType<typeof vi.fn>;
const mockSendPush = sendPushToUser as ReturnType<typeof vi.fn>;
const mockInsertLog = insertNotificationLog as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

describe("runMilestoneCheck", () => {
  it("パートナーシップが0件の場合は通知しない", async () => {
    mockGetPartnerships.mockResolvedValue([]);
    const result = await runMilestoneCheck();
    expect(result.checked).toBe(0);
    expect(result.notified).toBe(0);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("節目でない日（50日目）は通知しない", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 1, user1Id: 10, user2Id: 20, startedAt: daysAgo(49), status: "green" },
    ]);
    const result = await runMilestoneCheck();
    expect(result.checked).toBe(1);
    expect(result.notified).toBe(0);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("100日目は user1 と user2 の両方に通知する", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 2, user1Id: 10, user2Id: 20, startedAt: daysAgo(99), status: "green" },
    ]);
    const result = await runMilestoneCheck();
    expect(result.checked).toBe(1);
    expect(result.notified).toBe(1);
    expect(mockSendPush).toHaveBeenCalledTimes(2);
    // user1 への通知
    expect(mockSendPush).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ title: expect.stringContaining("100日記念") })
    );
    // user2 への通知
    expect(mockSendPush).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ title: expect.stringContaining("100日記念") })
    );
  });

  it("365日目（1周年）は通知する", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 3, user1Id: 30, user2Id: 40, startedAt: daysAgo(364), status: "green" },
    ]);
    const result = await runMilestoneCheck();
    expect(result.notified).toBe(1);
    expect(mockSendPush).toHaveBeenCalledWith(
      30,
      expect.objectContaining({ title: expect.stringContaining("1周年記念") })
    );
  });

  it("startedAt が null のパートナーシップはスキップする", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 4, user1Id: 50, user2Id: 60, startedAt: null, status: "green" },
    ]);
    const result = await runMilestoneCheck();
    expect(result.notified).toBe(0);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("複数パートナーシップで節目が混在する場合、節目のみ通知する", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 5, user1Id: 10, user2Id: 20, startedAt: daysAgo(49), status: "green" },  // 50日目 → 通知なし
      { id: 6, user1Id: 30, user2Id: 40, startedAt: daysAgo(99), status: "green" },  // 100日目 → 通知あり
      { id: 7, user1Id: 50, user2Id: 60, startedAt: daysAgo(150), status: "green" }, // 151日目 → 通知なし
    ]);
    const result = await runMilestoneCheck();
    expect(result.checked).toBe(3);
    expect(result.notified).toBe(1);
    expect(mockSendPush).toHaveBeenCalledTimes(2); // user1 + user2 で2回
  });

  it("通知ペイロードに証明書URLが含まれる", async () => {
    mockGetPartnerships.mockResolvedValue([
      { id: 8, user1Id: 70, user2Id: 80, startedAt: daysAgo(199), status: "green" }, // 200日目
    ]);
    await runMilestoneCheck();
    expect(mockSendPush).toHaveBeenCalledWith(
      70,
      expect.objectContaining({ url: "/certificate/8" })
    );
  });
});
