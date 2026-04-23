import { DataTable } from "@/components/ui";

import {
  formatMoney,
  methodLabel,
  paymentStatusLabel,
  paymentStatusStyle,
  toDayLabel,
  type MethodFilter,
  type PaymentsResponseRow,
} from "../services/payments-service";

type Props = {
  query: string;
  methodFilter: MethodFilter;
  page: number;
  pageSize: number;
  totalPages: number;
  paymentRows: PaymentsResponseRow[];
  isLoading: boolean;
  updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
};

export function PaymentsTableSection({
  query,
  methodFilter,
  page,
  pageSize,
  totalPages,
  paymentRows,
  isLoading,
  updateUrlState,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => updateUrlState({ search: event.target.value, page: 1 })}
          placeholder="Search by reference, booking, guest or room"
          className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
        />

        <select
          value={methodFilter}
          onChange={(event) => updateUrlState({ method: event.target.value, page: 1 })}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
      </div>

      <DataTable<(typeof paymentRows)[number]>
        columns={[
          {
            key: "reference",
            header: "Reference",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.reference}</p>
                <p className="text-xs text-slate-500">{row.bookingCode}</p>
              </div>
            ),
          },
          {
            key: "guest",
            header: "Guest",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.guestName}</p>
                {row.guestPhone ? <p className="text-xs text-slate-500">{row.guestPhone}</p> : null}
              </div>
            ),
          },
          {
            key: "room",
            header: "Room",
            align: "center",
            render: (row) => `Room ${row.roomNumber}`,
          },
          {
            key: "method",
            header: "Method",
            render: (row) => methodLabel(row.method),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(row.status)}`}
              >
                {paymentStatusLabel(row.status)}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Paid",
            align: "right",
            render: (row) => formatMoney(row.amount),
          },
          {
            key: "outstanding",
            header: "Outstanding",
            align: "right",
            render: (row) => formatMoney(row.outstanding),
          },
          {
            key: "date",
            header: "Paid At",
            align: "right",
            render: (row) => (row.paidAt ? toDayLabel(row.paidAt.slice(0, 10)) : "Pending"),
          },
        ]}
        data={paymentRows}
        getRowKey={(row) => row.id}
        getRowClassName={(row) => (row.status === "unpaid" ? "bg-rose-50/60" : "")}
        isLoading={isLoading}
        emptyTitle="No payment records"
        emptyDescription="Try changing your search query or method filter."
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
        onPageSizeChange={(nextPageSize) => updateUrlState({ pageSize: nextPageSize, page: 1 })}
      />
    </section>
  );
}
