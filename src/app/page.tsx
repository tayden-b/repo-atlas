"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

interface RecentRepo {
  id: string;
  name: string;
  owner: string;
  description: string | null;
  createdAt: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<RecentRepo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/repos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecent(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      router.push(`/repo/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          See the shape of any codebase.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#888]">
          Paste a public GitHub repo. Every file gets classified into five architecture layers —
          presentation, application, domain, infrastructure, tooling — by a scored rule engine
          reading paths, extensions, and content. One tarball request, no cloning.
        </p>

        <form onSubmit={handleAnalyze} className="mt-6 flex gap-2">
          <input
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="h-9 flex-1 rounded border border-[#333] bg-[#111] px-3 font-mono text-[12px] text-[#ededed] placeholder-[#555] outline-none transition-colors focus:border-[#666] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="flex h-9 items-center gap-2 rounded border border-[#333] bg-[#161616] px-4 text-[13px] font-medium transition-colors hover:border-[#555] hover:bg-[#1c1c1c] disabled:cursor-default disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin text-[#888]" />}
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </form>
        {error && <p className="mt-2 font-mono text-[12px] text-red-400">{error}</p>}
        {loading && (
          <p className="mt-2 font-mono text-[11px] text-[#666]">
            downloading archive, classifying files — bigger repos take longer
          </p>
        )}
      </div>

      {recent.length > 0 && (
        <div className="mx-auto mt-14 max-w-xl">
          <h2 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-[#777]">
            recent analyses
          </h2>
          <div className="overflow-hidden rounded border border-[#262626]">
            {recent.map((repo) => (
              <button
                key={repo.id}
                onClick={() => router.push(`/repo/${repo.id}`)}
                className="group flex w-full items-center justify-between border-b border-[#1a1a1a] px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-[#111]"
              >
                <div className="min-w-0">
                  <span className="text-[13px] font-medium">
                    {repo.owner}/{repo.name}
                  </span>
                  {repo.description && (
                    <p className="mt-0.5 truncate text-[12px] text-[#777]">{repo.description}</p>
                  )}
                </div>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-[#444] transition-colors group-hover:text-[#999]"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
