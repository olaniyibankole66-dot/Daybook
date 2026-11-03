import type { CurrencyCode } from "@/lib/money";

export type BusinessProfile = {
  name: string;
  type: string;
  currency: CurrencyCode;
  phone: string;
  city: string;
  lowStockAt: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  image: string | null;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  note: string;
  createdAt: string;
};

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type Sale = {
  id: string;
  createdAt: string;
  items: SaleItem[];
  customerId: string | null;
  customerName: string | null;
  amountPaid: number;
  note: string;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  image: string | null;
};

export type CustomerInput = {
  name: string;
  phone: string;
  note: string;
};

export type ExpenseInput = {
  amount: number;
  category: string;
  date: string;
  description: string;
};

export type SaleDraft = {
  items: { productId: string; quantity: number; unitPrice: number }[];
  customerId: string | null;
  newCustomer: { name: string; phone: string } | null;
  amountPaid: number;
  note: string;
};

export type Result = { ok: true } | { ok: false; error: string };

export const PRODUCT_CATEGORIES = [
  "Groceries",
  "Grains",
  "Noodles",
  "Dairy",
  "Drinks",
  "Beverages",
  "Cooking",
  "Seasoning",
  "Snacks",
  "Toiletries",
  "Household",
  "Cereal",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Fuel & generator",
  "Transport",
  "Airtime & data",
  "Packaging",
  "Salaries",
  "Utilities",
  "Repairs",
  "Market fees",
  "Other",
];

export const BUSINESS_TYPES = [
  "Provision store",
  "Retail",
  "Pharmacy",
  "Fashion",
  "Food",
  "Salon",
  "Electronics",
  "Farm produce",
  "Services",
  "Other",
];
