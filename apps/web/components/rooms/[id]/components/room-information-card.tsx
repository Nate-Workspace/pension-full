import type { Booking, Room } from "@/data";
import { StatusBadge } from "@/components/ui";
import { formatMoney, roomTypeLabel } from "../utils";

type RoomInformationCardProps = {
  room: Room;
  activeBooking: Booking | null;
};

export function RoomInformationCard({ room, activeBooking }: RoomInformationCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Room Information</h2>
        <StatusBadge status={room.status} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room Name</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{room.name}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room Number</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{room.number}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{roomTypeLabel(room.type)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Floor</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{room.floor}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{room.capacity} guest(s)</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price / Night</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{formatMoney(room.pricePerNight)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Guest</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {activeBooking ? activeBooking.guest.name : "No active booking"}
          </dd>
        </div>
        {room.assignedTo ? (
          <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned To</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{room.assignedTo}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
