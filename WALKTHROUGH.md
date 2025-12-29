# Repo Atlas Walkthrough

Repo Atlas is a tool to visualize and understand GitHub repositories by breaking them down into architectural layers.

## Features Implemented
- **Repo Analysis Engine**: Clones, scans, and classifies files into layers (UI, API, Domain, Data, Ops, etc.).
- **Interactive UI**:
  - **Landing Page**: Analyze any public GitHub URL.
  - **Repo Overview**: "Layer Stack" visualization showing percentage distribution and key modules.
  - **Layer Drilldown**: Filtered file explorer with "Why" explanations for classification.
  - **Code Viewer**: Read-only highlighting (fetched live from GitHub Raw).
- **Export**: Generate a detailed Markdown report for any repo.

## How to Run

1. **Install Dependencies** (if not already):
   ```bash
   npm install
   ```
2. **Setup Database** (SQLite):
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Open Browser**:
   Visit [http://localhost:3000](http://localhost:3000).

## Usage Guide
1. Enter a GitHub URL (e.g., `https://github.com/reduxjs/redux`) on the landing page.
2. Click **Analyze**. Wait for the process (cloning + scanning).
3. View the **Architecture Layers**. Click on a layer (e.g., "DOMAIN") to drill down.
4. Click on a file to see its content and *why* it was classified (e.g., "Matched test rule").
5. Click **Export** on the header to download a Markdown summary.

## Verification
  npx tsx scripts/verify-analysis.ts
  ```

## Walkthrough Verification
I have verified the workflow using a browser automation agent. Here are some snapshots of the process:

### Repo Overview
![Repo Overview](/Users/tayden.barretto/.gemini/antigravity/brain/5973c101-e12f-4e34-a868-9cd733627f32/.system_generated/click_feedback/click_feedback_1767036400399.png)

### Layer Drilldown (API)
![Layer Drilldown](/Users/tayden.barretto/.gemini/antigravity/brain/5973c101-e12f-4e34-a868-9cd733627f32/.system_generated/click_feedback/click_feedback_1767036405282.png)

### Code Viewer
![Code Viewer](/Users/tayden.barretto/.gemini/antigravity/brain/5973c101-e12f-4e34-a868-9cd733627f32/.system_generated/click_feedback/click_feedback_1767036411007.png)

### Export
![Export](/Users/tayden.barretto/.gemini/antigravity/brain/5973c101-e12f-4e34-a868-9cd733627f32/.system_generated/click_feedback/click_feedback_1767036422035.png)
