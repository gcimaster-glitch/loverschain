import { Badge } from "@/components/ui/badge";

type PartnershipStatus = "green" | "yellow" | "blue" | "gray" | "white" | "pending";

const STATUS_CONFIG: Record<PartnershipStatus, { label: string; className: string; emoji: string }> = {
  green: { label: "交際中", className: "bg-green-100 text-green-800 border-green-200", emoji: "💚" },
  yellow: { label: "問題発生", className: "bg-yellow-100 text-yellow-800 border-yellow-200", emoji: "💛" },
  blue: { label: "解消手続き中", className: "bg-blue-100 text-blue-800 border-blue-200", emoji: "💙" },
  gray: { label: "更新待ち", className: "bg-gray-100 text-gray-700 border-gray-200", emoji: "🩶" },
  white: { label: "解消済み", className: "bg-white text-gray-500 border-gray-200", emoji: "🤍" },
  pending: { label: "招待中", className: "bg-purple-100 text-purple-800 border-purple-200", emoji: "💜" },
};

export function PartnershipStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as PartnershipStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
    emoji: "❓",
  };
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.emoji} {config.label}
    </Badge>
  );
}

export default PartnershipStatusBadge;
