import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";
import { useBook } from "@/lib/store";
import { BUSINESS_TYPES } from "@/lib/types";
import { BackLink, Button, Field, inputClass } from "@/components/ui";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const profile = useBook((state) => state.profile);
  const updateProfile = useBook((state) => state.updateProfile);
  const [name, setName] = useState(profile.name);
  const [type, setType] = useState(profile.type);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [lowStockAt, setLowStockAt] = useState(String(profile.lowStockAt));
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          setError("Enter your business name.");
          return;
        }
        const threshold = Number(lowStockAt);
        if (!Number.isInteger(threshold) || threshold < 0 || threshold > 999) {
          setError("Low-stock alert must be a whole number from 0 to 999.");
          return;
        }
        updateProfile({
          name: name.trim(),
          type: type.trim() || "Retail",
          phone: phone.trim(),
          city: city.trim(),
          currency,
          lowStockAt: threshold,
        });
        setError(null);
        toast.success("Business details saved.");
      }}
    >
      <BackLink to="/more" label="More" />
      <h1 className="font-serif text-3xl tracking-tight">Business profile</h1>
      <p className="text-sm text-muted">
        Naira is the default. Changing currency only changes the symbol. Old amounts are not converted.
      </p>
      <Field label="Business name">
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Business type">
        <input className={inputClass} list="business-types" value={type} onChange={(event) => setType(event.target.value)} />
        <datalist id="business-types">
          {BUSINESS_TYPES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </Field>
      <Field label="City">
        <input className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Surulere, Lagos" />
      </Field>
      <Field label="Phone">
        <input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0803 441 2290" />
      </Field>
      <Field label="Currency">
        <select
          className={inputClass}
          value={currency}
          onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        >
          {CURRENCIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} ({item.symbol.trim()})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Low-stock alert" hint="You will be warned when a product has this many left, or fewer.">
        <input
          className={inputClass}
          inputMode="numeric"
          value={lowStockAt}
          onChange={(event) => setLowStockAt(event.target.value)}
        />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full">
        Save details
      </Button>
    </form>
  );
}
