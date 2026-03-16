/**
 * パートナーステータス判定機能のユニットテスト
 * シングル/イエロー/レッド判定ロジックとAPIの動作を検証する
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// DB関数をモック
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserById: vi.fn(),
    createPartnerStatusInquiry: vi.fn(),
    getPartnerStatusInquiryByToken: vi.fn(),
    getPartnerStatusInquiriesByRequester: vi.fn(),
    updatePartnerStatusInquiry: vi.fn(),
    calcPartnerStatusResult: vi.fn(),
    getDb: vi.fn(() => null), // DB接続なし
  };
});

// Resend（メール送信）をモック
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test-email-id" }, error: null }),
    },
  })),
}));

import {
  getUserById,
  createPartnerStatusInquiry,
  getPartnerStatusInquiryByToken,
  getPartnerStatusInquiriesByRequester,
  updatePartnerStatusInquiry,
  calcPartnerStatusResult,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createVerifiedUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "テストユーザー",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: {
      headers: { origin: "https://example.com" },
      cookies: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("partnerStatus router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestCheck", () => {
    it("KYC未完了ユーザーはリクエストできない", async () => {
      const ctx = createVerifiedUserContext();
      vi.mocked(getUserById).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "テストユーザー",
        kycStatus: "unverified",
        displayName: null,
        avatarUrl: null,
        openId: "test-user",
        role: "user",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        pendingPlanType: null,
        stripeCustomerId: null,
        referralCode: null,
        referredBy: null,
        pushSubscription: null,
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.partnerStatus.requestCheck({
          targetEmail: "partner@example.com",
          origin: "https://example.com",
        })
      ).rejects.toThrow("本人確認");
    });

    it("自分自身のメールへの問い合わせは不可", async () => {
      const ctx = createVerifiedUserContext();
      vi.mocked(getUserById).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "テストユーザー",
        kycStatus: "verified",
        displayName: null,
        avatarUrl: null,
        openId: "test-user",
        role: "user",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        pendingPlanType: null,
        stripeCustomerId: null,
        referralCode: null,
        referredBy: null,
        pushSubscription: null,
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.partnerStatus.requestCheck({
          targetEmail: "test@example.com", // 自分自身
          origin: "https://example.com",
        })
      ).rejects.toThrow("自分自身");
    });
  });

  describe("getMyInquiries", () => {
    it("認証済みユーザーは自分の問い合わせ履歴を取得できる", async () => {
      const ctx = createVerifiedUserContext();
      vi.mocked(getPartnerStatusInquiriesByRequester).mockResolvedValue([
        {
          id: 1,
          requesterId: 1,
          targetEmail: "partner@example.com",
          targetUserId: null,
          token: "test-token",
          status: "pending",
          result: null,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.partnerStatus.getMyInquiries();
      expect(result).toHaveLength(1);
      expect(result[0].targetEmail).toBe("partner@example.com");
      expect(result[0].status).toBe("pending");
      expect(result[0].resultLabel).toBeNull();
    });
  });

  describe("respondToInquiry", () => {
    it("有効なトークンで同意すると結果が返される", async () => {
      vi.mocked(getPartnerStatusInquiryByToken).mockResolvedValue({
        id: 1,
        requesterId: 2,
        targetEmail: "target@example.com",
        targetUserId: 3,
        token: "valid-token",
        status: "pending",
        result: null,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(calcPartnerStatusResult).mockResolvedValue("single");
      vi.mocked(updatePartnerStatusInquiry).mockResolvedValue(undefined);

      const ctx: TrpcContext = {
        user: null,
        req: {
          headers: {},
          cookies: {},
        } as unknown as TrpcContext["req"],
        res: {
          cookie: vi.fn(),
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.partnerStatus.respondToInquiry({
        token: "valid-token",
        consent: true,
      });

      expect(result.consented).toBe(true);
      expect(result.result).toBe("single");
      expect(result.resultLabel).toBe("シングル");
    });

    it("拒否した場合はconsentedがfalseで返される", async () => {
      vi.mocked(getPartnerStatusInquiryByToken).mockResolvedValue({
        id: 2,
        requesterId: 2,
        targetEmail: "target@example.com",
        targetUserId: 3,
        token: "valid-token-2",
        status: "pending",
        result: null,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(updatePartnerStatusInquiry).mockResolvedValue(undefined);

      const ctx: TrpcContext = {
        user: null,
        req: {
          headers: {},
          cookies: {},
        } as unknown as TrpcContext["req"],
        res: {
          cookie: vi.fn(),
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.partnerStatus.respondToInquiry({
        token: "valid-token-2",
        consent: false,
      });

      expect(result.consented).toBe(false);
    });

    it("期限切れトークンはエラーになる", async () => {
      vi.mocked(getPartnerStatusInquiryByToken).mockResolvedValue({
        id: 3,
        requesterId: 2,
        targetEmail: "target@example.com",
        targetUserId: 3,
        token: "expired-token",
        status: "pending",
        result: null,
        expiresAt: new Date(Date.now() - 1000), // 過去
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(updatePartnerStatusInquiry).mockResolvedValue(undefined);

      const ctx: TrpcContext = {
        user: null,
        req: {
          headers: {},
          cookies: {},
        } as unknown as TrpcContext["req"],
        res: {
          cookie: vi.fn(),
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.partnerStatus.respondToInquiry({
          token: "expired-token",
          consent: true,
        })
      ).rejects.toThrow("有効期限");
    });
  });
});
