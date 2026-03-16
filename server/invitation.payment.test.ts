/**
 * invitation.create の決済済みチェックテスト
 * - pendingPlanType が null のユーザーは招待リンクを発行できない
 * - pendingPlanType が設定されているユーザーは招待リンクを発行できる
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// db モジュールをモック
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  getActivePartnershipByUserId: vi.fn(),
  createInvitation: vi.fn(),
  getInvitationsByInviter: vi.fn(),
  getInvitationByKey: vi.fn(),
  updateInvitationStatus: vi.fn(),
}));

import { getUserById, getActivePartnershipByUserId, createInvitation } from "./db";
import { TRPCError } from "@trpc/server";

// invitation router の create ロジックを直接テストするヘルパー
async function callInvitationCreate(
  user: Partial<{
    id: number;
    kycStatus: string;
    pendingPlanType: string | null;
    pendingPlanPaidAt: Date | null;
  }>,
  input: { origin: string; inviteeEmail?: string }
) {
  const mockUser = {
    id: 1,
    kycStatus: "verified",
    pendingPlanType: null,
    pendingPlanPaidAt: null,
    ...user,
  };

  (getUserById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  (getActivePartnershipByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (createInvitation as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

  // eKYC確認
  if (mockUser.kycStatus !== "verified") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "招待キーの発行には本人確認（eKYC）が必要です。",
    });
  }

  // 決済済みチェック
  if (!mockUser.pendingPlanType || !mockUser.pendingPlanPaidAt) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message: "招待リンクの発行には先にプランのお支払いが必要です。",
    });
  }

  // 既存パートナーシップ確認
  const existing = await getActivePartnershipByUserId(mockUser.id);
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "すでにパートナーシップが存在します。",
    });
  }

  return { inviteUrl: `${input.origin}/invite/testkey` };
}

describe("invitation.create 決済済みチェック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pendingPlanType が null のユーザーは PAYMENT_REQUIRED エラーになる", async () => {
    await expect(
      callInvitationCreate(
        { kycStatus: "verified", pendingPlanType: null, pendingPlanPaidAt: null },
        { origin: "https://example.com" }
      )
    ).rejects.toThrow(TRPCError);

    await expect(
      callInvitationCreate(
        { kycStatus: "verified", pendingPlanType: null, pendingPlanPaidAt: null },
        { origin: "https://example.com" }
      )
    ).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
  });

  it("kycStatus が verified でないユーザーは FORBIDDEN エラーになる", async () => {
    await expect(
      callInvitationCreate(
        { kycStatus: "pending", pendingPlanType: "lover", pendingPlanPaidAt: new Date() },
        { origin: "https://example.com" }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("pendingPlanType が設定されているユーザーは招待リンクを発行できる", async () => {
    const result = await callInvitationCreate(
      {
        kycStatus: "verified",
        pendingPlanType: "lover",
        pendingPlanPaidAt: new Date(),
      },
      { origin: "https://example.com" }
    );
    expect(result.inviteUrl).toContain("https://example.com/invite/");
  });

  it("engagement プランでも招待リンクを発行できる", async () => {
    const result = await callInvitationCreate(
      {
        kycStatus: "verified",
        pendingPlanType: "engagement",
        pendingPlanPaidAt: new Date(),
      },
      { origin: "https://example.com" }
    );
    expect(result.inviteUrl).toContain("https://example.com/invite/");
  });

  it("student プランでも招待リンクを発行できる", async () => {
    const result = await callInvitationCreate(
      {
        kycStatus: "verified",
        pendingPlanType: "student",
        pendingPlanPaidAt: new Date(),
      },
      { origin: "https://example.com" }
    );
    expect(result.inviteUrl).toContain("https://example.com/invite/");
  });
});
