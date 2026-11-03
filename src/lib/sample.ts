import { shiftDayKey, shiftDays } from "@/lib/dates";
import type { BusinessProfile, Customer, Expense, Product, Sale, SaleItem } from "@/lib/types";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  opening: number;
};

type Pay = "full" | "none" | number;

type SaleDraft = {
  id: string;
  daysAgo: number;
  hour: number;
  minute: number;
  customerId?: string;
  pay: Pay;
  lines: [string, number][];
};

const CATALOG: CatalogItem[] = [
  { id: "p_peak", name: "Peak Milk 400g", category: "Dairy", cost: 3200, price: 3900, opening: 13 },
  {
    id: "p_semo",
    name: "Golden Penny Semovita 1kg",
    category: "Grains",
    cost: 1400,
    price: 1750,
    opening: 36,
  },
  { id: "p_indomie", name: "Indomie Chicken 70g", category: "Noodles", cost: 200, price: 300, opening: 80 },
  { id: "p_sugar", name: "Dangote Sugar 1kg", category: "Groceries", cost: 1700, price: 2100, opening: 15 },
  { id: "p_oil", name: "Kings Oil 1L", category: "Cooking", cost: 2900, price: 3500, opening: 9 },
  { id: "p_milo", name: "Milo 400g", category: "Beverages", cost: 2800, price: 3500, opening: 14 },
  { id: "p_maggi", name: "Maggi Star (50 cubes)", category: "Seasoning", cost: 750, price: 1000, opening: 11 },
  { id: "p_eva", name: "Eva Water 75cl", category: "Drinks", cost: 150, price: 250, opening: 80 },
  { id: "p_closeup", name: "Closeup 140g", category: "Toiletries", cost: 1100, price: 1500, opening: 10 },
  { id: "p_omo", name: "Omo 900g", category: "Household", cost: 1900, price: 2500, opening: 7 },
  { id: "p_gala", name: "Gala Beef Roll", category: "Snacks", cost: 250, price: 400, opening: 12 },
  { id: "p_morn", name: "Golden Morn 500g", category: "Cereal", cost: 1450, price: 1900, opening: 12 },
];

const SALE_DRAFTS: SaleDraft[] = [
  { id: "sale_01", daysAgo: 0, hour: 9, minute: 20, pay: "full", lines: [["p_indomie", 4], ["p_eva", 6], ["p_gala", 2]] },
  { id: "sale_02", daysAgo: 0, hour: 11, minute: 5, customerId: "cus_bola", pay: 3000, lines: [["p_oil", 1], ["p_sugar", 2]] },
  { id: "sale_03", daysAgo: 0, hour: 13, minute: 40, pay: "full", lines: [["p_peak", 1], ["p_milo", 1]] },
  { id: "sale_04", daysAgo: 0, hour: 16, minute: 10, customerId: "cus_ngozi", pay: "none", lines: [["p_semo", 2], ["p_maggi", 2]] },
  { id: "sale_05", daysAgo: 1, hour: 10, minute: 15, customerId: "cus_chinedu", pay: "full", lines: [["p_semo", 3], ["p_indomie", 8]] },
  { id: "sale_06", daysAgo: 1, hour: 15, minute: 0, customerId: "cus_hauwa", pay: "none", lines: [["p_morn", 2], ["p_peak", 1]] },
  { id: "sale_07", daysAgo: 1, hour: 18, minute: 5, pay: "full", lines: [["p_eva", 10], ["p_gala", 1], ["p_closeup", 1]] },
  { id: "sale_08", daysAgo: 2, hour: 12, minute: 30, customerId: "cus_bola", pay: 2000, lines: [["p_omo", 1], ["p_closeup", 1], ["p_maggi", 1]] },
  { id: "sale_09", daysAgo: 2, hour: 17, minute: 10, pay: "full", lines: [["p_sugar", 2], ["p_oil", 1], ["p_indomie", 6]] },
  { id: "sale_10", daysAgo: 3, hour: 11, minute: 0, pay: "full", lines: [["p_milo", 2], ["p_peak", 2], ["p_eva", 8]] },
  { id: "sale_11", daysAgo: 3, hour: 16, minute: 40, customerId: "cus_ngozi", pay: "full", lines: [["p_sugar", 1], ["p_semo", 1]] },
  { id: "sale_12", daysAgo: 5, hour: 9, minute: 50, customerId: "cus_chinedu", pay: "full", lines: [["p_oil", 1], ["p_maggi", 2], ["p_indomie", 10]] },
  { id: "sale_13", daysAgo: 6, hour: 13, minute: 20, pay: "full", lines: [["p_gala", 3], ["p_eva", 12], ["p_indomie", 5]] },
  { id: "sale_14", daysAgo: 7, hour: 14, minute: 0, customerId: "cus_hauwa", pay: "full", lines: [["p_milo", 1], ["p_morn", 1]] },
  { id: "sale_15", daysAgo: 11, hour: 10, minute: 30, pay: "full", lines: [["p_semo", 5], ["p_sugar", 4], ["p_oil", 2]] },
  { id: "sale_16", daysAgo: 16, hour: 12, minute: 0, pay: "full", lines: [["p_indomie", 15], ["p_eva", 20], ["p_gala", 4]] },
  { id: "sale_17", daysAgo: 13, hour: 15, minute: 30, customerId: "cus_chinedu", pay: "full", lines: [["p_peak", 3], ["p_milo", 2], ["p_morn", 2]] },
  { id: "sale_18", daysAgo: 9, hour: 11, minute: 45, customerId: "cus_bola", pay: "full", lines: [["p_omo", 2], ["p_closeup", 2]] },
  { id: "sale_19", daysAgo: 18, hour: 17, minute: 0, customerId: "cus_ngozi", pay: "full", lines: [["p_maggi", 3], ["p_sugar", 2]] },
  { id: "sale_20", daysAgo: 21, hour: 10, minute: 0, pay: "full", lines: [["p_oil", 2], ["p_omo", 1], ["p_closeup", 1]] },
  { id: "sale_21", daysAgo: 24, hour: 12, minute: 15, customerId: "cus_bola", pay: "full", lines: [["p_semo", 4], ["p_peak", 2]] },
];

