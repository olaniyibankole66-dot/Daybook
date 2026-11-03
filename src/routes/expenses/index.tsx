import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { parseDay } from "@/lib/dates";
import { useBook } from "@/lib/store";
import type { Expense } from "@/lib/types";
import { Money } from "@/components/money";
import { buttonStyles, Card, EmptyState, PageTitle } from "@/components/ui";

export const Route = createFileRoute("/expenses/")({ component: ExpensesPage });

function ExpensesPage() {
  const expenses = useBook((state) => state.expenses);
  const deleteExpense = useBook((state) => state.deleteExpense);
  const ordered = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const groups: { key: string; label: string; items: Expense[] }[] = [];
  for (const expense of ordered) {
    const label = format(parseDay(expense.date), "EEEE, d MMM");
    const last = groups[groups.length - 1];
    if (last?.key === expense.date) last.items.push(expense);
    else groups.push({ key: expense.date, label, items: [expense] });
  }

  return (
    <div>
      <PageTitle
        title="Expenses"
        subtitle="Rent, fuel, transport, and other costs of running the shop."
        action={
          <Link to="/expenses/new" className={buttonStyles({ size: "md" })}>
            <Plus className="size-4" aria-hidden />
            Add
          </Link>
        }
      />
      <p className="mb-4 text-sm text-muted">
        Do not record goods you buy to resell. That cost is counted when you sell them, so profit is not counted twice.
      </p>
      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          body="Add rent, generator fuel, transport, airtime, and other costs. Leave stock purchases out."
          action={
            <Link to="/expenses/new" className={buttonStyles({ size: "lg" })}>
              Add an expense
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-sm font-medium text-muted">{group.label}</h2>
              <Card className="divide-y divide-line px-4">
                {group.items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onDelete={() => {
                      deleteExpense(expense.id);
                      toast.success("Expense deleted.");
                    }}
                  />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({ expense, onDelete }: { expense: Expense; onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium">{expense.category}</p>
        <p className="text-sm text-muted">{expense.description}</p>
      </div>
      <div className="text-right">
        <p className="font-serif text-lg tabular-nums">
          <Money value={expense.amount} />
        </p>
        <button
          type="button"
          className="mt-1 min-h-11 text-sm font-medium text-danger"
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            onDelete();
          }}
        >
          {armed ? "Confirm" : "Delete"}
        </button>
      </div>
    </div>
  );
}
