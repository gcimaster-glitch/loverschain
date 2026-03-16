/**
 * MilestoneBanner コンポーネント
 * 証明書ページで交際日数の節目に応じた特別なバナーを表示する。
 * shared/milestone.ts の getMilestoneInfo を使用して判定する。
 */
import { useEffect, useState } from "react";
import { getMilestoneInfo, calcElapsedDays } from "../../../shared/milestone";

interface MilestoneBannerProps {
  startedAt: Date;
}

export default function MilestoneBanner({ startedAt }: MilestoneBannerProps) {
  const [visible, setVisible] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ id: number; x: number; color: string; delay: number; duration: number }>
  >([]);

  const elapsedDays = calcElapsedDays(startedAt);
  const milestone = getMilestoneInfo(elapsedDays);

  useEffect(() => {
    if (!milestone.isMilestone) return;
    // マウント後に少し遅らせてアニメーション開始
    const t = setTimeout(() => setVisible(true), 100);
    // 紙吹雪を生成
    const pieces = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ["#ff6b9d", "#c44dff", "#4daaff", "#ffd700", "#7fff7f"][i % 5],
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setConfettiPieces(pieces);
    return () => clearTimeout(t);
  }, [milestone.isMilestone]);

  if (!milestone.isMilestone) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-6 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        background: `linear-gradient(135deg, ${milestone.bannerColors[0]}, ${milestone.bannerColors[1]})`,
        border: `1.5px solid ${milestone.bannerBorderColor}`,
        boxShadow: `0 0 24px ${milestone.bannerBorderColor}44`,
      }}
    >
      {/* 紙吹雪アニメーション */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              left: `${piece.x}%`,
              top: "-8px",
              backgroundColor: piece.color,
              opacity: 0.7,
              animation: `confettiFall ${piece.duration}s ease-in ${piece.delay}s both`,
            }}
          />
        ))}
      </div>

      {/* バナー本文 */}
      <div className="relative z-10 px-6 py-5 text-center">
        {/* 絵文字アイコン */}
        <div className="text-4xl mb-2">{milestone.emoji}</div>

        {/* 節目ラベル */}
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: milestone.bannerTextColor }}
        >
          {milestone.label}おめでとうございます！
        </h2>

        {/* 経過日数 */}
        <p
          className="text-lg font-semibold mb-2"
          style={{ color: milestone.bannerTextColor, opacity: 0.9 }}
        >
          交際{" "}
          <span className="text-2xl font-bold">
            {elapsedDays.toLocaleString("ja-JP")}
          </span>{" "}
          日目
        </p>

        {/* サブメッセージ */}
        {milestone.subMessage && (
          <p
            className="text-sm"
            style={{ color: milestone.bannerTextColor, opacity: 0.75 }}
          >
            {milestone.subMessage}
          </p>
        )}
      </div>

      {/* 光彩エフェクト（右上） */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${milestone.bannerBorderColor}33 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />
      {/* 光彩エフェクト（左下） */}
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${milestone.bannerBorderColor}22 0%, transparent 70%)`,
          transform: "translate(-30%, 30%)",
        }}
      />

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
