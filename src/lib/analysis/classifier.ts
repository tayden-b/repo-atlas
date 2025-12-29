import { Layer, FileAnalysisResult, FileSignal } from "./types";
import { RawFileStats } from "./scanner";
import path from "path";

interface Rule {
    id: string;
    pattern: RegExp | string; // regex for path/content, or exact for ext
    type: "PATH" | "EXT" | "CONTENT";
    layer: Layer;
    score: number;
    subcat?: string;
}

const RULES: Rule[] = [
    // =========================================================================
    // 1. PRESENTATION LAYER
    // "The Face": UI, API Routes, CLI Commands
    // =========================================================================

    // Web UI
    { id: "pres-web-folder", pattern: /(^|\/)(ui|views|pages|components|frontend|web|public|assets|styles)(\/|$)/i, type: "PATH", layer: Layer.PRESENTATION, score: 5, subcat: "Web UI" },
    { id: "pres-web-ext", pattern: /^\.(tsx|jsx|css|scss|less|sass|vue|svelte|html)$/i, type: "EXT", layer: Layer.PRESENTATION, score: 5, subcat: "Web UI" },

    // Next.js App Router Special Files
    { id: "pres-next-app", pattern: /(^|\/)(page|layout|loading|template|error|not-found|global-error|route)\.(tsx|jsx|js|ts)$/i, type: "PATH", layer: Layer.PRESENTATION, score: 6, subcat: "Web UI" },

    // API Routes (moved from old API layer)
    { id: "pres-api-routes", pattern: /(^|\/)(api|routes|endpoints|graphql|rpc)(\/|$)/i, type: "PATH", layer: Layer.PRESENTATION, score: 5, subcat: "API Route" },
    { id: "pres-api-content", pattern: /(@Controller|@Get|@Post|router\.|app\.get|ServeHTTP|func.*Handler)/i, type: "CONTENT", layer: Layer.PRESENTATION, score: 4, subcat: "API Route" },

    // CLI / Terminal
    { id: "pres-cli-folder", pattern: /(^|\/)(cmd|cli|commands)(\/|$)/i, type: "PATH", layer: Layer.PRESENTATION, score: 5, subcat: "CLI Command" },
    { id: "pres-cli-content", pattern: /cobra\.Command|flags\.String|console\.log|print\(/i, type: "CONTENT", layer: Layer.PRESENTATION, score: 2, subcat: "CLI Command" },

    // =========================================================================
    // 2. APPLICATION LAYER
    // "The Brain": Logic, State, Orchestration
    // =========================================================================

    // Business Logic / Services
    { id: "app-service", pattern: /(^|\/)(services|usecases|logic|hooks|actions)(\/|$)/i, type: "PATH", layer: Layer.APPLICATION, score: 5, subcat: "Service" },
    { id: "app-service-content", pattern: /class.*Service|type.*UseCase|function.*Hook/i, type: "CONTENT", layer: Layer.APPLICATION, score: 4, subcat: "Service" },

    // State Management (Redux, Stores)
    { id: "app-state", pattern: /(^|\/)(store|state|reducers|slices|atoms|context)(\/|$)/i, type: "PATH", layer: Layer.APPLICATION, score: 5, subcat: "State Management" },
    { id: "app-state-content", pattern: /createSlice|configureStore|createStore|RecoilRoot|atom\(|createContext|dispatch\(/i, type: "CONTENT", layer: Layer.APPLICATION, score: 4, subcat: "State Management" },

    // Controllers (if logic heavy, else Presentation. Often App layer in MVC)
    { id: "app-controller", pattern: /(^|\/)(controllers)(\/|$)/i, type: "PATH", layer: Layer.APPLICATION, score: 4, subcat: "Controller" },

    // Workflows / Jobs
    { id: "app-jobs", pattern: /(^|\/)(jobs|workers|queues|tasks)(\/|$)/i, type: "PATH", layer: Layer.APPLICATION, score: 5, subcat: "Job/Worker" },


    // =========================================================================
    // 3. DOMAIN LAYER
    // "The Core": Entities, Types, Constants, Pure Utils
    // =========================================================================

    // Models / Entities
    { id: "dom-model", pattern: /(^|\/)(models|entities|domain|schemas|dtos|dto)(\/|$)/i, type: "PATH", layer: Layer.DOMAIN, score: 6, subcat: "Model" },
    { id: "dom-types", pattern: /(^|\/)(types|interfaces)(\/|$)/i, type: "PATH", layer: Layer.DOMAIN, score: 6, subcat: "Type/Interface" },

    // Core Utilities (moved from Shared)
    { id: "dom-util", pattern: /(^|\/)(utils|util|lib|helpers|validations|common|shared)(\/|$)/i, type: "PATH", layer: Layer.DOMAIN, score: 4, subcat: "Utility" },

    // Config / Constants
    { id: "dom-const", pattern: /(^|\/)(constants|config|enums)(\/|$)/i, type: "PATH", layer: Layer.DOMAIN, score: 5, subcat: "Constant/Config" },


    // =========================================================================
    // 4. INFRASTRUCTURE LAYER
    // "The Plumbing": DB, External IO, Adapters
    // =========================================================================

    // Database
    // Database
    { id: "infra-db-folder", pattern: /(^|\/)(db|database|prisma|drizzle|sql|migrations|seeds|data)(\/|$)/i, type: "PATH", layer: Layer.INFRASTRUCTURE, score: 6, subcat: "Database" },
    { id: "infra-db-ext", pattern: /^\.(sql|prisma|db|sqlite)$/i, type: "EXT", layer: Layer.INFRASTRUCTURE, score: 6, subcat: "Database" },
    { id: "infra-repo", pattern: /(^|\/)(repositories|dao|store)(\/|$)/i, type: "PATH", layer: Layer.INFRASTRUCTURE, score: 5, subcat: "Repository" },

    // External Clients / Adapters
    { id: "infra-client", pattern: /(^|\/)(clients|adapters|providers|integrations|sdk|webhooks)(\/|$)/i, type: "PATH", layer: Layer.INFRASTRUCTURE, score: 5, subcat: "Adapter" },
    { id: "infra-content", pattern: /fetch\(|axios\.|grpc\.|s3\.|aws-sdk|pg\.|mysql\./i, type: "CONTENT", layer: Layer.INFRASTRUCTURE, score: 3, subcat: "Adapter" },


    // =========================================================================
    // 5. TOOLING LAYER
    // "The Support": Tests, Builds, CI, Docs
    // =========================================================================

    // Configuration / Build
    { id: "tool-config-files", pattern: /^(package\.json|go\.mod|requirements\.txt|tsconfig\.json|\.gitignore|Dockerfile|Makefile|docker-compose.*)$/i, type: "PATH", layer: Layer.TOOLING, score: 7, subcat: "Configuration" },
    { id: "tool-config-folder", pattern: /(^|\/)(build|dist|deploy|scripts|infra|terraform|.github|k8s)(\/|$)/i, type: "PATH", layer: Layer.TOOLING, score: 6, subcat: "Configuration" },
    { id: "tool-infra-ext", pattern: /^\.(tf|tfvars|yaml|yml|toml|conf|xml|gradle)$/i, type: "EXT", layer: Layer.TOOLING, score: 2, subcat: "Configuration" },

    // Tests
    { id: "tool-test-folder", pattern: /(^|\/)(test|tests|__tests__|spec|e2e|cypress)(\/|$)/i, type: "PATH", layer: Layer.TOOLING, score: 7, subcat: "Test" },
    { id: "tool-test-file", pattern: /(\.|_)(test|spec)\./i, type: "PATH", layer: Layer.TOOLING, score: 7, subcat: "Test" },
    { id: "tool-test-content", pattern: /(describe\(|it\(|expect\(|assert\.|TestMain)/i, type: "CONTENT", layer: Layer.TOOLING, score: 4, subcat: "Test" },

    // Documentation
    { id: "tool-docs", pattern: /(^|\/)(docs|documentation)(\/|$)/i, type: "PATH", layer: Layer.TOOLING, score: 6, subcat: "Documentation" },
    { id: "tool-docs-file", pattern: /^(README|LICENSE|CHANGELOG).*$/i, type: "PATH", layer: Layer.TOOLING, score: 7, subcat: "Documentation" },
    { id: "tool-docs-ext", pattern: /^\.(md|txt)$/i, type: "EXT", layer: Layer.TOOLING, score: 2, subcat: "Documentation" },
];

export function classifyFile(file: RawFileStats): FileAnalysisResult {
    const scores: Record<Layer, number> = {
        [Layer.PRESENTATION]: 0,
        [Layer.APPLICATION]: 0,
        [Layer.DOMAIN]: 0,
        [Layer.INFRASTRUCTURE]: 0,
        [Layer.TOOLING]: 0,
    };

    const signals: FileSignal[] = [];

    // Evaluate Rules
    for (const rule of RULES) {
        let matched = false;

        if (rule.type === "PATH") {
            if (typeof rule.pattern === 'string') matched = file.path.includes(rule.pattern);
            else matched = rule.pattern.test(file.path);
        } else if (rule.type === "EXT") {
            if (typeof rule.pattern === 'string') matched = file.extension === rule.pattern;
            else matched = rule.pattern.test(file.extension);
        } else if (rule.type === "CONTENT") {
            if (typeof rule.pattern === 'string') matched = file.snippet.includes(rule.pattern);
            else matched = rule.pattern.test(file.snippet);
        }

        if (matched) {
            scores[rule.layer] += rule.score;
            signals.push({ rule: rule.id, strength: rule.score, description: `Matched ${rule.id}` });
        }
    }

    // Determine Winner
    let bestLayer = Layer.DOMAIN; // Default for code that doesn't match specific layers
    let maxScore = 0;

    for (const [layer, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestLayer = layer as Layer;
        }
    }

    // Heuristic: If it's a code file (ts/js/go/py) and score is 0, map to DOMAIN (likely utility/logic).
    // If it's config-like (json/yaml) and score is 0, map to TOOLING.
    if (maxScore === 0) {
        if (/^\.(ts|js|go|py|java|cs|rb)$/i.test(file.extension)) bestLayer = Layer.DOMAIN;
        else if (/^\.(json|yaml|yml|xml|toml)$/i.test(file.extension)) bestLayer = Layer.TOOLING;
    }

    const confidence = Math.min(maxScore / 7, 1);

    // Determine Best Subcategory
    let bestSubcat: string | undefined = undefined;
    let maxSubcatScore = -1;

    for (const rule of RULES) {
        if (rule.layer !== bestLayer) continue;
        if (!rule.subcat) continue;

        let matched = false;
        if (rule.type === "PATH") {
            if (typeof rule.pattern === 'string') matched = file.path.includes(rule.pattern);
            else matched = rule.pattern.test(file.path);
        } else if (rule.type === "EXT") {
            if (typeof rule.pattern === 'string') matched = file.extension === rule.pattern;
            else matched = rule.pattern.test(file.extension);
        } else if (rule.type === "CONTENT") {
            if (typeof rule.pattern === 'string') matched = file.snippet.includes(rule.pattern);
            else matched = rule.pattern.test(file.snippet);
        }

        if (matched && rule.score > maxSubcatScore) {
            maxSubcatScore = rule.score;
            bestSubcat = rule.subcat;
        }
    }

    // Inferred Module
    return {
        path: file.path,
        extension: file.extension,
        loc: file.loc,
        churn: file.churn,
        layer: bestLayer,
        subcategory: bestSubcat,
        confidence,
        signals,
        module: getModuleName(file.path)
    };
}

function getModuleName(filePath: string): string {
    const parts = filePath.split(path.sep);
    let p = 0;

    // 1. Skip structural roots (ignore completely)
    const SKIP_ROOTS = new Set(['src', 'source', 'dist', 'build', 'out', '.next', 'public']);
    while (p < parts.length && SKIP_ROOTS.has(parts[p])) {
        p++;
    }

    if (p >= parts.length) return "(root)";

    // 2. Check for Passthrough Roots (drill deeper if child exists)
    // "app/page.tsx" -> "app" (keep if no child dir)
    // "app/api/users" -> "api/users" (skip app)
    // "lib/utils.ts" -> "lib"
    // "lib/analysis/scanner.ts" -> "analysis"
    const PASSTHROUGH_ROOTS = new Set([
        'app', 'lib', 'pkg', 'internal', 'cmd', 'components', 'utils', 'common', 'shared',
        'ui', 'services', 'features'
    ]);

    // We only passthrough if there is a subdirectory following it.
    // If it's the last directory match before filename, we might keep it.
    // Logic: If current part is passthrough, and there are at least 2 more parts (subdir + filename), skip it.
    // Example: lib/analysis/scanner.ts:
    // p=0 (lib). partsLeft=3. 0 < 3-2. Skip lib. p=1 (analysis).
    // p=1 (analysis). Not passthrough. Stop. Result: analysis.
    while (p < parts.length - 2 && PASSTHROUGH_ROOTS.has(parts[p])) {
        p++;
    }

    // 3. Check for Grouper Roots (keep child with parent)
    // "agents/application/trade.py" -> "agents/application"
    // "packages/core/index.ts" -> "packages/core"
    const GROUPER_ROOTS = new Set([
        'agents', 'packages', 'modules', 'scripts', 'plugins', 'apps', 'examples'
    ]);

    if (GROUPER_ROOTS.has(parts[p]) && p < parts.length - 2) {
        return `${parts[p]}/${parts[p + 1]}`;
    }

    // 4. Default: Return current directory
    // If we are at the filename (p == parts.length - 1), use parent dir
    if (p === parts.length - 1) {
        if (p > 0) {
            const parent = parts[p - 1];
            if (SKIP_ROOTS.has(parent) || PASSTHROUGH_ROOTS.has(parent)) {
                return "(root)";
            }
            return parent;
        }
        return "(root)";
    }

    return parts[p];
}
