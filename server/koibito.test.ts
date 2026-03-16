import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// DB モック
vi.mock("./db", () => ({
  getDb: vi.fn(() => null),
  getUserById: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  updateUserProfile: vi.fn(),
  updateUserKycStatus: vi.fn(),
  updateUserPartnershipStatus: vi.fn(),
  getAllUsers: vi.fn(() => []),
  getUsersCount: vi.fn(() => 0),
  getUsersByKycStatus: vi.fn(() => []),
  createInvitation: vi.fn(),
  getInvitationByKey: vi.fn(),
  updateInvitationStatus: vi.fn(),
  getInvitationsByInviter: vi.fn(() => []),
  createPartnership: vi.fn(() => ({ insertId: 1 })),
  getPartnershipById: vi.fn(),
  getActivePartnershipByUserId: vi.fn(),
  updatePartnershipStatus: vi.fn(),
  updatePartnershipBlockchain: vi.fn(),
  addPartnershipStatusHistory: vi.fn(),
  getPartnershipHistory: vi.fn(() => []),
  getAllPartnerships: vi.fn(() => []),
  getPartnershipsCount: vi.fn(() => 0),
  getActivePartnershipsCount: vi.fn(() => 0),
  createDissolutionRequest: vi.fn(),
  getDissolutionRequestByPartnership: vi.fn(),
  confirmDissolutionRequest: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const clearedCookies: unknown[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "テストユーザー",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (_name: string, _opts: unknown) => clearedCookies.push({ _name, _opts }),
    } as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return createCtx({ id: 99, openId: "admin-user", role: "admin" });
}

// ============================================================
// auth.logout
// ============================================================
describe("auth.logout", () => {
  it("セッションクッキーをクリアして success:true を返す", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "u", email: "u@e.com", name: "U",
        loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) =>
          clearedCookies.push({ name, options }),
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ============================================================
// user.me
// ============================================================
describe("user.me", () => {
  it("認証済みユーザーのプロフィールを返す", async () => {
    const mockUser = {
      id: 1, openId: "test-user", name: "テスト", email: "t@e.com",
      loginMethod: "manus", role: "user" as const,
      kycStatus: "not_started" as const, partnershipStatus: "single" as const,
      displayName: null, gender: null, birthDate: null, phone: null,
      avatarUrl: null, stripeVerificationSessionId: null, kycVerifiedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    };
    vi.mocked(db.getUserById).mockResolvedValueOnce(mockUser);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.user.me();
    expect(result.id).toBe(1);
    expect(result.kycStatus).toBe("not_started");
  });

  it("未認証の場合はエラーを返す", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.me()).rejects.toThrow();
  });
});

// ============================================================
// user.updateProfile
// ============================================================
describe("user.updateProfile", () => {
  it("プロフィールを正常に更新する", async () => {
    vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.user.updateProfile({ displayName: "新しい名前" });
    expect(result.success).toBe(true);
    expect(db.updateUserProfile).toHaveBeenCalledWith(1, { displayName: "新しい名前" });
  });
});

// ============================================================
// invitation.verify
// ============================================================
describe("invitation.verify", () => {
  it("有効な招待キーを検証する", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    vi.mocked(db.getInvitationByKey).mockResolvedValueOnce({
      id: 1,
      inviterId: 2,
      inviteeEmail: null,
      invitationKey: "valid-key-123",
      status: "pending" as const,
      expiresAt: futureDate,
      acceptedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getUserById).mockResolvedValueOnce({
      id: 2, openId: "inviter", name: "招待者", email: "i@e.com",
      loginMethod: "manus", role: "user" as const,
      kycStatus: "verified" as const, partnershipStatus: "single" as const,
      displayName: "招待者さん", gender: null, birthDate: null, phone: null,
      avatarUrl: null, stripeVerificationSessionId: null, kycVerifiedAt: null,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.invitation.verify({ key: "valid-key-123" });
    expect(result.valid).toBe(true);
    expect(result.inviterName).toBe("招待者さん");
  });

  it("期限切れの招待キーはエラーを返す", async () => {
    const pastDate = new Date(Date.now() - 1000);
    vi.mocked(db.getInvitationByKey).mockResolvedValueOnce({
      id: 1,
      inviterId: 2,
      inviteeEmail: null,
      invitationKey: "expired-key",
      status: "pending" as const,
      expiresAt: pastDate,
      acceptedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.updateInvitationStatus).mockResolvedValueOnce(undefined);
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.invitation.verify({ key: "expired-key" })).rejects.toThrow(
      "有効期限"
    );
  });
});

// ============================================================
// partnership.certificate (public)
// ============================================================
describe("partnership.certificate", () => {
  it("証明書を公開取得できる", async () => {
    vi.mocked(db.getPartnershipById).mockResolvedValueOnce({
      id: 1,
      user1Id: 1,
      user2Id: 2,
      status: "green" as const,
      startedAt: new Date(),
      endedAt: null,
      blockchainTxHash: "0xabc",
      certificateUrl: "https://j-agreement.com/cert/1",
      blockchainRegisteredAt: new Date(),
      dissolutionType: null,
      dissolutionRequestedBy: null,
      dissolutionConfirmedAt: null,
      coolingOffEndsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getUserById)
      .mockResolvedValueOnce({
        id: 1, openId: "u1", name: "ユーザー1", email: "u1@e.com",
        loginMethod: "manus", role: "user" as const,
        kycStatus: "verified" as const, partnershipStatus: "green" as const,
        displayName: "田中太郎", gender: null, birthDate: null, phone: null,
        avatarUrl: null, stripeVerificationSessionId: null, kycVerifiedAt: null,
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      })
      .mockResolvedValueOnce({
        id: 2, openId: "u2", name: "ユーザー2", email: "u2@e.com",
        loginMethod: "manus", role: "user" as const,
        kycStatus: "verified" as const, partnershipStatus: "green" as const,
        displayName: "山田花子", gender: null, birthDate: null, phone: null,
        avatarUrl: null, stripeVerificationSessionId: null, kycVerifiedAt: null,
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      });

    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const cert = await caller.partnership.certificate({ partnershipId: 1 });
    expect(cert.id).toBe(1);
    expect(cert.status).toBe("green");
    expect(cert.user1?.displayName).toBe("田中太郎");
    expect(cert.user2?.displayName).toBe("山田花子");
    expect(cert.blockchainTxHash).toBe("0xabc");
  });
});

// ============================================================
// admin.adminList (RBAC)
// ============================================================
describe("user.adminList", () => {
  it("管理者はユーザー一覧を取得できる", async () => {
    vi.mocked(db.getAllUsers).mockResolvedValueOnce([]);
    vi.mocked(db.getUsersCount).mockResolvedValueOnce(0);
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.user.adminList({ limit: 10, offset: 0 });
    expect(result.total).toBe(0);
  });

  it("一般ユーザーはユーザー一覧を取得できない", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.user.adminList({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

// ============================================================
// ランク計算テスト（shared/ranks.ts）
// ============================================================
import { calcRank, getRankDef, RANKS } from "../shared/ranks";

function daysAgo(days: number): Date {
  // setDateではなくミリ秒単位で計算して正確に指定日数前を返す
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe("calcRank - ランク計算", () => {
  it("3日でsilver_3dランクになる", () => {
    const rank = calcRank(daysAgo(3));
    expect(rank).toBe("silver_3d");
  });

  it("30日でsilver_1mランクになる", () => {
    const rank = calcRank(daysAgo(30));
    expect(rank).toBe("silver_1m");
  });

  it("300日でgold_10mランクになる", () => {
    const rank = calcRank(daysAgo(300));
    expect(rank).toBe("gold_10m");
  });

  it("1216日以上でlegend_40mランクになる", () => {
    const rank = calcRank(daysAgo(1220));
    expect(rank).toBe("legend_40m");
  });

  it("0日でbronzeランクになる", () => {
    const rank = calcRank(daysAgo(0));
    expect(rank).toBe("bronze");
  });

  it("RANKSは昇順で定義されている", () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].minDays).toBeGreaterThan(RANKS[i - 1].minDays);
    }
  });
});

// ============================================================
// payment.coinBalance
// ============================================================
describe("payment.coinBalance", () => {
  it("未認証ユーザーはエラーを返す", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.payment.coinBalance()).rejects.toThrow();
  });
});
