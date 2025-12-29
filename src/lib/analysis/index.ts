import { cloneRepo, cleanupRepo } from "./cloner";
import { scanRepo } from "./scanner";
import { classifyFile } from "./classifier";
import { summarizeRepo } from "./summarizer";
import { Layer } from "./types";
import { prisma } from "../prisma";
import simpleGit from "simple-git";

export async function analyzeRepository(repoUrl: string) {
    // 1. Clone
    const { path: repoDir } = await cloneRepo(repoUrl);

    try {
        // 2. Scan (Files, LOC, Churn, Snippets)
        const rawFiles = await scanRepo(repoDir);

        // Get default branch
        const git = simpleGit(repoDir);
        let branch = "HEAD";
        try {
            branch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
        } catch (e) {
            console.warn("Failed to determine branch", e);
        }

        // 3. Classify (Layer, Confidence)
        const analyzedFiles = rawFiles.map(file => classifyFile(file));

        // 4. Summarize (README, Stats)
        const description = await summarizeRepo(repoDir);

        // 5. Aggregate Stats
        const layerStats: Record<string, { count: number; loc: number }> = {};
        Object.values(Layer).forEach(l => layerStats[l] = { count: 0, loc: 0 });

        let totalLoc = 0;

        analyzedFiles.forEach(f => {
            layerStats[f.layer].count++;
            layerStats[f.layer].loc += f.loc;
            totalLoc += f.loc;
        });

        // 6. Save to DB
        const parts = repoUrl.split('/');
        const cleanName = parts[parts.length - 1].replace('.git', '');
        const owner = parts[parts.length - 2] || 'unknown';

        const repo = await prisma.repoAnalysis.create({
            data: {
                repoUrl,
                owner,
                name: cleanName,
                defaultBranch: branch,
                description,
                overviewStats: JSON.stringify({
                    totalFiles: analyzedFiles.length,
                    totalLoc
                }),
                layerStats: JSON.stringify(layerStats),
                files: {
                    create: analyzedFiles.map(f => ({
                        path: f.path,
                        extension: f.extension,
                        loc: f.loc,
                        churnScore: f.churn,
                        layer: f.layer,
                        confidence: f.confidence,
                        signals: JSON.stringify(f.signals),
                        moduleName: f.module
                    }))
                }
            }
        });

        // 7. Aggregate Modules
        const moduleMap = new Map<string, { loc: number; churnSum: number; count: number; layers: Record<string, number> }>();

        for (const f of analyzedFiles) {
            if (!moduleMap.has(f.module)) {
                moduleMap.set(f.module, { loc: 0, churnSum: 0, count: 0, layers: {} });
            }
            const m = moduleMap.get(f.module)!;
            m.loc += f.loc;
            m.churnSum += f.churn;
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
                churnAvg: stats.count > 0 ? stats.churnSum / stats.count : 0,
                confidenceAvg: 0.8
            });
        }

        await prisma.moduleIndex.createMany({
            data: moduleEntries
        });

        return repo;

    } finally {
        await cleanupRepo(repoDir);
    }
}
