/**
 * メールHTMLテンプレート集
 * ブランドカラー: ピンク (#e91e8c), ダークネイビー (#1a1a2e)
 */

const BRAND_PINK = "#e91e8c";
const BRAND_DARK = "#1a1a2e";
const BRAND_LIGHT_PINK = "#fce4ec";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>恋人証明</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#2d1b4e 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  💕 恋人証明
                </span>
              </div>
            </td>
          </tr>
          <!-- コンテンツ -->
          ${content}
          <!-- フッター -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0 0 8px;font-size:12px;color:#999999;">
                このメールは <a href="https://loverschain.jp" style="color:${BRAND_PINK};text-decoration:none;">恋人証明</a> から送信されています。
              </p>
              <p style="margin:0;font-size:11px;color:#bbbbbb;">
                © 2025 恋人証明. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * eKYC完了・招待リンク送信メール
 */
export function invitationEmailHtml(params: {
  userName: string;
  inviteUrl: string;
  planName: string;
}): string {
  const { userName, inviteUrl, planName } = params;
  const content = `
  <!-- メインメッセージ -->
  <tr>
    <td style="padding:40px 40px 0;text-align:center;">
      <div style="width:72px;height:72px;background:${BRAND_LIGHT_PINK};border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;line-height:72px;">
        ✅
      </div>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:${BRAND_DARK};line-height:1.3;">
        本人確認が完了しました！
      </h1>
      <p style="margin:0;font-size:15px;color:#666666;line-height:1.6;">
        ${userName} さん、お待たせしました。<br />
        本人確認が承認されました。
      </p>
    </td>
  </tr>
  <!-- プラン情報 -->
  <tr>
    <td style="padding:24px 40px 0;">
      <div style="background:${BRAND_LIGHT_PINK};border-radius:12px;padding:16px 20px;text-align:center;">
        <p style="margin:0;font-size:13px;color:${BRAND_PINK};font-weight:700;">選択プラン</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND_DARK};">${planName}</p>
      </div>
    </td>
  </tr>
  <!-- 説明 -->
  <tr>
    <td style="padding:24px 40px 0;">
      <p style="margin:0;font-size:15px;color:#444444;line-height:1.8;text-align:center;">
        下記の招待リンクをパートナーに送ってください。<br />
        パートナーが登録・本人確認を完了すると、<br />
        <strong style="color:${BRAND_DARK};">恋人証明書が発行されます。</strong>
      </p>
    </td>
  </tr>
  <!-- CTAボタン -->
  <tr>
    <td style="padding:32px 40px;text-align:center;">
      <a href="${inviteUrl}"
         style="display:inline-block;background:linear-gradient(135deg,${BRAND_PINK} 0%,#c2185b 100%);color:#ffffff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(233,30,140,0.4);">
        💌 招待リンクを開く
      </a>
      <p style="margin:16px 0 0;font-size:12px;color:#999999;">
        このリンクは発行から7日間有効です
      </p>
    </td>
  </tr>
  <!-- URLテキスト -->
  <tr>
    <td style="padding:0 40px 32px;">
      <div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;">
        <p style="margin:0 0 4px;font-size:11px;color:#999999;font-weight:600;">招待URL（コピーして送信）</p>
        <p style="margin:0;font-size:12px;color:#555555;word-break:break-all;line-height:1.5;">${inviteUrl}</p>
      </div>
    </td>
  </tr>
  <!-- ステップ説明 -->
  <tr>
    <td style="padding:0 40px 32px;">
      <div style="border:1px solid #eeeeee;border-radius:12px;padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND_DARK};">📋 次のステップ</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;">
              <span style="display:inline-block;width:24px;height:24px;background:${BRAND_PINK};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
              <span style="font-size:14px;color:#444444;">上記の招待リンクをパートナーに送る</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="display:inline-block;width:24px;height:24px;background:${BRAND_PINK};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
              <span style="font-size:14px;color:#444444;">パートナーが登録・本人確認を完了する</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="display:inline-block;width:24px;height:24px;background:${BRAND_PINK};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
              <span style="font-size:14px;color:#444444;">恋人証明書が自動発行されます 💕</span>
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>`;
  return baseLayout(content);
}

/**
 * eKYC却下・再申請案内メール
 */
export function kycRejectedEmailHtml(params: {
  userName: string;
  errorTitle: string;
  errorDetail: string;
  kycUrl: string;
}): string {
  const { userName, errorTitle, errorDetail, kycUrl } = params;
  const content = `
  <tr>
    <td style="padding:40px 40px 0;text-align:center;">
      <div style="width:72px;height:72px;background:#fff3e0;border-radius:50%;margin:0 auto 20px;line-height:72px;font-size:36px;">
        ⚠️
      </div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${BRAND_DARK};">
        本人確認を再度お試しください
      </h1>
      <p style="margin:0;font-size:15px;color:#666666;line-height:1.6;">
        ${userName} さん、<br />
        本人確認の審査に問題がありました。
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px 0;">
      <div style="background:#fff3e0;border-left:4px solid #ff9800;border-radius:0 8px 8px 0;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#e65100;">不合格の理由</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#333333;">${errorTitle}</p>
        <p style="margin:0;font-size:13px;color:#666666;line-height:1.6;">${errorDetail}</p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;text-align:center;">
      <a href="${kycUrl}"
         style="display:inline-block;background:linear-gradient(135deg,${BRAND_PINK} 0%,#c2185b 100%);color:#ffffff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(233,30,140,0.4);">
        🔄 今すぐ再申請する
      </a>
    </td>
  </tr>`;
  return baseLayout(content);
}
