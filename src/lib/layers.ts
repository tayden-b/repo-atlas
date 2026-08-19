import { Layer } from "@/lib/analysis/types";

// One place for how layers look and read across the app.
export const LAYER_ORDER = [
  Layer.PRESENTATION,
  Layer.APPLICATION,
  Layer.DOMAIN,
  Layer.INFRASTRUCTURE,
  Layer.TOOLING,
] as const;

export const LAYER_META: Record<
  Layer,
  { label: string; tagline: string; accent: string; bar: string; chip: string }
> = {
  [Layer.PRESENTATION]: {
    label: "presentation",
    tagline: "UI, API routes, CLI — everything a user or client touches",
    accent: "text-sky-400",
    bar: "bg-sky-500",
    chip: "border-sky-900 bg-sky-950/40 text-sky-400",
  },
  [Layer.APPLICATION]: {
    label: "application",
    tagline: "services, state, jobs — the orchestration logic",
    accent: "text-violet-400",
    bar: "bg-violet-500",
    chip: "border-violet-900 bg-violet-950/40 text-violet-400",
  },
  [Layer.DOMAIN]: {
    label: "domain",
    tagline: "models, types, pure logic — the core",
    accent: "text-emerald-400",
    bar: "bg-emerald-500",
    chip: "border-emerald-900 bg-emerald-950/40 text-emerald-400",
  },
  [Layer.INFRASTRUCTURE]: {
    label: "infrastructure",
    tagline: "databases, adapters, external clients — the plumbing",
    accent: "text-amber-400",
    bar: "bg-amber-500",
    chip: "border-amber-900 bg-amber-950/40 text-amber-400",
  },
  [Layer.TOOLING]: {
    label: "tooling",
    tagline: "tests, builds, CI, docs — the support system",
    accent: "text-[#999]",
    bar: "bg-[#666]",
    chip: "border-[#333] bg-[#161616] text-[#999]",
  },
};
