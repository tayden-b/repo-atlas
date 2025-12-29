"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileCode, ExternalLink, Info } from "lucide-react";

export default function LayerPage() {
    const { id, layer } = useParams();
    const router = useRouter();
    const [files, setFiles] = useState<any[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
    const [subcats, setSubcats] = useState<string[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [repo, setRepo] = useState<any>(null); // Need repo for URL/Branch
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [fileContent, setFileContent] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch Repo info
    useEffect(() => {
        fetch(`/api/repo/${id}`).then(res => res.json()).then(setRepo);
    }, [id]);

    // Fetch Files
    useEffect(() => {
        fetch(`/api/repo/${id}/layer/${layer}`)
            .then(res => res.json())
            .then(data => {
                setFiles(data);
                setFilteredFiles(data);

                // Extract Subcats
                const sc = Array.from(new Set(data.map((f: any) => f.subcategory).filter(Boolean))) as string[];
                setSubcats(sc);

                // Extract Modules
                const mods = Array.from(new Set(data.map((f: any) => f.moduleName).filter(Boolean))) as string[];
                setModules(mods.sort());

                if (data.length > 0) setSelectedFile(data[0]);
                setLoading(false);
            });
    }, [id, layer]);

    // Filter Effect
    useEffect(() => {
        let filtered = files;

        // Apply subcategory filter
        if (selectedSubcat) {
            filtered = filtered.filter(f => f.subcategory === selectedSubcat);
        }

        // Apply module filter
        if (selectedModule) {
            filtered = filtered.filter(f => f.moduleName === selectedModule);
        }

        setFilteredFiles(filtered);
    }, [selectedSubcat, selectedModule, files]);

    // Fetch Content
    useEffect(() => {
        if (!selectedFile || !repo) return;

        // Construct Raw URL
        // repo.repoUrl: https://github.com/owner/name
        // raw: https://raw.githubusercontent.com/owner/name/branch/path
        const rawBase = repo.repoUrl.replace("github.com", "raw.githubusercontent.com");
        const url = `${rawBase}/${repo.defaultBranch}/${selectedFile.path}`;

        fetch(url)
            .then(res => {
                if (res.ok) return res.text();
                return "Error fetching content (might be private or binary)";
            })
            .then(setFileContent)
            .catch(() => setFileContent("Failed to load content"));

    }, [selectedFile, repo]);

    const decodedLayer = decodeURIComponent(layer as string).toUpperCase();

    if (loading) return <div className="p-12">Loading layer data...</div>;

    return (
        <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <div className="border-b bg-white dark:bg-neutral-900 px-6 py-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/repo/${id}`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {decodedLayer} Layer
                                <Badge variant="secondary">{files.length} files</Badge>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Subcategory Filters */}
                {subcats.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs text-neutral-500 font-medium">Filter by Type:</div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <Badge
                                variant={selectedSubcat === null ? "default" : "outline"}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedSubcat(null)}
                            >
                                All
                            </Badge>
                            {subcats.sort().map(sc => (
                                <Badge
                                    key={sc}
                                    variant={selectedSubcat === sc ? "default" : "outline"}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedSubcat(sc)}
                                >
                                    {sc}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Module Filters */}
                {modules.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs text-neutral-500 font-medium">Filter by Module:</div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <Badge
                                variant={selectedModule === null ? "default" : "outline"}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedModule(null)}
                            >
                                All
                            </Badge>
                            {modules.map(mod => (
                                <Badge
                                    key={mod}
                                    variant={selectedModule === mod ? "default" : "outline"}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedModule(mod)}
                                >
                                    {mod}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Sidebar File List */}
                <div className="w-1/3 border-r bg-white dark:bg-neutral-900 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredFiles.map(f => (
                            <div
                                key={f.id}
                                className={`p-3 rounded-md cursor-pointer border hover:border-blue-400 transition-colors ${selectedFile?.id === f.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'border-transparent'}`}
                                onClick={() => setSelectedFile(f)}
                            >
                                <div className="flex items-center gap-2 font-medium text-sm text-neutral-800 dark:text-neutral-200 break-all">
                                    <FileCode className="h-4 w-4 text-neutral-500" />
                                    {f.path}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">{f.moduleName || 'root'}</Badge>
                                    <span>{f.loc} LOC</span>
                                    <span>{(f.confidence * 100).toFixed(0)}% Conf</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Code View */}
                <div className="w-2/3 flex flex-col bg-neutral-50 dark:bg-neutral-950">
                    {selectedFile ? (
                        <>
                            <div className="p-4 border-b flex items-start justify-between bg-white dark:bg-neutral-900">
                                <div>
                                    <h2 className="font-semibold text-lg">{selectedFile.path}</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {JSON.parse(selectedFile.signals).map((s: any, i: number) => (
                                            <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Info className="h-3 w-3" /> {s.description}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`${repo?.repoUrl}/blob/${repo?.defaultBranch}/${selectedFile.path}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto">
                                <pre className="text-sm font-mono bg-white dark:bg-neutral-900 p-4 rounded-md border overflow-x-auto">
                                    <code>{fileContent}</code>
                                </pre>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-neutral-400">
                            Select a file to view content
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
