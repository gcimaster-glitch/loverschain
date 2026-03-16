import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Mail, Phone, ArrowRight, Loader2, RefreshCw } from "lucide-react";

/* ─── メール認証カード ─── */
export function EmailVerificationCard({
  emailVerified,
  onVerified,
  initialEmail,
}: {
  emailVerified: boolean;
  onVerified?: () => void;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  // プロフィールのメールアドレスが後から読み込まれた場合に反映
  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const sendCode = trpc.user.sendEmailVerification.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCodeSent(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const verifyCode = trpc.user.verifyEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onVerified?.();
    },
    onError: (e) => toast.error(e.message),
  });

  if (emailVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">メールアドレス認証済み</p>
            <p className="text-xs text-green-600 mt-0.5">メールアドレスが確認されています</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">認証済み</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            メールアドレス認証
          </CardTitle>
          <Badge variant="outline" className="text-orange-600 border-orange-300">未認証</Badge>
        </div>
        <CardDescription className="text-sm">
          メールアドレスを認証することで、アカウントの安全性が向上します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email-input">メールアドレス</Label>
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                disabled={sendCode.isPending}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => sendCode.mutate({ email })}
              disabled={sendCode.isPending || !email}
            >
              {sendCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" />認証コードを送信</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <strong>{email}</strong> に6桁の認証コードを送信しました。メールをご確認ください。
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-code">認証コード（6桁）</Label>
              <Input
                id="email-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-xl tracking-widest font-mono"
                disabled={verifyCode.isPending}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => verifyCode.mutate({ code })}
              disabled={verifyCode.isPending || code.length !== 6}
            >
              {verifyCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />確認中...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />認証コードを確認する<ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
            <button
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              onClick={() => { setCodeSent(false); setCode(""); }}
            >
              <RefreshCw className="w-3 h-3" />
              メールアドレスを変更する
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── SMS認証カード ─── */
export function SmsVerificationCard({
  phoneVerified,
  onVerified,
  initialPhone,
}: {
  phoneVerified: boolean;
  onVerified?: () => void;
  initialPhone?: string;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  // プロフィールの電話番号が後から読み込まれた場合、または保存後に更新された場合に反映
  useEffect(() => {
    if (initialPhone !== undefined) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const sendCode = trpc.user.sendSmsVerification.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCodeSent(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const verifyCode = trpc.user.verifySms.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onVerified?.();
    },
    onError: (e) => toast.error(e.message),
  });

  if (phoneVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">電話番号認証済み</p>
            <p className="text-xs text-green-600 mt-0.5">携帯電話番号が確認されています</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">認証済み</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-500" />
            携帯電話番号認証
          </CardTitle>
          <Badge variant="outline" className="text-orange-600 border-orange-300">未認証</Badge>
        </div>
        <CardDescription className="text-sm">
          SMS（ショートメッセージ）で認証コードを受け取り、電話番号を確認します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone-input">携帯電話番号</Label>
              <Input
                id="phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="090-0000-0000"
                disabled={sendCode.isPending}
              />
              <p className="text-xs text-muted-foreground">
                ハイフンあり・なし両方対応。日本の携帯番号（080/090/070）をご入力ください。
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => sendCode.mutate({ phone })}
              disabled={sendCode.isPending || phone.length < 10}
            >
              {sendCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
              ) : (
                <><Phone className="w-4 h-4 mr-2" />SMSで認証コードを送信</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <strong>{phone}</strong> にSMSで6桁の認証コードを送信しました。
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-code">認証コード（6桁）</Label>
              <Input
                id="sms-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-xl tracking-widest font-mono"
                disabled={verifyCode.isPending}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => verifyCode.mutate({ code })}
              disabled={verifyCode.isPending || code.length !== 6}
            >
              {verifyCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />確認中...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />認証コードを確認する<ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
            <button
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              onClick={() => { setCodeSent(false); setCode(""); }}
            >
              <RefreshCw className="w-3 h-3" />
              電話番号を変更する
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
