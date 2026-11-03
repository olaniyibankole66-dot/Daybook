import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { Period } from "@/lib/dates";
import { bestSellers, dailySeries, summarize } from "@/lib/metrics";
import { roundMoney } from "@/lib/money";
import { useBook } from "@/lib/store";
import { Money, useMoneyFormat } from "@/components/money";
import { Card, PageTitle, PeriodTabs } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const OPTIONS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "30days", label: "Last 30 days" },
];

function ReportsPage() {
  const sales = useBook((state) => state.sales);
  const expenses = useBook((state) => state.expenses);
  const [period, setPeriod] = useState<Period>("month");
  const format = useMoneyFormat();
  const summary = summarize(sales, expenses, period);
  const sellers = bestSellers(sales, period).slice(0, 5);
  const series = dailySeries(sales, expenses, period);
  const top = sellers[0]?.revenue ?? 0;
  const quiet = summary.orders === 0 && summary.expenses === 0;
  const lossDay = series.some((point) => point.profit < 0);

  return (
    <div>
      <PageTitle
        title="Reports"
        subtitle="Sales is money in. Estimated profit is what is left after product costs and expenses."
      />
      <PeriodTabs value={period} onChange={setPeriod} options={OPTIONS} />

      <Card
        className={cn(
          "mt-4 p-4",
          summary.profit > 0 && "bg-primary-soft",
          summary.profit < 0 && "bg-danger-soft",
        )}
      >
        <p className={summary.profit < 0 ? "text-sm text-danger" : "text-sm text-primary"}>
          Estimated profit
        </p>
        <p className="mt-2 font-serif text-4xl leading-none tracking-tight tabular-nums" data-testid="report-profit">
          {format(summary.profit)}
        </p>
        <p className="mt-3 text-sm text-ink">
          {format(summary.revenue)} sales − {format(summary.productCost)} product cost − {format(summary.expenses)} expenses
        </p>
      </Card>

      <Card className="mt-3 px-4">
        <Line label="Sales" hint="Money from what you sold, even if some is still owing." value={summary.revenue} />
        <Line label="Product cost" hint="What those sold items cost you." value={summary.productCost} />
        <Line label="Expenses" hint="Rent, fuel, transport, and other shop costs." value={summary.expenses} />
        <Line label="Collected" hint="Cash and transfers already received." value={summary.collected} />
        <Line label="Still owing" hint="Sales in this period that are not fully paid." value={summary.owing} />
      </Card>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Over time</h2>
        <p className="mt-1 text-sm text-muted">Each day: sales, and estimated profit after that day's costs.</p>
        {quiet ? (
          <p className="mt-4 text-sm text-muted">Nothing recorded in this period yet.</p>
        ) : (
          <Card className="mt-3 p-3">
            <div className="h-52 w-full min-w-0" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval={period === "week" ? 0 : 4}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-surface-2)" }}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      color: "var(--color-ink)",
                    }}
                    formatter={(value, name) => [
                      format(Number(value ?? 0)),
                      name === "profit" ? "Estimated profit" : "Sales",
                    ]}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="profit" name="profit" fill="var(--color-ink)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-primary" /> Sales
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-ink" /> Estimated profit
              </span>
            </div>
            {lossDay ? (
              <p className="mt-2 text-sm text-muted">A profit bar below the line is a loss that day.</p>
            ) : null}
          </Card>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Best selling</h2>
        <p className="mt-1 text-sm text-muted">Ranked by sales. "After cost" is before shop expenses.</p>
        {sellers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No products sold in this period.</p>
        ) : (
          <Card className="mt-3 divide-y divide-line px-4">
            {sellers.map((seller) => {
              const width = top > 0 ? Math.max(8, Math.round((seller.revenue / top) * 100)) : 0;
              const after = roundMoney(seller.revenue - seller.productCost);
              return (
                <div key={seller.productId} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">{seller.name}</p>
                    <p className="font-serif tabular-nums">
                      <Money value={seller.revenue} />
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {seller.quantity} sold · {format(after)} after cost
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-2">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}

function Line({ label, hint, value }: { label: string; hint: string; value: number }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <p className="font-serif text-lg tabular-nums">
        <Money value={value} />
      </p>
    </div>
  );
}
