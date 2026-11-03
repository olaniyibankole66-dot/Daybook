import { useState } from "react";
import { compressImage } from "@/lib/image";
import { parseAmount, parseQty, roundMoney } from "@/lib/money";
import { useBook } from "@/lib/store";
import { PRODUCT_CATEGORIES, type ProductInput } from "@/lib/types";
import { Button, Field, inputClass, ProductMark } from "@/components/ui";
import { useMoneyFormat } from "@/components/money";

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProductInput;
  submitLabel: string;
  onSubmit: (value: ProductInput) => void;
}) {
  const products = useBook((state) => state.products);
  const format = useMoneyFormat();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [cost, setCost] = useState(initial ? String(initial.costPrice) : "");
  const [price, setPrice] = useState(initial ? String(initial.sellingPrice) : "");
  const [qty, setQty] = useState(initial ? String(initial.quantity) : "");
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = [...new Set([...PRODUCT_CATEGORIES, ...products.map((product) => product.category)])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const costValue = parseAmount(cost);
  const priceValue = parseAmount(price);
  const each =
    costValue !== null && priceValue !== null ? roundMoney(priceValue - costValue) : null;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const costPrice = parseAmount(cost);
        const sellingPrice = parseAmount(price);
        const quantity = parseQty(qty);
        if (!name.trim()) {
          setError("Enter a product name.");
          return;
        }
        if (!category.trim()) {
          setError("Enter a category.");
          return;
        }
        if (costPrice === null || sellingPrice === null) {
          setError("Enter the cost price and selling price. Use numbers only.");
          return;
        }
        if (quantity === null) {
          setError("Enter how many you have in stock.");
          return;
        }
        setError(null);
        onSubmit({
          name: name.trim(),
          category: category.trim(),
          costPrice,
          sellingPrice,
          quantity,
          image,
        });
      }}
    >
      <div className="flex items-center gap-3">
        <ProductMark name={name || "Product"} image={image} />
        <div className="min-w-0 flex-1">
          <Field label="Photo" hint="Optional. A clear photo of the pack helps at the till.">
            <input
              className="block w-full text-sm text-muted file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:text-sm file:font-medium file:text-ink"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                void compressImage(file)
                  .then((next) => {
                    setImage(next);
                    setError(null);
                  })
                  .catch((reason: unknown) => {
                    setError(reason instanceof Error ? reason.message : "Could not use that photo.");
                  })
                  .finally(() => setBusy(false));
              }}
            />
          </Field>
        </div>
      </div>
      {image ? (
        <Button variant="ghost" className="px-0" onClick={() => setImage(null)}>
          Remove photo
        </Button>
      ) : null}

      <Field label="Product name">
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Peak Milk 400g" />
      </Field>
      <Field label="Category">
        <input
          className={inputClass}
          list="product-categories"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Drinks"
        />
        <datalist id="product-categories">
          {categories.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost price" hint="What you paid.">
          <input
            className={inputClass}
            inputMode="decimal"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Selling price" hint="What the customer pays.">
          <input
            className={inputClass}
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      {each !== null ? (
        <p className={each < 0 ? "text-sm text-danger" : "text-sm text-primary"}>
          {each < 0
            ? `This selling price is ${format(Math.abs(each))} below cost.`
            : `You make ${format(each)} on each one, before shop expenses.`}
        </p>
      ) : null}
      <Field label="Quantity in stock" hint="Change this when you buy more or count the shelf.">
        <input
          className={inputClass}
          inputMode="numeric"
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          placeholder="0"
        />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Reading photo…" : submitLabel}
      </Button>
    </form>
  );
}
