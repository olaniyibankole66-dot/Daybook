import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Ellipsis, Home, Package, Receipt, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { hydrateBook, useBook } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  {
    to: "/sales",
    label: "Sales",
    icon: Receipt,
    match: (path: string) => path === "/sales" || path.startsWith("/sales/"),
  },
  {
    to: "/stock",
    label: "Stock",
    icon: Package,
    match: (path: string) => path === "/stock" || path.startsWith("/stock/"),
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users,
    match: (path: string) => path === "/customers" || path.startsWith("/customers/"),
  },
  {
    to: "/more",
    label: "More",
    icon: Ellipsis,
    match: (path: string) =>
      ["/more", "/expenses", "/reports", "/settings"].some(
        (item) => path === item || path.startsWith(`${item}/`),
      ),
  },
] as const;

function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void hydrateBook().then(() => setReady(true));
  }, []);
  return ready;
}

function Opening() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 pt-8 text-ink">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-on-primary">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <p className="font-serif text-2xl">Daybook</p>
      </div>
      <p className="mt-4 text-muted">Opening your books…</p>
    </div>
  );
}

function NavLinks({ layout }: { layout: "side" | "bar" }) {
  const pathname = normalize(useRouterState({ select: (state) => state.location.pathname }));
  return (
    <>
      {NAV.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={
              layout === "bar"
                ? cn(
                    "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-primary" : "text-muted",
                  )
                : cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                    active ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-2",
                  )
            }
          >
            <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const ready = useReady();
  const profile = useBook((state) => state.profile);
  if (!ready) return <Opening />;

  return (
    <div className="app-frame bg-bg text-ink">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-on-primary">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-xl leading-none">Daybook</span>
            <span className="mt-1 block text-xs text-muted">Run your shop</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
          <NavLinks layout="side" />
          <p className="mb-1 mt-6 px-3 text-xs font-medium tracking-wide text-faint uppercase">
            Books
          </p>
          <Link
            to="/reports"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Reports
          </Link>
          <Link
            to="/expenses"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Expenses
          </Link>
          <Link
            to="/settings"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Settings
          </Link>
        </nav>
        <div className="border-t border-line px-4 py-4">
          <p className="truncate text-sm font-medium">{profile.name}</p>
          <p className="truncate text-xs text-muted">
            {profile.city || profile.type}
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="scroll-pad">
          <div className="mx-auto w-full max-w-3xl px-4 pt-5 md:px-8 md:pt-8">{children}</div>
        </div>
        <nav className="app-nav" aria-label="Main">
          <div className="mx-auto flex max-w-lg">
            <NavLinks layout="bar" />
          </div>
        </nav>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-ink)",
            color: "var(--color-bg)",
            border: "none",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </div>
  );
}
