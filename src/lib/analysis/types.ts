export enum Layer {
    PRESENTATION = "PRESENTATION",
    APPLICATION = "APPLICATION",
    DOMAIN = "DOMAIN",
    INFRASTRUCTURE = "INFRASTRUCTURE",
    TOOLING = "TOOLING"
}

export interface FileSignal {
    rule: string;
    strength: number; // 0-1
    description: string;
}

export interface FileAnalysisResult {
    path: string;
    extension: string;
    loc: number;
    churn: number;
    layer: Layer;
    subcategory?: string;
    confidence: number;
    signals: FileSignal[];
    module: string; // Top-level folder or package
}

export interface RepoStats {
    totalFiles: number;
    totalLoc: number;
    layerDist: Record<Layer, number>;
} // Percentage or LOC count
