/**
 * Stripe Identity VerificationSession.LastError.Code の日本語メッセージマップ
 * https://docs.stripe.com/api/identity/verification_sessions/object#identity_verification_session_object-last_error-code
 */
export const KYC_ERROR_MESSAGES: Record<string, { title: string; detail: string; action: string }> = {
  abandoned: {
    title: "本人確認が中断されました",
    detail: "確認フローが完了する前にセッションが終了しました。",
    action: "もう一度「本人確認を開始する」から再試行してください。",
  },
  consent_declined: {
    title: "同意が拒否されました",
    detail: "本人確認への同意が得られませんでした。",
    action: "利用規約・プライバシーポリシーに同意の上、再試行してください。",
  },
  country_not_supported: {
    title: "対応していない国の書類です",
    detail: "ご提出の書類が発行された国は現在対応していません。",
    action: "日本発行の書類（マイナンバーカード・運転免許証・パスポート）をご使用ください。",
  },
  device_not_supported: {
    title: "お使いのデバイスは対応していません",
    detail: "現在のデバイスまたはブラウザでは本人確認を完了できません。",
    action: "スマートフォン（iOS/Android）の最新ブラウザからお試しください。",
  },
  document_expired: {
    title: "書類の有効期限が切れています",
    detail: "提出された書類の有効期限が切れています。",
    action: "有効期限内の書類をご使用ください。",
  },
  document_type_not_supported: {
    title: "対応していない書類の種類です",
    detail: "提出された書類の種類は本人確認に使用できません。",
    action: "マイナンバーカード・運転免許証・パスポートのいずれかをご使用ください。",
  },
  document_unverified_other: {
    title: "書類の確認に失敗しました",
    detail: "書類の内容を正確に読み取ることができませんでした。",
    action: "明るい場所で書類全体が鮮明に写るよう撮影し、再試行してください。",
  },
  email_unverified_other: {
    title: "メールアドレスの確認に失敗しました",
    detail: "メールアドレスの確認中に問題が発生しました。",
    action: "再試行してください。問題が続く場合はサポートにお問い合わせください。",
  },
  email_verification_declined: {
    title: "メールアドレスの確認が拒否されました",
    detail: "メールアドレスの確認が完了しませんでした。",
    action: "正しいメールアドレスを入力して再試行してください。",
  },
  id_number_insufficient_document_data: {
    title: "書類から情報を読み取れませんでした",
    detail: "書類から必要な情報（番号など）を読み取ることができませんでした。",
    action: "書類全体が鮮明に写るよう撮影し、再試行してください。",
  },
  id_number_mismatch: {
    title: "書類の番号が一致しません",
    detail: "入力された番号と書類に記載された番号が一致しませんでした。",
    action: "正確な番号を入力して再試行してください。",
  },
  id_number_unverified_other: {
    title: "書類番号の確認に失敗しました",
    detail: "書類番号の確認中に問題が発生しました。",
    action: "再試行してください。問題が続く場合はサポートにお問い合わせください。",
  },
  phone_unverified_other: {
    title: "電話番号の確認に失敗しました",
    detail: "電話番号の確認中に問題が発生しました。",
    action: "再試行してください。",
  },
  phone_verification_declined: {
    title: "電話番号の確認が拒否されました",
    detail: "電話番号の確認が完了しませんでした。",
    action: "正しい電話番号を入力して再試行してください。",
  },
  selfie_document_missing_photo: {
    title: "書類に顔写真がありません",
    detail: "提出された書類に顔写真が含まれていませんでした。",
    action: "顔写真付きの書類（マイナンバーカード・運転免許証・パスポート）をご使用ください。",
  },
  selfie_face_mismatch: {
    title: "顔写真が一致しませんでした",
    detail: "書類の顔写真とセルフィーが一致しませんでした。",
    action: "ご本人の書類を使用し、明るい場所でセルフィーを撮影してください。",
  },
  selfie_manipulated: {
    title: "画像が改ざんされている可能性があります",
    detail: "提出された画像に不正な加工が検出されました。",
    action: "加工していない元の書類・写真をご使用ください。",
  },
  selfie_unverified_other: {
    title: "セルフィーの確認に失敗しました",
    detail: "セルフィーの確認中に問題が発生しました。",
    action: "明るい場所で顔全体が鮮明に写るよう撮影し、再試行してください。",
  },
  under_supported_age: {
    title: "年齢要件を満たしていません",
    detail: "本サービスのご利用には年齢要件があります。",
    action: "サービスの利用条件をご確認ください。",
  },
};

/**
 * エラーコードから日本語メッセージを取得する（フォールバック付き）
 */
export function getKycErrorMessage(errorCode: string | null | undefined): {
  title: string;
  detail: string;
  action: string;
} {
  if (!errorCode) {
    return {
      title: "本人確認に失敗しました",
      detail: "本人確認の処理中に問題が発生しました。",
      action: "再度お試しください。問題が続く場合はサポートにお問い合わせください。",
    };
  }
  return (
    KYC_ERROR_MESSAGES[errorCode] ?? {
      title: "本人確認に失敗しました",
      detail: `確認中に問題が発生しました（コード: ${errorCode}）。`,
      action: "再度お試しください。問題が続く場合はサポートにお問い合わせください。",
    }
  );
}
