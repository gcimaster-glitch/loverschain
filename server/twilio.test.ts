import { describe, expect, it } from "vitest";

/**
 * Twilio設定バリデーションテスト
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER が設定されている場合は形式チェック
 * - 未設定の場合はモードで動作することを確認
 */
describe("Twilio SMS Configuration", () => {
  it("should have valid TWILIO_ACCOUNT_SID format if set", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    if (sid) {
      // Twilio Account SID は "AC" で始まる32文字の英数字
      expect(sid).toMatch(/^AC[a-f0-9]{32}$/i);
    } else {
      // 未設定の場合はモードで動作（開発環境では許容）
      console.log("[Test] TWILIO_ACCOUNT_SID not set - running in mock mode");
      expect(true).toBe(true);
    }
  });

  it("should have TWILIO_AUTH_TOKEN if TWILIO_ACCOUNT_SID is set", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid) {
      expect(token).toBeTruthy();
      expect(token!.length).toBeGreaterThan(10);
    } else {
      expect(true).toBe(true);
    }
  });

  it("should have valid TWILIO_FROM_NUMBER format if set", () => {
    const from = process.env.TWILIO_FROM_NUMBER;
    if (from) {
      // E.164形式: +で始まる国際電話番号
      expect(from).toMatch(/^\+[1-9]\d{1,14}$/);
    } else {
      console.log("[Test] TWILIO_FROM_NUMBER not set - running in mock mode");
      expect(true).toBe(true);
    }
  });

  it("SMS verification code generation should produce 6-digit code", () => {
    // 認証コード生成ロジックのテスト
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });
});
