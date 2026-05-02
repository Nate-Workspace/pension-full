type RoomDetailsEmptyStateProps = {
  isLoading: boolean;
  isNotFound: boolean;
};

export function RoomDetailsEmptyState({ isLoading, isNotFound }: RoomDetailsEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-900">
        {isLoading ? "Loading room details..." : "Room not found"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {isLoading
          ? "Fetching the latest room data."
          : isNotFound
            ? "The selected room no longer exists."
            : "Unable to load this room right now."}
      </p>
    </div>
  );
}
