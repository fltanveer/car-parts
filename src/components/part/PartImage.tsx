import clsx from "clsx";
import { getCategoryById } from "@/lib/api";
import type { Part } from "@/lib/types";
import { CategoryIcon } from "../ui/CategoryIcon";

// Placeholder until real product photos exist (spec 7.7 wants real photos,
// never stock images). Shows category icon + brand + part number.
export function PartImage({ part, className, large }: { part: Part; className?: string; large?: boolean }) {
  const cat = getCategoryById(part.category_id);
  const parent = cat?.parent_id ? getCategoryById(cat.parent_id) : cat;
  return (
    <div
      className={clsx(
        "relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 text-ink-2",
        className,
      )}
      role="img"
      aria-label={`${part.brand} ${part.name}`}
    >
      <CategoryIcon icon={parent?.icon ?? "engine"} className={large ? "size-24 opacity-60" : "size-12 opacity-50"} />
      <span
        className={clsx(
          "absolute bottom-2 left-2 rounded-md bg-white/85 px-1.5 py-0.5 font-bold tracking-wide text-ink",
          large ? "text-base" : "text-[11px]",
        )}
      >
        {part.brand}
      </span>
    </div>
  );
}
