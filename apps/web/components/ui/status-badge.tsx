import { ROOM_STATUS_LABELS, type RoomStatus } from "@/lib/types/status";

type StatusBadgeProps = {
  status: RoomStatus;
  label?: string;
};

const STATUS_STYLES: Record<RoomStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  occupied: "border-rose-200 bg-rose-50 text-rose-700",
  cleaning: "border-amber-200 bg-amber-50 text-amber-700",
  maintenance: "border-slate-300 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {label ?? ROOM_STATUS_LABELS[status]}
    </span>
  );
}

export type { StatusBadgeProps };
