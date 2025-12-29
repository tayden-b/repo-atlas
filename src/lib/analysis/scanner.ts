import fs from "fs/promises";
import path from "path";
import simpleGit from "simple-git";

export interface RawFileStats {
    path: string; // relative path
    loc: number;
    churn: number;
    extension: string;
    snippet: string;
}

function isBinary(buffer: Buffer): boolean {
    // Simple heuristic: check for null bytes in the first 8000 bytes
    const chunk = buffer.subarray(0, Math.min(buffer.length, 8000));
    return chunk.includes(0);
}

export async function scanRepo(dirPath: string): Promise<RawFileStats[]> {
    const git = simpleGit(dirPath);

    // 1. Get List of files (committed)
    const filesStr = await git.raw(['ls-files']);
    const filePaths = filesStr.split('\n').filter(p => p.trim().length > 0);

    // 2. Compute Churn
    // git log --name-only --format=''
    // This gives a stream of filenames modified in commits.
    const logStr = await git.raw(['log', '--name-only', '--format=']);
    const churnMap = new Map<string, number>();

    logStr.split('\n').forEach(line => {
        const p = line.trim();
        if (!p) return;
        churnMap.set(p, (churnMap.get(p) || 0) + 1);
    });

    // 3. Process files (LOC)
    const results: RawFileStats[] = [];

    for (const relPath of filePaths) {
        const fullPath = path.join(dirPath, relPath);
        try {
            // Read as buffer first to check binary
            const buffer = await fs.readFile(fullPath);

            if (isBinary(buffer)) {
                continue; // Skip binary files for LOC/Classification for now
            }

            const content = buffer.toString('utf-8');
            const lines = content.split('\n');
            const loc = lines.length;
            const snippet = lines.slice(0, 50).join('\n');

            results.push({
                path: relPath,
                loc,
                churn: churnMap.get(relPath) || 0,
                extension: path.extname(relPath).toLowerCase(),
                snippet
            });
        } catch (e) {
            // ignore
            console.warn(`Failed to process file ${relPath}`, e);
        }
    }

    return results;
}
