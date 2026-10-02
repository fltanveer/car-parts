import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "@/lib/labels";

type Variant = "primary" | "brand" | "ok" | "outline" | "ghost" | "danger";
type Size = "xl" | "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 disabled:bg-muted",
  brand: "bg-brand text-white hover:bg-brand-2 disabled:opacity-50",
  ok: "bg-ok text-white hover:brightness-110 disabled:opacity-50",
  outline: "border-2 border-ink/15 bg-card text-ink hover:border-ink/40 disabled:opacity-50",
  ghost: "text-ink hover:bg-ink/5 disabled:opacity-50",
  danger: "border-2 border-bad/30 bg-card text-bad hover:bg-bad/5 disabled:opacity-50",
};

// lg = 56px minimum for the one main action on a screen (rule 1).
const sizes: Record<Size, string> = {
  xl: "min-h-16 px-6 text-xl gap-3 rounded-2xl",
  lg: "min-h-14 px-5 text-lg gap-2.5 rounded-2xl",
  md: "min-h-12 px-4 text-base gap-2 rounded-xl",
  sm: "min-h-9 px-3 text-sm gap-1.5 rounded-lg",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", full = false) =>
  clsx(
    "inline-flex items-center justify-center font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    full && "w-full",
  );

export function Button({ variant = "primary", size = "md", full, className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button type="button" className={clsx(buttonClass(variant, size, full), className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", size = "md", full, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <Link className={clsx(buttonClass(variant, size, full), className)} {...rest} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={clsx("rounded-2xl border border-line bg-card", className)} {...rest} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, children, back }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-5">
      {back}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, error }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-medium text-bad">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-xl border-2 border-line bg-card px-4 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-brand";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}
export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={clsx(inputClass, "min-h-28 py-3", props.className)} />;
}
export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={clsx(inputClass, "pr-10", props.className)} />;
}

/** Large tappable option instead of typing (rule 3). */
export function ChoiceCard({
  selected, onClick, icon, title, subtitle, className, disabled, tone,
}: {
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  disabled?: boolean;
  tone?: "ok" | "bad";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 bg-card p-3.5 text-left transition-colors",
        selected ? (tone === "bad" ? "border-bad bg-bad-soft" : tone === "ok" ? "border-ok bg-ok-soft" : "border-brand bg-brand-soft/40") : "border-line hover:border-ink/30",
        disabled && "opacity-50",
        className,
      )}
    >
      {icon && <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-xl text-ink">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {subtitle && <span className="block text-sm text-muted">{subtitle}</span>}
      </span>
    </button>
  );
}

export function Chip({ active, className, ...rest }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={clsx(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-ink/40",
        className,
      )}
      {...rest}
    />
  );
}

const toneBox: Record<Tone | "warn" | "danger", string> = {
  info: "bg-surface border-line text-ink-2",
  wait: "bg-wait-soft border-wait-bg/50 text-wait",
  warn: "bg-wait-soft border-wait-bg/50 text-wait",
  ok: "bg-ok-soft border-ok/30 text-ok",
  bad: "bg-bad-soft border-bad/30 text-bad",
  danger: "bg-bad-soft border-bad/30 text-bad",
};

export function Notice({ tone = "info", children, className }: { tone?: Tone | "warn" | "danger"; children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border px-4 py-3 text-sm", toneBox[tone], className)}>{children}</div>;
}

const tonePill: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  wait: "bg-wait-soft text-wait",
  bad: "bg-bad-soft text-bad",
  info: "bg-surface text-ink-2",
};
const toneDot: Record<Tone, string> = { ok: "bg-ok", wait: "bg-wait-bg", bad: "bg-bad", info: "bg-muted" };

/** Status with fixed colour meaning (rule 10). */
export function StatusPill({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", tonePill[tone], className)}>
      <span className={clsx("size-1.5 rounded-full", toneDot[tone])} aria-hidden />
      {children}
    </span>
  );
}

export function Container({ className, wide, ...rest }: ComponentProps<"div"> & { wide?: boolean }) {
  return <div className={clsx("mx-auto w-full px-4", wide ? "max-w-6xl" : "max-w-3xl", className)} {...rest} />;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-card px-6 py-10 text-center">
      {icon && <span className="grid size-14 place-items-center rounded-2xl bg-surface text-2xl text-muted">{icon}</span>}
      <p className="text-lg font-bold">{title}</p>
      {body && <p className="max-w-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={clsx("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors",
            value === it.value ? "bg-ink text-white" : "bg-card text-ink-2 ring-1 ring-line hover:ring-ink/30",
          )}
        >
          {it.label}
          {it.count != null && it.count > 0 && (
            <span className={clsx("grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5", value === it.value ? "bg-white/20" : "bg-bad text-white")}>{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; size?: "md" | "lg" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
    >
      <span className="font-semibold">{label}</span>
      <span className={clsx("relative shrink-0 rounded-full transition-colors", size === "lg" ? "h-9 w-16" : "h-7 w-12", checked ? "bg-ok" : "bg-line")}>
        <span className={clsx("absolute top-1 rounded-full bg-white shadow transition-all", size === "lg" ? "size-7" : "size-5", checked ? (size === "lg" ? "left-8" : "left-6") : "left-1")} />
      </span>
    </button>
  );
}

export function Stat({ label, value, sub, tone, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border p-4", tone ? toneBox[tone] : "border-line bg-card", className)}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-80">{sub}</p>}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const btn = "grid size-11 place-items-center rounded-xl border-2 border-line bg-card text-xl font-bold hover:border-ink/40 disabled:opacity-40";
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="−">
        −
      </button>
      <span className="min-w-10 text-center text-lg font-bold tabular-nums">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">
        +
      </button>
    </div>
  );
}
