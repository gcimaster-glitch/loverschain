import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export function CertSettingsCard({
  prefecture,
  showPrefectureOnCert,
  showNameOnCert,
  onSaved,
}: {
  prefecture?: string | null;
  showPrefectureOnCert: boolean;
  showNameOnCert: boolean;
  onSaved?: () => void;
}) {
  const [pref, setPref] = useState(prefecture ?? "");
  const [showPref, setShowPref] = useState(showPrefectureOnCert);
  const [showName, setShowName] = useState(showNameOnCert);

  useEffect(() => {
    setPref(prefecture ?? "");
    setShowPref(showPrefectureOnCert);
    setShowName(showNameOnCert);
  }, [prefecture, showPrefectureOnCert, showNameOnCert]);

  const updateSettings = trpc.partnership.updateCertSettings.useMutation({
    onSuccess: () => {
      toast.success("証明書の表示設定を更新しました");
      onSaved?.();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          証明書の表示設定
        </CardTitle>
        <CardDescription className="text-sm">
          証明書に表示する情報を設定できます。プライバシーに配慮して設定してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 名前の表示 */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">名前を表示する</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              証明書に表示名（または本名）を表示します
            </p>
          </div>
          <Switch
            checked={showName}
            onCheckedChange={setShowName}
          />
        </div>

        {/* 都道府県の表示 */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">居住地（都道府県）を表示する</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              証明書に居住地の都道府県を表示します
            </p>
          </div>
          <Switch
            checked={showPref}
            onCheckedChange={setShowPref}
          />
        </div>

        {/* 都道府県選択 */}
        {showPref && (
          <div className="space-y-2">
            <Label htmlFor="prefecture-select">居住地（都道府県）</Label>
            <Select value={pref} onValueChange={setPref}>
              <SelectTrigger id="prefecture-select">
                <SelectValue placeholder="都道府県を選択" />
              </SelectTrigger>
              <SelectContent>
                {PREFECTURES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() =>
            updateSettings.mutate({
              prefecture: pref || undefined,
              showPrefectureOnCert: showPref,
              showNameOnCert: showName,
            })
          }
          disabled={updateSettings.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? "保存中..." : "設定を保存する"}
        </Button>
      </CardContent>
    </Card>
  );
}
