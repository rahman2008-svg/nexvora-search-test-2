# NexVora Search ⚡

> **Fast, Private, and Truly Independent Web Search Engine**  
> Powered by an in-memory Okapi BM25 inverted index, deterministic rule-based categorization, polite automated web ingestion, and zero external search API dependencies.

---

## 🌟 Key Architecture Highlights

- **Zero Database Dependency**: Operates entirely without Postgres, MySQL, Cloud SQL, MongoDB, or Firebase. All index structures, documents, and category maps are stored in versioned JSON and JSONL artifacts.
- **Zero Third-Party Search or AI API Keys**: Eliminates external dependencies on Google Search API, Bing API, OpenAI, or LLM tokens. The search engine, relevance scoring, and query suggestions run 100% autonomously.
- **Zero Admin Panels or Admin Credentials**: Completely managed through Git. Update source seed files, commit to GitHub, and the automated GitHub Actions pipeline handles the rest.
- **Domain Independent**: Zero hardcoded URLs. Designed to run identically on `https://www.nexvora.com`, any Vercel deployment URL (`*.vercel.app`), custom domains, or `localhost:3000` using relative paths and dynamic origin detection.
- **High Performance**: Sub-5ms search execution times via pre-computed BM25 inverted indexes, term frequencies, document frequencies, and length normalization.

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       ├── process-sources.yml   # Automated ingestion, classification, indexing & git commit
│       └── ci.yml                # CI checks: linting, 43 integrity assertions & build
├── api/                          # Vercel Serverless Functions
│   ├── search.ts                 # /api/search endpoint with BM25 ranking & edge caching
│   ├── suggest.ts                # /api/suggest endpoint for live query auto-completion
│   └── healthz.ts                # /api/healthz health check
├── generated/                    # Versioned search engine data artifacts
│   ├── categories/               # 11 category indices (programming.json, science.json, etc.)
│   ├── documents/                # chunk-*.json partitions & documents.jsonl
│   ├── index/                    # nexvora-index.json (BM25 inverted index) & stats
│   └── reports/                  # processing-report.json, failed-urls, duplicate-urls
├── public/                       # Static public assets (robots.txt, sitemap.xml, favicon)
├── scripts/
│   ├── pipeline.ts               # Autonomous ingestion, parsing, classification & indexing script
│   └── validate-pipeline.ts      # 43 automated integrity assertions for all generated files
├── sources/                      # Human-managed seed sources (Git-managed)
│   ├── search-urls/              # sample-queries.txt (Raw Google search URLs)
│   ├── sitemaps/                 # popular-sitemaps.txt (XML sitemaps)
│   └── websites/                 # curated-sites.txt (Curated direct seed URLs)
├── src/                          # Modern React 19 + TypeScript + Tailwind CSS UI
│   ├── api/                      # Express search routes for local dev / Node environments
│   ├── components/               # SearchBox, ResultCard, FilterBar, Pagination, EmptyState
│   ├── indexing/                 # Inverted index, BM25 ranking engine, suggestion engine
│   ├── pages/                    # HomePage, SearchResultsPage, SourcesPage, AboutPage, PrivacyPage
│   ├── processor/                # Content engine, HTML parser, category classifier, robots checker
│   └── services/                 # SearchService with API-first and offline-fallback architecture
├── server.ts                     # Full-stack Node/Express server for dev & container deployments
├── vercel.json                   # Production Vercel configuration with rewrites & caching
└── vite.config.ts                # Vite 8 build configuration with vendor chunk code-splitting
```

---

## 🔍 How to Add Sources to the Index

NexVora is managed entirely via text files in the `sources/` directory. No database queries, CMS forms, or admin logins are required.

### 1. Adding Direct Websites (`sources/websites/curated-sites.txt`)

Add standard website URLs directly to `sources/websites/curated-sites.txt` (one URL per line). You can organize with comments (`#`):

```txt
# Machine Learning & AI Documentation
https://pytorch.org/docs/stable/index.html
https://scikit-learn.org/stable/tutorial/index.html

# Web Standards
https://developer.mozilla.org/en-US/docs/Web/API
```

- Trailing query parameters (like `?utm_source=...` or `?fbclid=...`) are automatically stripped.
- Duplicate URLs or duplicate canonical links are automatically identified and skipped.
- Domain politeness intervals and `robots.txt` guidelines are automatically respected.

### 2. Adding Google Search URLs (`sources/search-urls/sample-queries.txt`)

You can copy and paste complete Google Search URLs directly into `sources/search-urls/sample-queries.txt`:

```txt
https://www.google.com/search?q=fast+api+python+tutorial&sourceid=chrome&ie=UTF-8
https://www.google.com/search?gs_ssp=eJzj...&q=quantum+computing+qubits&oq=quantum...
```

The pipeline automatically:
1. Parses the URL and extracts the `q` search query.
2. Cleans and decodes percent-encoded characters (`+` or `%20` into spaces).
3. Strips all Google tracking parameters (`gs_ssp`, `oq`, `client`, `sourceid`, `sca_esv`, `ved`, etc.).
4. Deduplicates queries across the seed list.
5. Ingests and links the query to the search index and query suggestion graph.

---

