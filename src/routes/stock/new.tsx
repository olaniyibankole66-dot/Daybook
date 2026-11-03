import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useBook } from "@/lib/store";
import { ProductForm } from "@/components/product-form";
import { BackLink } from "@/components/ui";

export const Route = createFileRoute("/stock/new")({ component: NewProductPage });

function NewProductPage() {
  const addProduct = useBook((state) => state.addProduct);
  const navigate = useNavigate();
  return (
    <div>
      <BackLink to="/stock" label="Stock" />
      <h1 className="mb-4 font-serif text-3xl tracking-tight">Add a product</h1>
      <ProductForm
        submitLabel="Save product"
        onSubmit={(value) => {
          const result = addProduct(value);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Product added.");
          void navigate({ to: "/stock" });
        }}
      />
    </div>
  );
}
