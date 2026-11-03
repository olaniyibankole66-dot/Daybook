import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft } from "lucide-react";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { Period } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover",
        secondary: "bg-surface-2 text-ink hover:bg-line active:bg-line",
        outline: "bg-surface text-ink shadow-card hover:bg-surface-2",
        danger: "bg-danger-soft text-danger hover:bg-danger hover:text-on-primary",
        ghost: "bg-transparent text-ink hover:bg-surface-2",
      },
      size: {
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function IconButton({
  label,
  className,
  ...props
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink hover:bg-line disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export const inputClass =
  "min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-xl bg-surface shadow-card", className)}>{children}</section>;
}

export function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "ok" && "bg-primary-soft text-primary",
        tone === "warn" && "bg-warning-soft text-warning",
        tone === "danger" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface px-5 py-8 text-center shadow-card">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-5 flex flex-col items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as never}
      className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PeriodTabs({
  value,
  onChange,
  options,
}: {
  value: Period;
  onChange: (period: Period) => void;
  options: { id: Period; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "min-h-11 flex-1 rounded-lg px-2 text-sm font-medium",
              selected ? "bg-surface text-ink shadow-card" : "text-muted",
            )}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  variant = "danger",
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "danger" | "outline" | "secondary";
}) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant={variant}
      size="lg"
      className="w-full"
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        onConfirm();
        setArmed(false);
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}

export function ProductMark({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img src={image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
    );
  }
  const letter = name.trim().charAt(0).toUpperCase() || "•";
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-soft font-serif text-lg text-primary">
      {letter}
    </span>
  );
}
