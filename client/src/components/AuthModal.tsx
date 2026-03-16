/**
 * AuthModal.tsx
 * 新規登録・ログイン共通モーダル
 * Google / LINE / メール（Manus OAuth）の3択を提供
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getGoogleLoginUrl, getLineLoginUrl, getLoginUrl } from "@/const";
import { Heart, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "register" | "login";
  returnPath?: string;
}

// LINEロゴSVG
const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

// Googleロゴ
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export function AuthModal({ open, onClose, mode = "register", returnPath }: AuthModalProps) {
  const isRegister = mode === "register";
  const title = isRegister ? "新規登録" : "ログイン";
  const subtitle = isRegister
    ? "アカウントを作成して、二人の愛を証明しましょう"
    : "アカウントにログインして続けましょう";

  const handleGoogle = () => {
    window.location.href = getGoogleLoginUrl(returnPath);
  };

  const handleLine = () => {
    window.location.href = getLineLoginUrl(returnPath);
  };

  const handleEmail = () => {
    window.location.href = getLoginUrl(returnPath);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              {subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ボタン群 */}
        <div className="p-6 space-y-3">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-3 text-gray-700 font-medium"
            onClick={handleGoogle}
          >
            <GoogleIcon />
            Googleで{title}
          </Button>

          {/* LINE */}
          <Button
            className="w-full h-12 rounded-xl bg-[#06C755] hover:bg-[#05b34d] text-white font-medium flex items-center gap-3 transition-all"
            onClick={handleLine}
          >
            <LineIcon />
            LINEで{title}
          </Button>

          <div className="flex items-center gap-3 my-1">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">または</span>
            <Separator className="flex-1" />
          </div>

          {/* メール */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all flex items-center gap-3 text-gray-700 font-medium"
            onClick={handleEmail}
          >
            <Mail className="w-5 h-5 text-rose-400" />
            メールアドレスで{title}
          </Button>

          {/* 切り替えリンク */}
          <p className="text-center text-sm text-gray-500 pt-2">
            {isRegister ? (
              <>
                すでにアカウントをお持ちの方は{" "}
                <button
                  className="text-rose-500 font-medium hover:underline"
                  onClick={() => {
                    onClose();
                    // ログインモーダルを開く場合は親コンポーネントで制御
                  }}
                >
                  ログイン
                </button>
              </>
            ) : (
              <>
                アカウントをお持ちでない方は{" "}
                <button
                  className="text-rose-500 font-medium hover:underline"
                  onClick={() => {
                    onClose();
                  }}
                >
                  新規登録
                </button>
              </>
            )}
          </p>

          <p className="text-center text-xs text-gray-400 pt-1">
            登録することで
            <a href="/terms" className="underline hover:text-gray-600">利用規約</a>
            および
            <a href="/privacy" className="underline hover:text-gray-600">プライバシーポリシー</a>
            に同意したものとみなします。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
