import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import {
  Coins,
  Gift,
  Heart,
  LogOut,
  Settings,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthModal } from "./AuthModal";

interface AppHeaderProps {
  transparent?: boolean;
}

export default function AppHeader({ transparent = false }: AppHeaderProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "register" | "login" }>({ open: false, mode: "register" });

  const { data: profile } = trpc.user.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: coinData } = trpc.payment.coinBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isActive = (path: string) => location === path;

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md ${transparent ? 'bg-black/40 border-b border-white/10' : 'bg-white/90 border-b border-border shadow-sm'}`}>
      <div className="container flex items-center justify-between h-16">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart className={`w-6 h-6 ${transparent ? 'text-pink-400 fill-pink-400' : 'text-primary fill-primary'}`} />
          <span className={`text-xl font-bold ${transparent ? 'text-white' : 'text-foreground'}`}>恋人証明</span>
        </Link>

        {/* 中央ナビ（デスクトップ） */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/verify">
            <Button
              variant="ghost"
              size="sm"
              className={`${isActive("/verify") ? (transparent ? 'bg-white/20' : 'bg-muted') : ''} ${transparent ? 'text-white hover:bg-white/10 hover:text-white' : ''}`}
            >
              <Shield className="w-4 h-4 mr-1" />
              証明書確認
            </Button>
          </Link>
          <Link href="/plans">
            <Button
              variant="ghost"
              size="sm"
              className={`${isActive("/plans") ? (transparent ? 'bg-white/20' : 'bg-muted') : ''} ${transparent ? 'text-white hover:bg-white/10 hover:text-white' : ''}`}
            >
              <Star className="w-4 h-4 mr-1" />
              料金プラン
            </Button>
          </Link>
          <Link href="/affiliates">
            <Button
              variant="ghost"
              size="sm"
              className={`${isActive("/affiliates") ? (transparent ? 'bg-white/20' : 'bg-muted') : ''} ${transparent ? 'text-white hover:bg-white/10 hover:text-white' : ''}`}
            >
              <Gift className="w-4 h-4 mr-1" />
              特典・提携
            </Button>
          </Link>
        </div>

        {/* 右側 */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <>
              {/* コイン残高 */}
              {coinData !== undefined && (
                <Link href="/plans">
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1 text-xs">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{coinData.balance} コイン</span>
                  </Button>
                </Link>
              )}

              {/* ユーザーメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block max-w-24 truncate">
                      {profile?.displayName ?? user?.name ?? "ユーザー"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* プロフィール情報 */}
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.displayName ?? user?.name ?? "ユーザー"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    {profile?.kycStatus === "verified" && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                        <Shield className="w-3 h-3" /> 本人確認済み
                      </span>
                    )}
                    {profile?.kycStatus !== "verified" && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-500 mt-1">
                        <Shield className="w-3 h-3" /> 本人確認が必要
                      </span>
                    )}
                  </div>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="w-4 h-4 text-primary" />
                      マイページ
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      プロフィール設定
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/referral" className="flex items-center gap-2 cursor-pointer">
                      <Users className="w-4 h-4" />
                      紹介コード
                    </Link>
                  </DropdownMenuItem>

                  {/* モバイル用ナビ */}
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/verify" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      証明書確認
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/plans" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-4 h-4" />
                      料金プラン
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/affiliates" className="flex items-center gap-2 cursor-pointer">
                      <Gift className="w-4 h-4" />
                      特典・提携
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/referral" className="flex items-center gap-2 cursor-pointer">
                      <Coins className="w-4 h-4" />
                      コイン残高: {coinData?.balance ?? 0}
                    </Link>
                  </DropdownMenuItem>

                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-purple-600">
                          <Shield className="w-4 h-4" />
                          管理者ダッシュボード
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-4 h-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/verify" className="hidden sm:block">
                <Button variant="ghost" size="sm">証明書を確認</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className={transparent ? 'border-white/50 text-white hover:bg-white/10 rounded-full' : 'rounded-full'}
                onClick={() => setAuthModal({ open: true, mode: "login" })}
              >
                ログイン
              </Button>
              <Button
                size="sm"
                className={transparent ? 'bg-white text-black hover:bg-white/90 rounded-full' : 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-full'}
                onClick={() => setAuthModal({ open: true, mode: "register" })}
              >
                無料登録
              </Button>
              <AuthModal
                open={authModal.open}
                mode={authModal.mode}
                onClose={() => setAuthModal(prev => ({ ...prev, open: false }))}
              />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
