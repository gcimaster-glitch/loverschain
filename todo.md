# 恋人証明 プロジェクト TODO

## Phase 1: DBスキーマ・マイグレーション
- [x] users テーブル拡張（kyc_status, partnership_status, gender, birth_date, phone）
- [x] partnerships テーブル（user1_id, user2_id, status, blockchain_tx_hash, certificate_url）
- [x] partnership_status_history テーブル（履歴管理）
- [x] invitations テーブル（招待キー管理）
- [x] dissolution_requests テーブル（解消申請管理）
- [x] マイグレーションSQL実行

## Phase 2: サーバーサイドAPI（認証・eKYC・招待・パートナーシップ）
- [x] ユーザープロフィール取得・更新 API
- [x] eKYC セッション開始 API（Stripe Identity）
- [x] 招待キー発行 API（Resend メール連携）
- [x] 招待キー検証 API（公開）
- [x] パートナーシップ成立 API（招待キー使用）
- [x] パートナーシップ情報取得 API

## Phase 3: サーバーサイドAPI（ブロックチェーン・解消・管理者）
- [x] j-agreement.com API連携（ブロックチェーン証明発行・非同期）
- [x] デジタル証明書取得 API（公開）
- [x] 解消申請 API（円満・一方的）
- [x] 解消承認 API
- [x] 管理者: ユーザー一覧・検索 API
- [x] 管理者: eKYC審査 API（承認・却下）
- [x] 管理者: パートナーシップ一覧 API

## Phase 4: フロントエンドUI
- [x] グローバルCSSテーマ（ローズピンク × ディープパープル）
- [x] ランディングページ（LP）
- [x] ログイン・認証フロー（Manus OAuth）
- [x] マイページ（プロフィール・パートナー情報）
- [x] eKYC本人確認フロー画面
- [x] 招待キー発行・共有画面
- [x] 招待受諾・パートナーシップ成立画面
- [x] デジタル証明書表示画面
- [x] 解消申請フロー画面
- [x] パートナーシップステータス表示（カラーバッジ）
- [x] 証明書検証ページ（公開）
- [x] プロフィール設定ページ

## Phase 5: 管理者ダッシュボード・最終調整
- [x] 管理者ダッシュボード（統計カード）
- [x] ユーザー管理画面
- [x] eKYC審査画面（承認・却下）
- [x] パートナーシップ一覧画面
- [x] Vitestテスト作成（10テスト全パス）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存

## 追加機能フェーズ（v1.1）- 完了

### DB拡張
- [x] users テーブル拡張（coin_balance, referral_code, referred_by, plan_type, is_student_verified, stripe_customer_id）
- [x] payment_orders テーブル（Stripe決済履歴）
- [x] coin_transactions テーブル（コイン購入・消費履歴）
- [x] physical_certificate_orders テーブル（郵送・額装注文）
- [x] affiliate_partners テーブル（タイアップ提携先）
- [x] referrals テーブル（紹介システム）
- [x] oem_agencies テーブル（OEM代理店・手数料率）
- [x] マイグレーションSQL実行

### サーバーサイドAPI
- [x] ランク自動計算ロジック（交際日数→ランク判定・shared/ranks.ts）
- [x] Stripe決済統合（webdev_add_feature stripe）
- [x] Stripe Webhook エンドポイント（/api/stripe/webhook）
- [x] コイン残高・購入API
- [x] プラン別料金設定API（一般・高校生・結婚相談所OEM・婚約プラン）
- [x] OEM代理店管理API
- [x] 紹介コード発行・報酬API
- [x] 証明書郵送注文API（Stripe決済）
- [x] タイアップ特典一覧API
- [x] 管理者: 売上統計API
- [x] 管理者: タイアップ管理API

### フロントエンド
- [x] ランク証明書デザインページ（節目ごとにカラー・デザイン変化）
- [x] 料金プラン選択ページ（/plans）
- [x] 紹介コード共有ページ（/referral）
- [x] タイアップ特典一覧ページ（/affiliates）
- [x] 管理者ダッシュボード拡張（売上・タイアップタブ追加）
- [x] App.tsxに全ルート登録

### テスト
- [x] ランク計算テスト（calcRank: 5ケース）
- [x] coinBalance未認証エラーテスト
- [x] 全17テストパス確認

## 今後の拡張（Phase 3以降）
- [ ] Stripe Identity 本番eKYC統合（STRIPE_SECRET_KEY設定が必要）
- [ ] Resend メール送信本番設定（RESEND_API_KEY設定が必要）
- [ ] j-agreement.com 本番API連携設定（J_AGREEMENT_API_URL, J_AGREEMENT_API_KEY設定が必要）
- [ ] 証明書郵送・額装の実際の印刷業者API連携
- [ ] SNSシェアキャンペーン（Instagram/TikTok/Facebook OGP設定）
- [ ] プッシュ通知（パートナーシップ変更時）
- [ ] 証明書PDF出力
- [ ] 多言語対応（英語）
- [ ] OEM代理店専用ポータル（サブドメイン対応）

## バグ修正・UX改善（v1.2）
- [ ] ナビゲーション: 全ページにヘッダーリンクを追加（マイページ・プラン・証明書確認・ログアウト）
- [ ] ナビゲーション: ログイン後のメニュー（eKYC・招待・証明書・設定）を整備
- [ ] eKYC: マイページからeKYC申請ページへの導線を追加
- [ ] eKYC: Stripe Identity未設定時のモックフロー（開発環境用）を実装
- [ ] eKYC: 申請状態（未申請・審査中・承認済み・却下）の表示を改善
- [ ] 全体: ページ間リンク・ボタンの動作確認

## コンテンツ・UX刷新（v1.3）
- [ ] OEM/ODM専用ページ（/for-business）新設
- [ ] 料金プランからOEM/ODMプランを除外・フッターバナーから誘導のみ
- [ ] コインパッケージの説明を簡略化・わかりやすく刷新
- [ ] TOPページのコピーをプロコピーライター級に全面刷新
- [ ] 社会問題セクションを別ページ（/why）に分離
- [ ] App.tsxに/for-businessと/whyのルートを追加

## TOPページ大幅強化（v1.4）
- [x] フローティングCTAボタン（スクロール追従・アニメーション）
- [x] スクロールアニメーション強化（Intersection Observer）
- [x] 証明書サンプル画像AI生成・表示セクション
- [x] ライフスタイル写真AI生成・表示セクション
- [x] カテゴリー別LP誘導セクション（高校生/大学生/婚活/結婚相談所/内縁/LGBT/結婚できないけれど）
- [ ] FAQ詳細ページ新設（/faq）
- [ ] FAQ: 別れたらどうなる（合意解消・一方的解消フロー説明）
- [ ] FAQ: なぜシングルだと証明できる（独身証明アップロード機能説明）
- [ ] FAQ: 他に彼女がいないと保証できる（重複登録防止の仕組み説明）
- [ ] 各カテゴリー別LP新設（/for/highschool, /for/college, /for/konkatsu, /for/agency, /for/naien, /for/lgbt, /for/nokekkon）

