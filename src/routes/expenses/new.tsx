import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { dayKey } from "@/lib/dates";
import { parseAmount } from "@/lib/money";
import { useBook } from "@/lib/store";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { BackLink, Button, Field, inputClass } from "@/components/ui";

export const Route = createFileRoute("/expenses/new")({ component: NewExpensePage });

function NewExpensePage() {
  const addExpense = useBook((state) => state.addExpense);
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] ?? "Other");
  const [date, setDate] = useState(dayKey(new Date()));
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const value = parseAmount(amount);
        if (value === null) {
          setError("Enter an amount greater than zero.");
          return;
        }
        const result = addExpense({ amount: value, category, date, description });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Expense saved.");
        void navigate({ to: "/" });
      }}
    >
      <BackLink to="/expenses" label="Expenses" />
      <h1 className="font-serif text-3xl tracking-tight">Add an expense</h1>
      <p className="text-sm text-muted">
        This reduces estimated profit. Do not enter the cost of goods you sell — that is already on each product.
      </p>
      <Field label="Amount">
        <input className={inputClass} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
      </Field>
      <Field label="Category">
        <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date">
        <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </Field>
      <Field label="Description" hint="What was this for?">
        <input
          className={inputClass}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Fuel for the generator"
        />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full">
        Save expense
      </Button>
    </form>
  );
}
