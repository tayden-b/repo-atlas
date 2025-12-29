import { Octokit } from "@octokit/rest";
import { RawFileStats } from "./scanner";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // Optional: increases rate limit
});

interface GitHubFile {
    path: string;
    type: string;
    size: number;
    sha: string;
}

export async function fetchRepoFiles(repoUrl: string): Promise<{
    files: RawFileStats[];
    owner: string;
    repo: string;
    defaultBranch: string;
    description: string;
}> {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        throw new Error("Invalid GitHub URL");
    }

    const [, owner, repoName] = match;
    const repo = repoName.replace(/\.git$/, "");

    // Get repository info
    const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
    });

    const defaultBranch = repoData.default_branch;
    const description = repoData.description || "No description available.";

    // Get repository tree (all files)
    const { data: treeData } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: "true",
    });

    // Filter to only files (not directories)
    const fileEntries = (treeData.tree as GitHubFile[]).filter(
        (item) => item.type === "blob" && !isBinary(item.path)
    );

    // Limit to first 500 files to avoid rate limits and timeouts
    const limitedFiles = fileEntries.slice(0, 500);

    // Fetch file contents and analyze
    const files: RawFileStats[] = [];

    for (const file of limitedFiles) {
        try {
            // Fetch file content
            const { data: contentData } = await octokit.repos.getContent({
                owner,
                repo,
                path: file.path,
                ref: defaultBranch,
            });

            if ("content" in contentData && contentData.content) {
                const content = Buffer.from(contentData.content, "base64").toString("utf-8");
                const lines = content.split("\n");
                const loc = lines.length;
                const snippet = lines.slice(0, 50).join("\n");

                const extension = getExtension(file.path);

                files.push({
                    path: file.path,
                    loc,
                    churn: 0, // GitHub API doesn't provide churn easily
                    extension,
                    snippet,
                });
            }
        } catch (error) {
            // Skip files that can't be fetched (too large, binary, etc.)
            console.warn(`Skipping file ${file.path}:`, error);
            continue;
        }
    }

    return {
        files,
        owner,
        repo,
        defaultBranch,
        description,
    };
}

function getExtension(filePath: string): string {
    const parts = filePath.split(".");
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : "";
}

function isBinary(filePath: string): boolean {
    const binaryExtensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
        ".pdf", ".zip", ".tar", ".gz", ".exe", ".dll",
        ".so", ".dylib", ".woff", ".woff2", ".ttf", ".eot",
        ".mp4", ".mp3", ".wav", ".avi", ".mov",
    ];

    const ext = getExtension(filePath);
    return binaryExtensions.includes(ext);
}
