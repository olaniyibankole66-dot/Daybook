import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Settings, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { currencyByCode } from "@/lib/money";
import { useBook } from "@/lib/store";
import { Card, ConfirmButton } from "@/components/ui";

export const Route = createFileRoute("/more")({ component: MorePage });

function MorePage() {
  const profile = useBook((state) => state.profile);
  const loadSample = useBook((state) => state.loadSample);
  const startFresh = useBook((state) => state.startFresh);
  const navigate = useNavigate();
  const currency = currencyByCode(profile.currency);

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">More</h1>
      <p className="mt-1 text-sm text-muted">Reports, expenses, and your business details.</p>

      <Link to="/settings" className="mt-5 block rounded-xl bg-surface p-4 shadow-card">
        <p className="text-sm text-muted">Business</p>
        <p className="font-serif text-2xl tracking-tight">{profile.name}</p>
        <p className="mt-1 text-sm text-muted">
          {profile.type}
          {profile.city ? ` · ${profile.city}` : ""} · {currency.name}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">Edit profile</p>
      </Link>

      <nav className="mt-4 overflow-hidden rounded-xl bg-surface shadow-card" aria-label="More sections">
        <MoreRow to="/reports" icon={TrendingUp} title="Reports" body="Sales, costs, and profit over time" />
        <MoreRow to="/expenses" icon={Wallet} title="Expenses" body="Rent, fuel, transport, and other costs" />
        <MoreRow to="/settings" icon={Settings} title="Settings" body="Name, currency, and low-stock alerts" />
      </nav>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Your records</h2>
        <p className="mt-1 text-sm text-muted">
          Records stay in this browser on this phone. Clearing the browser removes them.
        </p>
        <div className="mt-4 space-y-2">
          <ConfirmButton
            variant="outline"
            label="Load sample shop"
            confirmLabel="Replace my records with the sample"
            onConfirm={() => {
              loadSample();
              toast.success("Sample shop loaded.");
              void navigate({ to: "/" });
            }}
          />
          <ConfirmButton
            label="Start fresh"
            confirmLabel="Erase products, sales, and expenses"
            onConfirm={() => {
              startFresh();
              toast.success("Records cleared.");
              void navigate({ to: "/" });
            }}
          />
        </div>
      </section>

      <Card className="mt-8 p-4">
        <h2 className="font-serif text-xl">How profit is counted</h2>
        <p className="mt-2 text-sm text-muted">
          Estimated profit = sales − product cost − expenses.
        </p>
        <p className="mt-2 text-sm text-muted">
          Sales is the money from what you sold, including what a customer still owes. Product cost is what those items cost you. Expenses are the other costs of running the shop, such as rent and fuel.
        </p>
      </Card>
    </div>
  );
}

function MoreRow({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/reports" | "/expenses" | "/settings";
  icon: typeof Settings;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted">{body}</span>
      </span>
      <ChevronRight className="size-4 text-faint" aria-hidden />
    </Link>
  );
}
