import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { parseAmount, roundMoney } from "@/lib/money";
import { useBook } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useMoneyFormat } from "@/components/money";
import {
  BackLink,
  Button,
  EmptyState,
  Field,
  IconButton,
  ProductMark,
  buttonStyles,
  inputClass,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sales/new")({ component: RecordSalePage });

type Line = { quantity: number; price: string };

export function RecordSalePage() {
  const products = useBook((state) => state.products);
  const customers = useBook((state) => state.customers);
  const recordSale = useBook((state) => state.recordSale);
  const navigate = useNavigate();
  const format = useMoneyFormat();

  const [lines, setLines] = useState<Record<string, Line>>({});
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [payMode, setPayMode] = useState<"paid" | "owing">("paid");
  const [received, setReceived] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const selected = (lines[product.id]?.quantity ?? 0) > 0;
        if (selected) return true;
        if (!needle) return true;
        return (
          product.name.toLowerCase().includes(needle) ||
          product.category.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const aq = lines[a.id]?.quantity ?? 0;
        const bq = lines[b.id]?.quantity ?? 0;
        if (aq > 0 !== bq > 0) return aq > 0 ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, query, lines]);

  const selected = products.filter((product) => (lines[product.id]?.quantity ?? 0) > 0);
  const parsed = selected.map((product) => ({
    product,
    quantity: lines[product.id]?.quantity ?? 0,
    unitPrice: parseAmount(lines[product.id]?.price ?? ""),
  }));
  const pricesOk = parsed.every((line) => line.unitPrice !== null);
  const total = roundMoney(
    parsed.reduce((sum, line) => sum + (line.unitPrice ?? 0) * line.quantity, 0),
  );
  const receivedValue = payMode === "paid" ? total : received.trim() === "" ? 0 : parseAmount(received);
  const owing =
    receivedValue === null ? null : roundMoney(Math.max(0, total - receivedValue));

  function bump(product: Product, delta: number) {
    setLines((current) => {
      const previous = current[product.id];
      const nextQty = Math.min(product.quantity, Math.max(0, (previous?.quantity ?? 0) + delta));
      if (nextQty === 0) {
        const rest = { ...current };
        delete rest[product.id];
        return rest;
      }
      return {
        ...current,
        [product.id]: {
          quantity: nextQty,
          price: previous?.price ?? String(product.sellingPrice),
        },
      };
    });
  }

  if (products.length === 0) {
    return (
      <div>
        <BackLink to="/sales" label="Sales" />
        <EmptyState
          title="Add a product first"
          body="You need something in stock before you can record a sale."
          action={
            <Link to="/stock/new" className={buttonStyles({ size: "lg" })}>
              Add a product
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <form
      className="page-dock-pad"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected.length === 0) {
          setError("Add at least one product.");
          return;
        }
        if (!pricesOk || parsed.some((line) => line.unitPrice === null)) {
          setError("Check the prices. Use numbers only.");
          return;
        }
        if (receivedValue === null) {
          setError("Enter how much you received, or 0 if nothing was paid.");
          return;
        }
        const result = recordSale({
          items: parsed.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice ?? 0,
          })),
          customerId: addingCustomer ? null : customerId || null,
          newCustomer: addingCustomer ? { name: newName, phone: newPhone } : null,
          amountPaid: receivedValue,
          note,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Sale recorded. Stock is updated.");
        void navigate({ to: "/" });
      }}
    >
      <BackLink to="/sales" label="Sales" />
      <h1 className="font-serif text-3xl tracking-tight">Record a sale</h1>
      <p className="mt-1 text-sm text-muted">Stock goes down when you save. The price here is for this sale only.</p>

      <label className="relative mt-4 block">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          className={cn(inputClass, "pl-9")}
          placeholder="Search products"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="mt-3 divide-y divide-line">
        {visible.map((product) => {
          const line = lines[product.id];
          const quantity = line?.quantity ?? 0;
          const unit = quantity > 0 ? parseAmount(line?.price ?? "") : null;
          const margin =
            unit !== null ? roundMoney(unit - product.costPrice) : null;
          return (
            <div key={product.id} className="py-3">
              <div className="flex items-center gap-3">
                <ProductMark name={product.name} image={product.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm text-muted">
                    {format(product.sellingPrice)} · {product.quantity} in stock
                  </p>
                </div>
                {quantity > 0 ? (
                  <div className="flex items-center">
                    <IconButton label={`Remove one ${product.name}`} onClick={() => bump(product, -1)}>
                      <Minus className="size-4" />
                    </IconButton>
                    <span className="w-8 text-center text-base tabular-nums">{quantity}</span>
                    <IconButton
                      label={`Add one ${product.name}`}
                      disabled={quantity >= product.quantity}
                      onClick={() => bump(product, 1)}
                    >
                      <Plus className="size-4" />
                    </IconButton>
                  </div>
                ) : (
                  <IconButton
                    label={`Add ${product.name}`}
                    disabled={product.quantity <= 0}
                    onClick={() => bump(product, 1)}
                  >
                    <Plus className="size-4" />
                  </IconButton>
                )}
              </div>
              {quantity > 0 ? (
                <div className="mt-3">
                  <label className="block text-sm">
                    <span className="text-muted">Price each</span>
                    <input
                      className={cn(inputClass, "mt-1")}
                      inputMode="decimal"
                      value={line?.price ?? ""}
                      onChange={(event) =>
                        setLines((current) => ({
                          ...current,
                          [product.id]: { quantity, price: event.target.value },
                        }))
                      }
                    />
                  </label>
                  {margin !== null ? (
                    <p className={margin < 0 ? "mt-1 text-sm text-danger" : "mt-1 text-sm text-primary"}>
                      {margin < 0
                        ? `${format(Math.abs(margin))} below cost`
                        : `Makes ${format(margin)} each, before expenses`}
                    </p>
                  ) : null}
                </div>
              ) : product.quantity <= 0 ? (
                <p className="mt-1 text-sm text-danger">Out of stock</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <section className="mt-6 space-y-4">
        <h2 className="font-serif text-xl">Customer</h2>
        <Field label="Who bought this?" hint="Walk-in is fine when they pay in full.">
          <select
            className={inputClass}
            value={addingCustomer ? "" : customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setAddingCustomer(false);
            }}
          >
            <option value="">Walk-in customer</option>
            {customers
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
          </select>
        </Field>
        <Button
          variant="outline"
          onClick={() => {
            setAddingCustomer((value) => !value);
            setCustomerId("");
          }}
        >
          {addingCustomer ? "Cancel new customer" : "Add someone new"}
        </Button>
        {addingCustomer ? (
          <div className="space-y-3">
            <Field label="Name">
              <input className={inputClass} value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Bola Adeyemi" />
            </Field>
            <Field label="Phone" hint="Optional. Example: 0803 441 2290">
              <input className={inputClass} type="tel" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} />
            </Field>
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl">Payment</h2>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment">
          {(
            [
              ["paid", "Paid in full"],
              ["owing", "Still owing"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={payMode === id}
              className={cn(
                "min-h-12 rounded-lg px-3 text-sm font-medium",
                payMode === id ? "bg-primary text-on-primary" : "bg-surface text-ink shadow-card",
              )}
              onClick={() => setPayMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {payMode === "owing" ? (
          <div className="mt-3">
            <Field label="Amount received now" hint="Enter 0 if they paid nothing yet.">
              <input
                className={inputClass}
                inputMode="decimal"
                value={received}
                onChange={(event) => setReceived(event.target.value)}
                placeholder="0"
              />
            </Field>
            {owing !== null && owing > 0 ? (
              <p className="mt-2 text-sm text-warning">
                They will still owe {format(owing)}.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">The full {format(total)} is marked as paid.</p>
        )}
        <div className="mt-3">
          <Field label="Note" hint="Optional.">
            <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Paid part now, rest on Friday" />
          </Field>
        </div>
      </section>

      <div className="dock">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 md:px-8">
          {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="font-serif text-2xl leading-none tabular-nums">{format(total)}</p>
            </div>
            <Button type="submit" size="lg" className="ml-auto">
              Save sale
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
