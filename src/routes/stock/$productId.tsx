import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useBook } from "@/lib/store";
import { ProductForm } from "@/components/product-form";
import { BackLink, ConfirmButton, EmptyState } from "@/components/ui";

export const Route = createFileRoute("/stock/$productId")({ component: EditProductPage });

function EditProductPage() {
  const { productId } = Route.useParams();
  const product = useBook((state) => state.products.find((item) => item.id === productId));
  const updateProduct = useBook((state) => state.updateProduct);
  const deleteProduct = useBook((state) => state.deleteProduct);
  const navigate = useNavigate();

  if (!product) {
    return (
      <div>
        <BackLink to="/stock" label="Stock" />
        <EmptyState title="Product not found" body="It may have been removed from stock." />
      </div>
    );
  }

  return (
    <div>
      <BackLink to="/stock" label="Stock" />
      <h1 className="mb-1 font-serif text-3xl tracking-tight">Edit product</h1>
      <p className="mb-4 text-sm text-muted">
        Change the quantity when you restock. Old sales keep the price they were sold at.
      </p>
      <ProductForm
        initial={{
          name: product.name,
          category: product.category,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          quantity: product.quantity,
          image: product.image,
        }}
        submitLabel="Save changes"
        onSubmit={(value) => {
          const result = updateProduct(product.id, value);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Product updated.");
          void navigate({ to: "/stock" });
        }}
      />
      <div className="mt-8">
        <ConfirmButton
          label="Delete product"
          confirmLabel="Delete this product"
          onConfirm={() => {
            deleteProduct(product.id);
            toast.success("Product deleted. Past sales stay in your books.");
            void navigate({ to: "/stock" });
          }}
        />
      </div>
    </div>
  );
}
