import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { type ReactNode } from "react";
import { toast } from "sonner";
import { isPaid, saleCost, saleOwing, saleTotal } from "@/lib/metrics";
import { useBook } from "@/lib/store";
import { Money } from "@/components/money";
import { BackLink, Badge, Card, ConfirmButton, EmptyState } from "@/components/ui";

export const Route = createFileRoute("/sales/$saleId")({ component: SaleDetailPage });

function SaleDetailPage() {
  const { saleId } = Route.useParams();
  const sale = useBook((state) => state.sales.find((item) => item.id === saleId));
  const deleteSale = useBook((state) => state.deleteSale);
  const navigate = useNavigate();

  if (!sale) {
    return (
      <div>
        <BackLink to="/sales" label="Sales" />
        <EmptyState title="Sale not found" body="It may have been deleted." />
      </div>
    );
  }

  const owing = saleOwing(sale);

  return (
    <div>
      <BackLink to="/sales" label="Sales" />
      <p className="text-sm text-muted">{format(new Date(sale.createdAt), "EEEE, d MMM, h:mm a")}</p>
      <h1 className="mt-1 font-serif text-3xl tracking-tight">
        <Money value={saleTotal(sale)} />
      </h1>
      <div className="mt-2">
        {isPaid(sale) ? <Badge tone="ok">Paid in full</Badge> : <Badge tone="warn">Still owing</Badge>}
      </div>

      <Card className="mt-5 px-4">
        {sale.items.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted">
                {item.quantity} × <Money value={item.unitPrice} />
              </p>
            </div>
            <p className="font-serif text-lg tabular-nums">
              <Money value={item.unitPrice * item.quantity} />
            </p>
          </div>
        ))}
      </Card>

      <Card className="mt-3 px-4 py-3 text-sm">
        <Row label="Product cost" value={<Money value={saleCost(sale)} />} />
        <Row label="Collected" value={<Money value={sale.amountPaid} />} />
        <Row label="Still owing" value={<Money value={owing} />} />
      </Card>

      <Card className="mt-3 px-4 py-4">
        <p className="text-sm text-muted">Customer</p>
        {sale.customerId ? (
          <Link to="/customers/$customerId" params={{ customerId: sale.customerId }} className="mt-1 block font-medium text-primary">
            {sale.customerName}
          </Link>
        ) : (
          <p className="mt-1 font-medium">{sale.customerName || "Walk-in"}</p>
        )}
        {sale.note ? <p className="mt-3 text-sm text-muted">{sale.note}</p> : null}
      </Card>

      <div className="mt-6">
        <ConfirmButton
          label="Delete sale"
          confirmLabel="Delete and put stock back"
          onConfirm={() => {
            deleteSale(sale.id);
            toast.success("Sale deleted. Items are back in stock.");
            void navigate({ to: "/sales" });
          }}
        />
        <p className="mt-2 text-sm text-muted">Deleting puts the quantities back on the shelf.</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
