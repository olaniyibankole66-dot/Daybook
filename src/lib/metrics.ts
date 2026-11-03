import { format } from "date-fns";
import { eachDay, inPeriod, parseDay, periodBounds, type Period, dayKey } from "@/lib/dates";
import { roundMoney } from "@/lib/money";
import type { Expense, Product, Sale } from "@/lib/types";

export function saleTotal(sale: Sale): number {
  return roundMoney(sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
}

export function saleCost(sale: Sale): number {
  return roundMoney(sale.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0));
}

export function saleOwing(sale: Sale): number {
  return roundMoney(Math.max(0, saleTotal(sale) - sale.amountPaid));
}

export function isPaid(sale: Sale): boolean {
  return saleOwing(sale) <= 0;
}

export type Summary = {
  revenue: number;
  productCost: number;
  expenses: number;
  profit: number;
  orders: number;
  collected: number;
  owing: number;
};

export function summarize(
  sales: Sale[],
  expenses: Expense[],
  period: Period,
  now = new Date(),
): Summary {
  const periodSales = sales.filter((sale) => inPeriod(new Date(sale.createdAt), period, now));
  const periodExpenses = expenses.filter((expense) =>
    inPeriod(parseDay(expense.date), period, now),
  );
  const revenue = roundMoney(periodSales.reduce((sum, sale) => sum + saleTotal(sale), 0));
  const productCost = roundMoney(periodSales.reduce((sum, sale) => sum + saleCost(sale), 0));
  const expenseTotal = roundMoney(periodExpenses.reduce((sum, expense) => sum + expense.amount, 0));
  const collected = roundMoney(periodSales.reduce((sum, sale) => sum + sale.amountPaid, 0));
  const owing = roundMoney(periodSales.reduce((sum, sale) => sum + saleOwing(sale), 0));
  return {
    revenue,
    productCost,
    expenses: expenseTotal,
    profit: roundMoney(revenue - productCost - expenseTotal),
    orders: periodSales.length,
    collected,
    owing,
  };
}

export type Seller = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  productCost: number;
};

export function bestSellers(sales: Sale[], period: Period, now = new Date()): Seller[] {
  const map = new Map<string, Seller>();
  for (const sale of sales) {
    if (!inPeriod(new Date(sale.createdAt), period, now)) continue;
    for (const item of sale.items) {
      const current = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        revenue: 0,
        productCost: 0,
      };
      current.name = item.name;
      current.quantity += item.quantity;
      current.revenue = roundMoney(current.revenue + item.unitPrice * item.quantity);
      current.productCost = roundMoney(current.productCost + item.unitCost * item.quantity);
      map.set(item.productId, current);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);
}

export type DayPoint = {
  date: string;
  label: string;
  revenue: number;
  profit: number;
};

export function dailySeries(
  sales: Sale[],
  expenses: Expense[],
  period: Period,
  now = new Date(),
): DayPoint[] {
  const { start, end } = periodBounds(period, now);
  return eachDay(start, end).map((date) => {
    const key = dayKey(date);
    const daySales = sales.filter((sale) => dayKey(new Date(sale.createdAt)) === key);
    const dayExpenses = expenses.filter((expense) => expense.date === key);
    const revenue = roundMoney(daySales.reduce((sum, sale) => sum + saleTotal(sale), 0));
    const productCost = roundMoney(daySales.reduce((sum, sale) => sum + saleCost(sale), 0));
    const expenseTotal = roundMoney(dayExpenses.reduce((sum, expense) => sum + expense.amount, 0));
    return {
      date: key,
      label: format(date, period === "week" ? "EEE" : "d MMM"),
      revenue,
      profit: roundMoney(revenue - productCost - expenseTotal),
    };
  });
}

export function lowStockProducts(products: Product[], threshold: number): Product[] {
  return products
    .filter((product) => product.quantity <= threshold)
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
}

export function customerOwing(sales: Sale[], customerId: string): number {
  return roundMoney(
    sales
      .filter((sale) => sale.customerId === customerId)
      .reduce((sum, sale) => sum + saleOwing(sale), 0),
  );
}
