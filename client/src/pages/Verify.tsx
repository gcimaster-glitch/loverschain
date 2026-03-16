import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Search, Shield } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { PartnershipStatusBadge } from "@/components/PartnershipStatusBadge";

export default function Verify() {
  const [, navigate] = useLocation();
  const [inputId, setInputId] = useState("");
  usePageTitle("証明書検証 - パートナーシップの真正性を確認");
  const [searchId, setSearchId] = useState<number | null>(null);

  const { data: cert, isLoading, error } = trpc.partnership.certificate.useQuery(
    { partnershipId: searchId! },
    { enabled: searchId !== null }
  );

  const handleSearch = () => {
    const id = parseInt(inputId.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(id) && id > 0) {
      setSearchId(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-16 max-w-xl mx-auto text-center">
        <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">証明書を確認する</h1>
        <p className="text-muted-foreground mb-10">
          証明書番号（KS-XXXXXXXX）を入力して、パートナーシップの有効性を確認できます。
        </p>

        <div className="flex gap-3 mb-8">
          <Input
            placeholder="証明書番号 (例: KS-00000001)"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-center"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-primary text-primary-foreground shrink-0"
          >
            <Search className="w-4 h-4 mr-2" />
            確認
          </Button>
        </div>

        {isLoading && (
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-red-700 text-sm">
              {error.message}
            </CardContent>
          </Card>
        )}

        {cert && (
          <Card className="text-left shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">証明書 KS-{String(cert.id).padStart(8, "0")}</h2>
                <PartnershipStatusBadge status={cert.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[cert.user1, cert.user2].map((u, i) => (
                  <div key={i} className="p-3 bg-muted rounded-xl text-center text-sm">
                    <p className="font-medium text-foreground">{u?.displayName ?? "不明"}</p>
                    {u?.kycStatus === "verified" && (
                      <p className="text-xs text-green-600 mt-1">✓ 本人確認済み</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                交際開始: {new Date(cert.startedAt).toLocaleDateString("ja-JP")}
              </div>

              {cert.blockchainTxHash && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                  <Shield className="w-3 h-3 inline mr-1" />
                  ブロックチェーン証明済み: {cert.blockchainTxHash.slice(0, 20)}...
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/certificate/${cert.id}`)}
              >
                詳細な証明書を見る
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
