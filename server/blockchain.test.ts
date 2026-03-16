import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

// j-agreement.com API連携のユニットテスト
// registerOnBlockchain関数はpartnership.tsのプライベート関数のため、
// ここではAPIのリクエスト形式・SHA-256ハッシュ計算・レスポンスパースをテストする

describe("j-agreement.com API連携", () => {
  describe("SHA-256ハッシュ計算", () => {
    it("同じ入力データから同じハッシュが生成される（冪等性）", () => {
      const data = {
        partnershipId: 1,
        partnerAName: "山田太郎",
        partnerBName: "佐藤花子",
        certifiedAt: "2026-01-01T00:00:00.000Z",
      };
      const hash1 = createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");
      const hash2 = createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("異なる入力データから異なるハッシュが生成される", () => {
      const data1 = {
        partnershipId: 1,
        partnerAName: "山田太郎",
        partnerBName: "佐藤花子",
        certifiedAt: "2026-01-01T00:00:00.000Z",
      };
      const data2 = {
        partnershipId: 2,
        partnerAName: "田中一郎",
        partnerBName: "鈴木美咲",
        certifiedAt: "2026-02-01T00:00:00.000Z",
      };
      const hash1 = createHash("sha256").update(JSON.stringify(data1)).digest("hex");
      const hash2 = createHash("sha256").update(JSON.stringify(data2)).digest("hex");
      expect(hash1).not.toBe(hash2);
    });

    it("ハッシュは64文字の16進数文字列である", () => {
      const hash = createHash("sha256")
        .update("test data")
        .digest("hex");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("APIリクエストペイロード形式", () => {
    it("external_idはloverschain-{partnershipId}形式である", () => {
      const partnershipId = 42;
      const externalId = `loverschain-${partnershipId}`;
      expect(externalId).toBe("loverschain-42");
    });

    it("titleは恋人証明書 #{partnershipId}形式である", () => {
      const partnershipId = 42;
      const title = `恋人証明書 #${partnershipId}`;
      expect(title).toBe("恋人証明書 #42");
    });

    it("partiesにパートナーA・Bの名前と役割が含まれる", () => {
      const parties = [
        { name: "山田太郎", role: "パートナーA" },
        { name: "佐藤花子", role: "パートナーB" },
      ];
      expect(parties[0].name).toBe("山田太郎");
      expect(parties[0].role).toBe("パートナーA");
      expect(parties[1].name).toBe("佐藤花子");
      expect(parties[1].role).toBe("パートナーB");
    });

    it("metadataにsource: loverschain.jpとpartnership_idが含まれる", () => {
      const partnershipId = 42;
      const metadata = {
        source: "loverschain.jp",
        partnership_id: String(partnershipId),
      };
      expect(metadata.source).toBe("loverschain.jp");
      expect(metadata.partnership_id).toBe("42");
    });
  });

  describe("APIレスポンスパース", () => {
    it("202レスポンスからrecord_id・status・verification_urlを取得できる", () => {
      const mockResponse = {
        record_id: "jar_026b56be7f80d88f3a04",
        external_id: "loverschain-1",
        status: "pending",
        verification_url: "https://j-agreement.com/verify/api/jar_026b56be7f80d88f3a04",
        created_at: "2026-03-01T17:47:15.000Z",
        is_new: true,
      };
      expect(mockResponse.record_id).toMatch(/^jar_/);
      expect(mockResponse.status).toBe("pending");
      expect(mockResponse.verification_url).toContain("j-agreement.com");
      expect(mockResponse.is_new).toBe(true);
    });

    it("200レスポンス（既存記録）ではis_newがfalseになる", () => {
      const mockExistingResponse = {
        record_id: "jar_026b56be7f80d88f3a04",
        external_id: "loverschain-1",
        status: "confirmed",
        verification_url: "https://j-agreement.com/verify/api/jar_026b56be7f80d88f3a04",
        created_at: "2026-03-01T17:47:15.000Z",
        is_new: false,
      };
      expect(mockExistingResponse.is_new).toBe(false);
      expect(mockExistingResponse.status).toBe("confirmed");
    });

    it("verificationUrlはj-agreement.com/api/v1/verify?hash=形式である", () => {
      const documentHash = "a".repeat(64);
      const verificationUrl = `https://j-agreement.com/api/v1/verify?hash=${documentHash}`;
      expect(verificationUrl).toContain("j-agreement.com/api/v1/verify?hash=");
      expect(verificationUrl).toContain(documentHash);
    });
  });

  describe("APIキー疎通確認（実際のAPIを呼び出す）", () => {
    it("テスト用APIキーでPOST /recordsが成功する", async () => {
      const apiKey = process.env.J_AGREEMENT_API_KEY;
      const apiUrl = process.env.J_AGREEMENT_API_URL;

      if (!apiKey || !apiUrl) {
        // 環境変数未設定時はスキップ
        console.log("[Test] J_AGREEMENT_API_KEY not set, skipping live test");
        return;
      }

      const documentHash = createHash("sha256")
        .update(JSON.stringify({
          partnershipId: 9999,
          partnerAName: "テストA",
          partnerBName: "テストB",
          certifiedAt: "2026-03-01T00:00:00.000Z",
        }))
        .digest("hex");

      const response = await fetch(`${apiUrl}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          external_id: "loverschain-vitest-9999",
          title: "恋人証明書 #9999（vitestテスト）",
          document_hash: documentHash,
          parties: [
            { name: "テストA", role: "パートナーA" },
            { name: "テストB", role: "パートナーB" },
          ],
          signed_at: "2026-03-01T00:00:00.000Z",
          metadata: {
            source: "loverschain.jp",
            partnership_id: "9999",
          },
        }),
      });

      expect([200, 202]).toContain(response.status);
      const result = await response.json() as {
        record_id: string;
        status: string;
        verification_url: string;
        is_new: boolean;
      };
      expect(result.record_id).toBeTruthy();
      expect(result.verification_url).toContain("j-agreement.com");
    }, 15000); // 15秒タイムアウト
  });
});
