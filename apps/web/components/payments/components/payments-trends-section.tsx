import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartWrapper } from "@/components/ui";

import { formatMoney } from "../services/payments-service";

type Props = {
  isLoading: boolean;
  dailyTrend: Array<{ label: string; value: number }>;
  methodTrend: Array<{ method: string; value: number }>;
};

export function PaymentsTrendsSection({ isLoading, dailyTrend, methodTrend }: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartWrapper
        title="Daily Revenue Trend"
        description="Collected payments over the last 7 days"
        isLoading={isLoading}
        minHeightClassName="min-h-[300px]"
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0f766e" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper
        title="Revenue by Method"
        description="Cash vs Mobile Money collection"
        isLoading={isLoading}
        minHeightClassName="min-h-[300px]"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={methodTrend}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="method" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </section>
  );
}
