import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

export function Button({ className, variant = "default", ...props }: ComponentPropsWithoutRef<"button"> & { variant?: "default" | "primary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-primary bg-primary text-white hover:brightness-95",
        variant === "danger" && "border-danger bg-danger text-white hover:brightness-95",
        variant === "ghost" && "border-transparent bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
        variant === "default" && "border-border bg-card hover:bg-black/5 dark:hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}

export function NavLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
        active ? "border-primary/40 bg-primary/10 text-foreground" : "border-transparent text-muted hover:border-border hover:bg-card"
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", active ? "bg-primary" : "bg-border")} />
      {children}
    </Link>
  );
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={clsx("rounded-lg border border-border bg-card p-4 shadow-soft", className)} {...props} />;
}

export function Pill({ className, tone = "default", ...props }: ComponentPropsWithoutRef<"span"> & { tone?: "default" | "good" | "warn" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "default" && "border-border bg-background text-muted",
        tone === "good" && "border-success/30 bg-success/10 text-success",
        tone === "warn" && "border-warning/30 bg-warning/10 text-warning",
        tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
        className
      )}
      {...props}
    />
  );
}

export function Metric({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Card>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

export const inputClass = "min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary";
