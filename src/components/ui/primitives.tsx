import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 disabled:bg-muted",
  accent: "bg-accent text-ink hover:brightness-95 disabled:opacity-50",
  outline: "border-2 border-ink/15 bg-card text-ink hover:border-ink/40 disabled:opacity-50",
  ghost: "text-ink hover:bg-ink/5 disabled:opacity-50",
  danger: "border-2 border-danger/30 bg-card text-danger hover:bg-danger/5",
};

// lg = 56px, the minimum for primary actions (spec 4.4).
const sizes: Record<Size, string> = {
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

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button type="button" className={clsx(buttonClass(variant, size, full), className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
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

export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, hint, children, error }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-medium text-danger">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-xl border-2 border-line bg-card px-4 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-ink";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={clsx(inputClass, "min-h-28 py-3", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={clsx(inputClass, "appearance-none bg-[length:20px] pr-10", props.className)} />;
}

// Large tappable option card used for choices instead of typing (spec 4.9).
export function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  className,
  disabled,
}: {
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 bg-card p-3.5 text-left transition-colors",
        selected ? "border-ink bg-ink/[0.03]" : "border-line hover:border-ink/30",
        disabled && "opacity-50",
        className,
      )}
    >
      {icon && <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-ink">{icon}</span>}
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
        active ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/40",
        className,
      )}
      {...rest}
    />
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warn" | "ok" | "danger"; children: ReactNode; className?: string }) {
  const tones = {
    info: "bg-surface border-line text-ink-2",
    warn: "bg-accent-soft border-accent/40 text-accent-ink",
    ok: "bg-q-genuine-soft border-q-genuine/30 text-q-genuine",
    danger: "bg-danger/5 border-danger/30 text-danger",
  };
  return <div className={clsx("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}

export function Container({ className, ...rest }: ComponentProps<"div">) {
  return <div className={clsx("mx-auto w-full max-w-3xl px-4", className)} {...rest} />;
}
