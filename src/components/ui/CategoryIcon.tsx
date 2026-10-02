import {
  AirVent,
  Car,
  CircleDot,
  Cog,
  Disc3,
  Droplets,
  Lightbulb,
  PanelTop,
  Settings2,
  Thermometer,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  engine: Cog,
  brake: Disc3,
  suspension: Waves,
  light: Lightbulb,
  electrical: Zap,
  filter: Droplets,
  body: Car,
  ac: AirVent,
  steering: CircleDot,
  transmission: Settings2,
  cooling: Thermometer,
  mirror: PanelTop,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const I = MAP[icon] ?? Wrench;
  return <I className={className} aria-hidden />;
}
