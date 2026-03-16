import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addPartnershipStatusHistory,
  cancelDissolutionRequest,
  confirmDissolutionRequest,
  createDissolutionRequest,
  createPartnership,
  getActivePartnershipByUserId,
  getPastPartnershipsByUserId,
  getAllPartnerships,
  getActivePartnershipsCount,
  getPartnershipsCount,
  getDissolutionRequestByPartnership,
  getInvitationByKey,
  getPartnershipById,
  getPartnershipHistory,
  getUserById,
  updateInvitationStatus,
  updatePartnershipBlockchain,
  updatePartnershipStatus,
  updateUserPartnershipStatus,
  updatePartnershipToEngaged,
  updateSingleCertificate,
  updateUserCertSettings,
  hasActivePartnership,
  updateCouplePhotoUrl,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sendPushToUser } from "../push";
import {
  sendPartnershipCreatedEmail,
  sendDissolutionRequestEmail,
  sendDissolutionConfirmedEmail,
  sendDissolutionCancelledEmail,
} from "../email";
import { createHash } from "crypto";
import { storagePut } from "../storage";
import { generateKokonomiageCert } from "../certificates/kokonomiage";

// j-agreement.com API連携

async function registerOnBlockchain(partnershipId: number, data: {
  user1Id: number;
  user2Id: number;
  user1Name: string;
  user2Name: string;
  startedAt: Date;
  kokonomiageImageUrl?: string | null;
}): Promise<{ txHash: string; certificateUrl: string; verificationUrl: string } | null> {
  const apiUrl = process.env.J_AGREEMENT_API_URL;
  const apiKey = process.env.J_AGREEMENT_API_KEY;

  // SHA-256ハッシュ計算（冪等性のため同じデータは同じハッシュ）
  const documentHash = createHash("sha256")
    .update(JSON.stringify({
      partnershipId,
      partnerAName: data.user1Name,
      partnerBName: data.user2Name,
      certifiedAt: data.startedAt.toISOString(),
    }))
    .digest("hex");

  if (!apiUrl || !apiKey) {
    // モック: 開発環境用
    console.log("[Blockchain] Mock mode - no API configured");
    return {
      txHash: `0x${documentHash}`,
      certificateUrl: `https://j-agreement.com/verify/${partnershipId}`,
      verificationUrl: `https://j-agreement.com/api/v1/verify?hash=${documentHash}`,
    };
  }

  try {
    const payload = {
      external_id: `loverschain-${partnershipId}`,
      title: `恋人証明書 #${partnershipId}`,
      document_hash: documentHash,
      parties: [
        { name: data.user1Name, role: "パートナーA" },
        { name: data.user2Name, role: "パートナーB" },
      ],
      signed_at: data.startedAt.toISOString(),
      metadata: {
        source: "loverschain.jp",
        partnership_id: String(partnershipId),
        ...(data.kokonomiageImageUrl ? { certificate_image_url: data.kokonomiageImageUrl } : {}),
      },
    };

    const response = await fetch(`${apiUrl}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error("[Blockchain] API error:", response.status, errText);
      return null;
    }

    const result = (await response.json()) as {
      record_id: string;
      external_id: string;
      status: string;
      verification_url: string;
      created_at: string;
      is_new: boolean;
    };

    console.log(`[Blockchain] Partnership ${partnershipId} registered: record_id=${result.record_id}, status=${result.status}`);

    return {
      txHash: result.record_id,
      certificateUrl: result.verification_url,
      verificationUrl: `https://j-agreement.com/api/v1/verify?hash=${documentHash}`,
    };
  } catch (error) {
    console.error("[Blockchain] Failed to register:", error);
    return null;
  }
}

