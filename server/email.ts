/**
 * Resend メール送信ヘルパー
 * 全イベント（招待・解消申請・承認・完了）で共通利用
 */

// ドメイン認証完了後は RESEND_FROM_ADDRESS="恋人証明 <noreply@loverschain.jp>" を環境変数に設定する
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "恋人証明 <onboarding@resend.dev>";
const BRAND_COLOR = "#c026d3"; // rose/fuchsia
const SITE_URL = "https://loverschain.jp";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/** 共通メール送信関数 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email:", payload.subject);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Email] Resend API error:", res.status, body);
    } else {
      console.log("[Email] Sent:", payload.subject, "→", payload.to);
    }
  } catch (err) {
    console.error("[Email] Failed to send:", payload.subject, err);
  }
}

/** 共通HTMLラッパー */
function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>恋人証明</title>
</head>
<body style="margin:0;padding:0;background:#0f0a1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a0f2e;border-radius:16px;overflow:hidden;border:1px solid #3d1f5e;">
          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#c026d3);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;">💗</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.05em;">恋人証明</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Lovers Chain — ブロックチェーンで証明する愛のかたち</p>
            </td>
          </tr>
          <!-- コンテンツ -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #3d1f5e;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                このメールは <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">loverschain.jp</a> から自動送信されています。<br />
                心当たりがない場合は、このメールを無視してください。
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

/** ボタンHTML */
function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0;">${text}</a>`;
}

// ─── テンプレート ──────────────────────────────────────────────────────────

/** 招待メール */
export async function sendInvitationEmail(opts: {
  to: string;
  inviterName: string;
  inviteUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `💕 ${opts.inviterName}さんから恋人証明の招待が届きました`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">招待が届きました</h2>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 12px;">
        <strong style="color:#f0abfc;">${opts.inviterName}</strong>さんから、恋人証明への招待が届きました。
      </p>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 24px;">
        下記のボタンをクリックして、パートナーシップを成立させましょう。
        招待リンクは<strong style="color:#f0abfc;">7日間</strong>有効です。
      </p>
      ${ctaButton("招待を受け入れる →", opts.inviteUrl)}
      <p style="color:#6b7280;font-size:12px;margin:16px 0 0;">
        ボタンが押せない場合は、このURLをブラウザに貼り付けてください：<br />
        <span style="color:#a78bfa;">${opts.inviteUrl}</span>
      </p>
    `),
  });
}

/** パートナーシップ成立メール */
export async function sendPartnershipCreatedEmail(opts: {
  to: string;
  userName: string;
  partnerName: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `💗 パートナーシップが成立しました！`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">パートナーシップ成立おめでとうございます！</h2>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 12px;">
        <strong style="color:#f0abfc;">${opts.userName}</strong>さん、
        <strong style="color:#f0abfc;">${opts.partnerName}</strong>さんとのパートナーシップが成立しました。
      </p>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 24px;">
        ブロックチェーンへの証明書登録が開始されました。マイページで証明書をご確認ください。
      </p>
      ${ctaButton("マイページで確認する →", opts.dashboardUrl)}
    `),
  });
}

/** 解消申請メール（相手への通知） */
export async function sendDissolutionRequestEmail(opts: {
  to: string;
  requesterName: string;
  type: "mutual" | "unilateral";
  dashboardUrl: string;
}): Promise<void> {
  const isMutual = opts.type === "mutual";
  await sendEmail({
    to: opts.to,
    subject: `⚠️ ${opts.requesterName}さんから${isMutual ? "合意解消" : "一方的解消"}の申請が届きました`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">
        ${isMutual ? "合意解消の申請" : "一方的解消の申請"}が届きました
      </h2>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 12px;">
        <strong style="color:#f0abfc;">${opts.requesterName}</strong>さんから
        ${isMutual
          ? "合意解消の申請が届きました。14日間のクーリングオフ期間中に、同意するか取り消しを要請できます。"
          : "一方的解消の申請が届きました。マイページから同意するか、取り消しを要請できます。"
        }
      </p>
      ${ctaButton("マイページで確認する →", opts.dashboardUrl)}
    `),
  });
}

/** 解消承認メール（申請者への通知） */
export async function sendDissolutionConfirmedEmail(opts: {
  to: string;
  partnerName: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `✅ ${opts.partnerName}さんが解消申請に同意しました`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">解消申請が承認されました</h2>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 12px;">
        <strong style="color:#f0abfc;">${opts.partnerName}</strong>さんが解消申請に同意しました。
        パートナーシップが解消されました。
      </p>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 24px;">
        新しいパートナーとの証明を始めることができます。
      </p>
      ${ctaButton("マイページへ →", opts.dashboardUrl)}
    `),
  });
}

/** 解消申請取り消しメール */
export async function sendDissolutionCancelledEmail(opts: {
  to: string;
  cancellerName: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `🔄 解消申請が取り消されました`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">解消申請が取り消されました</h2>
      <p style="color:#d1d5db;line-height:1.7;margin:0 0 12px;">
        <strong style="color:#f0abfc;">${opts.cancellerName}</strong>さんが解消申請を取り消しました。
        パートナーシップは継続中です。
      </p>
      ${ctaButton("マイページへ →", opts.dashboardUrl)}
    `),
  });
}
