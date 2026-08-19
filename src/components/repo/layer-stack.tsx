"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Layer } from "@/lib/analysis/types";
import { LAYER_ORDER, LAYER_META } from "@/lib/layers";

interface LayerStats {
  count: number;
  loc: number;
}

interface ModuleData {
  id: string;
  name: string;
  layer: string;
  loc: number;
  confidenceAvg: number;
}

interface LayerStackProps {
  repoId: string;
  stats: Record<Layer, LayerStats>;
  modules: ModuleData[];
}

export function LayerStack({ repoId, stats, modules }: LayerStackProps) {
  const router = useRouter();
  const totalLoc = LAYER_ORDER.reduce((sum, l) => sum + (stats[l]?.loc ?? 0), 0);

  return (
    <div className="space-y-2">
      {LAYER_ORDER.map((layer) => {
        const layerStat = stats[layer] || { count: 0, loc: 0 };
        const meta = LAYER_META[layer];
        const layerModules = modules
          .filter((m) => m.layer === layer)
          .sort((a, b) => b.loc - a.loc);
        const share = totalLoc > 0 ? layerStat.loc / totalLoc : 0;

        return (
          <button
            key={layer}
            onClick={() => router.push(`/repo/${repoId}/layer/${layer.toLowerCase()}`)}
            disabled={layerStat.count === 0}
            className="group block w-full rounded border border-[#262626] bg-[#0e0e0e] px-4 py-3 text-left transition-colors enabled:hover:border-[#3a3a3a] enabled:hover:bg-[#111] disabled:opacity-40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className={`font-mono text-[11px] font-medium uppercase tracking-wider ${meta.accent}`}>
                  {meta.label}
                </span>
                <span className="font-mono text-[11px] text-[#777]">
                  {layerStat.count} files · {layerStat.loc.toLocaleString()} loc ·{" "}
                  {(share * 100).toFixed(0)}%
                </span>
              </div>
              {layerStat.count > 0 && (
                <ChevronRight
                  size={13}
                  className="text-[#444] transition-colors group-hover:text-[#999]"
                />
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-[#666]">{meta.tagline}</p>

            {/* proportional LOC bar */}
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#1a1a1a]">
              <div
                className={`h-full rounded-full ${meta.bar}`}
                style={{ width: `${Math.max(share * 100, layerStat.count > 0 ? 1 : 0)}%` }}
              />
            </div>

            {layerModules.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {layerModules.slice(0, 10).map((mod) => (
                  <span
                    key={mod.id}
                    className="rounded border border-[#262626] bg-[#141414] px-1.5 py-px font-mono text-[11px] text-[#999]"
                  >
                    {mod.name} <span className="text-[#555]">{mod.loc.toLocaleString()}</span>
                  </span>
                ))}
                {layerModules.length > 10 && (
                  <span className="px-1 py-px font-mono text-[11px] text-[#555]">
                    +{layerModules.length - 10} more
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
