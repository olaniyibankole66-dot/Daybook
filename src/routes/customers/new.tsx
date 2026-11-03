import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useBook } from "@/lib/store";
import { BackLink, Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers/new")({ component: NewCustomerPage });

function NewCustomerPage() {
  const addCustomer = useBook((state) => state.addCustomer);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = addCustomer({ name, phone, note });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Customer saved.");
        void navigate({ to: "/customers" });
      }}
    >
      <BackLink to="/customers" label="Customers" />
      <h1 className="font-serif text-3xl tracking-tight">Add a customer</h1>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Bola Adeyemi" />
      </Field>
      <Field label="Phone" hint="Optional. Example: 0803 441 2290">
        <input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </Field>
      <Field label="Note" hint="Optional. How they usually pay, or where they live.">
        <textarea className={cn(inputClass, "min-h-24 py-3")} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full">
        Save customer
      </Button>
    </form>
  );
}
