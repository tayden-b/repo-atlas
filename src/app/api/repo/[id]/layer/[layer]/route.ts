import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; layer: string }> }) {
    try {
        const { id, layer } = await params;

        // Validate layer enum/string if needed

        const files = await prisma.fileIndex.findMany({
            where: {
                repoId: id,
                layer: layer.toUpperCase()
            },
            orderBy: {
                loc: 'desc'
            },
            take: 100 // Limit for UI performance? Or pagination?
        });

        return NextResponse.json(files);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }
}
