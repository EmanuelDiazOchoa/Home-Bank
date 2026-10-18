import type { Transaction } from "../store/accountStore";
import { getCategoryMeta } from "../constants/billCategories";

export type Period = 1 | 3 | 6;

export interface CategoryTotal {
  category: string;
  amount: number;
  color: string;
}

export interface MonthTotal {
  label: string;
  income: number;
  expense: number;
  current: boolean;
}

export interface AnalyticsResult {
  income: number;
  expense: number;
  categories: CategoryTotal[];
  months: MonthTotal[];
  hasData: boolean;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Mover plata a una inversión o recibir un préstamo no es gastar ni ganar
export const isIncome = (t: Transaction) =>
  (t.type === "income" || t.type === "transfer_in") && t.category !== "Préstamo";
export const isExpense = (t: Transaction) =>
  (t.type === "expense" || t.type === "transfer_out") && t.category !== "Inversión";

const sum = (list: Transaction[]) => list.reduce((acc, t) => acc + Math.abs(t.amount), 0);

export function computeAnalytics(
  transactions: Transaction[],
  period: Period,
  now: Date = new Date()
): AnalyticsResult {
  const periodStart = new Date(now.getFullYear(), now.getMonth() - (period - 1), 1);
  const inPeriod = transactions.filter((t) => new Date(t.created_at) >= periodStart);

  const income = sum(inPeriod.filter(isIncome));
  const expenseList = inPeriod.filter(isExpense);
  const expense = sum(expenseList);

  const grouped: Record<string, number> = {};
  expenseList.forEach((t) => {
    const key = t.category || "Otros";
    grouped[key] = (grouped[key] || 0) + Math.abs(t.amount);
  });
  const sorted = Object.entries(grouped)
    .map(([category, amount]) => ({ category, amount, color: getCategoryMeta(category).color }))
    .sort((a, b) => b.amount - a.amount);

  // Top 5 y el resto agrupado en "Otras"
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const categories = rest.length
    ? [...top, { category: "Otras", amount: rest.reduce((a, c) => a + c.amount, 0), color: "#8E9AAF" }]
    : top;

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const list = transactions.filter((t) => {
      const td = new Date(t.created_at);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    return {
      label: MONTHS[d.getMonth()],
      income: sum(list.filter(isIncome)),
      expense: sum(list.filter(isExpense)),
      current: i === 5,
    };
  });

  return { income, expense, categories, months, hasData: income > 0 || expense > 0 };
}