export const partnershipRouter = router({
  // パートナーシップ成立（招待キー使用）
  create: protectedProcedure
    .input(
      z.object({
        invitationKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const accepter = await getUserById(ctx.user.id);
      if (!accepter) throw new TRPCError({ code: "NOT_FOUND" });

      // eKYC確認
      if (accepter.kycStatus !== "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "パートナーシップの成立には本人確認（eKYC）が必要です。",
        });
      }

      // 既存パートナーシップ確認
      const existingAccepter = await getActivePartnershipByUserId(ctx.user.id);
      if (existingAccepter) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "すでにパートナーシップが存在します。",
        });
      }

      // 招待キー検証
      const invitation = await getInvitationByKey(input.invitationKey);
      if (!invitation || invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "無効な招待キーです。",
        });
      }

      if (new Date() > invitation.expiresAt) {
        await updateInvitationStatus(invitation.id, "expired");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "招待の有効期限が切れています。",
        });
      }

      // 自分自身への招待は不可
      if (invitation.inviterId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身を招待することはできません。",
        });
      }

      // 招待者のeKYC確認
      const inviter = await getUserById(invitation.inviterId);
      if (!inviter || inviter.kycStatus !== "verified") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "招待者の本人確認が完了していません。",
        });
      }

      // 招待者の既存パートナーシップ確認
      const existingInviter = await getActivePartnershipByUserId(
        invitation.inviterId
      );
      if (existingInviter) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "招待者はすでに別のパートナーシップが存在します。",
        });
      }

      // 割り勘決済チェック: 割り勘招待の場合は承認者の支払い完了が必要
      if (invitation.isSplitPayment && !invitation.accepterPaidAt) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "割り勘招待のため、パートナーシップ成立前にあなたの分（半額）のお支払いが必要です。",
        });
      }

      // パートナーシップ作成
      const result = await createPartnership({
        user1Id: invitation.inviterId,
        user2Id: ctx.user.id,
      });

      const insertId = (result as { insertId?: number }).insertId ?? 0;

      // 招待を使用済みに更新
      await updateInvitationStatus(invitation.id, "accepted");

      // 両ユーザーのステータスをgreenに更新
      await Promise.all([
        updateUserPartnershipStatus(invitation.inviterId, "green"),
        updateUserPartnershipStatus(ctx.user.id, "green"),
      ]);

      // ステータス履歴記録
      await addPartnershipStatusHistory({
        partnershipId: insertId,
        fromStatus: undefined,
        toStatus: "green",
        changedBy: ctx.user.id,
        reason: "パートナーシップ成立",
      });

      // ブロックチェーン証明書発行（非同期）
      const now = new Date();
      const user1Name = inviter.displayName ?? inviter.name ?? `ユーザー${invitation.inviterId}`;
      const user2Name = accepter.displayName ?? accepter.name ?? `ユーザー${ctx.user.id}`;
      const certId = `KS-${String(insertId).padStart(8, "0")}`;

      // 婚姻届風証明書画像をS3に保存してからブロックチェーン登録（非同期）
      (async () => {
        try {
          // ① 婚姻届風証明書画像を生成してS3に保存
          let kokonomiageImageUrl: string | null = null;
          try {
            const imgBuffer = await generateKokonomiageCert({
              user1Name,
              user2Name,
              certId,
              startedAt: now,
              planType: "lover",
              user1AvatarUrl: inviter.avatarUrl ?? null,
              user2AvatarUrl: accepter.avatarUrl ?? null,
            });
            const fileKey = `certificates/${insertId}/kokonomiage-${Date.now()}.png`;
            const { url } = await storagePut(fileKey, imgBuffer, "image/png");
            kokonomiageImageUrl = url;
            console.log(`[Certificate] Kokonomiage image saved to S3: ${url}`);
          } catch (imgErr) {
            console.error("[Certificate] Failed to generate/upload kokonomiage image:", imgErr);
          }

          // ② ブロックチェーン登録（画像URLをメタデータに含める）
          const blockchainResult = await registerOnBlockchain(insertId, {
            user1Id: invitation.inviterId,
            user2Id: ctx.user.id,
            user1Name,
            user2Name,
            startedAt: now,
            kokonomiageImageUrl,
          });

          if (blockchainResult) {
            await updatePartnershipBlockchain(
              insertId,
              blockchainResult.txHash,
              kokonomiageImageUrl ?? blockchainResult.certificateUrl
            );
            console.log(
              `[Blockchain] Partnership ${insertId} registered: record_id=${blockchainResult.txHash}`
            );
          }
        } catch (err) {
          console.error("[Blockchain] Background registration failed:", err);
        }
      })();

      // 招待者へpush通知を送信
      sendPushToUser(invitation.inviterId, {
        title: "💗 パートナーシップが成立しました！",
        body: `${ctx.user.name ?? "パートナー"}さんが招待を承認しました。証明書を確認してください。`,
        url: "/dashboard",
        tag: "partnership-created",
      }).catch((e) => console.warn("[Push] partnership notify failed:", e));

      // 双方へメール通知
      const emailDashboardUrl = "https://loverschain.jp/dashboard";
      if (inviter?.email) {
        sendPartnershipCreatedEmail({
          to: inviter.email,
          userName: inviter.displayName ?? inviter.name ?? "あなた",
          partnerName: ctx.user.name ?? "パートナー",
          dashboardUrl: emailDashboardUrl,
        }).catch((e) => console.warn("[Email] partnership created (inviter) failed:", e));
      }
      if (ctx.user.email) {
        sendPartnershipCreatedEmail({
          to: ctx.user.email,
          userName: ctx.user.name ?? "あなた",
          partnerName: inviter?.displayName ?? inviter?.name ?? "パートナー",
          dashboardUrl: emailDashboardUrl,
        }).catch((e) => console.warn("[Email] partnership created (accepter) failed:", e));
      }

      return {
        success: true,
        partnershipId: insertId,
        message: "パートナーシップが成立しました！",
      };
    }),

  // 自分のパートナーシップ情報取得
  mine: protectedProcedure.query(async ({ ctx }) => {
    const partnership = await getActivePartnershipByUserId(ctx.user.id);
    if (!partnership) return null;

    const isUser1 = partnership.user1Id === ctx.user.id;
    const partnerId = isUser1 ? partnership.user2Id : partnership.user1Id;
    const partner = await getUserById(partnerId);

    return {
      ...partnership,
      partner: partner
        ? {
            id: partner.id,
            displayName: partner.displayName ?? partner.name,
            avatarUrl: partner.avatarUrl,
            kycStatus: partner.kycStatus,
          }
        : null,
    };
  }),

  // 証明書取得（公開）
  certificate: publicProcedure
    .input(z.object({ partnershipId: z.number() }))
    .query(async ({ input }) => {
      const partnership = await getPartnershipById(input.partnershipId);
      if (!partnership) throw new TRPCError({ code: "NOT_FOUND" });

      const [user1, user2] = await Promise.all([
        getUserById(partnership.user1Id),
        getUserById(partnership.user2Id),
      ]);

      return {
        id: partnership.id,
        status: partnership.status,
        planType: partnership.planType,
        startedAt: partnership.startedAt,
        endedAt: partnership.endedAt,
        blockchainTxHash: partnership.blockchainTxHash,
        certificateUrl: partnership.certificateUrl,
        blockchainRegisteredAt: partnership.blockchainRegisteredAt,
        couplePhotoUrl: partnership.couplePhotoUrl,
        user1: user1
          ? {
              displayName: user1.displayName ?? user1.name,
              avatarUrl: user1.avatarUrl,
              kycStatus: user1.kycStatus,
            }
          : null,
        user2: user2
          ? {
              displayName: user2.displayName ?? user2.name,
              avatarUrl: user2.avatarUrl,
              kycStatus: user2.kycStatus,
            }
          : null,
      };
    }),

  // パートナーシップ履歴
  history: protectedProcedure
    .input(z.object({ partnershipId: z.number() }))
    .query(async ({ ctx, input }) => {
      const partnership = await getPartnershipById(input.partnershipId);
      if (!partnership) throw new TRPCError({ code: "NOT_FOUND" });

      // 自分が関係するパートナーシップのみ
      if (
        partnership.user1Id !== ctx.user.id &&
        partnership.user2Id !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return getPartnershipHistory(input.partnershipId);
    }),

  // 解消申請
  requestDissolution: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mutual", "unilateral"]),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const partnership = await getActivePartnershipByUserId(ctx.user.id);
      if (!partnership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "有効なパートナーシップが見つかりません。",
        });
      }

      if (partnership.status !== "green") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "現在の状態では解消申請できません。",
        });
      }

      // 既存の解消申請確認
      const existing = await getDissolutionRequestByPartnership(partnership.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "すでに解消申請が存在します。",
        });
      }

      await createDissolutionRequest({
        partnershipId: partnership.id,
        requestedBy: ctx.user.id,
        type: input.type,
        reason: input.reason,
      });

      // ステータス更新
      const newStatus = input.type === "mutual" ? "gray" : "yellow";
      const prevStatus = partnership.status;

      await updatePartnershipStatus(partnership.id, newStatus, {
        dissolutionType: input.type,
        dissolutionRequestedBy: ctx.user.id,
        coolingOffEndsAt:
          input.type === "mutual"
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14日後
            : undefined,
      });

      await addPartnershipStatusHistory({
        partnershipId: partnership.id,
        fromStatus: prevStatus,
        toStatus: newStatus,
        changedBy: ctx.user.id,
        reason: `解消申請（${input.type === "mutual" ? "円満" : "一方的"}）: ${input.reason ?? ""}`,
      });

      // 両ユーザーのステータス更新
      const isUser1 = partnership.user1Id === ctx.user.id;
      const partnerId = isUser1 ? partnership.user2Id : partnership.user1Id;
      await Promise.all([
        updateUserPartnershipStatus(ctx.user.id, newStatus),
        updateUserPartnershipStatus(partnerId, newStatus),
      ]);

      // パートナーへpush通知を送信
      const notifyBody =
        input.type === "mutual"
          ? `${ctx.user.name ?? "パートナー"}さんが円満解消を申請しました。14日間のクーリングオフ期間があります。`
          : `${ctx.user.name ?? "パートナー"}さんが解消を申請しました。ダッシュボードで確認してください。`;
      sendPushToUser(partnerId, {
        title: "💔 解消申請が届きました",
        body: notifyBody,
        url: "/dashboard",
        tag: "dissolution-request",
      }).catch((e) => console.warn("[Push] dissolution notify failed:", e));

      // パートナーへメール通知
      const partnerUser = await getUserById(partnerId);
      if (partnerUser?.email) {
        sendDissolutionRequestEmail({
          to: partnerUser.email,
          requesterName: ctx.user.name ?? "パートナー",
          type: input.type,
          dashboardUrl: "https://loverschain.jp/dashboard",
        }).catch((e) => console.warn("[Email] dissolution request failed:", e));
      }

      return {
        success: true,
        newStatus,
        message:
          input.type === "mutual"
            ? "円満解消を申請しました。14日間のクーリングオフ期間後に解消されます。"
            : "解消を申請しました。パートナーの承認を待っています。",
      };
    }),

  // 解消承認（パートナーが同意）
  confirmDissolution: protectedProcedure.mutation(async ({ ctx }) => {
    const partnership = await getActivePartnershipByUserId(ctx.user.id);
    if (!partnership) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (partnership.status !== "yellow" && partnership.status !== "gray") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "解消申請が存在しません。",
      });
    }

    // 自分が申請者でないことを確認
    if (partnership.dissolutionRequestedBy === ctx.user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "自分の解消申請を承認することはできません。",
      });
    }

    const dissolutionReq = await getDissolutionRequestByPartnership(
      partnership.id
    );
    if (dissolutionReq) {
      await confirmDissolutionRequest(dissolutionReq.id);
    }

    const prevStatus = partnership.status;

    // white（解消完了）に更新
    await updatePartnershipStatus(partnership.id, "white", {
      dissolutionConfirmedAt: new Date(),
      endedAt: new Date(),
    });

    await addPartnershipStatusHistory({
      partnershipId: partnership.id,
      fromStatus: prevStatus,
      toStatus: "white",
      changedBy: ctx.user.id,
      reason: "解消承認",
    });

    // 両ユーザーをsingleに戻す
    const isUser1 = partnership.user1Id === ctx.user.id;
    const partnerId = isUser1 ? partnership.user2Id : partnership.user1Id;
    await Promise.all([
      updateUserPartnershipStatus(ctx.user.id, "single"),
      updateUserPartnershipStatus(partnerId, "single"),
    ]);

    // 申請者へpush通知を送信
    sendPushToUser(partnerId, {
      title: "✅ 解消が承認されました",
      body: "パートナーシップが正式に解消されました。",
      url: "/dashboard",
      tag: "dissolution-confirmed",
    }).catch((e) => console.warn("[Push] dissolution confirm notify failed:", e));

    // 申請者へメール通知
    const requesterUser = await getUserById(partnerId);
    if (requesterUser?.email) {
      sendDissolutionConfirmedEmail({
        to: requesterUser.email,
        partnerName: ctx.user.name ?? "パートナー",
        dashboardUrl: "https://loverschain.jp/dashboard",
      }).catch((e) => console.warn("[Email] dissolution confirmed failed:", e));
    }

    return {
      success: true,
      message: "パートナーシップが解消されました。",
    };
  }),

  // 解消申請の取り消し
  // 過去のパートナーシップ一覧（解消済み）
  pastList: protectedProcedure.query(async ({ ctx }) => {
    const pastPartnerships = await getPastPartnershipsByUserId(ctx.user.id);

    // パートナー情報を付加
    const enriched = await Promise.all(
      pastPartnerships.map(async (p) => {
        const partnerId = p.user1Id === ctx.user.id ? p.user2Id : p.user1Id;
        const partner = await getUserById(partnerId);
        return {
          ...p,
          partner: partner
            ? {
                id: partner.id,
                displayName: partner.displayName,
                avatarUrl: partner.avatarUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  }),

  cancelDissolution: protectedProcedure.mutation(async ({ ctx }) => {
    const partnership = await getActivePartnershipByUserId(ctx.user.id);
    if (!partnership) {
      throw new TRPCError({ code: "NOT_FOUND", message: "有効なパートナーシップが見つかりません。" });
    }

    if (partnership.status !== "yellow" && partnership.status !== "gray") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "解消申請が存在しません。" });
    }

    // 自分が申請者であることを確認
    if (partnership.dissolutionRequestedBy !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "自分の申請のみ取り消せます。" });
    }

    const dissolutionReq = await getDissolutionRequestByPartnership(partnership.id);
    if (dissolutionReq) {
      await cancelDissolutionRequest(dissolutionReq.id);
    }

    const prevStatus = partnership.status;
    await updatePartnershipStatus(partnership.id, "green", {
      dissolutionType: null as any,
      dissolutionRequestedBy: null as any,
      coolingOffEndsAt: null as any,
    });

    await addPartnershipStatusHistory({
      partnershipId: partnership.id,
      fromStatus: prevStatus,
      toStatus: "green",
      changedBy: ctx.user.id,
      reason: "解消申請取り消し",
    });

    const isUser1 = partnership.user1Id === ctx.user.id;
    const partnerId = isUser1 ? partnership.user2Id : partnership.user1Id;
    await Promise.all([
      updateUserPartnershipStatus(ctx.user.id, "green"),
      updateUserPartnershipStatus(partnerId, "green"),
    ]);

    // パートナーへpush通知を送信
    sendPushToUser(partnerId, {
      title: "🔄 解消申請が取り消されました",
      body: "パートナーが解消申請を取り消しました。パートナーシップは継続します。",
      url: "/dashboard",
      tag: "dissolution-cancelled",
    }).catch((e) => console.warn("[Push] dissolution cancel notify failed:", e));

    // パートナーへメール通知
    const cancelNotifyUser = await getUserById(partnerId);
    if (cancelNotifyUser?.email) {
      sendDissolutionCancelledEmail({
        to: cancelNotifyUser.email,
        cancellerName: ctx.user.name ?? "パートナー",
        dashboardUrl: "https://loverschain.jp/dashboard",
      }).catch((e) => console.warn("[Email] dissolution cancelled failed:", e));
    }

    return { success: true, message: "解消申請を取り消しました。" };
  }),

  // 解消ステータス取得（ダッシュボード用）
  getDissolutionStatus: protectedProcedure.query(async ({ ctx }) => {
    const partnership = await getActivePartnershipByUserId(ctx.user.id);
    if (!partnership) return null;

    const dissolutionReq = await getDissolutionRequestByPartnership(partnership.id);

    return {
      partnershipStatus: partnership.status,
      dissolutionType: partnership.dissolutionType,
      dissolutionRequestedBy: partnership.dissolutionRequestedBy,
      coolingOffEndsAt: partnership.coolingOffEndsAt,
      isRequester: partnership.dissolutionRequestedBy === ctx.user.id,
      request: dissolutionReq ?? null,
    };
  }),

  // 婚約申請（両者の独身証明書が承認済みの場合にengagedに昇格）
  requestEngagement: protectedProcedure.mutation(async ({ ctx }) => {
    const partnership = await getActivePartnershipByUserId(ctx.user.id);
    if (!partnership) {
      throw new TRPCError({ code: "NOT_FOUND", message: "有効なパートナーシップが見つかりません。" });
    }

    if (partnership.status !== "green") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "現在の状態では婚約申請できません。" });
    }

    // 両者の独身証明書が承認済みか確認
    const [user1, user2] = await Promise.all([
      getUserById(partnership.user1Id),
      getUserById(partnership.user2Id),
    ]);

    if (
      user1?.singleCertificateStatus !== "approved" ||
      user2?.singleCertificateStatus !== "approved"
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "両者の独身証明書が承認済みである必要があります。独身証明書をアップロードして管理者の承認を受けてください。",
      });
    }

    await updatePartnershipToEngaged(partnership.id);
    await addPartnershipStatusHistory({
      partnershipId: partnership.id,
      fromStatus: "green",
      toStatus: "engaged",
      changedBy: ctx.user.id,
      reason: "婚約申請（独身証明書承認済み）",
    });

    // 両ユーザーのステータスをengagedに更新
    await Promise.all([
      updateUserPartnershipStatus(partnership.user1Id, "engaged"),
      updateUserPartnershipStatus(partnership.user2Id, "engaged"),
    ]);

    return { success: true, message: "おめでとうございます！婚約中ステータスになりました。" };
  }),

  // 独身証明書アップロード
  uploadSingleCertificate: protectedProcedure
    .input(z.object({ fileUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await updateSingleCertificate(ctx.user.id, input.fileUrl);
      return { success: true, message: "独身証明書をアップロードしました。管理者の審査をお待ちください。" };
    }),

  // カップル写真をS3にアップロード（スマホ証明書用）
  uploadCouplePhoto: protectedProcedure
    .input(
      z.object({
        // Base64エンコードされた画像データ（data:image/jpeg;base64,...形式）
        dataUrl: z.string().max(10 * 1024 * 1024), // 10MB以内
        partnershipId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // パートナーシップの当事者か確認
      const partnership = await getPartnershipById(input.partnershipId);
      if (!partnership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "パートナーシップが見つかりません" });
      }
      if (partnership.user1Id !== ctx.user.id && partnership.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "このパートナーシップの当事者ではありません" });
      }

      // data URLからBase64部分を抽出
      const matches = input.dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/);
      if (!matches) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "画像データの形式が不正です" });
      }
      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // ファイルサイズチェック（5MB以内）
      if (buffer.length > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "画像サイズは5MB以内にしてください" });
      }

      const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const fileKey = `couple-photos/${input.partnershipId}-${Date.now()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, contentType);

      // DBに保存
      await updateCouplePhotoUrl(input.partnershipId, url);

      return { success: true, couplePhotoUrl: url };
    }),

  // カップル写真を削除
  deleteCouplePhoto: protectedProcedure
    .input(z.object({ partnershipId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const partnership = await getPartnershipById(input.partnershipId);
      if (!partnership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "パートナーシップが見つかりません" });
      }
      if (partnership.user1Id !== ctx.user.id && partnership.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "このパートナーシップの当事者ではありません" });
      }
      await updateCouplePhotoUrl(input.partnershipId, null);
      return { success: true };
    }),

  // 証明書表示設定の更新（都道府県・名前の表示/非表示）
  updateCertSettings: protectedProcedure
    .input(
      z.object({
        prefecture: z.string().max(20).optional(),
        showPrefectureOnCert: z.boolean().optional(),
        showNameOnCert: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserCertSettings(ctx.user.id, input);
      return { success: true };
    }),

  // 管理者: 全パートナーシップ一覧
  adminList: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const [list, total, activeCount] = await Promise.all([
        getAllPartnerships(input.limit, input.offset),
        getPartnershipsCount(),
        getActivePartnershipsCount(),
      ]);
      return { partnerships: list, total, activeCount };
    }),
});