## SEO対策（v1.4）
- [x] index.htmlにtitle・description・keywords・OGPメタタグを追加（30〜60文字タイトル・50〜160文字description）
- [x] 各ページにusePageTitleフックでdocument.titleを動的設定（14ページ全対応）
- [x] 構造化データ（JSON-LD: WebSite・Organization）をindex.htmlに追加## eKYCフロー改善（v1.6）
- [x] Kyc.tsxをステップ形式のガイド付きeKYCフローに全面書き換え（イラスト・詳細説明・進捗バー付き）
- [x] FAQページ新設（/faq）— 別れ・独身証明・重複防止などの説明
- [x] カテゴリー別LP新設（/for/highschool, /for/college, /for/konkatsu, /for/agency, /for/naien, /for/lgbt, /for/nokekkon）
- [x] Home.tsxのカテゴリーカードに各LPへのリンクを追加
- [x] App.tsxに/faq・/for/*ルートを追加TEP1〜4の進捗バー付き）
- [ ] STEP1: 事前準備ガイド（必要書類・所要時間・注意事項）
- [ ] STEP2: 本人確認開始（Stripe Identity連携ボタン・操作説明）
- [ ] STEP3: 審査中ガイド（待機画面・審査期間説明・よくある質問）
- [ ] STEP4: 完了後ガイド（次のステップ案内・マイページへの誘導）
- [ ] 審査不合格時の再申請ガイド（理由説明・改善ポイント）

## スクロール位置修正（v1.5）
- [x] ScrollToTopコンポーネントを作成し、ページ遷移時に常にwindow.scrollTo(0,0)を実行する
- [x] App.tsxのRouterコンポーネント内にScrollToTopを組み込む

## 証明書解消フロー（v1.7）
- [x] dissolution_requestsテーブル・partnerships解消フィールドは既存スキーマに実装済み（マイグレーション不要）
- [x] cancelDissolutionRequestヘルパーをserver/db.tsに追加
- [x] cancelDissolution APIをpartnership.tsに追加
- [x] getDissolutionStatus APIをpartnership.tsに追加
- [x] Dashboard.tsxに「合意解消」ボタン・確認ダイアログ（理由入力・クーリングオフ説明）を実装
- [x] Dashboard.tsxに「一方的解消申請」ボタン・確認ダイアログ（警告文言・理由入力）を実装
- [x] Dashboard.tsxに解消ステータスバナー（gray/yellow/white対応・残日数表示）を実装
- [x] Dashboard.tsxに申請取り消しボタン実装
- [x] TypeScriptエラーゼロ・17テスト全パス確認

## 再証明フロー（v1.8）
- [x] db.tsにgetPastPartnershipsByUserIdヘルパーを追加
- [x] partnership.tsにpastListクエリ APIを追加（パートナー情報付加）
- [x] Dashboard.tsxに再証明誘導バナー（white状態・パートナーシップなし・ KYC認証済み条件）を実装
- [x] Dashboard.tsxに過去のパートナーシップ履歴セクション（相手名・期間・解消タイプ・証明書リンク）を実装
- [x] 招待キー発行カードにid="invite-section"を付加しバナーからスクロール遷移を実装
- [x] TypeScriptエラーゼロ・17テスト全パス確認

## プッシュ通知機能（v1.9）
- [x] DBスキーマにpush_subscriptionsテーブルを追加（userId, endpoint, p256dh, auth, createdAt）
- [x] SQLマイグレーション実行
- [x] web-pushパッケージをインストールしVAPIDキーペアを生成
- [x] server/push.tsにsendPushToUser()ヘルパーを実装（web-pushプロバイダー・複数デバイス対応）
- [x] routers/notification.tsに購読登録・解除・状態確認・VAPID公開鍵取得APIを追加
- [x] 解消申請時にパートナーへpush通知を送信（requestDissolution）
- [x] 招待キー受諾時に招待者へpush通知を送信（createPartnership）
- [x] 解消承認・取り消し時にpush通知を送信（confirmDissolution・cancelDissolution）
- [x] client/public/sw.jsにService Workerを実装（push受信・通知表示・クリックナビゲーション）
- [x] usePushNotification.tsフックを新規作成（許可リクエスト・購読・解除・状態管理）
- [x] PushNotificationBanner.tsxコンポーネントを新規作成（未許可・許可済・拒否状態対応）
- [x] Dashboard.tsxにPushNotificationBannerを配置（KycStatusBanner直後）
- [x] TypeScriptエラーゼロ・17テスト全パス確認

## メール通知・PDF出力・sitemap（v2.0）
- [x] server/email.tsにResendメール送信ヘルパーを実装（招待・解消申請・承認・完了テンプレート）
- [x] partnership.tsのrequestDissolution・confirmDissolution・cancelDissolutionにメール通知を追加
- [x] invitation.tsのcreate（招待キー発行）にメール通知を追加（既存Resend処理を統一）
- [x] createPartnership（パートナーシップ成立）時に双方へメール通知を追加
- [x] Certificate.tsxにPDF出力ボタンを追加（window.print()＋印刷用CSS・ファイル名自動設定）
- [x] client/public/sitemap.xmlを生成（全公開URL・カテゴリーLP・FAQ含む）
- [x] client/public/robots.txtにsitemap参照を追加
- [x] TypeScriptエラーゼロ・17テスト全パス確認

## 動的OGP画像生成（v2.1）
- [x] canvasパッケージをインストールする（server-side Canvas API）
- [x] server/ogp.tsにCanvas APIでOGP画像生成ヘルパーを実装する（1200x630px・ダークパープル背景・ユーザー名・証明書番号・交際開始日・ランクバッジ入り）
- [x] server/routes/ogp.tsにExpressルート（GET /api/ogp/certificate/:id）を実装（クローラーUA判定・通常ブラウザリダイレクト・Cache-Control設定）
- [x] server/_core/index.tsに/api/ogpルートを登録
- [x] DBから証明書情報（ユーザー名・パートナー名・開始日・証明書番号）を取得するヘルパーを追加する
- [x] クローラーUser-Agent判定でSNSクローラーには画像を返し、通常ブラウザは/certificate/:idへリダイレクト
- [x] Certificate.tsxにuseEffectでog:title・og:description・og:image・og:url・twitter:cardを動的設定
- [x] Certificate.tsxのシェアボタンをShare2アイコン＋Web Share API対応に改善
- [x] server/ogp.test.tsに5件のvitestテストを追加（PNG生成・シグネチャ・長名前・全ランク・未知ランク）
- [x] 全22テストパス確認（既存17件＋OGP新規5件）
- [x] TypeScriptエラーゼロ確認

## OGP画像に経過日数追加（v2.1.1）
- [x] server/ogp.tsに経過日数計算ロジックを追加（startedAtから現在までの日数、+1日目起算）
- [x] 「交際○○日目」バッジ（ピンク・パープルグラデーション）を中央に描画
- [x] 「交際開始日：○○年○○月○○日」をバッジ直下に表示
- [x] ogp.test.tsに経過日数関連テストを2件追加（未来日・長期交際）
- [x] 全24テストパス確認（既存22件＋新規2件）
- [x] TypeScriptエラーゼロ確認

## OGP画像 節目テーマ機能（v2.2）
- [x] server/ogp.tsに節目テーマ定義（MILESTONE_THEMES）を追加（100日/200日/300日/1年/2年/3年/5年/10年）
- [x] 各節目ごとに背景グラデーション・フレーム色・バッジ色・装飾パターンを変化させる
- [x] 節目以外はデフォルトテーマ（ダークパープル）を使用する
- [x] 節目名ラベル（「100日記念」「1周年」等）を左上コーナーバッジに表示
- [x] ogp.test.tsに節目テーマ関連テストを追加（getMilestoneTheme単体テスト12件・各節目で正常生成テスト1件）
- [x] 全37テストパス確認（既存24件＋新規13件）
- [x] TypeScriptエラーゼロ確認

## 証明書ページ 節目バナー機能（v2.3）
- [x] shared/milestone.tsに節目判定ロジック（getMilestoneInfo・calcElapsedDays・getOgpMilestoneTheme）を切り出す（サーバー・クライアント共用）
- [x] server/ogp.tsをshared/milestone.tsのロジックを使うよう更新（テーマ定義の重複を排除）
- [x] MilestoneBanner.tsxコンポーネントを作成（節目ラベル・絵文字・グラデーション背景・紙吹雪アニメーション・入場アニメ）
- [x] Certificate.tsxにMilestoneBannerを組み込み（cert.startedAtが存在する場合に表示）
- [x] server/milestone.test.tsに22件のvitestテストを追加（calcElapsedDays/getMilestoneInfo/getOgpMilestoneTheme）
- [x] 全59テストパス確認（既存37件＋新規22件）
- [x] TypeScriptエラーゼロ確認

## 節目プッシュ通知機能（v2.4）
- [x] push_subscriptionsテーブルは既に存在確認済み（drizzle/schema.ts・DB共に実装済み）
- [x] web-pushパッケージ・@types/web-pushをインストール済み
- [x] server/push.tsにWeb Push送信ヘルパーは既実装済み（sendPushToUser・savePushSubscription等）
- [x] server/routers/notification.tsにsubscribe/unsubscribe/getStatus・公開鍵取得は既実装済み
- [x] server/db.tsにupsertPushSubscription・deletePushSubscription・getAllActivePartnershipsWithStartedAtヘルパーを追加
- [x] server/batch/checkMilestones.tsに節目チェックバッチを実装（全アクティブパートナーシップを確認し節目日に通知）
- [x] server/_core/index.tsにスケジューラ起動コードを追加（JST 09:00毎日定時実行）
- [x] client/public/sw.jsにService Workerは既実装済み（push受信・通知表示・クリックハンドラ）
- [x] client/src/hooks/usePushNotification.tsは既実装済み（許可要求・購読登録・解除）
- [x] PushNotificationBanner.tsxは既実装済み（Dashboard.tsxに組み込み済み）
- [x] server/milestone-batch.test.tsに7件のvitestテストを追加
- [x] 全66テストパス確認（既存59件＋新規7件）
- [x] TypeScriptエラーゼロ確認

## ダッシュボード 次の節目カウントダウン（v2.5）
- [x] shared/milestone.tsにgetNextMilestone関数とNextMilestoneInfo型を追加（次の節目日数・残り日数・進捗率・テーマ色を返す）
- [x] client/src/components/MilestoneCountdown.tsxを作成（カウントダウン数字・プログレスバー・節目ラベル・節目達成済バッジ・証明書ページヘリンク）
- [x] Dashboard.tsxにMilestoneCountdownを組み込み（status === "green"のパートナーシップに表示）
- [x] server/milestone.test.tsにgetNextMilestone関数のテストを追加（11件）
- [x] 全77テストパス確認（既存66件＋新規11件）
- [x] TypeScriptエラーゼロ確認

## 通知送信履歴 管理画面（v2.6）
- [x] drizzle/schema.tsにnotification_logsテーブルを追加（id・partnershipId・userId・milestoneLabel・sentAt・status）
- [x] pnpm drizzle-kit generateでマイグレーションSQL生成・webdev_execute_sqlで適用
- [x] server/db.tsにinsertNotificationLog・getNotificationLogsヘルパーを追加
- [x] server/batch/checkMilestones.tsで通知送信後にnotification_logsへ記録
- [x] server/routers/admin.tsにnotification.list手続きを実装（adminのみ・ページネーション対応）
- [x] client/src/pages/AdminNotifications.tsxを作成（テーブル表示・パートナーシップIDフィルタ・ページネーション）
- [x] App.tsxに/admin/notificationsルートを追加
- [x] Admin.tsxに「通知履歴」タブを追加（詳細ページへのリンク付き）
- [x] milestone-batch.test.tsにinsertNotificationLogモックを追加し全テストパス修正
- [x] 全77テストパス確認・TypeScriptエラーゼロ確認

## 通知再送機能（v2.7）
- [x] server/routers/admin.tsにresendNotification手続きを追加（partnershipId・milestoneLabel指定で再送・DBログ記録・結果返却）
- [x] AdminNotifications.tsxに再送UIを実装（ヘッダー「手動再送」ボタン・各行「再送」ボタン・IDフィルター時「このIDへ再送」ボタン）
- [x] 再送確認ダイアログ（パートナーシップID入力・節目ラベル任意入力・送信中スピナー）を実装
- [x] sonnerのtoast.success/toast.errorで結果トーストを表示
- [x] 全77テストパス確認・TypeScriptエラーゼロ確認

## シェアボタン節目対応（v2.8）
- [x] Certificate.tsxに calcElapsedDays/getMilestoneInfo を importし、節目判定ロジックを追加
- [x] シェアボタンテキストを節目時は「🎉 100日記念をシェアする」、通常時は「シェア」に変化
- [x] Web Share APIのtitle/textも節目時は節目ラベルを含む内容に変更（「#恋人証明」ハッシュタグ付き）
- [x] 全77テストパス確認・TypeScriptエラーゼロ確認

## canvasパッケージ置き換え・通知設定セクション（v2.9）
- [x] canvas → @napi-rs/canvas に置き換え（デプロイ時のネイティブビルド失敗を解消）
- [x] プロフィール設定ページ（Profile.tsx）に通知設定カードを追加
- [x] 通知許可状態（granted/denied/default/unsupported）をバッジで表示
- [x] オン時は「通知をオフにする」ボタン、オフ時は「通知をオンにする」ボタンを表示
- [x] 通知オフ時は push_subscriptions から購読を削除（trpc.notification.unsubscribe）
- [x] ブロック中はブラウザ設定案内を表示、非対応ブラウザは代替ブラウザ案内を表示
- [x] 全77テストパス確認・TypeScriptエラーゼロ確認

## UX強化・浮気防止・婚活支援・SMS認証（v3.0）

### DBスキーマ拡張
- [x] usersテーブルに phone_verified, email_verified フラグを追加
- [x] usersテーブルに single_certificate_url（独身証明書URL）を追加
- [x] usersテーブルに konkatsu_profile（婚活プロフィールJSON）を追加
- [x] usersテーブルに sms_verification_code, sms_verification_expires_at を追加
- [x] usersテーブルに email_verification_code, email_verification_expires_at を追加
- [x] partnershipsテーブルのstatusに "engaged" を追加（婚約中ステータス）
- [x] マイグレーションSQL実行

### バックエンドAPI
- [x] server/db.tsに saveEmailVerificationCode, savePhoneVerificationCode ヘルパーを追加
- [x] server/db.tsに verifyEmailCode, verifySmsCode ヘルパーを追加
- [x] server/db.tsに updateSingleCertificate, updateKonkatsuProfile ヘルパーを追加
- [x] server/db.tsに checkUserHasActivePartnership（浮気防止チェック）ヘルパーを追加
- [x] user.tsに sendSmsVerification API（Twilio SMS送信・モックフォールバック）を追加
- [x] user.tsに verifySmsCode API（6桁コード検証・phone_verified更新）を追加
- [x] user.tsに sendEmailVerification API（メール認証コード送信）を追加
- [x] user.tsに verifyEmailCode API（メール認証コード検証・email_verified更新）を追加
- [x] partnership.tsに浮気防止チェック（招待受諾時にアクティブパートナーシップを確認）を追加
- [x] partnership.tsに requestEngagedStatus API（婚約申請）を追加
- [x] partnership.tsに uploadSingleCertificate API（独身証明書アップロード）を追加
- [x] partnership.tsに updateCertSettings API（証明書表示設定更新）を追加
- [x] admin.tsに reviewSingleCertificate API（独身証明書審査）を追加

### フロントエンドUI
- [x] VerificationCards.tsx コンポーネント新規作成（SMS/メール認証カード）
- [x] SingleCertificateCard.tsx コンポーネント新規作成（独身証明書アップロード・婚約申請）
- [x] CertSettingsCard.tsx コンポーネント新規作成（証明書表示設定）
- [x] Profile.tsx を全面改修（認証・独身証明・証明書設定を統合）
- [x] Dashboard.tsxのクイックリンクを4列グリッドに拡張（証明書確認リンク追加）
- [x] Dashboard.tsxのプロフィールリンクの説明文を「認証・証明設定」に更新

### TOPページ改善
- [x] HOW IT WORKSセクション改善（時間バッジ追加・用語ガイド注記追加）
- [x] 浮気防止・イエローアカウント・婚活支援・シェア機能の新セクション追加
- [x] 用語ガイドセクション追加（eKYC・ブロックチェーン・グリーン/イエローアカウント・独身証明書・婚約中ステータスをアコーディオン形式で説明）
- [x] 機能グリッドのdescriptionをより詳細な説明に改善
- [x] 3 PILLARSセクションのeKYCタイトルに「（eKYC）」を追加・用語ガイド注記追加

### テスト
- [x] server/twilio.test.tsに4件のTwilio設定バリデーションテストを追加（全パス確認）
- [x] TypeScriptエラーゼロ確認

## 管理者 独身証明書審査UI（v3.1）
- [x] admin.tsに getPendingSingleCertificates API（審査待ち一覧）を追加
- [x] admin.tsに getReviewedSingleCertificates API（審査済み履歴）を追加
- [x] admin.tsの reviewSingleCertificate APIに却下理由フィールドを追加
- [x] AdminSingleCertificates.tsx 審査UIページを新規作成（審査待ち一覧・画像プレビュー・承認/却下ダイアログ）
- [x] Admin.tsxに「独身証明書審査」タブを追加
- [x] App.tsxに /admin/single-certificates ルートを追加
- [x] vitestテストを追加・全テストパス確認（81テスト全パス）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存

## 審査ガイドラインモーダル（v3.2）
- [x] ReviewGuidelineModal コンポーネントを AdminSingleCertificates.tsx に追加
- [x] ページヘッダーに「審査ガイドラインを確認」ボタンを追加
- [x] 各審査待ちカードにもガイドライン参照リンクを追加
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存

## 却下文例コピーボタン（v3.3）
- [x] 却下文例カードに「コピー」ボタンを追加（Clipboard API）
- [x] コピー成功時にトースト通知を表示
- [x] コピー済み状態のビジュアルフィードバック（ボタンアイコン変化）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存

## UX全面改修・導線の明確化（v4.0）
- [x] TOPページ: ヒーローに「用意するもの・ステップ数・手に入るもの」を大字で表示
- [x] TOPページ: 能書きセクションを削除または最下部に移動、CTAを本化
- [x] TOPページ: 「まず何を用意して→何ステップ→何が手に入るか」の視覚的フロー
- [x] ダッシュボード: 現在のステップ位置と次のアクションを常に1つ明示するプログレスUI（NextStepBanner）
- [x] ダッシュボード: 「証明書発行まであと○ステップ」のプログレスバー実装
- [x] ダッシュボード: 各ステップの完了/未完了を色で視覚的に表示
- [x] TypeScriptエラーゼロ確認（81テスト全パス）
- [x] チェックポイント保存

## ヒーロー直下 料金情報バー（v4.1）
- [x] Home.tsxのヒーローセクション直下に料金情報バーを追加（月額980円・初回発行手数料無料）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存

## eKYCフロー詳細ガイド・FAQ充実・料金導線（v4.2）
- [x] Kyc.tsxのSTEP1（事前準備）に必要書類チェックリスト・所要時間・注意事項を追加（実装済み）
- [x] Kyc.tsxのSTEP2（本人確認開始）に操作説明・Stripe Identity連携ボタンの詳細説明を追加（実装済み）
- [x] Kyc.tsxのSTEP3（審査中）に待機画面・審査期間説明・よくある質問を追加（実装済み）
- [x] Kyc.tsxのSTEP4（完了後）に次のステップ案内・マイページへの誘導を追加（実装済み）
- [x] Kyc.tsxに審査不合格時の再申請ガイドを追加（実装済み）
- [x] FAQ.tsxの「別れたらどうなる」セクションを詳細化（実装済み）
- [x] FAQ.tsxの「なぜシングルだと証明できる」・「他に彼女・彼氏がいないと保証」セクションを詳細化（実装済み）
- [x] Home.tsxの料金バーに「料金プランの詳細 →」リンクを追加
- [x] Dashboard.tsxにプラン確認カード（現在のプラン・解約リンク）を追加
- [x] TypeScriptエラーゼロ確認（81テスト全パス）
- [x] チェックポイント保存

## SNSシェア・婚約証明書デザイン・Stripe連動（v5.0）
- [x] Certificate.tsxに証明書発行完了後のX・LINEシェアボタンを追加
- [x] シェアURLにOGP対応のパラメータを含める
- [x] 婚約中（engaged）パートナーシップの証明書をゴールド・シャンパン系デザインに変更
- [x] Certificate.tsxのengagedステータス判定とデザイン分岐を実装
- [x] Stripeサブスクリプション情報取得APIをserver/routers/payment.tsに追加
- [x] Dashboard.tsxのプラン確認カードを動的データ（次回請求日・プラン名）で更新
- [x] Stripeポータルセッション生成APIを追加（解約・プラン変更用）
- [x] TypeScriptエラーゼロ確認（81テスト全パス）
- [x] チェックポイント保存

## 証明書画像保存・婚約OGP・OEM/ODMページ（v5.1）
- [x] html2canvasをインストールして証明書カードを画像としてスマホ保存できる「画像として保存」ボタンを追加
- [x] Certificate.tsxに「画像として保存」ボタンを実装（PNG形式・ファイル名自動設定）
- [x] server/ogp.tsの婚約中（engaged）ステータス時にゴールド系 OGP画像を生成するよう拡張
- [x] OEM/ODM専用ページ（/for-business）を新設（料金・導入事例・問い合わせフォーム）
- [x] App.tsxに/for-businessルートを追加
- [x] Home.tsxのフッターバナーに/for-businessへのリンクを追加
- [x] TypeScriptエラーゼロ確認（85テスト全パス）
- [x] チェックポイント保存

## Stripe Price ID設定・OEM問い合わせ連携・SEO強化（v5.2）

### Stripe Price ID設定・サブスクリプション開始フロー
- [ ] STRIPE_PRICE_ID環境変数を設定（月額980円のPrice ID）
- [ ] server/routers/payment.tsにcreateSubscriptionCheckout APIを追加（Price IDを使ったCheckout Session生成）
- [ ] Dashboard.tsxのプラン確認カードに「今すぐ登録」ボタンを追加（未サブスク時）
- [ ] Plans.tsxの「今すぐ始める」ボタンをStripe Checkout Sessionに連携

### OEM/ODM問い合わせフォームのバックエンド連携
- [ ] ForBusiness.tsxのContactFormをtrpc.system.notifyOwnerに接続
- [ ] 問い合わせ内容（会社名・担当者名・メール・電話・業種・メッセージ）をオーナーへ通知

### カテゴリー別LP SEO強化
- [ ] /faq ページにJSON-LD FAQPage構造化データを追加
- [ ] /for/* カテゴリーLPページにJSON-LD WebPage構造化データを追加
- [ ] index.htmlのOGP画像をデフォルト証明書画像に更新

### テスト・チェックポイント
- [ ] TypeScriptエラーゼロ確認
- [ ] チェックポイント保存（v5.2）

## 法的ページ作成（v5.3）
- [x] 特定商取引法表示ページ（/legal/tokusho）を作成
- [x] プライバシーポリシーページ（/legal/privacy）を作成（免責・賠償上限条項含む）
- [x] 利用規約ページ（/legal/terms）を作成（免責・賠償上限条項含む）
- [x] App.tsxに3ページのルートを追加
- [x] Home.tsxフッターに特定商取引法・プライバシーポリシー・利用規約へのリンクを追加
- [x] TypeScriptエラーゼロ確認（85テスト全パス）
- [x] チェックポイント保存（v5.3）

## TOPページデザイン刷新（v5.4）
- [x] Home.tsxのカラーテーマを紫・黒からブライダル系（白・ピンク・ゴールド）に変更
- [x] ヒーローセクションの背景を明るい爵やかなグラデーションに変更
- [x] フッターはダークブラウン系（ブライダル上品感）に変更
- [x] 全セクションの背景を白・ベージュ・ローズピンクに変更
- [x] テキスト色を黒から温かいダークブラウンに変更（山葉・インク系）
- [x] TypeScriptエラーゼロ確認（85テスト全パス）
- [x] チェックポイント保存（v5.4）

## Stripeサブスクリプション開始フロー完成・OEM問い合わせ連携（v5.5）
- [x] Stripeダッシュボードで月額980円の製品・Price IDを作成（ライブモード）
- [x] STRIPE_PRICE_ID環境変数を設定（price_1T6Cs2DGZopVX7ybGEG0ytgC）
- [x] server/routers/payment.tsにcreateSubscriptionCheckout APIを追加
- [x] Plans.tsxの「今すぐ登録する」ボタンをStripe Checkout Sessionに連携
- [x] Dashboard.tsxのプラン確認カードに「今すぐ登録する」ボタンを追加（未サブスク時）
- [x] ForBusiness.tsxのContactFormはtrpc.system.notifyOwnerに接続済みであることを確認
- [x] TypeScriptエラーゼロ確認（85テスト全パス）
- [x] チェックポイント保存（v5.5）

## Webhook確認・デザイン統一・同意チェック・j-agreement連携（v5.6）
- [ ] Stripe Webhookエンドポイント（https://loverschain.jp/api/stripe/webhook）の設定確認・customer.subscription.created/invoice.paidイベント受信対応
- [ ] Plans.tsxの独自ヘッダーをAppHeaderコンポーネントに統一（ブライダルカラー）
- [ ] FAQ.tsxのヘッダーをAppHeaderコンポーネントに統一
- [ ] Kyc.tsxのSTEP1に「利用規約・プライバシーポリシーに同意する」チェックボックスを追加（未同意時は次へ進めない）
- [ ] verid.jpとj-agreement.comのAPI仕様を調査
- [ ] j-agreement.comブロックチェーン連携の実装（現行実装との差分を修正）
- [ ] TypeScriptエラーゼロ確認
- [ ] チェックポイント保存（v5.6）

## j-agreement.comブロックチェーン連携（v5.7）
- [x] J_AGREEMENT_API_KEY・J_AGREEMENT_API_URL環境変数を設定
- [x] partnership.tsのregisterOnBlockchain関数を正式API仕様（POST /api/v1/records）に更新
  - SHA-256ハッシュ計算（partnershipId・partnerAName・partnerBName・certifiedAt）
  - parties情報（パートナーA/B名・役割）を含める
  - metadata.source: "loverschain.jp"を設定
- [x] verification_urlはcertificateUrlカラムに保存（updatePartnershipBlockchain経由）
- [x] Certificate.tsxにeverification_urlとj-agreement.comリンクは既実装済みであることを確認
- [x] server/blockchain.test.tsに11件のvitestTestを追加（SHA-256ハッシュ・APIペイロード・APIキー疏通確認）
- [x] TypeScriptエラーゼロ確認（96テスト全パス）
- [x] チェックポイント保存（v5.7）

## j-agreement.com Webhook受信エンドポイント実装（v5.8）
- [x] LOVERSCHAIN_WEBHOOK_SECRET環境変数を設定
- [x] drizzle/schema.tsにjAgreementRecordId・blockchainBlockNumber・blockchainConfirmedAtカラムを追加
- [x] DBマイグレーション実行（0007_cute_wendigo.sql）
- [x] server/j-agreement-webhook.tsを新規作成（HMAC-SHA256署名検証・blockchain.confirmed処理）
- [x] server/_core/index.tsにPOST /api/webhook/j-agreementルートを登録（express.raw前処理）
- [x] server/db.tsのupdatePartnershipBlockchainにjAgreementRecordIdパラメータを追加
- [x] server/j-agreement-webhook.test.tsに9件のvitestTestを追加
- [x] TypeScriptエラーゼロ確認（105テスト全パス）
- [x] チェックポイント保存（v5.8）

## Resendメール送信設定（v5.9）
- [x] RESEND_API_KEY環境変数を設定（re_ZNpLrHDH_...）
- [x] email.tsの送信元を環境変数切り替え可能に（暗定値: onboarding@resend.dev）
- [ ] loverschain.jpドメイン認証（DNS: SPF/DKIM/DMARCレコード追加）→手動作業必要
- [ ] RESEND_FROM_ADDRESS環境変数に「恋人証明 <noreply@loverschain.jp>」を設定（ドメイン認証後）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v5.9）

## Stripe Webhook強化・Kyc同意チェック・デザイン統一（v5.10）
- [x] stripe-webhook.tsにcustomer.subscription.created/deleted処理を追加
- [x] Kyc.tsx STEP1に利用規約・プライバシーポリシー同意チェックボックスを追加
- [x] Plans.tsxのデザインをブライダルカラー（AppHeader使用）に統一
- [x] FAQ.tsxのデザインをブライダルカラーに統一
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v5.10）

## 招待リンク・ログイン後UX・KYCフロー修正（v5.11）
- [ ] 招待リンクからのセッション切れ問題を調査・修正（ログイン後に招待ページへリダイレクト）
- [ ] ログイン後TOPページに戻る問題を修正（ダッシュボードへ自動リダイレクト）
- [ ] ヘッダーのログイン状態表示を強化（ログイン済みユーザーへの視覚的フィードバック）
- [ ] KYCページのチェックボックスを目立つ位置に移動（ボタン直前ではなくSTEP冒頭に配置）
- [ ] KYC開始エラーの原因を調査・修正（Stripe Identity連携エラー）
- [ ] TypeScriptエラーゼロ確認
- [ ] チェックポイント保存（v5.11）

## 招待リンク・ログイン後UX・KYCフロー修正（v5.11）
- [x] 招待リンクからのログイン後に招待ページへ返る（getLoginUrlにreturnPath引数追加・OAuthコールバックでstateから復元）
- [x] ログイン済みユーザーがTOPページに来たらダッシュボードへ自動リダイレクト
- [x] KYCページの同意チェックボックスをページ最上部の目立つ位置に移動（未同意時はボタン非活性・警告表示）
- [x] Stripe Identity APIのallowed_typesパラメータを正しい配列形式に修正
- [x] startKycの返り値にurlフィールドを追加（Stripe Identity urlを優先使用）
- [x] TypeScriptエラーゼロ・105テスト全パス確認
- [x] チェックポイント保存（v5.11）

## ダッシュボード・ブランド全面刷新（v6.0）
- [x] 競合リサーチ・デザイン方針策定
- [x] ブランドカラー・タイポグラフィ・デザインシステム再定義
- [x] ダッシュボード全面刷新（カップル向け感情訴求UI）
- [x] TOPページ・ナビゲーション刷新（完成済み）
- [x] TypeScriptエラーゼロ・テスト全パス確認
- [x] チェックポイント保存（v6.0）

## ダッシュボード写真アップロード・KYC修正・UX強化（v6.1）
- [x] user.tsにuploadAvatar APIを追加（Base64画像をS3にアップロード→avatarUrl更新）
- [x] ダッシュボードのLoveCounterに写真アップロード機能追加（アバター表示・変更）
- [x] Profile.tsxにアバターアップロード機能追加
- [x] KYCページをブライダルカラーに統一（黒背景→白背景）
- [x] TypeScriptエラーゼロ・105テスト全パス確認
- [x] チェックポイント保存（v6.1）

## パートナー写真表示・通知バナー改善・KYC強化（v6.2）
- [x] ダッシュボードLoveCounterにパートナーのavatarUrlを表示（実装済み確認）
- [x] プッシュ通知バナーをコンパクト化（購読済みは非表示・未購読時のみ表示）
- [x] KYCエラーハンドリング強化（Stripeエラーメッセージを日本語で表示）
- [x] TypeScriptエラーゼロ・105テスト全パス確認
- [x] チェックポイント保存（v6.2）

## 料金体系整理・支払いフロー変更・TOPページ修正（v6.3）
- [x] shared/ranks.tsを3プラン（lover/engagement/student）に更新
- [x] DBスキーマのplanType enumを更新（lover/engagement/student）・マイグレーション実行
- [x] payment.tsのcreatePartnershipCheckoutを新料金体系に更新（ペアあたり・新規・更新分け）
- [x] Plans.tsxを新料金体系に全面更新（税込・税別・更新料・銀行振込案内・PayPay予告）
- [x] TOPページの強制リダイレクトを削除（ログイン済みでもTOPを閲覧可能）
- [x] TypeScriptエラーゼロ・105テスト全パス確認
- [x] チェックポイント保存（v6.3）

## Stripe Price ID設定・銀行振込先・決済フロー実装（v6.4）
- [ ] Stripe Price IDを6種類（3プラン×新規・更新）作成・環境変数に登録
- [x] 銀行振込先情報をPlans.tsxに設定（GMOあおぞらネット銀行）
- [x] 招待リンク送信前の決済フロー実装（ダッシュボード→プラン選択→Stripe決済→招待リンク自動生成）
- [x] usersTableにpendingPlanType・pendingPlanPaidAtカラム追加（DBマイグレーション実行）
- [x] stripe-webhook.tsにpartnership系決済完了時のpendingPlanType設定処理を追加
- [x] invitation.createに決済済みチェック（PAYMENT_REQUIREDエラー）を追加
- [x] Dashboard.tsxにPlanSelectDialogコンポーネントを新規作成（lover/engagement/studentプラン選択）
- [x] Dashboard.tsxにNextActionCardにプラン選択ダイアログ連携を追加
- [x] Dashboard.tsxにActivePartnershipViewにwhite状態時の決済チェックを追加
- [x] Dashboard.tsxに?payment=successクエリパラメータ検知・招待リンク自動生成を実装
- [x] invitation.payment.test.tsに5件の決済チェックテストを追加（全パス）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v6.4）

## 残タスク一括実装（v6.5）

### Stripe Price ID 6種類登録
- [ ] Stripeダッシュボードで3プラン×新規・更新の6種類のPrice IDを環境変数に登録
- [ ] payment.tsのcreatePartnershipCheckoutで各Price IDを使うよう更新

### 管理者ダッシュボード：銀行振込後の手動pendingPlanType設定
- [x] admin.tsにsetPendingPlan APIを追加（userId・planType・paidAt設定）
- [x] AdminUsers.tsxに「プラン設定」ボタンとダイアログを追加（銀行振込確認後の手動有効化）

### OEM問い合わせフォームのバックエンド連携
- [x] ForBusiness.tsxのContactFormをtrpc.system.notifyOwnerに接続（会社名・担当者名・メール・電話・業種・メッセージ）（実装済み確認）

### SEO強化
- [x] FAQ.tsxにJSON-LD FAQPage構造化データを追加
- [x] カテゴリーLP（/for/*）にJSON-LD WebPage構造化データを追加
- [x] index.htmlのOGP画像をデフォルト証明書画像に更新（CDNアップロード済み）

- [x] TypeScriptエラーゼロ確認（Found 0 errors）
- [x] チェックポイント保存（v6.5）

## Google/LINE OAuth認証追加（v6.6）

### DBスキーマ
- [ ] usersテーブルにgoogleId・lineIdカラムを追加（マイグレーション実行）

### バックエンド
- [ ] Google OAuth認可URL生成エンドポイント（GET /api/auth/google）
- [ ] Google OAuthコールバック処理（GET /api/auth/google/callback）：ユーザー作成/紐付け・セッション発行
- [ ] LINE OAuth認可URL生成エンドポイント（GET /api/auth/line）
- [ ] LINE OAuthコールバック処理（GET /api/auth/line/callback）：ユーザー作成/紐付け・セッション発行
- [ ] 環境変数登録：GOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRET・LINE_CHANNEL_ID・LINE_CHANNEL_SECRET

### フロントエンド
- [ ] const.tsにgetGoogleLoginUrl()・getLineLoginUrl()を追加
- [ ] AppHeaderにGoogleログインボタン・LINEログインボタンを追加
- [ ] Home.tsxのCTAにGoogleログインボタン・LINEログインボタンを追加
- [ ] InviteAccept.tsxにGoogleログインボタン・LINEログインボタンを追加

### テスト・品質
- [ ] TypeScriptエラーゼロ確認
- [ ] チェックポイント保存（v6.6）

## 日時入力UI統一（v6.7）

- [x] 日時入力箇所の全体調査（Profile.tsxの生年月日・ComponentShowcase.tsxのDateTimeデモ）
- [x] DateTimePicker共通コンポーネントを作成（カレンダー日付選択＋30分単位時間プルダウン、デフォルト10:00）
- [x] Profile.tsxの生年月日入力をDatePickerコンポーネントに置き換え
- [x] ComponentShowcase.tsxのDateTimeデモをDateTimePickerコンポーネントに置き換え
- [x] TypeScriptエラーゼロ確認（Found 0 errors）
- [x] 全110テストパス確認
- [x] チェックポイント保存（v6.7）

## LINE/Google OAuth認証実装（v6.8）

- [x] DBスキーマ拡張（openIdカラムにline_プレフィックスで保存する方式を採用、マイグレーション不要）
- [x] LINE OAuthバックエンド実装（/api/auth/line → 認可URL生成、/api/auth/line/callback → トークン検証・ユーザー作成/紐付け・Cookie発行）
- [x] env.tsにLINE_CHANNEL_ID・LINE_CHANNEL_SECRETを追加（VITE_LINE_CHANNEL_IDも登録）
- [x] フロントエンド：AppHeader・Home・InviteAcceptにLINEログインボタンを追加
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v6.8）

## Google OAuth認証実装（v6.9）

- [ ] server/routes/google-auth.tsを作成（/api/auth/google → Google認可URL生成、/api/auth/google/callback → トークン検証・ユーザー作成/紐付け・Cookie発行）
- [ ] env.tsにGOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRETを追加
- [ ] server/_core/index.tsにregisterGoogleAuthRoutesを登録
- [ ] client/src/const.tsにgetGoogleLoginUrl関数を追加
- [ ] AppHeader・Home・InviteAcceptにGoogleログインボタンを追加
- [ ] GOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRET環境変数を登録
- [ ] TypeScriptエラーゼロ確認
- [ ] 全テストパス確認

## 証明書2種類実装（v7.0）

### ①婚姻届風証明書（大判・ブロックチェーン原本）
- [x] server/certificates/kokonomiage.tsを作成（@napi-rs/canvasでA4横向き婚姻届風画像生成）
  - 和紙テクスチャ風背景・朱色印鑑・封印・官庁風レイアウト
  - 二人の氏名・交際開始日・証明書番号・発行機関・ブロックチェーン情報
  - NotoSerifCJK-JPフォント使用
- [x] server/routes/ogp.tsに /api/ogp/kokonomiage/:id エンドポイントを追加
- [x] Certificate.tsxに「婚姻届風」タブを追加（①プレビュー・ダウンロードボタン）

### ②スマホ最適化証明書カード（待ち受け画面用）
- [x] client/src/components/SmartphoneCertCard.tsxを作成（縔69:16比率・写真あり/なし切り替え）
  - 写真ありモード：二人の写真を背景に証明書情報をオーバーレイ
  - 写真なしモード：ブライダルカラーグラデーション＋証明書情報
  - html2canvasでPNG保存（スマホ待ち受け最適化）
- [x] Certificate.tsxに「スマホカード」タブを追加（②プレビュー・ダウンロードボタン）
- [x] 写真あり/なしトグルスイッチを実装

### 共通
- [x] Certificate.tsxのタブUI実装（①婚姻届風 / ②スマホカード）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.0）

## Google OAuth本番設定・証明書写真機能（v7.1）

- [ ] Google OAuth環境変数登録（GOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRET） ← Google Cloud Consoleで発行必要
- [x] 婚姻届風証明書（①）に顔写真欄を追加（loadImageでアバターをCanvas内に描画、円形クリップ）
- [x] ogp.tsのkokonomiageエンドポイントにuser1AvatarUrl・user2AvatarUrlを渡すよう更新
- [x] schema.tsにpartnerships.couplePhotoUrlカラムを追加・DBマイグレーション実行
- [x] db.tsにupdateCouplePhotoUrl関数を追加
- [x] partnership.tsにuploadCouplePhoto・deleteCouplePhotoプロシージャを追加（S3アップロード・認可チェック・サイズチェック）
- [x] partnership.certificateルーターにcouplePhotoUrl・planTypeを追加
- [x] SmartphoneCertCard.tsxをS3アップロード対応に更新（保存ボタン・保存済み表示・削除ボタン・次回自動表示）
- [x] Certificate.tsxからpartnershipId・couplePhotoUrlをSmartphoneCertCardに渡すよう更新
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.1）

## Google OAuth本番設定完了・証明書機能強化（v7.2）

- [x] GOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRETを環境変数に登録（本番実用）
- [x] スマホ証明書写真のCanvas APIリサイズ処理を追加（2MB超で自動リサイズ・最大2048px・JPEG0.85）
- [x] 写真選択後のinputリセット処理を追加（同じファイルを再選択可能に）
- [x] 婚姻届風証明書をブロックチェーン登録時の原本画像としてS3に保存（generateKokonomiageCert→storagePut）
- [x] ブロックチェーン登録ペイロードのmetadataにcertificate_image_urlを含める
- [x] certificateUrlに婚姻届風画像S3 URLを使用（画像が原本証明書として機能）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.2）

## Google OAuth client_id missingエラー修正（v7.3）

- [x] env.tsのGOOGLE_CLIENT_ID読み込みを確認（正常）
- [x] 原因特定: getGoogleLoginUrlがVITE_GOOGLE_CLIENT_ID（未登録）を参照していた
- [x] 修正: サーバー経由リダイレクト方式に変更（/api/auth/googleへリダイレクト・クライアントID非露出）
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v7.3）

## LINE OAuth Invalid redirect_uriエラー修正（v7.4）

- [x] 原因特定: getLineLoginUrlがVITE_LINE_CHANNEL_ID（未登録）を参照していた
- [x] 修正: サーバー経由リダイレクト方式に変更（/api/auth/lineへリダイレクト・LINE_CHANNEL_ID非露出）
- [x] サーバー側にredirect_uri=https://loverschain.jp/api/auth/line/callback、client_id=2009305361で正常生成を確認
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v7.4）

## 認証モーダルUI統一・プラン/決済ページ分離（v7.5）

- [x] AuthModal.tsxを新規作成（新規登録・ログイン共通モーダル、Google/LINE/メール3択）
- [x] Home.tsxの新規登録・ログインボタンをモーダル呼び出しに変更
- [x] AppHeader.tsxの新規登録・ログインボタンをモーダル呼び出しに変更
- [x] Plans.tsxのプランカードに支払い方法バッジ（カード/銀行振込）を追加
- [x] Plans.tsxの「このプランで始める」ボタンを/checkout?plan=xxxへの遷移に変更
- [x] Checkout.tsxを新規作成（プラン詳細・支払い方法選択・Stripe決済・銀行振込案内・金額サマリー）
- [x] App.tsxにCheckoutルートを追加
- [x] TypeScriptエラーゼロ確認（Found 0 errors）
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.5）

## eKYCセッション作成500エラー修正（v7.6）

- [x] 原因特定: デバッグエンドポイント（/api/debug/kyc-test）でStripe Identityライブモード正常動作を確認
- [x] 原因特定: startKycプロシージャがfetch手動実装でURLSearchParamsの配列形式パラメータが不正だった
- [x] 修正: startKycプロシージャをStripe SDK（stripe.identity.verificationSessions.create）を使った実装に書き換え
- [x] デバッグエンドポイント（/api/debug/env-check・/api/debug/kyc-test）を削除（セキュリティ強化）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [ ] 本番環境で再テスト（Publish待ち）

## eKYC自動承認・エラーメッセージ改善・Sentry監視（v7.7）

- [x] Stripe Webhook: identity.verification_session.verifiedイベントでkycStatusを自動的にverifiedに更新
- [x] Stripe Webhook: identity.verification_session.requires_inputイベントでkycStatusをfailedに更新（last_error.codeも保存）
- [x] usersテーブルにkycErrorCodeカラムを追加（last_error.code保存用）
- [x] server/db.tsのupdateUserKycStatusにkycErrorCode引数を追加
- [x] shared/kycErrors.tsにeKYCエラー日本語メッセージマップを実装（20エラーコード対応）
- [x] Kyc.tsxのonErrorハンドラをエラーコード別日本語メッセージに改嚄
- [x] Kyc.tsxのFailedGuideコンポーネントにkycErrorCodeプロップを追加（審査不合格画面にエラー詳細を表示）
- [x] server/sentry.tsにSentryサーバー初期化コードを実装（captureException/captureMessageヘルパー付き）
- [x] server/_core/index.tsにSentry初期化・エラーハンドラを組み込む
- [x] client/src/sentry.tsにSentryフロントエンド初期化コードを実装（browserTracing・sessionReplay付き）
- [x] client/src/main.tsxにSentryフロントエンド初期化を組み込む
- [x] SENTRY_DSN / VITE_SENTRY_DSNシークレット登録（DSN疏通テストパス: イベントID 043dd407e388459d86eb480d0d409e42）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.7）

## eKYC processing/canceledイベントのプッシュ通知追加（v7.8）

- [x] identity.verification_session.processingイベントにプッシュ通知を追加（「書類を受け付けました。審査中です」）
- [x] identity.verification_session.canceledイベントにプッシュ通知を追加（「本人確認がキャンセルされました。再度お試しください」）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.8）

## eKYC審査中ポーリング・管理者エラーコード表示（v7.9）

- [x] Kyc.tsxにkycStatus=pendingの場呁5秒間隔でポーリングして審査完了を自動反映
- [x] ポーリング中はスピナー・審査中UIを表示（「審査結果を確認中…完了次第自動で画面が更新されます」）
- [x] verified/failed/not_startedになったらポーリング停止・画面自動更新
- [x] 管理者eKYC一覧ページにkycErrorCode列を追加（エラー原因列・ツールチップに詳細表示）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.9）

## 開発環境用ボタン非表示（v7.10）

- [x] Kyc.tsxの「開発環境用：審査を即時完了させる」ボタンをimport.meta.env.DEVで制御して本番環境では非表示にする
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v7.10）

## 管理者eKYC却下理由・自動招待メール・Webhook登録（v7.11）

- [x] adminReviewKycプロシージャにkycErrorCode引数を追加（却下時に理由コードを保存）
- [x] Admin.tsxの却下ボタンをダイアログに変更（KYC_ERROR_MESSAGESから理由コードを選択）
- [x] stripe-webhook.tsのverifiedイベント処理でeKYC完了後に自動招待リンクを生成してメール送信（決済済み・未パートナーシップの場合のみ）
- [x] テストモードWebhookにeKYCイベントを追加登録（Stripe API経由）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.11）

## 招待メールデザイン・再申請ディープリンクヮeKYC統計ダッシュボード（v7.12）

- [x] 招待メールをブランドカラー（ピンク）のリッチHTMLテンプレートに改善（server/emailTemplates.ts新規作成）
- [x] eKYC却下後のプッシュ通知にエラーコード別メッセージを追加（却下メール送信も追加）
- [x] getKycStatsヘルパーをdb.tsに追加（ステータス別カウント・エラーコード内訳・平均審査時間・最近却下10件）
- [x] admin.tsにkycStatsプロシージャを追加（adminProcedure保護）
- [x] Admin.tsxにeKYC統計タブを追加（ステータス別カウント・承認率・平均審査時間・却下理由内訳・最近却下ユーザー）
- [x] TypeScriptエラーゼロ確認
- [x] 全109テストパス確認（1件はj-agreement.comネットワーク接続エラー・既知）
- [x] チェックポイント保存（v7.12）

## 未実装機能整理・メールFROMアドレス統一（v7.13）

- [x] コードベース全体精査：未実装と記載されていた機能の実際の実装状況を確認
- [x] Google OAuth：server/routes/google-auth.ts・ルート登録・AuthModal.tsx・const.tsすべて実装済みを確認（v6.8で完成済み）
- [x] KYCステップガイド：STEP1テ事前準備・STEP3審査中・STEP4完了・再申請ガイドすべて実装済みを確認（v1.6で完成済み）
- [x] ForBusiness.tsxのContactForm→trpc.system.notifyOwner接続実装済みを確認（v6.5で完成済み）
- [x] FAQ・カテゴリーLP・JSON-LD構造化データ実装済みを確認（v6.5で完成済み）
- [x] stripe-webhook.tsのfromアドレスをRESEND_FROM_ADDRESS環境変数対応に統一（ドメイン認証前はonboarding@resend.devに自動フォールバック）
- [x] TypeScriptエラーゼロ確認
- [x] 全110テストパス確認
- [x] チェックポイント保存（v7.13）

## 手動作業実施（v7.14）

- [x] Resendドメイン認証完了確認（loverschain.jp ステータス: Verified）
- [x] RESEND_FROM_ADDRESS環境変数を「恋人証明 <noreply@loverschain.jp>」に設定
- [x] RESEND_FROM_ADDRESS環境変数テストパス（server/resend-env.test.ts）
- [ ] Stripe Webhookに eKYC 4イベントを追加（Stripeダッシュボードで手動作業）
- [x] Stripe Webhookに eKYC 4イベントを追加（済み）
- [x] 本番ドメイン用Webhook（loverschain.jp）を新規作成（済み）
- [x] stripe-webhook.tsを本番・Manus内部の2つのWebhook Secretに対応
- [x] TypeScriptエラーゼロ確認
- [x] 全112テストパス確認
- [ ] チェックポイント保存（v7.14）
- [ ] 本番環境でeKYCフロー再テスト（loverschain.jp）

## 本番環境バグ修正レeKYC顔写真必須化（v7.15）

- [x] SMS認証失敗 → E.164形式変換（0xxxxxxxx → +81xxxxxxxx）で修正
- [x] プロフィール写真アップロード不可 → document.createElement方式をhidden input + label方式に変更
- [x] プッシュ通知非対応メッセージ → iOS向けにSafariホーム画面追加案内に改善
- [x] TypeScriptエラーゼロ確認
- [x] 全112テストパス確認
- [x] チェックポイント保存（v7.15）

## eKYC顔写真撮影必須化（v7.15追加）

- [x] startKycプロシージャのrequire_live_capture: true・ require_matching_selfie: trueに変更
- [x] KYCページのUI説明文を「書類＋顔写真セルフィー必須」に更新

## プロフィール認証UX改善（v7.16）

- [ ] メール認証カード：プロフィールに保存済みのemailを初期値として自動入力する
- [ ] SMS認証カード：プロフィールに保存済みのphoneを初期値として自動入力する
- [ ] SMS認証エラー調査・修正（本番でエラー発生中）
- [ ] sendEmailVerificationでprofile.emailをデフォルト値として使用するよう修正
- [ ] sendSmsVerificationでprofile.phoneをデフォルト値として使用するよう修正
- [ ] TypeScriptエラーゼロ確認
- [ ] テストパス確認
- [ ] チェックポイント保存（v7.16）

## バグ修正・機能追加（v7.17）

- [x] Stripe決済後にプランが反映されないバグを修正（Webhookのplan_type未設定→order_typeから抽出するよう修正・DB手動修正でてつじさんのpendingPlanType=loverを設定）
- [x] 未プラン時の招待コードボタンを無効化し、モーダルで警告表示する（InviteAccept.tsxにKYCチェック追加・NextActionCardのkycStatusチェックにnot_started/failedを追加）
- [x] プロフィールの携帯番号保存バグを修正する（sendSmsVerification時に電話番号をprofileにも保存）
- [x] 認証UX改善：プロフィール入力済みの携帯・メールを認証カードに自動反映（再入力不要）（SmsVerificationCardのuseEffect修正・Profile.tsxからinitialPhoneを渡す）
- [x] カップル割り勘決済機能（相手に半額支払いリクエスト）を追加する（DBスキーマ拡張・createPartnershipSplitCheckout/createSplitAccepterCheckout API追加・Checkout.tsx割り勘オプション追加・InviteAccept.tsx割り勘支払いUI追加）
- [x] テストのdaysAgo関数をミリ秒単位で正確に計算するよう修正（全112テストパス）

## バグ修正・機能追加（v7.18）

- [x] Checkout.tsx（招待者側）の割り勘オプション選択時にフロー説明テキストを追加する（ステップバイステップのビジュアルフロー図実装済み）
- [x] InviteAccept.tsx（承認者側）の割り勘支払いUIにフロー説明テキストを追加する
- [x] Dashboard.tsxの割り勘招待ボタン周辺にフロー説明テキストを追加する

## バグ修正・機能追加（v7.19）

- [x] Stripe CheckoutのpaymentMethodTypesにpaypayを追加する（createPartnershipCheckout/createSubscriptionCheckout/createPartnershipSplitCheckout）
- [x] TOPページ（Home.tsx）に支払い方法ロゴ（Visa/Mastercard/PayPay等）を追加する
- [x] Checkout.tsxに支払い方法ロゴを追加する
- [x] Plans.tsxに支払い方法ロゴを追加する
- [ ] シングル/イエロー/レッド判定機能（パートナー状況の事前確認システム）は未実装のため、設計・実装計画を立てる

## シングル/イエロー/レッド判定機能（v7.20）

- [ ] DBスキーマ：partner_status_inquiries（問い合わせ）テーブルを追加する
- [ ] API：パートナーステータス問い合わせ送信（メール/LINE通知）
- [ ] API：問い合わせ承認・ステータス開示
- [ ] UI：ダッシュボードに「パートナーステータスの事前確認」ボタンを追加する
- [ ] UI：相手への確認メール/LINE送信フロー
- [ ] UI：ステータス開示結果表示（シングル/イエロー/レッド）
- [ ] ステータス判定ロジック：シングル（パートナーなし）・イエロー（90日以内解消申請）・レッド（現在交際中）

## 割り勘フロー修正・シングル/イエロー/レッド判定機能（v7.20）

### 割り勘フロー修正
- [x] partnership.tsのcreateプロシージャにisSplitPayment時のaccepterPaidAtチェックを追加（未払いでパートナーシップ成立できないよう修正）
- [x] InviteAccept.tsxの割り勘フロー：支払い完了後にaccepterPaidAtが設定されているかチェックしてから成立ボタンを表示

### シングル/イエロー/レッド判定機能
- [x] DBスキーマ：partner_status_inquiries テーブルを追加（id, requesterId, targetEmail, targetUserId, token, status, consentGiven, result, expiresAt, createdAt）
- [x] drizzle-kit generateでマイグレーションSQL生成・webdev_execute_sqlで適用
- [x] server/db.tsのpartner_status_inquiries用ヘルパーを追加
- [x] server/routers/partnerStatus.tsを新規作成（requestCheck/grantConsent/getResult APIを実装）
- [x] requestCheck: 相手のメールアドレスにトークン付き確認メールを送信
- [x] grantConsent: トークンで同意ページにアクセスした相手が承認するとステータスを開示
- [x] getResult: 問い合わせ結果（シングル/イエロー/レッド）を取得
- [x] ステータス判定ロジック：シングル（パートナーなし）・イエロー（90日以内に解消申請）・レッド（現在交際中）
- [x] server/routers.tsのpartnerStatusRouterを追加
- [x] client/src/pages/PartnerStatusConsent.tsx を新規作成（同意ページ：/partner-status-consent?token=xxx）
- [x] App.tsxに/partner-status-consentルートを追加
- [x] Dashboard.tsxに「パートナーステータスの事前確認」ボタンとダイアログを追加
- [x] ダイアログ：メールアドレス入力→送信→結果表示（シングル/イエロー/レッド）
- [x] TypeScriptエラーゼロ確認
- [x] テストパス確認
- [x] チェックポイント保存（v7.20）

## シングル/イエロー/レッド判定UI改善3案（v7.21）

### 改善案1: ステータス結果ビジュアルカードモーダル
- [ ] PartnerStatusResultModal.tsxコンポーネントを新規作成（シングル/イエロー/レッドの色分けフルスクリーンモーダル）
- [ ] シングル：緑グラデーション背景・大きなチェックマーク・「新しい交際が可能な状態です」
- [ ] イエロー：黄色背景・注意アイコン・「90日以内に交際解消歴あり」補足説明
- [ ] レッド：赤背景・警告アイコン・「現在パートナーがいます」
- [ ] 「この結果をスクリーンショットで保存」ボタン（html2canvas使用）
- [ ] Dashboard.tsxの結果表示をPartnerStatusResultModalに差し替え

### 改善案2: タイムライン進行状況表示＋プッシュ通知連携
- [ ] ダイアログ内に3ステップタイムライン（①送信済み→②確認中→③結果受信）を実装
- [ ] 残り時間カウントダウン表示（expiresAtまでの時間）
- [ ] アニメーション付きインジケーター（pending中はパルスアニメーション）
- [ ] partnerStatus.tsのrespondToInquiryで同意時にrequesterへプッシュ通知を送信
- [ ] ダッシュボードのバッジ（未確認の結果あり）を追加

### 改善案3: KYC未完了ユーザー向け誘導フロー
- [ ] KYC未完了でも「パートナーステータスの事前確認」ボタンを表示（グレーアウト＋南京錠アイコン）
- [ ] クリック時にKYC誘導モーダルを表示（「本人確認が必要です・所要時間約3分」）
- [ ] 「今すぐ本人確認する」ボタンでeKYCページへ遷移- [x] TypeScriptエラーゼロ確認
- [x] 全テストパス確認
- [x] チェックポイント保存（v7.22）

## UI改善3案 完了（v7.21）

- [x] 改善案1: PartnerStatusResultModal.tsx 新規作成（ビジュアルカード・スクリーンショット保存）
- [x] 改善案2: PartnerStatusTimeline.tsx 新規作成（3ステップ・カウントダウン・パルスアニメーション）
- [x] 改善案2: partnerStatus.ts respondToInquiry にプッシュ通知追加（同意時に依頼者へ通知）
- [x] 改善案3: Dashboard.tsx KYC未完了ボタンをグレーアウト化＋南京錠アイコン
- [x] 改善案3: KYC誘導モーダル実装（機能プレビュー＋eKYCページへ直接遷移）
- [x] TypeScriptエラーゼロ確認
- [x] 全118テストパス確認
- [x] チェックポイント保存（v7.21）

## ポーリング自動更新・管理者スパム検知・同意ページデザイン強化（v7.22）

- [x] ポーリング自動更新: pending状態の30秒ごとに再取得（refetchInterval）
- [x] ポーリング自動更新: 結果受信時にビジュアルカードを自動表示（useEffect）
- [x] 管理者画面: partnerStatusInquiries一覧ページ追加
- [x] 管理者画面: スパム検知（日次上限設定・超過ユーザー一覧）
- [x] 管理者画面: ブラックリスト管理（ブロック・解除）
- [x] DB: partner_status_blacklist テーブル追加
- [x] partnerStatus.ts: requestCheck に日次上限チェックを追加
- [x] PartnerStatusConsent: 依頼者アバター・名前・理由説明を表示
- [x] PartnerStatusConsent: 同意率向上UI（安心感の訴求・プライバシー説明）
- [x] TypeScriptエラーゼロ確認
- [x] 全テストパス確認
- [x] チェックポイント保存（v7.22）

## ダッシュボードUI修正5点（v7.23）

- [ ] パートナーステータス確認モーダル：閉じた後に再度開いても送信済み状態（タイムライン）が表示されるよう修正
- [ ] プランカードのクリック：ダッシュボードを離れずに現在のプラン詳細をダイアログで表示（/plansページへ遷移しない）
- [ ] ダッシュボード最上部にステータスバー追加（グリーン/イエロー/レッド/グレーを横幅フルのバーで表示）
- [ ] 招待リンク作成ボタンの重複を解消（1つに統一）
- [ ] 特典ページのデモデータ「TOHOシネマズ」を架空の店舗名に変更
- [ ] TypeScriptエラーゼロ確認
- [ ] チェックポイント保存（v7.23）

## パートナーステータス確認フロー根本修正（v7.24）

- [x] ポーリングをダイアログ外でも常時継続（pending中は常時30秒ごとに再取得）
- [x] ダッシュボードのボタンに「結果が届いた」通知バッジを常時表示
- [x] ダイアログを開き直したとき、既に結果がある問い合わせはすぐ結果カードを表示
- [x] TypeScriptエラーゼロ確認
- [x] チェックポイント保存（v7.24）
