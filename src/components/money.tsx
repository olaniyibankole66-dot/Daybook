import { formatMoney } from "@/lib/money";
import { useBook } from "@/lib/store";
import { cn } from "@/lib/utils";

export function useMoneyFormat() {
  const currency = useBook((state) => state.profile.currency);
  return (value: number) => formatMoney(value, currency);
}

export function Money({ value, className }: { value: number; className?: string }) {
  const format = useMoneyFormat();
  return <span className={cn("tabular-nums", className)}>{format(value)}</span>;
}
