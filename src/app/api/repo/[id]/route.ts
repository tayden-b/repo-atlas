import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const repo = await prisma.repoAnalysis.findUnique({
            where: { id },
            include: {
                modules: true
            }
        });

        if (!repo) {
            return NextResponse.json({ error: "Repo not found" }, { status: 404 });
        }

        return NextResponse.json(repo);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch repo" }, { status: 500 });
    }
}