export function blankProfile(): BusinessProfile {
  return {
    name: "My business",
    type: "Retail",
    currency: "NGN",
    phone: "",
    city: "",
    lowStockAt: 5,
  };
}

export function buildSample(now = new Date()): {
  profile: BusinessProfile;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
} {
  const byId = new Map(CATALOG.map((item) => [item.id, item]));
  const customers: Customer[] = [
    {
      id: "cus_bola",
      name: "Bola Adeyemi",
      phone: "0802 334 1187",
      note: "Pays on Friday. Buys oil and sugar on credit.",
      createdAt: shiftDays(now, 40, 9, 0),
    },
    {
      id: "cus_chinedu",
      name: "Chinedu Okonkwo",
      phone: "0816 552 9044",
      note: "Pays immediately.",
      createdAt: shiftDays(now, 36, 9, 0),
    },
    {
      id: "cus_hauwa",
      name: "Hauwa Bello",
      phone: "0703 881 2265",
      note: "",
      createdAt: shiftDays(now, 28, 9, 0),
    },
    {
      id: "cus_ngozi",
      name: "Ngozi Eze",
      phone: "0805 219 7731",
      note: "Neighbours call her Mama Ngozi.",
      createdAt: shiftDays(now, 22, 9, 0),
    },
  ];
  const customerName = new Map(customers.map((customer) => [customer.id, customer.name]));

  const sold = new Map<string, number>();
  const sales: Sale[] = SALE_DRAFTS.map((draft) => {
    const items: SaleItem[] = draft.lines.map(([productId, quantity]) => {
      const product = byId.get(productId);
      if (!product) throw new Error(`Unknown sample product ${productId}`);
      sold.set(productId, (sold.get(productId) ?? 0) + quantity);
      return {
        productId,
        name: product.name,
        quantity,
        unitPrice: product.price,
        unitCost: product.cost,
      };
    });
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const amountPaid = draft.pay === "full" ? total : draft.pay === "none" ? 0 : Math.min(draft.pay, total);
    return {
      id: draft.id,
      createdAt: shiftDays(now, draft.daysAgo, draft.hour, draft.minute),
      items,
      customerId: draft.customerId ?? null,
      customerName: draft.customerId ? (customerName.get(draft.customerId) ?? null) : null,
      amountPaid,
      note: "",
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const products: Product[] = CATALOG.map((item) => {
    const left = item.opening - (sold.get(item.id) ?? 0);
    if (left < 0) throw new Error(`Sample stock for ${item.name} is ${left}`);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      costPrice: item.cost,
      sellingPrice: item.price,
      quantity: left,
      image: null,
      createdAt: shiftDays(now, 30, 8, 0),
    };
  });

  const expenses: Expense[] = [
    {
      id: "exp_fuel",
      amount: 4500,
      category: "Fuel & generator",
      date: shiftDayKey(now, 0),
      description: "Fuel for the generator this morning",
      createdAt: shiftDays(now, 0, 8, 10),
    },
    {
      id: "exp_transport",
      amount: 2800,
      category: "Transport",
      date: shiftDayKey(now, 1),
      description: "Drop to Mile 12 market",
      createdAt: shiftDays(now, 1, 7, 40),
    },
    {
      id: "exp_bags",
      amount: 1500,
      category: "Packaging",
      date: shiftDayKey(now, 2),
      description: "Nylon bags and twist ties",
      createdAt: shiftDays(now, 2, 18, 0),
    },
    {
      id: "exp_airtime",
      amount: 1000,
      category: "Airtime & data",
      date: shiftDayKey(now, 3),
      description: "Airtime for customer calls",
      createdAt: shiftDays(now, 3, 9, 0),
    },
    {
      id: "exp_rent",
      amount: 55000,
      category: "Rent",
      date: shiftDayKey(now, 12),
      description: "Shop rent for this month",
      createdAt: shiftDays(now, 12, 10, 0),
    },
    {
      id: "exp_repair",
      amount: 3500,
      category: "Repairs",
      date: shiftDayKey(now, 20),
      description: "Fixed the shop shutter",
      createdAt: shiftDays(now, 20, 15, 0),
    },
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    profile: {
      name: "Amaka Stores",
      type: "Provision store",
      currency: "NGN",
      phone: "0803 441 2290",
      city: "Surulere, Lagos",
      lowStockAt: 3,
    },
    products,
    customers,
    sales,
    expenses,
  };
}
