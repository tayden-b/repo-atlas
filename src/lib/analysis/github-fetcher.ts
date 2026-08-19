import { Octokit } from "@octokit/rest";
import { gunzipSync } from "zlib";
import { RawFileStats } from "./types";

// The whole repo comes down as one tarball request instead of one API call
// per file. That keeps an analysis inside two GitHub requests total (repo
// metadata + archive), which survives serverless timeouts and barely dents
// the unauthenticated rate limit.

const MAX_FILES = 2000;
const MAX_FILE_BYTES = 200 * 1024; // skip generated bundles / vendored blobs
const MAX_TARBALL_BYTES = 80 * 1024 * 1024;

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // optional: raises the rate limit
});

export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
    const match = repoUrl
        .trim()
        .match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

export async function fetchRepoFiles(repoUrl: string): Promise<{
    files: RawFileStats[];
    owner: string;
    repo: string;
    defaultBranch: string;
    description: string;
    truncated: boolean;
}> {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error("Not a valid GitHub repository URL");
    const { owner, repo } = parsed;

    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;
    const description = repoData.description || "No description available.";

    const { data: archive } = await octokit.repos.downloadTarballArchive({
        owner,
        repo,
        ref: defaultBranch,
    });

    const compressed = Buffer.from(archive as ArrayBuffer);
    if (compressed.byteLength > MAX_TARBALL_BYTES) {
        throw new Error("Repository archive is too large to analyze (>80MB compressed)");
    }
    const tar = gunzipSync(compressed);

    const files: RawFileStats[] = [];
    let truncated = false;

    // Plain ustar walk: 512-byte headers, file data padded to 512-byte blocks.
    let offset = 0;
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        if (header[0] === 0) break; // two zero blocks mark the end

        const name = readTarString(header, 0, 100);
        const prefix = readTarString(header, 345, 155);
        const size = parseInt(readTarString(header, 124, 12), 8) || 0;
        const typeflag = String.fromCharCode(header[156]);
        const dataStart = offset + 512;
        offset = dataStart + Math.ceil(size / 512) * 512;

        if (typeflag !== "0" && typeflag !== "\0") continue; // dirs, symlinks, pax headers
        // strip the leading "owner-repo-sha/" segment GitHub adds
        const fullName = prefix ? `${prefix}/${name}` : name;
        const path = fullName.split("/").slice(1).join("/");
        if (!path || isBinaryPath(path) || size === 0 || size > MAX_FILE_BYTES) continue;
        if (files.length >= MAX_FILES) {
            truncated = true;
            break;
        }

        const content = tar.subarray(dataStart, dataStart + size);
        if (content.includes(0)) continue; // binary content without a known extension
        const text = content.toString("utf-8");
        const lines = text.split("\n");

        files.push({
            path,
            loc: lines.length,
            extension: getExtension(path),
            snippet: lines.slice(0, 50).join("\n"),
        });
    }

    return { files, owner, repo, defaultBranch, description, truncated };
}

function readTarString(buf: Buffer, start: number, length: number): string {
    const slice = buf.subarray(start, start + length);
    const end = slice.indexOf(0);
    return slice.subarray(0, end === -1 ? length : end).toString("utf-8").trim();
}

function getExtension(filePath: string): string {
    const base = filePath.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    return dot > 0 ? base.slice(dot).toLowerCase() : "";
}

const BINARY_EXTENSIONS = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".svg",
    ".pdf", ".zip", ".tar", ".gz", ".exe", ".dll", ".bin", ".wasm",
    ".so", ".dylib", ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".mp3", ".wav", ".avi", ".mov", ".lock",
]);

function isBinaryPath(filePath: string): boolean {
    return BINARY_EXTENSIONS.has(getExtension(filePath));
}
