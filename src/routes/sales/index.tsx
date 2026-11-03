import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { dayKey, type Period } from "@/lib/dates";
import { isPaid, saleOwing, saleTotal, summarize } from "@/lib/metrics";
import { useBook } from "@/lib/store";
import type { Sale } from "@/lib/types";
import { Money, useMoneyFormat } from "@/components/money";
import { Badge, buttonStyles, Card, EmptyState, PageTitle, PeriodTabs } from "@/components/ui";

export const Route = createFileRoute("/sales/")({ component: SalesPage });

const OPTIONS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export function SalesPage() {
  const sales = useBook((state) => state.sales);
  const expenses = useBook((state) => state.expenses);
  const [period, setPeriod] = useState<Period>("today");
  const [query, setQuery] = useState("");
  const formatMoney = useMoneyFormat();
  const summary = summarize(sales, expenses, period);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sales
      .filter((sale) => {
        const when = new Date(sale.createdAt);
        const { start, end } = bounds(period);
        if (when < start || when > end) return false;
        if (!needle) return true;
        const haystack = [
          sale.customerName ?? "walk-in",
          ...sale.items.map((item) => item.name),
          sale.note,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sales, period, query]);

  const groups = groupSales(visible);

  return (
    <div>
      <PageTitle
        title="Sales"
        subtitle="Money from what you sold. Profit is on Home and Reports."
        action={
          <Link to="/sales/new" className={buttonStyles({ variant: "primary", size: "md" })}>
            <Plus className="size-4" aria-hidden />
            Record
          </Link>
        }
      />
      <PeriodTabs value={period} onChange={setPeriod} options={OPTIONS} />
      <Card className="mt-3 grid grid-cols-3 gap-2 px-3 py-3">
        <SummaryBit label="Sales" value={formatMoney(summary.revenue)} />
        <SummaryBit label="Collected" value={formatMoney(summary.collected)} />
        <SummaryBit label="Owing" value={formatMoney(summary.owing)} />
      </Card>
      <label className="mt-3 block">
        <span className="sr-only">Search sales</span>
        <input
          className="min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none"
          placeholder="Search customer or product"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {sales.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No sales yet"
            body="Record a sale when a customer buys. Stock goes down, and profit is counted from the product cost."
            action={
              <Link to="/sales/new" className={buttonStyles({ size: "lg" })}>
                Record a sale
              </Link>
            }
          />
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No sales match this view.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-sm font-medium text-muted">{group.label}</h2>
              <Card className="divide-y divide-line px-4">
                {group.items.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function bounds(period: Period) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "30days") {
    start.setDate(start.getDate() - 29);
  }
  return { start, end };
}

function groupSales(sales: Sale[]) {
  const groups: { key: string; label: string; items: Sale[] }[] = [];
  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    const key = dayKey(date);
    const label = format(date, "EEEE, d MMM");
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(sale);
    else groups.push({ key, label, items: [sale] });
  }
  return groups;
}

function SummaryBit({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-sm leading-tight tabular-nums break-words">{value}</p>
    </div>
  );
}

function SaleRow({ sale }: { sale: Sale }) {
  const owing = saleOwing(sale);
  const names = sale.items.map((item) => item.name);
  const preview = names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  return (
    <Link to="/sales/$saleId" params={{ saleId: sale.id }} className="block py-3">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-medium">{sale.customerName || "Walk-in"}</span>
          <span className="mt-0.5 block truncate text-sm text-muted">{preview}</span>
        </span>
        <span className="text-right">
          <span className="block font-serif text-lg tabular-nums">
            <Money value={saleTotal(sale)} />
          </span>
          <span className="mt-1 block">
            {isPaid(sale) ? <Badge tone="ok">Paid</Badge> : <Badge tone="warn">Owes</Badge>}
          </span>
        </span>
      </span>
      {owing > 0 ? (
        <span className="mt-1 block text-sm text-warning">
          Still owing <Money value={owing} />
        </span>
      ) : (
        <span className="mt-1 block text-sm text-muted">{format(new Date(sale.createdAt), "h:mm a")}</span>
      )}
    </Link>
  );
}
