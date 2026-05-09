# QA Web Analyzer

A production-ready QA web application that accepts a valid webpage URL and automatically generates comprehensive test artifacts: test cases, test scenarios, test plans, Requirements Traceability Matrix (RTM), and executable Playwright JavaScript test scripts.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                   Frontend (React)                    │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │ UrlInput │→│ LoadingOverlay│→│ ResultsDashboard│  │ │
│  │  └──────────┘  └──────────────┘  └───────┬───────┘  │ │
│  │                                           │          │ │
│  │  ┌────────────────────────────────────────┘          │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │  │Test Cases│ │Scenarios │ │Test Plan │          │ │
│  │  │  ├──────────┤ ├──────────┤ ├──────────┤          │ │
│  │  │  │   RTM    │ │Playwright│ │Download  │          │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘          │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │ API                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              API Route (pages/api/analyze.ts)         │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │                  Core Library (lib/)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐     │ │
│  │  │ Crawler  │→│ Analyzer │→│ Artifact Generator│     │ │
│  │  └──────────┘ └──────────┘ └────────┬─────────┘     │ │
│  │                                     │                │ │
│  │  ┌──────────────────────────────────┘                │ │
│  │  │  ┌──────────────────┐ ┌──────────────────┐        │ │
│  │  │  │Playwright Gen     │ │ Export Pipeline    │        │ │
│  │  │  └──────────────────┘ └──────────────────┘        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
qa-web-analyzer/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.js            # Next.js configuration
├── jest.config.js            # Test configuration
├── .gitignore
├── README.md
├── src/
│   ├── pages/
│   │   ├── index.tsx          # Main page (URL input + results)
│   │   ├── _app.tsx           # Next.js App wrapper
│   │   ├── _document.tsx      # HTML document shell
│   │   └── api/
│   │       └── analyze.ts     # API endpoint for analysis
│   ├── components/
│   │   ├── Header.tsx         # App header with logo
│   │   ├── UrlInput.tsx       # URL input form with validation
│   │   ├── LoadingOverlay.tsx # Animated loading state
│   │   ├── ResultsDashboard.tsx # Main results dashboard
│   │   ├── TestCasesSection.tsx # Test cases viewer
│   │   ├── TestScenariosSection.tsx # Test scenarios viewer
│   │   ├── TestPlanSection.tsx # Test plan viewer
│   │   ├── RtmSection.tsx     # RTM viewer
│   │   ├── PlaywrightSection.tsx # Playwright code viewer
│   │   └── DownloadPanel.tsx  # File download panel
│   ├── lib/
│   │   ├── types.ts           # TypeScript interfaces & types
│   │   ├── crawler.ts         # Webpage crawler (fetch + cheerio)
│   │   ├── analyzer.ts        # Page analysis engine
│   │   ├── artifact-generator.ts # Test artifacts generator
│   │   ├── playwright-generator.ts # Playwright script generator
│   │   └── export-pipeline.ts # Markdown/JSON/JS export
│   └── styles/
│       └── globals.css        # Global styles (dark theme)
├── tests/
│   ├── crawler.test.ts        # Crawler unit tests
│   ├── analyzer.test.ts       # Analyzer unit tests
│   └── artifact-generator.test.ts # Artifact generator tests
└── output/                    # Generated output directory
```

## Features

### Generated Test Types (12)

| Type | Description |
|------|-------------|
| Functional | Page load, form submission, navigation, button interactions |
| Smoke | Critical path validation, HTTP status, console errors |
| Regression | Core structure, link integrity, performance regression |
| Ad-hoc | Rapid reload, back/forward, injection testing |
| Accessibility | Headings, alt text, labels, keyboard nav, ARIA landmarks |
| Security | HTTPS, XSS resistance, form security, information disclosure |
| Compliance | GDPR, privacy/terms links, HTML5, viewport |
| Performance | Load time, resource audit, image optimization |
| Load | Concurrent users, stress testing, endurance |
| UI | Visual layout, responsive design, navigation, tables |
| API | HTTP response validation, form endpoints, resource checks |
| UAT | Business requirements, usability, cross-browser, error handling |

### Generated Artifacts

- **Test Cases**: 50+ structured test cases across 12 test types
- **Test Scenarios**: 10 end-to-end scenarios grouping related test cases
- **Test Plan**: Comprehensive plan with scope, schedule, risks, roles
- **RTM**: Requirements Traceability Matrix with 20 requirements
- **Playwright Scripts**: Executable JavaScript tests organized by type
- **Markdown Reports**: Human-readable documentation
- **JSON Data**: Machine-readable structured data

### Playwright Test Features

- Organized by test type into separate spec files
- Tagged with `@smoke`, `@regression`, `@accessibility`, etc.
- Cross-browser configuration (Chromium, Firefox, WebKit)
- HTML report generation
- Retry and trace support
- Annotations for test ID, severity, priority

## Quick Start

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

```bash
# Clone or navigate to the project
cd qa-web-analyzer

