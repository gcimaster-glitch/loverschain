/**
 * MilestoneCountdown
 * 次の節目まであと何日かをカウントダウン表示するカードコンポーネント。
 * プログレスバーで現在の節目区間の進捗を可視化する。
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { calcElapsedDays, getNextMilestone, getMilestoneInfo } from "@shared/milestone";

interface Props {
  startedAt: Date | string | number;
  partnershipId: number;
}

export function MilestoneCountdown({ startedAt, partnershipId }: Props) {
  const elapsedDays = useMemo(() => {
    return calcElapsedDays(new Date(startedAt));
  }, [startedAt]);

  const next = useMemo(() => getNextMilestone(elapsedDays), [elapsedDays]);
  const current = useMemo(() => getMilestoneInfo(elapsedDays), [elapsedDays]);

  // 10年以上の場合は特別メッセージを表示
  if (!next) {
    return (
      <div
        className="rounded-2xl border p-4"
        style={{
          background: `linear-gradient(135deg, oklch(0.25 0.08 60), oklch(0.18 0.06 50))`,
          borderColor: "oklch(0.75 0.18 80)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.90 0.18 80)" }}>
              全ての節目を達成！
            </p>
            <p className="text-xs opacity-70" style={{ color: "oklch(0.90 0.18 80)" }}>
              10年以上の愛の歩みに、心より敬意を。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(next.progress * 100);

  return (
    <Link href={`/certificate/${partnershipId}`}>
      <div
        className="group cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${next.bannerColors[0]}, ${next.bannerColors[1]})`,
          borderColor: next.bannerBorderColor,
        }}
      >
        {/* ヘッダー行 */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{next.emoji}</span>
            <div>
              <p
                className="text-xs font-medium opacity-70"
                style={{ color: next.bannerTextColor }}
              >
                次の節目
              </p>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: next.bannerTextColor }}
              >
                {next.label}
              </p>
            </div>
          </div>
          {/* カウントダウン数字 */}
          <div className="text-right">
            <span
              className="text-2xl font-black tabular-nums leading-none"
              style={{ color: next.bannerTextColor }}
            >
              {next.daysLeft.toLocaleString("ja-JP")}
            </span>
            <p
              className="text-xs opacity-70"
              style={{ color: next.bannerTextColor }}
            >
              日後
            </p>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: `${next.bannerBorderColor}40` }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${next.bannerBorderColor}, ${next.bannerTextColor})`,
              }}
            />
          </div>
          <div
            className="mt-1 flex justify-between text-[10px] opacity-60"
            style={{ color: next.bannerTextColor }}
          >
            <span>{next.fromDays > 0 ? `${next.fromDays}日目〜` : "交際開始〜"}</span>
            <span>{progressPercent}%</span>
            <span>{next.targetDays.toLocaleString("ja-JP")}日目</span>
          </div>
        </div>

        {/* 現在の経過日数 */}
        <div
          className="flex items-center justify-between text-xs opacity-60"
          style={{ color: next.bannerTextColor }}
        >
          <span>現在 {elapsedDays.toLocaleString("ja-JP")} 日目</span>
          {current.isMilestone && (
            <span className="rounded-full border px-2 py-0.5 text-[10px]"
              style={{ borderColor: next.bannerBorderColor }}>
              {current.emoji} {current.label}達成済み
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
