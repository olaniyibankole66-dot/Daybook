import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Package, Plus, TrendingUp, Users, Wallet } from "lucide-react";
import { lowStockProducts, saleOwing, summarize } from "@/lib/metrics";
import { useBook } from "@/lib/store";
import { Money, useMoneyFormat } from "@/components/money";
import { Badge, buttonStyles, Card, EmptyState, ProductMark } from "@/components/ui";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const profile = useBook((state) => state.profile);
  const products = useBook((state) => state.products);
  const customers = useBook((state) => state.customers);
  const sales = useBook((state) => state.sales);
  const expenses = useBook((state) => state.expenses);
  const loadSample = useBook((state) => state.loadSample);
  const formatMoney = useMoneyFormat();
  const today = summarize(sales, expenses, "today");
  const low = lowStockProducts(products, profile.lowStockAt);
  const recent = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const brandNew =
    products.length === 0 && sales.length === 0 && expenses.length === 0 && customers.length === 0;
  const profitTone = today.profit > 0 ? "profit" : today.profit < 0 ? "loss" : "plain";

  if (brandNew) {
    return (
      <div>
        <p className="text-sm font-medium text-primary">Daybook</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Your shop, in one place</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Record what you sell, what you spend, and what is left on the shelf. Estimated profit
          takes out product costs and expenses. It is not the same as sales.
        </p>
        <div className="mt-6">
          <EmptyState
            title="Start with a product"
            body="Add what you sell, with the price you paid and the price you charge. Or open the sample provision shop to see how the books work."
            action={
              <>
                <Link to="/stock/new" className={buttonStyles({ size: "lg", variant: "primary" }) + " w-full"}>
                  Add a product
                </Link>
                <button
                  type="button"
                  className={buttonStyles({ size: "lg", variant: "outline" }) + " w-full"}
                  onClick={() => loadSample()}
                >
                  Load the sample shop
                </button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-primary">Daybook</p>
      <p className="mt-2 text-sm text-muted">{format(new Date(), "EEEE, d MMM")}</p>
      <h1 className="font-serif text-3xl tracking-tight">{profile.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {profile.type}
        {profile.city ? ` · ${profile.city}` : ""}
      </p>

      <Link
        to="/sales/new"
        className={buttonStyles({ size: "lg", variant: "primary" }) + " mt-5 w-full"}
      >
        <Plus className="size-5" aria-hidden />
        Record a sale
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Today's sales" testId="today-sales">
          {formatMoney(today.revenue)}
        </Stat>
        <Stat label="Today's expenses" testId="today-expenses">
          {formatMoney(today.expenses)}
        </Stat>
        <article
          className={
            "col-span-2 rounded-xl p-4 shadow-card " +
            (profitTone === "profit" ? "bg-primary-soft" : profitTone === "loss" ? "bg-danger-soft" : "bg-surface")
          }
        >
          <p className={profitTone === "loss" ? "text-sm text-danger" : "text-sm text-primary"}>
            Estimated profit
          </p>
          <p className="mt-2 font-serif text-4xl leading-none tracking-tight tabular-nums" data-testid="today-profit">
            {formatMoney(today.profit)}
          </p>
          <p className="mt-3 text-sm text-muted">
            Sales minus product cost minus expenses. This is not the same as the money that came in.
          </p>
          <p className="mt-1 text-sm tabular-nums text-ink">
            {formatMoney(today.revenue)} − {formatMoney(today.productCost)} − {formatMoney(today.expenses)}
          </p>
        </article>
        <Stat label="Orders" testId="today-orders">
          {String(today.orders)}
        </Stat>
        <Stat label="Still owing today" testId="today-owing">
          {formatMoney(today.owing)}
        </Stat>
      </div>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">Low stock</h2>
          <Link to="/stock" className="text-sm font-medium text-primary">
            All stock
          </Link>
        </div>
        {low.length === 0 ? (
          <Card className="px-4 py-4 text-sm text-muted">
            {products.length === 0
              ? "Add products to watch stock."
              : `Nothing is at or below ${profile.lowStockAt}.`}
          </Card>
        ) : (
          <Card className="divide-y divide-line px-4">
            {low.map((product) => (
              <Link
                key={product.id}
                to="/stock/$productId"
                params={{ productId: product.id }}
                className="flex items-center gap-3 py-3"
              >
                <ProductMark name={product.name} image={product.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="block text-sm text-muted">{product.category}</span>
                </span>
                <Badge tone={product.quantity === 0 ? "danger" : "warn"}>
                  {product.quantity} left
                </Badge>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">Recent sales</h2>
          <Link to="/sales" className="text-sm font-medium text-primary">
            All sales
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="px-4 py-4 text-sm text-muted">
            No sales yet. When you sell something, it shows up here and stock goes down.
          </Card>
        ) : (
          <Card className="divide-y divide-line px-4">
            {recent.map((sale) => {
              const owing = saleOwing(sale);
              return (
                <Link
                  key={sale.id}
                  to="/sales/$saleId"
                  params={{ saleId: sale.id }}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {sale.customerName || "Walk-in"}
                    </span>
                    <span className="block text-sm text-muted">
                      {format(new Date(sale.createdAt), "d MMM, h:mm a")}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-serif text-lg tabular-nums">
                      <Money value={sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)} />
                    </span>
                    <span className="block text-xs text-muted">
                      {owing > 0 ? `Owes ${formatMoney(owing)}` : "Paid"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-2">
        <QuickLink to="/expenses/new" icon={Wallet} label="Add expense" />
        <QuickLink to="/stock/new" icon={Package} label="Add product" />
        <QuickLink to="/reports" icon={TrendingUp} label="View reports" />
        <QuickLink to="/customers" icon={Users} label="Customers" />
      </section>
    </div>
  );
}

function Stat({
  label,
  children,
  testId,
}: {
  label: string;
  children: string;
  testId: string;
}) {
  return (
    <article className="rounded-xl bg-surface p-3.5 shadow-card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl leading-tight tracking-tight tabular-nums" data-testid={testId}>
        {children}
      </p>
    </article>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/expenses/new" | "/stock/new" | "/reports" | "/customers";
  icon: typeof Wallet;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-14 items-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium shadow-card"
    >
      <Icon className="size-4 text-primary" aria-hidden />
      {label}
    </Link>
  );
}
