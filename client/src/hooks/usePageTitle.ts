import { useEffect } from "react";

/**
 * ページタイトルを動的に設定するカスタムフック
 * SEO要件: タイトルは30〜60文字
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const baseTitle = "恋人証明 | Lovers Chain";
    if (title) {
      document.title = `${title} | 恋人証明 - 二人の絆をブロックチェーンで証明`;
    } else {
      document.title = baseTitle;
    }
    return () => {
      document.title = baseTitle;
    };
  }, [title]);
}

/**
 * ページのメタディスクリプションを動的に設定するカスタムフック
 * SEO要件: 50〜160文字
 */
export function usePageMeta(description: string) {
  useEffect(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute("content", description);
    }
  }, [description]);
}
