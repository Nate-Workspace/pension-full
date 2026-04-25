type RoomDetailsHeaderProps = {
  roomName: string;
  isAdmin: boolean;
  onEditRoom: () => void;
};

export function RoomDetailsHeader({ roomName, isAdmin, onEditRoom }: RoomDetailsHeaderProps) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{roomName} Details</h1>
        <p className="mt-1 text-sm text-slate-500">Room profile, reservation history, and performance analytics.</p>
      </div>
      {isAdmin ? (
        <button
          type="button"
          onClick={onEditRoom}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Edit Room
        </button>
      ) : null}
    </section>
  );
}
