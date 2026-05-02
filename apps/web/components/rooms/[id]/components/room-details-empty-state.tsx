type RoomDetailsEmptyStateProps = {
  isLoading: boolean;
  isNotFound: boolean;
};

export function RoomDetailsEmptyState({
  isLoading,
  isNotFound,
}: RoomDetailsEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-900">
        {isLoading ? (
          <div className="space-y-6">
            <section className="flex items-start justify-between gap-3">
              <div>
                <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-10 w-28 animate-pulse rounded bg-slate-200" />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={`room-detail-metric-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div
                      key={`room-info-skeleton-${index}`}
                      className={`rounded-lg border border-slate-200 p-3 ${index === 6 ? "sm:col-span-2" : ""}`}
                    >
                      <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="flex gap-2">
                    <div className="h-8 w-14 animate-pulse rounded bg-slate-100" />
                    <div className="h-8 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-8 w-14 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div
                      key={`calendar-header-${index}`}
                      className="h-7 animate-pulse rounded-md bg-slate-100"
                    />
                  ))}
                  {Array.from({ length: 35 }, (_, index) => (
                    <div
                      key={`calendar-cell-${index}`}
                      className="min-h-20 rounded-md border border-slate-100 bg-slate-50 p-1.5"
                    >
                      <div className="h-3 w-4 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 space-y-1">
                        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-slate-100" />
                <div className="h-10 w-[10.5rem] animate-pulse rounded-md bg-slate-100" />
              </div>

              <div className="mb-3">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-160 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {Array.from({ length: 5 }, (_, index) => (
                          <th
                            key={`room-booking-head-${index}`}
                            className="px-4 py-3"
                          >
                            <div
                              className={`h-3 animate-pulse rounded bg-slate-100 ${
                                index === 0
                                  ? "w-24"
                                  : index === 1
                                    ? "w-16"
                                    : index === 2
                                      ? "w-12"
                                      : index === 3
                                        ? "w-20"
                                        : "w-12"
                              }`}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }, (_, rowIndex) => (
                        <tr
                          key={`room-booking-row-${rowIndex}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          {Array.from({ length: 5 }, (_, cellIndex) => (
                            <td
                              key={`room-booking-row-${rowIndex}-cell-${cellIndex}`}
                              className={`px-4 py-3 ${cellIndex >= 3 ? "text-right" : ""}`}
                            >
                              <div
                                className={`h-4 animate-pulse rounded bg-slate-100 ${
                                  cellIndex === 0
                                    ? "w-36"
                                    : cellIndex === 1
                                      ? "w-28"
                                      : cellIndex === 2
                                        ? "w-20"
                                        : "ml-auto w-16"
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200 p-4">
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
                      <div className="h-9 w-[6.5rem] animate-pulse rounded-md bg-slate-100" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <div className="h-9 w-16 rounded-md bg-slate-100" />
                      <div className="h-9 w-9 rounded-md bg-slate-100" />
                      <div className="h-9 w-9 rounded-md bg-slate-100" />
                      <div className="h-9 w-9 rounded-md bg-slate-100" />
                      <div className="h-9 w-16 rounded-md bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : isNotFound
            ? "The selected room no longer exists."
            : "Unable to load this room right now."}
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
