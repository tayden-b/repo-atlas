import { fetchRepoFiles } from "./github-fetcher";
import { classifyFile } from "./classifier";
import { Layer } from "./types";
import { prisma } from "../prisma";

export async function analyzeRepository(repoUrl: string) {
    // 1. Fetch files from GitHub (repo metadata + one tarball request)
    const { files: rawFiles, owner, repo: repoName, defaultBranch, description, truncated } =
        await fetchRepoFiles(repoUrl);

    // 2. Classify (Layer, Confidence)
    const analyzedFiles = rawFiles.map(file => classifyFile(file));

    // 3. Aggregate Stats
    const layerStats: Record<string, { count: number; loc: number }> = {};
    Object.values(Layer).forEach(l => layerStats[l] = { count: 0, loc: 0 });

    let totalLoc = 0;

    analyzedFiles.forEach(f => {
        layerStats[f.layer].count++;
        layerStats[f.layer].loc += f.loc;
        totalLoc += f.loc;
    });

    // 4. Save to DB. Re-analyzing a repo replaces its previous analysis
    // instead of stacking duplicates.
    const canonicalUrl = `https://github.com/${owner}/${repoName}`;
    const existing = await prisma.repoAnalysis.findFirst({ where: { repoUrl: canonicalUrl } });
    if (existing) {
        await prisma.$transaction([
            prisma.fileIndex.deleteMany({ where: { repoId: existing.id } }),
            prisma.moduleIndex.deleteMany({ where: { repoId: existing.id } }),
            prisma.repoAnalysis.delete({ where: { id: existing.id } }),
        ]);
    }

    const repo = await prisma.repoAnalysis.create({
        data: {
            repoUrl: canonicalUrl,
            owner,
            name: repoName,
            defaultBranch,
            description,
            overviewStats: JSON.stringify({
                totalFiles: analyzedFiles.length,
                totalLoc,
                truncated
            }),
            layerStats: JSON.stringify(layerStats),
            files: {
                create: analyzedFiles.map(f => ({
                    path: f.path,
                    extension: f.extension,
                    loc: f.loc,
                    layer: f.layer,
                    confidence: f.confidence,
                    signals: JSON.stringify(f.signals),
                    moduleName: f.module,
                    subcategory: f.subcategory
                }))
            }
        }
    });

    // 5. Aggregate Modules
    const moduleMap = new Map<string, { loc: number; confidenceSum: number; count: number; layers: Record<string, number> }>();

    for (const f of analyzedFiles) {
        if (!moduleMap.has(f.module)) {
            moduleMap.set(f.module, { loc: 0, confidenceSum: 0, count: 0, layers: {} });
        }
        const m = moduleMap.get(f.module)!;
        m.loc += f.loc;
        m.confidenceSum += f.confidence;
        m.count++;
        m.layers[f.layer] = (m.layers[f.layer] || 0) + 1;
    }

    const moduleEntries = [];
    for (const [name, stats] of moduleMap.entries()) {
        let domLayer = Layer.DOMAIN;
        let maxCount = 0;
        for (const [l, c] of Object.entries(stats.layers)) {
            if (c > maxCount) {
                maxCount = c;
                domLayer = l as Layer;
            }
        }

        moduleEntries.push({
            repoId: repo.id,
            name,
            layer: domLayer,
            loc: stats.loc,
            confidenceAvg: stats.count > 0 ? stats.confidenceSum / stats.count : 0
        });
    }

    await prisma.moduleIndex.createMany({
        data: moduleEntries
    });

    return repo;
}
