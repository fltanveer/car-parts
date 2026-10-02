import {
  AirVent, Armchair, Battery, Car, CircleDot, Cog, Cpu, Disc3, Droplets, Fuel, Gauge, Leaf, Lightbulb, Link2, Nut, PanelTop,
  Settings2, Sparkles, Thermometer, Waves, Wind, Wrench, Zap, Box, FileText, ShieldCheck, Package, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  engine: Cog,
  fuel: Fuel,
  cooling: Thermometer,
  exhaust: Wind,
  transmission: Settings2,
  brake: Disc3,
  suspension: Waves,
  steering: CircleDot,
  tyre: CircleDot,
  battery: Battery,
  electrical: Zap,
  sensor: Cpu,
  light: Lightbulb,
  body: Car,
  mirror: PanelTop,
  glass: PanelTop,
  interior: Armchair,
  ac: AirVent,
  filter: Droplets,
  fluid: Droplets,
  belt: Link2,
  hardware: Nut,
  hybrid: Leaf,
  accessory: Sparkles,
  wiper: Gauge,
  doc: FileText,
  box: Package,
  shield: ShieldCheck,
  part: Box,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const I = MAP[icon] ?? Wrench;
  return <I className={className} aria-hidden />;
}
