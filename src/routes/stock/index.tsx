import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { roundMoney } from "@/lib/money";
import { useBook } from "@/lib/store";
import { Money } from "@/components/money";
import { Badge, buttonStyles, Card, EmptyState, PageTitle, ProductMark } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock/")({ component: StockPage });

function StockPage() {
  const products = useBook((state) => state.products);
  const threshold = useBook((state) => state.profile.lowStockAt);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b))),
    [products],
  );
  const visible = products
    .filter((product) => (category === "All" ? true : product.category === category))
    .filter((product) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) || product.category.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => {
      const aLow = a.quantity <= threshold;
      const bLow = b.quantity <= threshold;
      if (aLow !== bLow) return aLow ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div>
      <PageTitle
        title="Stock"
        subtitle={`Alert when quantity is ${threshold} or less.`}
        action={
          <Link to="/stock/new" className={buttonStyles({ size: "md" })}>
            <Plus className="size-4" aria-hidden />
            Add
          </Link>
        }
      />
      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          body="Add a product with its cost price and selling price. When you record a sale, the quantity goes down."
          action={
            <Link to="/stock/new" className={buttonStyles({ size: "lg" })}>
              Add a product
            </Link>
          }
        />
      ) : (
        <>
          <input
            className="min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none"
            placeholder="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium",
                  category === item ? "bg-primary text-on-primary" : "bg-surface text-ink shadow-card",
                )}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No products match.</p>
          ) : (
            <Card className="mt-3 divide-y divide-line px-4">
              {visible.map((product) => {
                const each = roundMoney(product.sellingPrice - product.costPrice);
                const low = product.quantity <= threshold;
                return (
                  <Link
                    key={product.id}
                    to="/stock/$productId"
                    params={{ productId: product.id }}
                    className="flex items-center gap-3 py-3"
                    data-testid="product-row"
                  >
                    <ProductMark name={product.name} image={product.image} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium" data-testid="product-name">
                        {product.name}
                      </span>
                      <span className="block text-sm text-muted">
                        {product.category} · <span data-testid="product-qty">{product.quantity}</span> in stock
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-serif tabular-nums">
                        <Money value={product.sellingPrice} />
                      </span>
                      {low ? (
                        <Badge tone={product.quantity === 0 ? "danger" : "warn"}>
                          {product.quantity === 0 ? "Out" : "Low"}
                        </Badge>
                      ) : (
                        <span className={each < 0 ? "text-xs text-danger" : "text-xs text-muted"}>
                          {each < 0 ? "Below cost" : <><Money value={each} /> each</>}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