## ⚙️ Automated Ingestion & Indexing Pipeline

Run the full end-to-end processing pipeline locally:

```bash
# Run ingestion, categorization, BM25 indexing, and integrity validation
npm run pipeline
```

### Pipeline Lifecycle Steps

1. **Source Validation**: Reads and validates `curated-sites.txt`, `sample-queries.txt`, and `popular-sitemaps.txt`. Invalid URL schemes are safely flagged.
2. **Polite Fetching & Ingestion**: Respects `robots.txt`, avoids disallowed paths, applies a per-domain rate limit, and enforces a 2MB maximum payload limit.
3. **HTML Parsing & Metadata Extraction**: Strips scripts, styles, and navigational chrome. Extracts document `<title>`, meta description, canonical link, `<h1>`/`<h2>`/`<h3>` headings, clean body text, and publication dates.
4. **Canonical Deduplication**: Hashes URLs and normalized canonical targets to skip duplicates.
5. **Deterministic Categorization**: Classifies content into one of 11 knowledge domains (`Programming`, `Technology`, `Science`, `Education`, `News`, `Business`, `Sports`, `Entertainment`, `Health`, `Travel`, `General`) based on weighted URL patterns and keyword signals.
6. **Partitioning & JSON/JSONL Generation**:
   - Chunks documents into clean partitions in `generated/documents/chunk-*.json`.
   - Appends streaming entries to `generated/documents/documents.jsonl`.
   - Compiles domain feeds in `generated/categories/*.json`.
7. **Okapi BM25 Indexing**: Calculates term frequencies ($TF$), document frequencies ($DF$), inverse document frequencies ($IDF$), and average document lengths ($avgdl$). Serializes the inverted index to `generated/index/nexvora-index.json`.
8. **Integrity Validation**: Runs 43 automated assertions (`scripts/validate-pipeline.ts`) verifying document count parity, category mappings, and index consistency.

---

## 🤖 GitHub Actions Automation

NexVora features two continuous automation workflows in `.github/workflows/`:

### 1. Ingestion & Index Pipeline (`process-sources.yml`)
- **Push Trigger**: Triggers automatically whenever files in `sources/**`, `src/processor/**`, `src/indexing/**`, or `scripts/**` change.
- **Paths Ignore**: Ignores changes in `generated/**` and markdown documentation, preventing recursive commit loops.
- **Scheduled Trigger**: Runs automatically every day at 04:00 UTC (`cron: '0 4 * * *'`) to refresh content.
- **Manual Trigger**: Can be dispatched on-demand via the GitHub Actions tab (`workflow_dispatch`) with optional `validate_only` and `force_rebuild` flags.
- **Automated Commit**: Stages and commits only `generated/` directories using standard `GITHUB_TOKEN` permissions with the `[skip ci]` flag.

### 2. Continuous Integration (`ci.yml`)
- Runs on every pull request and push to verify code quality:
  1. `npm run lint` (TypeScript compilation check)
  2. `npm run validate:generated` (43 integrity assertions)
  3. `npm run build` (Vite production bundle verification)

---

## 🚀 Vercel Production Deployment

NexVora is pre-configured for seamless zero-config deployment to Vercel directly from GitHub.

### Step 1: Import Repository to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.

### Step 2: Build & Output Settings
Vercel automatically detects the configuration from `vercel.json`:
- **Framework Preset**: `Vite` (or `Other`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Environment Variables
**None required!**  
NexVora does not require any database connection strings, API tokens, webhook secrets, or admin credentials. Click **Deploy**.

### Step 4: Custom Domains
Connect any custom domain (e.g., `https://www.nexvora.com`) in your Vercel project settings:
- Because NexVora uses dynamic request/window origin resolution (`getAppOrigin()`), the application automatically adapts without any code changes or rebuilds.
- Canonical links, OpenGraph cards, search actions, and sitemaps immediately reference your custom domain.

---

## 🌐 Verified Production Endpoints

| Route | Description |
| :--- | :--- |
| `/` | Homepage with instant search box, search suggestions, and category shortcuts. |
| `/search?q=python` | Search results page with BM25 ranking, instant answers, filters, and pagination. |
| `/api/search?q=python` | REST endpoint returning ranked documents with BM25 score breakdowns and highlighting. |
| `/api/suggest?q=py` | REST endpoint returning query and title completion suggestions. |
| `/robots.txt` | Crawler policy allowing search index pages and referencing dynamic sitemap. |
| `/sitemap.xml` | XML Sitemap with dynamic origin resolution for high SEO discoverability. |
| `/sources` | Interactive pipeline dashboard, sources viewer, JSON manifests, and sandbox tester. |
| `/about` | Technical architecture overview and independent search engine mission. |
| `/privacy` | Privacy-first policy: zero tracking, zero logs, zero persistent cookies. |

---

## 💻 Local Development Commands

```bash
# Install dependencies
npm install

# Start local full-stack development server on http://localhost:3000
npm run dev

# Run the ingestion, categorization, and indexing pipeline
npm run pipeline

# Validate all generated files against 43 integrity assertions
npm run validate:generated

# Check TypeScript types
npm run lint

# Build optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

Apache-2.0 License. Built for privacy, independence, and performance.
