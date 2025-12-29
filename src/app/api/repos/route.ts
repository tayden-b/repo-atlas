import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const repos = await prisma.repoAnalysis.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                owner: true,
                name: true,
                description: true,
                createdAt: true,
                repoUrl: true
            }
        });

        return NextResponse.json(repos);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
    }
}
