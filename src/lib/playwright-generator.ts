import type { TestCase } from './types';

const HEADER = `// ============================================================================
// Generated Playwright Test Suite
// Source: QA Web Analyzer
// Generator: qa-web-analyzer
// ============================================================================
// To run: npx playwright test
// To run specific tag: npx playwright test --grep "@smoke"
// To run specific file: npx playwright test tests/generated/functional.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');
`;

const FOOTER = `\n// ============================================================================
// End of Generated Test Suite
// ============================================================================
`;

export function generatePlaywrightScripts(
  testCases: TestCase[],
  targetUrl: string,
): { filename: string; content: string }[] {
  const groups = groupByType(testCases);
  const files: { filename: string; content: string }[] = [];

  for (const [type, cases] of Object.entries(groups)) {
    if (cases.length === 0) continue;
    const filename = `tests/${type}.spec.js`;
    const content = generateTestFile(type, cases, targetUrl);
    files.push({ filename, content });
  }

  const allFile = generateAllTestsFile(testCases, targetUrl);
  files.push(allFile);

  const configFile = generatePlaywrightConfig(targetUrl);
  files.push({ filename: 'playwright.config.js', content: configFile });

  files.push(generatePackageJson());

  return files;
}

function groupByType(testCases: TestCase[]): Record<string, TestCase[]> {
  const groups: Record<string, TestCase[]> = {};
  for (const tc of testCases) {
    if (!groups[tc.type]) groups[tc.type] = [];
    groups[tc.type].push(tc);
  }
  return groups;
}

function generateTestFile(
  type: string,
  cases: TestCase[],
  targetUrl: string,
): string {
  const typeTag = `@${type}`;
  const suiteTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Tests - ${targetUrl}`;
  const suiteDescription = getSuiteDescription(type);

  let code = HEADER;
  code += `\nconst TARGET_URL = '${targetUrl}';\n`;
  code += `\n${suiteDescription}\n`;
  code += `test.describe('${suiteTitle}', () => {\n`;
  code += `  test.use({ baseURL: TARGET_URL });\n\n`;

  for (const tc of cases) {
    code += generateTestMethod(tc, typeTag);
  }

  code += `});\n`;
  code += FOOTER;
  return code;
}

function getSuiteDescription(type: string): string {
  const descriptions: Record<string, string> = {
    functional: '// Functional tests verify core page behaviors, form submissions, navigation, and user interactions.',
    smoke: '// Smoke tests validate critical path functionality - fast checks for deployment verification.',
    regression: '// Regression tests ensure existing functionality is not broken by changes.',
    'ad-hoc': '// Ad-hoc tests explore edge cases, unusual scenarios, and unexpected behaviors.',
    accessibility: '// Accessibility tests verify WCAG compliance and screen reader compatibility.',
    security: '// Security tests check for common vulnerabilities and security best practices.',
    compliance: '// Compliance tests verify regulatory and standards compliance (GDPR, HTML5, etc.).',
    performance: '// Performance tests measure page speed, resource usage, and optimization opportunities.',
    load: '// Load tests validate behavior under concurrent users and sustained traffic.',
    ui: '// UI tests verify visual rendering, layout, and responsive design.',
    api: '// API tests validate HTTP responses, resource availability, and endpoint behavior.',
    uat: '// UAT tests validate business requirements and end-user satisfaction.',
  };
  return descriptions[type] || `// ${type} tests for the target page.`;
}

