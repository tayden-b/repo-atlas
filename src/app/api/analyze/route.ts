import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/analysis";

export async function POST(req: NextRequest) {
    try {
        const { repoUrl } = await req.json();

        if (!repoUrl) {
            return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
        }

        // TODO: Validate URL format

        const result = await analyzeRepository(repoUrl);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Analysis failed:", error);
        return NextResponse.json({ error: "Failed to analyze repo" }, { status: 500 });
    }
}
