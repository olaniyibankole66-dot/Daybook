import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { customerOwing, saleOwing, saleTotal } from "@/lib/metrics";
import { parseAmount } from "@/lib/money";
import { useBook } from "@/lib/store";
import { telHref, cn } from "@/lib/utils";
import { Money } from "@/components/money";
import { BackLink, Badge, Button, Card, EmptyState, Field, inputClass } from "@/components/ui";

export const Route = createFileRoute("/customers/$customerId")({ component: CustomerPage });

function CustomerPage() {
  const { customerId } = Route.useParams();
  const customer = useBook((state) => state.customers.find((item) => item.id === customerId));
  const allSales = useBook((state) => state.sales);
  const updateCustomer = useBook((state) => state.updateCustomer);
  const deleteCustomer = useBook((state) => state.deleteCustomer);
  const recordPayment = useBook((state) => state.recordPayment);
  const navigate = useNavigate();
  const sales = allSales.filter((sale) => sale.customerId === customerId);
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [note, setNote] = useState(customer?.note ?? "");
  const [payment, setPayment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setPhone(customer.phone);
    setNote(customer.note);
  }, [customer]);

  if (!customer) {
    return (
      <div>
        <BackLink to="/customers" label="Customers" />
        <EmptyState title="Customer not found" body="They may have been removed." />
      </div>
    );
  }

  const owing = customerOwing(
    sales,
    customer.id,
  );
  const href = telHref(customer.phone);
  const purchases = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <div>
        <BackLink to="/customers" label="Customers" />
        <h1 className="font-serif text-3xl tracking-tight">{customer.name}</h1>
        <p className={owing > 0 ? "mt-2 text-warning" : "mt-2 text-sm text-muted"}>
          {owing > 0 ? (
            <>
              Still owes <Money value={owing} />
            </>
          ) : (
            "Nothing owing"
          )}
        </p>
        {href ? (
          <a href={href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
            <Phone className="size-4" aria-hidden />
            Call {customer.phone}
          </a>
        ) : null}
      </div>

      {owing > 0 ? (
        <Card className="space-y-3 p-4">
          <h2 className="font-serif text-xl">Record a payment</h2>
          <Field label="Amount received" hint="This is applied to the oldest unpaid sale first.">
            <input
              className={inputClass}
              inputMode="decimal"
              value={payment}
              onChange={(event) => setPayment(event.target.value)}
              placeholder="0"
            />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            className="w-full"
            onClick={() => {
              const amount = parseAmount(payment);
              if (amount === null || amount <= 0) {
                setError("Enter an amount greater than zero.");
                return;
              }
              const result = recordPayment(customer.id, amount);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setPayment("");
              setError(null);
              toast.success("Payment recorded.");
            }}
          >
            Save payment
          </Button>
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="mb-3 font-serif text-xl">Details</h2>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const result = updateCustomer(customer.id, { name, phone, note });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Customer updated.");
          }}
        >
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="Note">
            <textarea className={cn(inputClass, "min-h-24 py-3")} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit" variant="outline" className="w-full">
            Save details
          </Button>
        </form>
        {purchases.length === 0 ? (
          <div className="mt-4">
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                const result = deleteCustomer(customer.id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Customer removed.");
                void navigate({ to: "/customers" });
              }}
            >
              Delete customer
            </Button>
          </div>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-2 font-serif text-xl">Purchases</h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-muted">No sales for this customer yet.</p>
        ) : (
          <Card className="divide-y divide-line px-4">
            {purchases.map((sale) => {
              const due = saleOwing(sale);
              return (
                <Link key={sale.id} to="/sales/$saleId" params={{ saleId: sale.id }} className="block py-3">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm text-muted">
                        {format(new Date(sale.createdAt), "d MMM, h:mm a")}
                      </span>
                      <span className="mt-1 block">
                        {due > 0 ? <Badge tone="warn">Owes <Money value={due} /></Badge> : <Badge tone="ok">Paid</Badge>}
                      </span>
                    </span>
                    <span className="font-serif text-lg tabular-nums">
                      <Money value={saleTotal(sale)} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
