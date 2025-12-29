import simpleGit from "simple-git";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const BASE_TEMP_DIR = path.join(os.tmpdir(), "repo-atlas");

export async function cloneRepo(repoUrl: string): Promise<{ path: string; id: string }> {
    const id = uuidv4();
    const targetDir = path.join(BASE_TEMP_DIR, id);

    await fs.mkdir(BASE_TEMP_DIR, { recursive: true });

    const git = simpleGit();

    // Clone with depth 100 to get some history for churn, but limit bandwidth
    // Use --single-branch to save more time
    await git.clone(repoUrl, targetDir, ["--depth", "100", "--single-branch"]);

    return { path: targetDir, id };
}

export async function cleanupRepo(dirPath: string) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`Failed to cleanup dir ${dirPath}:`, error);
    }
}
