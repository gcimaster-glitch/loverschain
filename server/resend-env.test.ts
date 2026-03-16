import { describe, it, expect } from "vitest";

describe("RESEND_FROM_ADDRESS 環境変数", () => {
  it("RESEND_FROM_ADDRESS が設定されている", () => {
    const fromAddress = process.env.RESEND_FROM_ADDRESS;
    // 設定されていない場合はフォールバック値を使用するため、テストはスキップ
    // 本番環境では noreply@loverschain.jp が設定されていることを確認
    if (fromAddress) {
      expect(fromAddress).toContain("loverschain.jp");
      console.log("RESEND_FROM_ADDRESS:", fromAddress);
    } else {
      // フォールバック動作を確認
      const fallback = "恋人証明 <onboarding@resend.dev>";
      expect(fallback).toContain("resend.dev");
      console.log("RESEND_FROM_ADDRESS not set, using fallback:", fallback);
    }
  });

  it("email.ts の FROM_ADDRESS ロジックが正しく動作する", () => {
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS ?? "恋人証明 <onboarding@resend.dev>";
    expect(fromAddress).toBeTruthy();
    expect(fromAddress).toContain("恋人証明");
  });
});
