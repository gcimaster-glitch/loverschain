/**
 * 節目チェックバッチ
 * 毎日 JST 09:00 に実行し、全アクティブパートナーシップを確認する。
 * 交際日数が節目（100日・200日・1年等）に達したペアに対して
 * パートナー双方へプッシュ通知を送信する。
 */
import { getAllActivePartnershipsWithStartedAt, insertNotificationLog } from "../db";
import { sendPushToUser } from "../push";
import { calcElapsedDays, getMilestoneInfo } from "../../shared/milestone";

export async function runMilestoneCheck(): Promise<{
  checked: number;
  notified: number;
}> {
  console.log("[MilestoneCheck] Starting milestone check...");

  const partnerships = await getAllActivePartnershipsWithStartedAt();
  let notified = 0;

  for (const p of partnerships) {
    if (!p.startedAt) continue;

    const elapsedDays = calcElapsedDays(new Date(p.startedAt));
    const milestone = getMilestoneInfo(elapsedDays);

    if (!milestone.isMilestone) continue;

    // 節目当日のみ通知（翌日以降は重複送信しない）
    // getMilestoneInfo は節目日から数日間 isMilestone=true を返すため、
    // elapsedDays が節目の境界値と完全一致する日のみ送信する
    const exactMilestones = [100, 200, 300, 365, 730, 1095, 1825, 3650];
    if (!exactMilestones.includes(elapsedDays)) continue;

    const title = `🎉 ${milestone.label}おめでとうございます！`;
    const body = `交際${elapsedDays.toLocaleString("ja-JP")}日目を迎えました。証明書を確認しましょう！`;
    const url = `/certificate/${p.id}`;

    // user1 と user2 の両方に送信し、結果をDBに記録する
    const results = await Promise.allSettled([
      sendPushToUser(p.user1Id, { title, body, url, tag: `milestone-${p.id}-${elapsedDays}` }),
      sendPushToUser(p.user2Id, { title, body, url, tag: `milestone-${p.id}-${elapsedDays}` }),
    ]);
    const userIds = [p.user1Id, p.user2Id];
    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      const userId = userIds[idx];
      await insertNotificationLog({
        partnershipId: p.id,
        userId,
        milestoneLabel: milestone.label,
        milestoneDays: elapsedDays,
        status: result.status === "fulfilled" ? "sent" : "failed",
        errorMessage: result.status === "rejected" ? String((result as PromiseRejectedResult).reason) : undefined,
      }).catch(() => {}); // ログ記録失敗は無視
    }

    notified++;
    console.log(
      `[MilestoneCheck] Notified partnership ${p.id} (${elapsedDays} days) → users ${p.user1Id}, ${p.user2Id}`
    );
  }

  console.log(
    `[MilestoneCheck] Done. checked=${partnerships.length}, notified=${notified}`
  );
  return { checked: partnerships.length, notified };
}

/**
 * 毎日 JST 09:00 に節目チェックを実行するスケジューラを起動する。
 * サーバー起動時に一度だけ呼び出す。
 */
export function startMilestoneCheckScheduler(): void {
  // 次の JST 09:00 までのミリ秒を計算する
  function msUntilNextJst9am(): number {
    const now = new Date();
    // JST = UTC+9
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);

    const next = new Date(jstNow);
    next.setUTCHours(0, 0, 0, 0); // JST 00:00 = UTC 前日15:00
    next.setUTCHours(0); // 翌日 JST 00:00 にリセット

    // JST 09:00 = UTC 00:00
    const jst9am = new Date(jstNow);
    jst9am.setUTCHours(0, 0, 0, 0);

    // 既に今日の JST 09:00 を過ぎていれば翌日に設定
    if (jstNow.getUTCHours() >= 0) {
      jst9am.setUTCDate(jst9am.getUTCDate() + 1);
    }

    return jst9am.getTime() - now.getTime() - jstOffset;
  }

  function scheduleNext() {
    const delay = msUntilNextJst9am();
    console.log(
      `[MilestoneCheck] Next check scheduled in ${Math.round(delay / 1000 / 60)} minutes`
    );
    setTimeout(async () => {
      try {
        await runMilestoneCheck();
      } catch (err) {
        console.error("[MilestoneCheck] Error during scheduled check:", err);
      }
      // 次の実行を予約（24時間後）
      setInterval(async () => {
        try {
          await runMilestoneCheck();
        } catch (err) {
          console.error("[MilestoneCheck] Error during scheduled check:", err);
        }
      }, 24 * 60 * 60 * 1000);
    }, Math.max(delay, 0));
  }

  scheduleNext();
}