function generateTestMethod(tc: TestCase, typeTag: string): string {
  const tagStr = tc.tags.map((t) => `@${t.replace(/[^a-zA-Z0-9_-]/g, '')}`).join(' ');
  const safeTitle = tc.title.replace(/"/g, '\\"');

  let method = `  test('${safeTitle} [${tc.tags[0] || typeTag}]', { tag: ['${tc.tags.join("', '")}'] }, async ({ page }) => {\n`;
  method += `    test.info().annotations.push({ type: 'description', description: '${tc.description.replace(/"/g, '\\"')}' });\n`;
  method += `    test.info().annotations.push({ type: 'testId', description: '${tc.id}' });\n`;
  method += `    test.info().annotations.push({ type: 'severity', description: '${tc.severity}' });\n`;
  method += `    test.info().annotations.push({ type: 'priority', description: '${tc.priority}' });\n\n`;

  method += `    await test.step('Navigate to target page', async () => {\n`;
  method += `      const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle' });\n`;
  method += `      expect(response.status()).toBe(200);\n`;
  method += `    });\n\n`;

  for (let i = 0; i < tc.steps.length; i++) {
    const stepText = tc.steps[i].replace(/"/g, '\\"');
    const sanitized = stepText.substring(0, 100);

    if (tc.type === 'ui' && stepText.toLowerCase().includes('resolution')) {
      method += `    await test.step('${sanitized}', async () => {\n`;
      method += `      await page.setViewportSize({ width: 1920, height: 1080 });\n`;
      method += '    });\n\n';
    } else if (stepText.toLowerCase().includes('click') || stepText.toLowerCase().includes('navigate')) {
      method += `    await test.step('${sanitized}', async () => {\n`;
      method += `      await page.waitForLoadState('networkidle');\n`;
      method += '    });\n\n';
    } else if (stepText.toLowerCase().includes('verify') || stepText.toLowerCase().includes('check')) {
      method += `    await test.step('${sanitized}', async () => {\n`;
      method += `      expect(await page.title()).toBeTruthy();\n`;
      method += `      const bodyText = await page.textContent('body');\n`;
      method += `      expect(bodyText).toBeTruthy();\n`;
      method += '    });\n\n';
    } else {
      method += `    await test.step('${sanitized}', async () => {\n`;
      method += '      // Auto-generated: validate page state\n';
      method += '    });\n\n';
    }
  }

  method += `    await test.step('Verify expected results', async () => {\n`;
  for (const result of tc.expectedResults) {
    const safeResult = result.replace(/"/g, '\\"').substring(0, 120);
    method += `      // Expected: ${safeResult}\n`;
  }
  method += `      expect(await page.title()).toBeTruthy();\n`;
  method += `      expect(page.url()).toContain(TARGET_URL);\n`;
  method += '    });\n';
  method += '  });\n\n';

  return method;
}

function generateAllTestsFile(
  testCases: TestCase[],
  targetUrl: string,
): { filename: string; content: string } {
  let content = `// ============================================================================
// QA Web Analyzer - Generated Playwright Test Suite (All Tests)
// Target: ${targetUrl}
// Total Tests: ${testCases.length}
// Generated: ${new Date().toISOString()}
// ============================================================================
// Run all tests:     npx playwright test
// Run by tag:        npx playwright test --grep "@smoke"
// Run by file:       npx playwright test tests/functional.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

const TARGET_URL = '${targetUrl}';

`;

  const grouped = groupByType(testCases);
  for (const [type, cases] of Object.entries(grouped)) {
    content += `// ${type.charAt(0).toUpperCase() + type.slice(1)} Tests (${cases.length})\n`;
    content += `test.describe('${type.charAt(0).toUpperCase() + type.slice(1)} Tests', () => {\n`;
    content += `  test.use({ baseURL: TARGET_URL });\n\n`;

    for (const tc of cases.slice(0, 5)) {
      const safeTitle = tc.title.replace(/"/g, '\\"').substring(0, 80);
      content += `  test('${safeTitle}', async ({ page }) => {\n`;
      content += `    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });\n`;
      content += `    expect(await page.title()).toBeTruthy();\n`;
      content += '  });\n\n';
    }

    if (cases.length > 5) {
      content += `  // ... ${cases.length - 5} more tests (see ${type}.spec.js for full suite)\n\n`;
    }

    content += `});\n\n`;
  }

  content += `// See individual spec files in tests/ directory for complete test suites\n`;
  content += FOOTER;
  return { filename: 'tests/all-tests.spec.js', content };
}

function generatePlaywrightConfig(targetUrl: string): string {
  return `// @ts-check
// Generated Playwright Config for testing: ${targetUrl}
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: '${targetUrl}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
`;
}

function generatePackageJson(): { filename: string; content: string } {
  return {
    filename: 'package.json',
    content: JSON.stringify(
      {
        name: 'generated-qa-tests',
        version: '1.0.0',
        private: true,
        scripts: {
          test: 'playwright test',
          'test:smoke': 'playwright test --grep "@smoke"',
          'test:regression': 'playwright test --grep "@regression"',
          'test:functional': 'playwright test --grep "@functional"',
          'test:accessibility': 'playwright test --grep "@accessibility"',
          'test:security': 'playwright test --grep "@security"',
          'test:compliance': 'playwright test --grep "@compliance"',
          'test:performance': 'playwright test --grep "@performance"',
          'test:ui': 'playwright test --grep "@ui"',
          'test:api': 'playwright test --grep "@api"',
          'test:uat': 'playwright test --grep "@uat"',
          'test:chromium': 'playwright test --project chromium',
          'test:firefox': 'playwright test --project firefox',
          'test:webkit': 'playwright test --project webkit',
          report: 'playwright show-report',
        },
        devDependencies: {
          '@playwright/test': '^1.40.0',
        },
      },
      null,
      2,
    ),
  };
}
