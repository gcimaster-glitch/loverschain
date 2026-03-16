import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ページ遷移のたびにウィンドウを最上部へスクロールする。
 * App.tsx の Router コンポーネント内に配置して使用する。
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}
