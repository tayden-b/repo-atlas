import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/analysis";
import { parseGitHubUrl } from "@/lib/analysis/github-fetcher";

// Big repos take a while to download and classify; don't let the platform
// default cut the analysis off.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const { repoUrl } = await req.json();

        if (!repoUrl || typeof repoUrl !== "string") {
            return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
        }
        if (!parseGitHubUrl(repoUrl)) {
            return NextResponse.json(
                { error: "Expected a GitHub repository URL like https://github.com/owner/repo" },
                { status: 400 }
            );
        }

        const result = await analyzeRepository(repoUrl);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Analysis failed:", error);
        const message = error instanceof Error ? error.message : "Failed to analyze repo";
        const status = /Not Found/i.test(message) ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
