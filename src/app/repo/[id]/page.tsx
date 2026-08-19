"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { LayerStack } from "@/components/repo/layer-stack";
import { Layer } from "@/lib/analysis/types";

interface RepoDetail {
  id: string;
  owner: string;
  name: string;
  repoUrl: string;
  defaultBranch: string;
  description: string | null;
  createdAt: string;
  overviewStats: string;
  layerStats: string;
  modules: Array<{ id: string; name: string; layer: string; loc: number; confidenceAvg: number }>;
  error?: string;
}

export default function RepoPage() {
  const { id } = useParams();
  const [repo, setRepo] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/repo/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRepo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center font-mono text-[12px] text-[#666]">loading…</div>;
  }

  if (!repo || repo.error) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] text-[#999]">Analysis not found.</p>
        <Link href="/" className="mt-2 inline-block text-[12px] text-[#58a6ff] hover:underline">
          Back to Repo Atlas
        </Link>
      </div>
    );
  }

  const overviewStats = JSON.parse(repo.overviewStats) as {
    totalFiles: number;
    totalLoc: number;
    truncated?: boolean;
  };
  const layerStats = JSON.parse(repo.layerStats) as Record<Layer, { count: number; loc: number }>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] text-[#777] transition-colors hover:text-[#ddd]"
      >
        <ArrowLeft size={11} /> repo-atlas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold tracking-tight">
            {repo.owner}/{repo.name}
          </h1>
          {repo.description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#999]">
              {repo.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#777]">
            <span>{overviewStats.totalFiles.toLocaleString()} files</span>
            <span>{overviewStats.totalLoc.toLocaleString()} loc</span>
            <span>branch: {repo.defaultBranch}</span>
            <span>analyzed {new Date(repo.createdAt).toLocaleDateString()}</span>
            {overviewStats.truncated && (
              <span className="text-amber-500">truncated to first 2000 files</span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded border border-[#333] bg-[#161616] px-2.5 py-1.5 text-[12px] text-[#bbb] transition-colors hover:border-[#555] hover:text-[#ededed]"
          >
            <ExternalLink size={12} /> GitHub
          </a>
          <a
            href={`/api/repo/${repo.id}/export`}
            className="flex items-center gap-1.5 rounded border border-[#333] bg-[#161616] px-2.5 py-1.5 text-[12px] text-[#bbb] transition-colors hover:border-[#555] hover:text-[#ededed]"
          >
            <Download size={12} /> Report
          </a>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-[#777]">
          architecture layers
        </h2>
        <LayerStack repoId={repo.id} stats={layerStats} modules={repo.modules} />
      </div>
    </main>
  );
}
