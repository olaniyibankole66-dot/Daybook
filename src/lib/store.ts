import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customerOwing, saleOwing } from "@/lib/metrics";
import { roundMoney } from "@/lib/money";
import { blankProfile, buildSample } from "@/lib/sample";
import type {
  BusinessProfile,
  Customer,
  CustomerInput,
  Expense,
  ExpenseInput,
  Product,
  ProductInput,
  Result,
  Sale,
  SaleDraft,
  SaleItem,
} from "@/lib/types";
import { uid } from "@/lib/utils";

type BookData = {
  profile: BusinessProfile;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
};

type BookActions = {
  updateProfile: (patch: BusinessProfile) => void;
  addProduct: (input: ProductInput) => Result & { id?: string };
  updateProduct: (id: string, input: ProductInput) => Result;
  deleteProduct: (id: string) => void;
  addCustomer: (input: CustomerInput) => Result & { id?: string };
  updateCustomer: (id: string, input: CustomerInput) => Result;
  deleteCustomer: (id: string) => Result;
  recordSale: (draft: SaleDraft) => Result;
  deleteSale: (id: string) => void;
  recordPayment: (customerId: string, amount: number) => Result;
  addExpense: (input: ExpenseInput) => Result;
  deleteExpense: (id: string) => void;
  loadSample: () => void;
  startFresh: () => void;
};

export type BookState = BookData & BookActions;

const sample = buildSample();

function cleanProduct(input: ProductInput): Result & { value?: ProductInput } {
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name) return { ok: false, error: "Enter a product name." };
  if (!category) return { ok: false, error: "Enter a category." };
  if (input.costPrice < 0 || input.sellingPrice < 0) {
    return { ok: false, error: "Prices cannot be less than zero." };
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    return { ok: false, error: "Quantity must be a whole number, zero or more." };
  }
  return {
    ok: true,
    value: {
      name,
      category,
      costPrice: roundMoney(input.costPrice),
      sellingPrice: roundMoney(input.sellingPrice),
      quantity: input.quantity,
      image: input.image,
    },
  };
}

