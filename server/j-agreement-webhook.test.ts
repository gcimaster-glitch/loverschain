/**
 * j-agreement.com Webhook受信エンドポイントのテスト
 *
 * 実際のHTTPサーバーを立てずに handleJAgreementWebhook を直接呼び出す。
 * HMAC-SHA256署名の検証ロジックと各イベント処理を確認する。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import type { Request, Response } from "express";

// DB モック（実際のDBに接続しない）
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// drizzle-orm/mysql-core の eq モック
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

// schema モック
vi.mock("../drizzle/schema", () => ({
  partnerships: { id: "id" },
}));

const WEBHOOK_SECRET = "test_webhook_secret_for_unit_test";

// ────────────────────────────────────────────────────────────
// ヘルパー: HMAC署名を計算する
// ────────────────────────────────────────────────────────────
function computeSignature(payload: object, secret: string): string {
  const body = JSON.stringify(payload);
  const hex = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${hex}`;
}

// ────────────────────────────────────────────────────────────
// ヘルパー: モックReq/Resを作成する
// ────────────────────────────────────────────────────────────
function makeReqRes(payload: object, signature?: string) {
  const body = Buffer.from(JSON.stringify(payload));
  const req = {
    headers: {
      "x-loverschain-signature": signature ?? computeSignature(payload, WEBHOOK_SECRET),
    },
    body,
  } as unknown as Request;

  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
  const res = {
    json: jsonMock,
    status: statusMock,
  } as unknown as Response;

  return { req, res, jsonMock, statusMock };
}

// ────────────────────────────────────────────────────────────
// テスト
// ────────────────────────────────────────────────────────────
describe("j-agreement.com Webhook受信", () => {
  beforeEach(() => {
    process.env.LOVERSCHAIN_WEBHOOK_SECRET = WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  describe("HMAC署名検証", () => {
    it("正しい署名でリクエストが通過する", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const payload = { event: "test", record_id: "jar_test001", partnership_id: "lc-test", timestamp: 1705312800000 };
      const { req, res, jsonMock } = makeReqRes(payload);

      await handleJAgreementWebhook(req, res);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ received: true }));
    });

    it("署名なしで401を返す", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const payload = { event: "test", record_id: "jar_test001", partnership_id: "lc-test", timestamp: 1705312800000 };
      const { req, res, statusMock, jsonMock } = makeReqRes(payload, undefined);
      // 署名を削除
      (req.headers as Record<string, string | undefined>)["x-loverschain-signature"] = undefined;

      await handleJAgreementWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid signature" }));
    });

    it("不正な署名で401を返す", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const payload = { event: "test", record_id: "jar_test001", partnership_id: "lc-test", timestamp: 1705312800000 };
      const { req, res, statusMock, jsonMock } = makeReqRes(payload, "sha256=invalid_signature");

      await handleJAgreementWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid signature" }));
    });

    it("改ざんされたペイロードで401を返す", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const originalPayload = { event: "test", record_id: "jar_test001", partnership_id: "lc-test", timestamp: 1705312800000 };
      const sig = computeSignature(originalPayload, WEBHOOK_SECRET);

      // 署名は元のペイロードのもの、bodyは改ざん済み
      const tamperedPayload = { ...originalPayload, record_id: "jar_tampered" };
      const { req, res, statusMock } = makeReqRes(tamperedPayload, sig);

      await handleJAgreementWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe("testイベント", () => {
    it("testイベントで { received: true, event: 'test' } を返す", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const payload = { event: "test", record_id: "jar_test001", partnership_id: "lc-test", timestamp: 1705312800000 };
      const { req, res, jsonMock } = makeReqRes(payload);

      await handleJAgreementWebhook(req, res);

      expect(jsonMock).toHaveBeenCalledWith({ received: true, event: "test" });
    });
  });

  describe("blockchain.confirmedイベント", () => {
    it("正常なblockchain.confirmedイベントでDBを更新する", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const { getDb } = await import("./db");

      const payload = {
        event: "blockchain.confirmed",
        record_id: "jar_01ABCDEFGHIJKLMNOPQRSTUVWX",
        partnership_id: "loverschain-42",
        tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        block_number: 12345678,
        confirmed_at: "2024-01-15T09:00:00Z",
        timestamp: 1705312800000,
      };
      const { req, res, jsonMock } = makeReqRes(payload);

      await handleJAgreementWebhook(req, res);

      expect(getDb).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ received: true, event: "blockchain.confirmed" });
    });

    it("不正なpartnership_id形式で400を返す", async () => {
      const { handleJAgreementWebhook } = await import("./j-agreement-webhook");
      const payload = {
        event: "blockchain.confirmed",
        record_id: "jar_xxx",
        partnership_id: "invalid-format-123",
        tx_hash: "0xabc",
        block_number: 100,
        confirmed_at: "2024-01-15T09:00:00Z",
        timestamp: 1705312800000,
      };
      const { req, res, statusMock, jsonMock } = makeReqRes(payload);

      await handleJAgreementWebhook(req, res);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid partnership_id format" }));
    });
  });

  describe("HMAC署名計算の正確性", () => {
    it("同じペイロードとシークレットで同じ署名が生成される", () => {
      const payload = { event: "test", timestamp: 1705312800000 };
      const sig1 = computeSignature(payload, WEBHOOK_SECRET);
      const sig2 = computeSignature(payload, WEBHOOK_SECRET);
      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("異なるシークレットでは異なる署名が生成される", () => {
      const payload = { event: "test", timestamp: 1705312800000 };
      const sig1 = computeSignature(payload, "secret_a");
      const sig2 = computeSignature(payload, "secret_b");
      expect(sig1).not.toBe(sig2);
    });
  });
});
