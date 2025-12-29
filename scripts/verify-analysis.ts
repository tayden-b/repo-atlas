import { analyzeRepository } from "../src/lib/analysis/index";
import { prisma } from "../src/lib/prisma";

async function main() {
    const repoUrl = "https://github.com/reduxjs/redux"; // Small, well-known repo
    console.log(`Analyzing ${repoUrl}...`);

    try {
        const result = await analyzeRepository(repoUrl);
        console.log("Analysis complete!");
        console.log("Repo ID:", result.id);
        console.log("Name:", result.name);
        console.log("Description:", result.description);
        console.log("Overview Stats:", result.overviewStats);

        // Verify DB
        const count = await prisma.fileIndex.count({ where: { repoId: result.id } });
        console.log("File Count in DB:", count);

        if (count > 0) {
            console.log("✅ backend verification passed");
        } else {
            console.error("❌ No files stored");
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

main();
