"use client";

import { Layer } from "@/lib/analysis/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight, Layers, FileCode } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Stats match DB JSON structure
interface LayerStats {
    count: number;
    loc: number;
}

interface ModuleData {
    id: string;
    name: string;
    layer: Layer;
    loc: number;
    churnAvg: number;
}

interface LayerStackProps {
    repoId: string;
    stats: Record<Layer, LayerStats>;
    modules: ModuleData[];
}

const LAYER_ORDER = [
    Layer.PRESENTATION,
    Layer.APPLICATION,
    Layer.DOMAIN,
    Layer.INFRASTRUCTURE,
    Layer.TOOLING,
];

const LAYER_COLORS: Record<Layer, string> = {
    [Layer.PRESENTATION]: "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    [Layer.APPLICATION]: "bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200",
    [Layer.DOMAIN]: "bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    [Layer.INFRASTRUCTURE]: "bg-amber-100 dark:bg-amber-900 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    [Layer.TOOLING]: "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200",
};

export function LayerStack({ repoId, stats, modules }: LayerStackProps) {
    const router = useRouter();
    const [expandedLayer, setExpandedLayer] = useState<Layer | null>(null);

    const handleLayerClick = (layer: Layer) => {
        router.push(`/repo/${repoId}/layer/${layer.toLowerCase()}`);
    };

    const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
        e.preventDefault();
        router.push(`/repo/${repoId}/layer/${layer.toLowerCase()}`);
    };

    return (
        <div className="space-y-4">
            {LAYER_ORDER.map((layer) => {
                const layerStat = stats[layer] || { count: 0, loc: 0 };
                const layerModules = modules.filter((m) => m.layer === layer);

                // Hide empty layers? Or show empty state?
                // Show all to consistent stack

                return (
                    <div
                        key={layer}
                        className={cn(
                            "group relative overflow-hidden rounded-lg border-l-4 p-4 transition-all hover:shadow-md cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
                            LAYER_COLORS[layer].replace('bg-', 'border-l-') // simplistic color mapping
                        )}
                        onClick={() => handleLayerClick(layer)}
                        onContextMenu={(e) => handleContextMenu(e, layer)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("font-bold px-2 py-0.5 uppercase text-xs", LAYER_COLORS[layer])}>
                                    {layer}
                                </Badge>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {layerStat.count} files · {layerStat.loc} LOC
                                </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {layerModules.length > 0 ? (
                                layerModules.map((mod) => (
                                    <div
                                        key={mod.id}
                                        className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Navigate to module?
                                        }}
                                    >
                                        <Layers className="h-3 w-3 text-neutral-500" />
                                        {mod.name}
                                        <span className="text-xs text-neutral-400 font-mono">{mod.loc}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-xs text-neutral-400 italic">No explicit modules</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div >
    );
}
