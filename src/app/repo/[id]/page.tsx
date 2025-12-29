"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LayerStack } from "@/components/repo/layer-stack";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Github, Share } from "lucide-react";

export default function RepoPage() {
    const { id } = useParams();
    const router = useRouter();
    const [repo, setRepo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/repo/${id}`)
            .then(res => res.json())
            .then(data => {
                setRepo(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-4" /><Skeleton className="h-64 w-full" /></div>;
    }

    if (!repo || repo.error) {
        return <div className="p-8">Repo not found</div>;
    }

    const overviewStats = JSON.parse(repo.overviewStats);
    const layerStats = JSON.parse(repo.layerStats);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="-ml-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Github className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
                                {repo.owner} / {repo.name}
                            </h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                                {repo.description}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Share className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-neutral-200 dark:border-neutral-800">
                        <div>
                            <p className="text-sm text-neutral-500">Total Files</p>
                            <p className="text-2xl font-semibold">{overviewStats.totalFiles}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Total LOC</p>
                            <p className="text-2xl font-semibold">{overviewStats.totalLoc.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Analyzed At</p>
                            <p className="text-sm font-medium">{new Date(repo.createdAt).toLocaleDateString()}</p>
                        </div>
                        {/* Add Tech Stack heuristic here later */}
                    </div>
                </div>

                {/* Stack Viz */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Architecture Layers</h2>
                    <LayerStack
                        repoId={repo.id}
                        stats={layerStats}
                        modules={repo.modules}
                    />
                </div>
            </div>
        </div>
    );
}
