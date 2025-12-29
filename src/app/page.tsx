"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Github, ArrowRight } from "lucide-react";

interface RecentRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
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

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      router.push(`/repo/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Repo Atlas
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Understand any GitHub repository clearly with automated architecture layers.
          </p>
        </div>

        <Card className="shadow-lg border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle>Analyze a Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="flex gap-2">
              <Input
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analyze
              </Button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {recent.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">Recent Analyses</h2>
            <div className="grid gap-3">
              {recent.map((repo) => (
                <Card
                  key={repo.id}
                  className="hover:border-neutral-400 cursor-pointer transition-colors"
                  onClick={() => router.push(`/repo/${repo.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-neutral-500" />
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {repo.owner}/{repo.name}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                        {repo.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
