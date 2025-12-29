import fs from "fs/promises";
import path from "path";

export async function summarizeRepo(dirPath: string): Promise<string> {
    // Try to read README.md
    try {
        // Check for README.md, readme.md, README.txt etc.
        const readmeName = (await fs.readdir(dirPath)).find(f => /^readme/i.test(f));

        if (readmeName) {
            const readme = await fs.readFile(path.join(dirPath, readmeName), "utf-8");

            // Split into lines and process
            const lines = readme.split(/\r?\n/);
            const meaningfulLines: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();

                // Skip empty lines
                if (!trimmed) continue;

                // Skip markdown badges (shields.io, etc.)
                if (trimmed.match(/^\[!\[.*?\]\(.*?\)\]\(.*?\)/) || trimmed.match(/^!\[.*?\]\(.*?\)/)) {
                    continue;
                }

                // Skip badge link references like [contributors-shield]: https://...
                if (trimmed.match(/^\[[\w-]+\]:\s*https?:\/\//)) {
                    continue;
                }

                // Skip HTML tags (like <div>, <p align="center">, etc.)
                if (trimmed.match(/^<[\w\s="'-]+>/) || trimmed.match(/^<\/\w+>$/)) {
                    continue;
                }

                // Skip headers (# Title)
                if (trimmed.match(/^#{1,6}\s/)) {
                    continue;
                }

                // Skip horizontal rules
                if (trimmed.match(/^[-*_]{3,}$/)) {
                    continue;
                }

                // Skip HTML comments
                if (trimmed.match(/^<!--/) || trimmed.match(/-->$/)) {
                    continue;
                }

                // This is likely meaningful content
                meaningfulLines.push(trimmed);

                // Stop after we have 2-3 sentences or ~300 chars
                const combined = meaningfulLines.join(' ');
                if (combined.length > 300 || (combined.match(/\./g) || []).length >= 2) {
                    break;
                }
            }

            const summary = meaningfulLines.join(' ').slice(0, 500);

            if (summary && summary.length > 20) {
                return summary;
            }
        }
    } catch (e) {
        // ignore
    }

    // fallback to package.json
    try {
        const pkg = JSON.parse(await fs.readFile(path.join(dirPath, "package.json"), "utf-8"));
        return pkg.description || "No description available.";
    } catch (e) {
        return "No description available.";
    }
}
