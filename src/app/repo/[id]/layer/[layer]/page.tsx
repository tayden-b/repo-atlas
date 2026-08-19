"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Layer } from "@/lib/analysis/types";
import { LAYER_META } from "@/lib/layers";

interface FileRow {
  id: string;
  path: string;
  loc: number;
  confidence: number;
  signals: string;
  moduleName: string | null;
  subcategory: string | null;
}

interface RepoInfo {
  id: string;
  repoUrl: string;
  defaultBranch: string;
  owner: string;
  name: string;
}

interface Signal {
  rule: string;
  strength: number;
}

function FilterChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] text-[#666]">{label}</span>
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          "rounded border px-2 py-px font-mono text-[11px] transition-colors",
          selected === null
            ? "border-[#555] bg-[#1c1c1c] text-[#ededed]"
            : "border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-[#bbb]",
        )}
      >
        all
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt === selected ? null : opt)}
          className={clsx(
            "rounded border px-2 py-px font-mono text-[11px] transition-colors",
            selected === opt
              ? "border-[#555] bg-[#1c1c1c] text-[#ededed]"
              : "border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-[#bbb]",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function LayerPage() {
  const { id, layer } = useParams();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repo/${id}`)
      .then((res) => res.json())
      .then(setRepo)
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    fetch(`/api/repo/${id}/layer/${layer}`)
      .then((res) => res.json())
      .then((data: FileRow[]) => {
        setFiles(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedFile(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, layer]);

  const subcats = useMemo(
    () => Array.from(new Set(files.map((f) => f.subcategory).filter((s): s is string => !!s))).sort(),
    [files],
  );
  const modules = useMemo(
    () => Array.from(new Set(files.map((f) => f.moduleName).filter((m): m is string => !!m))).sort(),
    [files],
  );
  const filteredFiles = useMemo(
    () =>
      files.filter(
        (f) =>
          (!selectedSubcat || f.subcategory === selectedSubcat) &&
          (!selectedModule || f.moduleName === selectedModule),
      ),
    [files, selectedSubcat, selectedModule],
  );

  // read-only source preview via raw.githubusercontent.com
  useEffect(() => {
    if (!selectedFile || !repo) return;
    const rawBase = repo.repoUrl.replace("github.com", "raw.githubusercontent.com");
    fetch(`${rawBase}/${repo.defaultBranch}/${selectedFile.path}`)
      .then((res) => (res.ok ? res.text() : "// could not fetch content (moved or binary)"))
      .then(setFileContent)
      .catch(() => setFileContent("// failed to load content"));
  }, [selectedFile, repo]);

  const layerKey = decodeURIComponent(layer as string).toUpperCase() as Layer;
  const meta = LAYER_META[layerKey];

  if (loading) {
    return <div className="py-20 text-center font-mono text-[12px] text-[#666]">loading…</div>;
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl flex-col px-4 py-4">
      <div className="mb-3 space-y-2">
        <Link
          href={`/repo/${id}`}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#777] transition-colors hover:text-[#ddd]"
        >
          <ArrowLeft size={11} /> {repo ? `${repo.owner}/${repo.name}` : "back"}
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className={clsx("font-mono text-[13px] font-medium uppercase tracking-wider", meta?.accent)}>
            {meta?.label ?? layerKey}
          </h1>
          <span className="font-mono text-[11px] text-[#777]">
            {filteredFiles.length} of {files.length} files
          </span>
        </div>
        <FilterChips label="type" options={subcats} selected={selectedSubcat} onSelect={setSelectedSubcat} />
        <FilterChips label="module" options={modules} selected={selectedModule} onSelect={setSelectedModule} />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded border border-[#262626]">
        {/* file list */}
        <div className="pane-scroll w-2/5 overflow-y-auto border-r border-[#262626] bg-[#0e0e0e] lg:w-1/3">
          {filteredFiles.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFile(f)}
              className={clsx(
                "block w-full border-b border-[#1a1a1a] px-3 py-2 text-left transition-colors last:border-0",
                selectedFile?.id === f.id ? "bg-[#161616]" : "hover:bg-[#111]",
              )}
            >
              <div className="break-all font-mono text-[12px] text-[#ddd]">{f.path}</div>
              <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[#666]">
                {f.moduleName && <span>{f.moduleName}</span>}
                <span>{f.loc} loc</span>
                <span>conf {(f.confidence * 100).toFixed(0)}%</span>
              </div>
            </button>
          ))}
        </div>

        {/* source preview */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#0a0a0a]">
          {selectedFile ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-[#262626] bg-[#0e0e0e] px-3 py-2">
                <div className="min-w-0">
                  <div className="break-all font-mono text-[12px] font-medium text-[#ededed]">
                    {selectedFile.path}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(JSON.parse(selectedFile.signals) as Signal[]).map((s, i) => (
                      <span
                        key={i}
                        className={clsx("rounded border px-1.5 py-px font-mono text-[10px]", meta?.chip)}
                        title={`score ${s.strength}`}
                      >
                        {s.rule}
                      </span>
                    ))}
                  </div>
                </div>
                {repo && (
                  <a
                    href={`${repo.repoUrl}/blob/${repo.defaultBranch}/${selectedFile.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded border border-[#333] p-1.5 text-[#888] transition-colors hover:border-[#555] hover:text-[#ddd]"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <pre className="pane-scroll flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-[#a0a6ad]">
                <code>{fileContent}</code>
              </pre>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center font-mono text-[12px] text-[#555]">
              select a file
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
