import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { customerOwing } from "@/lib/metrics";
import { useBook } from "@/lib/store";
import { Money } from "@/components/money";
import { buttonStyles, Card, EmptyState, PageTitle } from "@/components/ui";

export const Route = createFileRoute("/customers/")({ component: CustomersPage });

function CustomersPage() {
  const customers = useBook((state) => state.customers);
  const sales = useBook((state) => state.sales);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = customers
    .map((customer) => ({ customer, owing: customerOwing(sales, customer.id) }))
    .filter(({ customer }) => {
      if (!needle) return true;
      return (
        customer.name.toLowerCase().includes(needle) || customer.phone.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.owing - a.owing || a.customer.name.localeCompare(b.customer.name));
  const peopleOwing = rows.filter((row) => row.owing > 0).length;

  return (
    <div>
      <PageTitle
        title="Customers"
        subtitle={peopleOwing > 0 ? `${peopleOwing} still owing money.` : "Names, phones, and what they owe."}
        action={
          <Link to="/customers/new" className={buttonStyles({ size: "md" })}>
            <Plus className="size-4" aria-hidden />
            Add
          </Link>
        }
      />
      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          body="Save a customer when someone buys on credit, so you can see what they still owe."
          action={
            <Link to="/customers/new" className={buttonStyles({ size: "lg" })}>
              Add a customer
            </Link>
          }
        />
      ) : (
        <>
          <input
            className="min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none"
            placeholder="Search name or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No customers match.</p>
          ) : (
            <Card className="mt-3 divide-y divide-line px-4">
              {rows.map(({ customer, owing }) => (
                <Link
                  key={customer.id}
                  to="/customers/$customerId"
                  params={{ customerId: customer.id }}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{customer.name}</span>
                    <span className="block text-sm text-muted">{customer.phone || "No phone number"}</span>
                  </span>
                  <span className={owing > 0 ? "text-right text-sm font-medium text-warning" : "text-right text-sm text-muted"}>
                    {owing > 0 ? (
                      <>
                        Owes <Money value={owing} />
                      </>
                    ) : (
                      "Nothing owing"
                    )}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