# Install dependencies
npm install

# Install Playwright browsers (for running generated tests)
npx playwright install chromium

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Usage

1. Open http://localhost:3000 in your browser
2. Enter a valid webpage URL (e.g., `https://example.com`)
3. Click "Analyze" and wait for the analysis to complete
4. Browse the generated results across tabs:
   - **Summary**: Overview of all generated artifacts
   - **Page Analysis**: Extracted page metadata and structure
   - **Test Cases**: Filterable list of all generated test cases
   - **Scenarios**: End-to-end test scenarios
   - **Test Plan**: Comprehensive test plan document
   - **RTM**: Requirements Traceability Matrix
   - **Playwright Scripts**: View and copy generated test code
   - **Download**: Export all artifacts

### Running Generated Tests

```bash
# Navigate to the generated test output directory
cd output/playwright-tests-<timestamp>

# Install dependencies
npm install

# Run all tests
npx playwright test

# Run specific test types
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@security"

# Run in specific browser
npx playwright test --project chromium

# View HTML report
npx playwright show-report
```

## Running Tests (App Tests)

```bash
npm test
```

## API Endpoint

### POST /api/analyze

Analyzes a webpage URL and generates QA artifacts.

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "success": true,
  "analysis": { /* PageAnalysisResult */ },
  "artifacts": {
    "testCases": [ /* TestCase[] */ ],
    "scenarios": [ /* TestScenario[] */ ],
    "testPlan": { /* TestPlan */ },
    "rtm": [ /* RtmEntry[] */ ]
  },
  "exports": {
    "markdown": [ /* { filename, content }[] */ ],
    "json": [ /* { filename, content }[] */ ],
    "playwright": [ /* { filename, content }[] */ ]
  }
}
```

## Download Formats

### Markdown Reports (.md)
- `page-analysis.md` - Full page structure and metadata analysis
- `test-cases.md` - All test cases organized by type
- `test-scenarios.md` - End-to-end test scenarios
- `test-plan.md` - Comprehensive test plan
- `rtm.md` - Requirements Traceability Matrix
- `test-summary.md` - Executive summary

### JSON Data (.json)
- `page-analysis.json` - Machine-readable page analysis
- `test-cases.json` - All test cases as structured data
- `test-scenarios.json` - Test scenarios data
- `test-plan.json` - Test plan data
- `rtm.json` - RTM data
- `complete-export.json` - Everything in one file

### Playwright Tests (.js)
- `tests/functional.spec.js`
- `tests/smoke.spec.js`
- `tests/regression.spec.js`
- `tests/accessibility.spec.js`
- `tests/security.spec.js`
- `tests/compliance.spec.js`
- `tests/performance.spec.js`
- `tests/ui.spec.js`
- `tests/api.spec.js`
- `tests/uat.spec.js`
- `tests/all-tests.spec.js`
- `playwright.config.js`
- `package.json`

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Crawling**: node-fetch + cheerio (DOM parsing)
- **Test Generation**: Custom artifact generator
- **Test Automation**: Playwright (generated scripts)
- **Export**: Markdown, JSON, JavaScript
- **Testing (app)**: Jest + ts-jest

## Error Handling

The application handles:
- Invalid URLs (format validation)
- Unreachable domains (DNS errors, connection refused)
- Timeouts (30-second request limit)
- SSL/TLS certificate errors
- Non-HTML responses
- Server errors (5xx)

## Security

- URL validation and sanitization
- No storage of analyzed page content
- No tracking or analytics
- HTTPS enforcement recommendation in generated tests
- XSS and SQL injection test cases

## License

Roystan
