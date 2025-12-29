import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Layer } from "@/lib/analysis/types";

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
            return new NextResponse("Repo not found", { status: 404 });
        }

        const overview = JSON.parse(repo.overviewStats);
        const layerStats = JSON.parse(repo.layerStats);

        let md = `# Report: ${repo.owner}/${repo.name}\n\n`;
        md += `${repo.description}\n\n`;
        md += `**Repo URL:** ${repo.repoUrl}\n`;
        md += `**Analyzed At:** ${repo.createdAt.toISOString()}\n\n`;

        md += `## Overview\n`;
        md += `- **Total Files:** ${overview.totalFiles}\n`;
        md += `- **Total LOC:** ${overview.totalLoc}\n\n`;

        md += `## Architecture Layers\n\n`;

        const layers = [Layer.PRESENTATION, Layer.APPLICATION, Layer.DOMAIN, Layer.INFRASTRUCTURE, Layer.TOOLING];

        for (const layer of layers) {
            const stats = layerStats[layer];
            if (!stats || stats.count === 0) continue;

            md += `### ${layer}\n`;
            md += `- Files: ${stats.count}\n`;
            md += `- LOC: ${stats.loc}\n`;

            const modules = repo.modules.filter(m => m.layer === layer);
            if (modules.length > 0) {
                md += `\n**Key Modules:**\n`;
                modules.forEach(m => {
                    md += `- \`${m.name}\` (${m.loc} LOC)\n`;
                });
            }
            md += `\n`;
        }

        return new NextResponse(md, {
            headers: {
                "Content-Type": "text/markdown",
                "Content-Disposition": `attachment; filename="${repo.name}-report.md"`
            }
        });

    } catch (error) {
        return new NextResponse("Failed to generate report", { status: 500 });
    }
}