export const useBook = create<BookState>()(
  persist(
    (set, get) => ({
      ...sample,

      updateProfile: (patch) => {
        const name = patch.name.trim();
        set({
          profile: {
            ...patch,
            name: name || get().profile.name,
            type: patch.type.trim() || "Retail",
            phone: patch.phone.trim(),
            city: patch.city.trim(),
            lowStockAt: Math.max(0, Math.min(999, Math.round(patch.lowStockAt || 0))),
          },
        });
      },

      addProduct: (input) => {
        const cleaned = cleanProduct(input);
        if (!cleaned.ok || !cleaned.value) return cleaned;
        const product: Product = {
          ...cleaned.value,
          id: uid("prd"),
          createdAt: new Date().toISOString(),
        };
        set({ products: [product, ...get().products] });
        return { ok: true, id: product.id };
      },

      updateProduct: (id, input) => {
        const current = get().products.find((product) => product.id === id);
        if (!current) return { ok: false, error: "That product is not in your stock." };
        const cleaned = cleanProduct(input);
        if (!cleaned.ok || !cleaned.value) return cleaned;
        const nextName = cleaned.value.name;
        set({
          products: get().products.map((product) =>
            product.id === id ? { ...product, ...cleaned.value } : product,
          ),
          sales:
            nextName === current.name
              ? get().sales
              : get().sales.map((sale) => ({
                  ...sale,
                  items: sale.items.map((item) =>
                    item.productId === id ? { ...item, name: nextName } : item,
                  ),
                })),
        });
        return { ok: true };
      },

      deleteProduct: (id) => {
        set({ products: get().products.filter((product) => product.id !== id) });
      },

      addCustomer: (input) => {
        const name = input.name.trim();
        if (!name) return { ok: false, error: "Enter the customer's name." };
        const customer: Customer = {
          id: uid("cus"),
          name,
          phone: input.phone.trim(),
          note: input.note.trim(),
          createdAt: new Date().toISOString(),
        };
        set({ customers: [customer, ...get().customers] });
        return { ok: true, id: customer.id };
      },

      updateCustomer: (id, input) => {
        const name = input.name.trim();
        if (!name) return { ok: false, error: "Enter the customer's name." };
        if (!get().customers.some((customer) => customer.id === id)) {
          return { ok: false, error: "That customer is not in your book." };
        }
        set({
          customers: get().customers.map((customer) =>
            customer.id === id
              ? { ...customer, name, phone: input.phone.trim(), note: input.note.trim() }
              : customer,
          ),
          sales: get().sales.map((sale) =>
            sale.customerId === id ? { ...sale, customerName: name } : sale,
          ),
        });
        return { ok: true };
      },

      deleteCustomer: (id) => {
        if (get().sales.some((sale) => sale.customerId === id)) {
          return {
            ok: false,
            error: "This customer has sales, so they stay in your books. You can edit their details.",
          };
        }
        set({ customers: get().customers.filter((customer) => customer.id !== id) });
        return { ok: true };
      },

      recordSale: (draft) => {
        const state = get();
        if (draft.items.length === 0) return { ok: false, error: "Add at least one product." };

        const items: SaleItem[] = [];
        const qtyUsed = new Map<string, number>();
        for (const line of draft.items) {
          const product = state.products.find((item) => item.id === line.productId);
          if (!product) return { ok: false, error: "A product is no longer in your stock." };
          const already = qtyUsed.get(product.id) ?? 0;
          if (!Number.isInteger(line.quantity) || line.quantity < 1) {
            return { ok: false, error: `Enter a quantity for ${product.name}.` };
          }
          if (already + line.quantity > product.quantity) {
            return {
              ok: false,
              error: `${product.name} has only ${product.quantity} in stock.`,
            };
          }
          if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
            return { ok: false, error: `Enter a valid price for ${product.name}.` };
          }
          qtyUsed.set(product.id, already + line.quantity);
          items.push({
            productId: product.id,
            name: product.name,
            quantity: line.quantity,
            unitPrice: roundMoney(line.unitPrice),
            unitCost: product.costPrice,
          });
        }

        const total = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
        let amountPaid = roundMoney(Math.max(0, draft.amountPaid));
        if (amountPaid > total) amountPaid = total;

        let customerId = draft.customerId;
        let customerName: string | null = null;
        let customers = state.customers;

        if (customerId) {
          const customer = customers.find((item) => item.id === customerId);
          if (!customer) return { ok: false, error: "That customer is not in your book." };
          customerName = customer.name;
        } else if (draft.newCustomer?.name.trim()) {
          const created: Customer = {
            id: uid("cus"),
            name: draft.newCustomer.name.trim(),
            phone: draft.newCustomer.phone.trim(),
            note: "",
            createdAt: new Date().toISOString(),
          };
          customers = [created, ...customers];
          customerId = created.id;
          customerName = created.name;
        } else {
          customerId = null;
        }

        if (roundMoney(total - amountPaid) > 0 && !customerId) {
          return { ok: false, error: "Choose who owes this money, or add their name." };
        }

        const sale: Sale = {
          id: uid("sale"),
          createdAt: new Date().toISOString(),
          items,
          customerId,
          customerName,
          amountPaid,
          note: draft.note.trim(),
        };

        set({
          customers,
          sales: [sale, ...state.sales],
          products: state.products.map((product) => {
            const used = qtyUsed.get(product.id);
            return used ? { ...product, quantity: product.quantity - used } : product;
          }),
        });
        return { ok: true };
      },

      deleteSale: (id) => {
        const sale = get().sales.find((item) => item.id === id);
        if (!sale) return;
        const used = new Map<string, number>();
        for (const item of sale.items) {
          used.set(item.productId, (used.get(item.productId) ?? 0) + item.quantity);
        }
        set({
          sales: get().sales.filter((item) => item.id !== id),
          products: get().products.map((product) => {
            const add = used.get(product.id);
            return add ? { ...product, quantity: product.quantity + add } : product;
          }),
        });
      },

      recordPayment: (customerId, amount) => {
        if (!(amount > 0)) return { ok: false, error: "Enter an amount greater than zero." };
        const owing = customerOwing(get().sales, customerId);
        if (owing <= 0) return { ok: false, error: "This customer does not owe anything." };
        let left = Math.min(roundMoney(amount), owing);
        const ordered = get()
          .sales.map((sale, index) => ({ sale, index }))
          .sort((a, b) => a.sale.createdAt.localeCompare(b.sale.createdAt) || a.index - b.index);
        const updates = new Map<string, Sale>();
        for (const { sale } of ordered) {
          if (sale.customerId !== customerId || left <= 0) continue;
          const due = saleOwing(sale);
          if (due <= 0) continue;
          const slice = Math.min(due, left);
          left = roundMoney(left - slice);
          updates.set(sale.id, { ...sale, amountPaid: roundMoney(sale.amountPaid + slice) });
        }
        set({
          sales: get().sales.map((sale) => updates.get(sale.id) ?? sale),
        });
        return { ok: true };
      },

      addExpense: (input) => {
        if (!(input.amount > 0)) return { ok: false, error: "Enter an amount greater than zero." };
        const category = input.category.trim();
        if (!category) return { ok: false, error: "Choose a category." };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "Choose a date." };
        const description = input.description.trim();
        if (!description) return { ok: false, error: "Add a short description." };
        const expense: Expense = {
          id: uid("exp"),
          amount: roundMoney(input.amount),
          category,
          date: input.date,
          description,
          createdAt: new Date().toISOString(),
        };
        set({ expenses: [expense, ...get().expenses] });
        return { ok: true };
      },

      deleteExpense: (id) => {
        set({ expenses: get().expenses.filter((expense) => expense.id !== id) });
      },

      loadSample: () => {
        set(buildSample());
      },

      startFresh: () => {
        set({
          profile: blankProfile(),
          products: [],
          customers: [],
          sales: [],
          expenses: [],
        });
      },
    }),
    {
      name: "daybook",
      skipHydration: true,
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        products: state.products,
        customers: state.customers,
        sales: state.sales,
        expenses: state.expenses,
      }),
    },
  ),
);

let hydration: Promise<void> | null = null;

export function hydrateBook(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hydration) {
    hydration = Promise.resolve(useBook.persist.rehydrate())
      .then(() => undefined)
      .catch(() => undefined);
  }
  return hydration;
}
