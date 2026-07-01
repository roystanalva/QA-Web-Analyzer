import type {
  TestCase,
  TestScenario,
  TestPlan,
  RtmEntry,
  PageAnalysisResult,
  ExportFiles,
  TestType,
} from './types';
import type { AnalyzedInsights } from './analyzer';
import { generatePlaywrightScripts } from './playwright-generator';

export function generateAllExports(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
): ExportFiles {
  return {
    markdown: generateMarkdownFiles(analysis, insights, testCases, scenarios, testPlan, rtm),
    json: generateJsonFiles(analysis, testCases, scenarios, testPlan, rtm),
    playwright: generatePlaywrightScripts(testCases, analysis.url),
    html: generateHtmlFiles(analysis, insights, testCases, scenarios, testPlan, rtm),
  };
}

function generateMarkdownFiles(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
): { filename: string; content: string }[] {
  return [
    { filename: 'reports/page-analysis.md', content: generatePageAnalysisMarkdown(analysis, insights) },
    { filename: 'reports/test-cases.md', content: generateTestCasesMarkdown(testCases) },
    { filename: 'reports/test-scenarios.md', content: generateScenariosMarkdown(scenarios) },
    { filename: 'reports/test-plan.md', content: generateTestPlanMarkdown(testPlan) },
    { filename: 'reports/rtm.md', content: generateRtmMarkdown(rtm) },
    { filename: 'reports/test-summary.md', content: generateSummaryMarkdown(analysis, testCases, scenarios, testPlan, rtm, insights) },
  ];
}

function generateJsonFiles(
  analysis: PageAnalysisResult,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
): { filename: string; content: string }[] {
  const jsonContent = (data: any) => JSON.stringify(data, null, 2);
  return [
    { filename: 'json/page-analysis.json', content: jsonContent(analysis) },
    { filename: 'json/test-cases.json', content: jsonContent(testCases) },
    { filename: 'json/test-scenarios.json', content: jsonContent(scenarios) },
    { filename: 'json/test-plan.json', content: jsonContent(testPlan) },
    { filename: 'json/rtm.json', content: jsonContent(rtm) },
    {
      filename: 'json/complete-export.json',
      content: jsonContent({
        metadata: {
          targetUrl: analysis.url,
          generatedAt: new Date().toISOString(),
          pageTitle: analysis.metadata.title,
          totalTestCases: testCases.length,
          testTypes: [...new Set(testCases.map((tc) => tc.type))],
        },
        analysis,
        testCases,
        scenarios,
        testPlan,
        rtm,
      }),
    },
  ];
}

function generatePageAnalysisMarkdown(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): string {
  const a = analysis;
  const i = insights;

  return `# Page Analysis Report

## Target Information
- **URL:** ${a.url}
- **HTTP Status:** ${a.statusCode}
- **Load Time:** ${a.loadTimeMs}ms
- **Analysis Timestamp:** ${new Date().toISOString()}

## Page Metadata
- **Title:** ${a.metadata.title || 'N/A'}
- **Description:** ${a.metadata.description || 'N/A'}
- **Language:** ${a.metadata.language || 'N/A'}
- **Charset:** ${a.metadata.charset || 'N/A'}
- **Viewport:** ${a.metadata.viewport || 'N/A'}
- **Canonical URL:** ${a.metadata.canonicalUrl || 'N/A'}
- **Favicon:** ${a.metadata.favicon || 'N/A'}
- **Keywords:** ${a.metadata.keywords || 'N/A'}
- **Author:** ${a.metadata.author || 'N/A'}
- **Open Graph Title:** ${a.metadata.ogTitle || 'N/A'}
- **Open Graph Description:** ${a.metadata.ogDescription || 'N/A'}
- **Open Graph Image:** ${a.metadata.ogImage || 'N/A'}

## Page Classification
- **Page Type:** ${i.pageType}
- **Complexity:** ${i.complexity}
- **Estimated Test Coverage:** ${i.estimatedTestCoverage}%

## Content Statistics
- **Word Count:** ${a.wordCount}
- **Paragraphs:** ${a.paragraphCount}
- **Headings:** ${a.headings.length}
- **Lists:** ${a.listCount}
- **Tables:** ${a.tables.length}
- **Images:** ${a.images.length}
- **Links:** ${a.links.length}
- **Buttons:** ${a.buttons.length}
- **Forms:** ${a.forms.length}
- **Iframes:** ${a.iframeCount}
- **Navigation Elements:** ${a.navElements.length}
- **Semantic Elements:** ${(a.semanticElements || []).join(', ')}

## Heading Structure
${a.headings.map((h) => `${'  '.repeat(h.level - 1)}- **H${h.level}:** ${h.text}`).join('\n') || '  No headings found'}

## Main Functionality
${i.mainFunctionality.map((f) => `- ${f}`).join('\n') || '  No specific functionality identified'}

## Inferred User Flows
${i.userFlows.map((f) => `- ${f}`).join('\n') || '  No user flows inferred'}

## Critical Elements
${i.criticalElements.map((e) => `- ${e}`).join('\n') || '  No critical elements identified'}

## Accessibility Signals
- **Total Images:** ${a.accessibility.totalImages}
- **Images with Alt Text:** ${a.accessibility.imagesWithAlt}
- **Images Missing Alt Text:** ${a.accessibility.missingAltText}
- **ARIA Labels:** ${a.accessibility.ariaLabelCount}
- **ARIA Roles:** ${a.accessibility.ariaRoleCount}
- **Form Labels Missing:** ${a.accessibility.formLabelsMissing}
- **Total Forms:** ${a.accessibility.totalForms}
- **Has Skip Navigation:** ${a.accessibility.hasSkipNav ? 'Yes' : 'No'}
- **Has Language Declaration:** ${a.accessibility.hasLanguageDeclaration ? 'Yes' : 'No'}
- **Has Title:** ${a.accessibility.hasTitle ? 'Yes' : 'No'}
- **Heading Gaps:** ${a.accessibility.headingGapWarnings.map((w) => `"${w}"`).join(', ') || 'None'}
- **Landmark Elements:** ${a.accessibility.landmarkElements.join(', ') || 'None'}

## Performance Hints
- **External Scripts:** ${a.performance.externalScripts}
- **Inline Scripts:** ${a.performance.inlineScripts}
- **External Styles:** ${a.performance.externalStyles}
- **Total Images:** ${a.performance.totalImages}
- **Estimated Requests:** ${a.performance.totalRequests}
- **DOM Elements:** ${a.performance.domElements}
- **Has Render-Blocking:** ${a.performance.hasRenderBlocking ? 'Yes' : 'No'}
- **Has Large DOM:** ${a.performance.hasLargeDom ? 'Yes' : 'No'}

### Performance Recommendations
${a.performance.recommendations.map((r) => `- ${r}`).join('\n') || '  None'}

## Security Observations
- **Uses HTTPS:** ${a.security.usesHttps ? 'Yes' : 'No'}
- **Has Forms:** ${a.security.hasForm ? 'Yes' : 'No'}
- **External Links:** ${a.security.externalLinks}
- **External Links w/o noopener:** ${a.security.externalLinksNoReferrer}
- **Inline Scripts:** ${a.security.inlineScripts}
- **Has Iframes:** ${a.security.hasIframe ? 'Yes' : 'No'}
- **Iframe Sandbox:** ${a.security.iframeSandbox ? 'Yes' : 'No'}
- **Exposed Emails:** ${a.security.exposedEmails.join(', ') || 'None'}

### Security Recommendations
${a.security.recommendations.map((r) => `- ${r}`).join('\n') || '  None'}

## Compliance Checks
- **DOCTYPE:** ${a.compliance.hasDoctype ? 'Present' : 'Missing'}
- **Language Attribute:** ${a.compliance.hasLangAttribute ? 'Present' : 'Missing'}
- **Charset Declaration:** ${a.compliance.hasCharsetDeclaration ? 'Present' : 'Missing'}
- **Viewport Meta:** ${a.compliance.hasViewportMeta ? 'Present' : 'Missing'}
- **Robots Meta:** ${a.compliance.hasRobotsMeta ? 'Present' : 'Missing'}
- **Privacy Link:** ${a.compliance.hasPrivacyLink ? 'Present' : 'Missing'}
- **Terms Link:** ${a.compliance.hasTermsLink ? 'Present' : 'Missing'}
- **Cookie Notice:** ${a.compliance.hasCookieNotice ? 'Present' : 'Missing'}
- **Accessibility Statement:** ${a.compliance.hasAccessibilityStatement ? 'Present' : 'Missing'}
- **Favicon:** ${a.compliance.hasFavicon ? 'Present' : 'Missing'}
- **Canonical URL:** ${a.compliance.hasCanonical ? 'Present' : 'Missing'}
- **Open Graph Tags:** ${a.compliance.hasOpenGraph ? 'Present' : 'Missing'}

## Test Risks
${i.testRisks.map((r) => `- ${r}`).join('\n') || '  No significant risks identified'}

## Recommendations
${i.recommendations.map((r) => `- ${r}`).join('\n') || '  No recommendations'}

---
*Generated by QA Web Analyzer on ${new Date().toLocaleString()}*
`;
}

function generateTestCasesMarkdown(testCases: TestCase[]): string {
  const grouped = groupByType(testCases);

  let md = `# Test Cases Report\n\n`;
  md += `- **Total Test Cases:** ${testCases.length}\n`;
  md += `- **Generated:** ${new Date().toISOString()}\n\n`;

  md += '## Summary by Type\n\n';
  md += '| Test Type | Count | Critical | High | Medium | Low |\n';
  md += '|-----------|-------|----------|------|--------|-----|\n';
  for (const [type, cases] of Object.entries(grouped)) {
    const critical = cases.filter((c) => c.priority === 'critical').length;
    const high = cases.filter((c) => c.priority === 'high').length;
    const medium = cases.filter((c) => c.priority === 'medium').length;
    const low = cases.filter((c) => c.priority === 'low').length;
    md += `| ${type.charAt(0).toUpperCase() + type.slice(1)} | ${cases.length} | ${critical} | ${high} | ${medium} | ${low} |\n`;
  }
  md += '\n---\n\n';

  for (const [type, cases] of Object.entries(grouped)) {
    md += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Test Cases\n\n`;
    for (const tc of cases) {
      md += `### ${tc.id}: ${tc.title}\n\n`;
      md += `- **Priority:** ${tc.priority}\n`;
      md += `- **Severity:** ${tc.severity}\n`;
      md += `- **Estimated Duration:** ${tc.estimatedDuration}\n`;
      md += `- **Tags:** ${tc.tags.map((t) => `\`${t}\``).join(', ')}\n\n`;
      md += `**Description:** ${tc.description}\n\n`;

      if (tc.preconditions.length > 0) {
        md += '**Preconditions:**\n';
        tc.preconditions.forEach((p) => (md += `- ${p}\n`));
        md += '\n';
      }

      if (tc.testData) {
        md += `**Test Data:**\n\`\`\`\n${tc.testData}\n\`\`\`\n\n`;
      }

      md += '**Steps:**\n';
      tc.steps.forEach((s, i) => (md += `${i + 1}. ${s}\n`));
      md += '\n';

      md += '**Expected Results:**\n';
      tc.expectedResults.forEach((r, i) => (md += `${i + 1}. ${r}\n`));
      md += '\n---\n\n';
    }
  }

  return md;
}

function generateScenariosMarkdown(scenarios: TestScenario[]): string {
  let md = `# Test Scenarios Report\n\n`;
  md += `- **Total Scenarios:** ${scenarios.length}\n`;
  md += `- **Generated:** ${new Date().toISOString()}\n\n`;

  for (const sc of scenarios) {
    md += `## ${sc.id}: ${sc.title}\n\n`;
    md += `- **Type:** ${sc.type}\n`;
    md += `- **Tags:** ${sc.tags.map((t) => `\`${t}\``).join(', ')}\n\n`;
    md += `**Description:** ${sc.description}\n\n`;

    if (sc.preconditions.length > 0) {
      md += '**Preconditions:**\n';
      sc.preconditions.forEach((p) => (md += `- ${p}\n`));
      md += '\n';
    }

    if (sc.relatedTestCases.length > 0) {
      md += '**Related Test Cases:**\n';
      sc.relatedTestCases.forEach((tcId) => (md += `- ${tcId}\n`));
      md += '\n';
    }

    md += '---\n\n';
  }

  return md;
}

function generateTestPlanMarkdown(plan: TestPlan): string {
  return `# ${plan.title}

- **Version:** ${plan.version}
- **Created:** ${plan.createdAt}
- **Target URL:** ${plan.targetUrl}

## Scope
${plan.scope}

## Out of Scope
${plan.outOfScope.map((item) => `- ${item}`).join('\n')}

## Test Objectives
${plan.objectives.map((obj) => `- ${obj}`).join('\n')}

## Test Types Covered
${plan.testTypes.map((t) => `- ${t}`).join('\n')}

## Test Environment
\`\`\`
${plan.environment}
\`\`\`

## Test Data Strategy
${plan.testDataStrategy}

## Entry Criteria
${plan.entryCriteria.map((c) => `- ${c}`).join('\n')}

## Exit Criteria
${plan.exitCriteria.map((c) => `- ${c}`).join('\n')}

## Deliverables
${plan.deliverables.map((d) => `- ${d}`).join('\n')}

## Risks and Mitigations
${plan.risksAndMitigations.map((r) => `- **Risk:** ${r.risk}\n  - **Mitigation:** ${r.mitigation}`).join('\n')}

## Schedule
${plan.schedule.map((s) => `### ${s.phase} (${s.duration})\n${s.activities.map((a) => `- ${a}`).join('\n')}`).join('\n\n')}

## Roles and Responsibilities
${plan.rolesAndResponsibilities.map((r) => `- **${r.role}:** ${r.responsibility}`).join('\n')}

## Assumptions
${plan.assumptions.map((a) => `- ${a}`).join('\n')}

## Dependencies
${plan.dependencies.map((d) => `- ${d}`).join('\n')}

## Tools and Frameworks
${plan.toolsAndFrameworks.map((t) => `- ${t}`).join('\n')}

## Defect Management
${plan.defectManagement}

## Communication Plan
${plan.communicationPlan}

---
*Generated by QA Web Analyzer on ${new Date().toLocaleString()}*
`;
}

function generateRtmMarkdown(rtm: RtmEntry[]): string {
  let md = `# Requirements Traceability Matrix (RTM)\n\n`;
  md += `- **Total Requirements:** ${rtm.length}\n`;
  md += `- **Generated:** ${new Date().toISOString()}\n\n`;

  md += '| Requirement ID | Description | Coverage Type | Status | Test Cases |\n';
  md += '|---------------|-------------|---------------|--------|------------|\n';
  for (const entry of rtm) {
    const testCases = entry.testCaseIds.length > 0
      ? entry.testCaseIds.join(', ')
      : 'N/A';
    md += `| ${entry.requirementId} | ${entry.requirementDescription} | ${entry.coverageType} | ${entry.status} | ${testCases} |\n`;
  }

  md += '\n## Coverage Summary\n\n';
  const total = rtm.length;
  const covered = rtm.filter((e) => e.status === 'covered').length;
  const partial = rtm.filter((e) => e.status === 'partial').length;
  const notCovered = rtm.filter((e) => e.status === 'not-covered').length;
  const coveragePct = total > 0 ? Math.round(((covered + partial * 0.5) / total) * 100) : 0;

  md += `- **Total Requirements:** ${total}\n`;
  md += `- **Covered:** ${covered} (${total > 0 ? Math.round((covered / total) * 100) : 0}%)\n`;
  md += `- **Partial:** ${partial}\n`;
  md += `- **Not Covered:** ${notCovered}\n`;
  md += `- **Overall Coverage:** ${coveragePct}%\n`;

  if (notCovered > 0) {
    md += '\n### Uncovered Requirements\n\n';
    rtm
      .filter((e) => e.status === 'not-covered')
      .forEach((e) => {
        md += `- **${e.requirementId}:** ${e.requirementDescription}\n`;
      });
  }

  return md;
}

function generateSummaryMarkdown(
  analysis: PageAnalysisResult,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
  insights: AnalyzedInsights,
): string {
  const grouped = groupByType(testCases);

  let md = `# QA Test Summary Report\n\n`;
  md += `- **Target URL:** ${analysis.url}\n`;
  md += `- **Page Title:** ${analysis.metadata.title}\n`;
  md += `- **Generated:** ${new Date().toISOString()}\n`;
  md += `- **Page Type:** ${insights.pageType}\n`;
  md += `- **Complexity:** ${insights.complexity}\n\n`;

  md += '## Executive Summary\n\n';
  md += `The QA Web Analyzer successfully analyzed the page at **${analysis.url}** and generated a comprehensive test suite. The page was classified as a **${insights.pageType}** with **${insights.complexity}** complexity.\n\n`;

  md += '## Test Suite Overview\n\n';
  md += '| Metric | Value |\n';
  md += '|--------|-------|\n';
  md += `| Total Test Cases | ${testCases.length} |\n`;
  md += `| Test Types | ${Object.keys(grouped).length} |\n`;
  md += `| Test Scenarios | ${scenarios.length} |\n`;
  md += `| RTM Requirements | ${rtm.length} |\n`;
  md += `| Playwright Test Files | ${Object.keys(grouped).length} spec files |\n\n`;

  md += '## Test Cases by Type\n\n';
  md += '| Type | Count | Critical | High | Medium | Low |\n';
  md += '|------|-------|----------|------|--------|-----|\n';
  for (const [type, cases] of Object.entries(grouped)) {
    const critical = cases.filter((c) => c.priority === 'critical').length;
    const high = cases.filter((c) => c.priority === 'high').length;
    const medium = cases.filter((c) => c.priority === 'medium').length;
    const low = cases.filter((c) => c.priority === 'low').length;
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    md += `| ${label} | ${cases.length} | ${critical} | ${high} | ${medium} | ${low} |\n`;
  }
  md += '\n';

  md += '## Coverage Summary\n\n';
  const totalRtm = rtm.length;
  const covered = rtm.filter((e) => e.status === 'covered').length;
  const partial = rtm.filter((e) => e.status === 'partial').length;
  const notCovered = rtm.filter((e) => e.status === 'not-covered').length;
  md += `- **Requirements Coverage:** ${totalRtm > 0 ? Math.round(((covered + partial * 0.5) / totalRtm) * 100) : 0}%\n`;
  md += `- **Estimated Page Coverage:** ${insights.estimatedTestCoverage}%\n\n`;

  md += '## Key Risks\n\n';
  insights.testRisks.slice(0, 5).forEach((r) => (md += `- ⚠️ ${r}\n`));
  md += '\n';

  md += '## Top Recommendations\n\n';
  insights.recommendations.slice(0, 5).forEach((r) => (md += `- 💡 ${r}\n`));
  md += '\n';

  md += '## Generated Files\n\n';
  md += '| Category | Files |\n';
  md += '|----------|-------|\n';
  md += '| Reports (Markdown) | page-analysis.md, test-cases.md, test-scenarios.md, test-plan.md, rtm.md, test-summary.md |\n';
  md += '| Reports (HTML) | page-analysis.html, test-cases.html, test-scenarios.html, test-plan.html, rtm.html, test-summary.html |\n';
  md += '| Data (JSON) | page-analysis.json, test-cases.json, test-scenarios.json, test-plan.json, rtm.json, complete-export.json |\n';
  md += '| Playwright Tests | *.spec.js files organized by test type |\n';
  md += '| Playwright Config | playwright.config.js, package.json |\n';

  return md;
}

function groupByType(testCases: TestCase[]): Record<string, TestCase[]> {
  const groups: Record<string, TestCase[]> = {};
  for (const tc of testCases) {
    if (!groups[tc.type]) groups[tc.type] = [];
    groups[tc.type].push(tc);
  }
  return groups;
}

function generateHtmlFiles(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
): { filename: string; content: string }[] {
  return [
    { filename: 'reports/page-analysis.html', content: generatePageAnalysisHtml(analysis, insights) },
    { filename: 'reports/test-cases.html', content: generateTestCasesHtml(testCases) },
    { filename: 'reports/test-scenarios.html', content: generateScenariosHtml(scenarios) },
    { filename: 'reports/test-plan.html', content: generateTestPlanHtml(testPlan) },
    { filename: 'reports/rtm.html', content: generateRtmHtml(rtm) },
    { filename: 'reports/test-summary.html', content: generateSummaryHtml(analysis, testCases, scenarios, testPlan, rtm, insights) },
  ];
}

function getHtmlStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; background: white; }
    .header { background: linear-gradient(135deg, #1a5276, #2980b9); color: white; padding: 30px; border-radius: 8px 8px 0 0; margin-bottom: 20px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header .meta { font-size: 14px; opacity: 0.9; }
    .header .meta span { display: inline-block; margin-right: 20px; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1a5276; border-bottom: 2px solid #2980b9; padding-bottom: 10px; margin-bottom: 15px; font-size: 22px; }
    .section h3 { color: #2c3e50; margin: 15px 0 10px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
    table, th, td { border: 1px solid #ddd; }
    th { background: #f2f2f2; padding: 12px; text-align: left; font-weight: 600; }
    td { padding: 10px 12px; }
    tr:nth-child(even) { background: #f9f9f9; }
    tr:hover { background: #f1f1f1; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-critical { background: #e74c3c; color: white; }
    .badge-high { background: #e67e22; color: white; }
    .badge-medium { background: #f1c40f; color: #333; }
    .badge-low { background: #27ae60; color: white; }
    .badge-blocker { background: #8e44ad; color: white; }
    .badge-major { background: #e74c3c; color: white; }
    .badge-minor { background: #f39c12; color: white; }
    .badge-trivial { background: #95a5a6; color: white; }
    .badge-covered { background: #27ae60; color: white; }
    .badge-partial { background: #f39c12; color: white; }
    .badge-not-covered { background: #e74c3c; color: white; }
    .info-box { background: #eaf2f8; border-left: 4px solid #2980b9; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .risk-box { background: #fdedec; border-left: 4px solid #e74c3c; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .recommendation-box { background: #eafaf1; border-left: 4px solid #27ae60; padding: 15px; margin: 15px 0; border-radius: 4px; }
    ul, ol { margin: 10px 0 10px 20px; }
    li { margin-bottom: 5px; }
    .footer { background: #ecf0f1; padding: 20px; text-align: center; font-size: 13px; color: #7f8c8d; border-radius: 0 0 8px 8px; margin-top: 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
    .metric-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; text-align: center; }
    .metric-card .value { font-size: 24px; font-weight: bold; color: #1a5276; }
    .metric-card .label { font-size: 13px; color: #666; margin-top: 5px; }
    pre { background: #2d3436; color: #dfe6e9; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: 'Consolas', monospace; font-size: 13px; }
    code { background: #f1f2f6; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 13px; }
    pre code { background: none; padding: 0; }
    @media print { .container { box-shadow: none; } body { background: white; } }
  `;
}

function generateHtmlHeader(title: string, url: string): string {
  const timestamp = new Date().toLocaleString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - QA Web Analyzer</title>
  <style>${getHtmlStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QA Web Analyzer Report</h1>
      <div class="meta">
        <span><strong>Document:</strong> ${title}</span>
        <span><strong>Target URL:</strong> ${url}</span>
        <span><strong>Generated:</strong> ${timestamp}</span>
      </div>
    </div>
    <div class="content">`;
}

function generateHtmlFooter(): string {
  return `
    </div>
    <div class="footer">
      Generated by QA Web Analyzer on ${new Date().toLocaleString()} | For QA testing purposes only
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPriorityBadge(priority: string): string {
  return `<span class="badge badge-${priority}">${escapeHtml(priority)}</span>`;
}

function getSeverityBadge(severity: string): string {
  return `<span class="badge badge-${severity}">${escapeHtml(severity)}</span>`;
}

function getStatusBadge(status: string): string {
  return `<span class="badge badge-${status}">${escapeHtml(status)}</span>`;
}

function generatePageAnalysisHtml(analysis: PageAnalysisResult, insights: AnalyzedInsights): string {
  const a = analysis;
  const i = insights;
  
  let html = generateHtmlHeader('Page Analysis Report', a.url);
  
  html += `
    <div class="section">
      <h2>Target Information</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>URL</td><td>${escapeHtml(a.url)}</td></tr>
        <tr><td>HTTP Status</td><td>${a.statusCode}</td></tr>
        <tr><td>Load Time</td><td>${a.loadTimeMs}ms</td></tr>
        <tr><td>Analysis Timestamp</td><td>${new Date().toISOString()}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Page Metadata</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Title</td><td>${escapeHtml(a.metadata.title || 'N/A')}</td></tr>
        <tr><td>Description</td><td>${escapeHtml(a.metadata.description || 'N/A')}</td></tr>
        <tr><td>Language</td><td>${escapeHtml(a.metadata.language || 'N/A')}</td></tr>
        <tr><td>Charset</td><td>${escapeHtml(a.metadata.charset || 'N/A')}</td></tr>
        <tr><td>Viewport</td><td>${escapeHtml(a.metadata.viewport || 'N/A')}</td></tr>
        <tr><td>Canonical URL</td><td>${escapeHtml(a.metadata.canonicalUrl || 'N/A')}</td></tr>
        <tr><td>Favicon</td><td>${escapeHtml(a.metadata.favicon || 'N/A')}</td></tr>
        <tr><td>Keywords</td><td>${escapeHtml(a.metadata.keywords || 'N/A')}</td></tr>
        <tr><td>Author</td><td>${escapeHtml(a.metadata.author || 'N/A')}</td></tr>
        <tr><td>Open Graph Title</td><td>${escapeHtml(a.metadata.ogTitle || 'N/A')}</td></tr>
        <tr><td>Open Graph Description</td><td>${escapeHtml(a.metadata.ogDescription || 'N/A')}</td></tr>
        <tr><td>Open Graph Image</td><td>${escapeHtml(a.metadata.ogImage || 'N/A')}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Page Classification</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${escapeHtml(i.pageType)}</div>
          <div class="label">Page Type</div>
        </div>
        <div class="metric-card">
          <div class="value">${escapeHtml(i.complexity)}</div>
          <div class="label">Complexity</div>
        </div>
        <div class="metric-card">
          <div class="value">${i.estimatedTestCoverage}%</div>
          <div class="label">Estimated Test Coverage</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Content Statistics</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${a.wordCount}</div>
          <div class="label">Word Count</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.paragraphCount}</div>
          <div class="label">Paragraphs</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.headings.length}</div>
          <div class="label">Headings</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.listCount}</div>
          <div class="label">Lists</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.tables.length}</div>
          <div class="label">Tables</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.images.length}</div>
          <div class="label">Images</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.links.length}</div>
          <div class="label">Links</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.buttons.length}</div>
          <div class="label">Buttons</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.forms.length}</div>
          <div class="label">Forms</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.iframeCount}</div>
          <div class="label">Iframes</div>
        </div>
        <div class="metric-card">
          <div class="value">${a.navElements.length}</div>
          <div class="label">Navigation Elements</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Heading Structure</h2>
      <ul>
        ${a.headings.map(h => `<li>${'  '.repeat(h.level - 1)}<strong>H${h.level}:</strong> ${escapeHtml(h.text)}</li>`).join('\n        ') || '<li>No headings found</li>'}
      </ul>
    </div>

    <div class="section">
      <h2>Main Functionality</h2>
      <ul>
        ${i.mainFunctionality.map(f => `<li>${escapeHtml(f)}</li>`).join('\n        ') || '<li>No specific functionality identified</li>'}
      </ul>
    </div>

    <div class="section">
      <h2>Inferred User Flows</h2>
      <ul>
        ${i.userFlows.map(f => `<li>${escapeHtml(f)}</li>`).join('\n        ') || '<li>No user flows inferred</li>'}
      </ul>
    </div>

    <div class="section">
      <h2>Critical Elements</h2>
      <ul>
        ${i.criticalElements.map(e => `<li>${escapeHtml(e)}</li>`).join('\n        ') || '<li>No critical elements identified</li>'}
      </ul>
    </div>

    <div class="section">
      <h2>Accessibility Signals</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Total Images</td><td>${a.accessibility.totalImages}</td></tr>
        <tr><td>Images with Alt Text</td><td>${a.accessibility.imagesWithAlt}</td></tr>
        <tr><td>Images Missing Alt Text</td><td>${a.accessibility.missingAltText}</td></tr>
        <tr><td>ARIA Labels</td><td>${a.accessibility.ariaLabelCount}</td></tr>
        <tr><td>ARIA Roles</td><td>${a.accessibility.ariaRoleCount}</td></tr>
        <tr><td>Form Labels Missing</td><td>${a.accessibility.formLabelsMissing}</td></tr>
        <tr><td>Total Forms</td><td>${a.accessibility.totalForms}</td></tr>
        <tr><td>Has Skip Navigation</td><td>${a.accessibility.hasSkipNav ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has Language Declaration</td><td>${a.accessibility.hasLanguageDeclaration ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has Title</td><td>${a.accessibility.hasTitle ? 'Yes' : 'No'}</td></tr>
        <tr><td>Heading Gaps</td><td>${a.accessibility.headingGapWarnings.map(w => `"${escapeHtml(w)}"`).join(', ') || 'None'}</td></tr>
        <tr><td>Landmark Elements</td><td>${a.accessibility.landmarkElements.join(', ') || 'None'}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Performance Hints</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>External Scripts</td><td>${a.performance.externalScripts}</td></tr>
        <tr><td>Inline Scripts</td><td>${a.performance.inlineScripts}</td></tr>
        <tr><td>External Styles</td><td>${a.performance.externalStyles}</td></tr>
        <tr><td>Total Images</td><td>${a.performance.totalImages}</td></tr>
        <tr><td>Estimated Requests</td><td>${a.performance.totalRequests}</td></tr>
        <tr><td>DOM Elements</td><td>${a.performance.domElements}</td></tr>
        <tr><td>Has Render-Blocking</td><td>${a.performance.hasRenderBlocking ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has Large DOM</td><td>${a.performance.hasLargeDom ? 'Yes' : 'No'}</td></tr>
      </table>
      ${a.performance.recommendations.length > 0 ? `
      <h3>Performance Recommendations</h3>
      <div class="recommendation-box">
        <ul>
          ${a.performance.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : ''}
    </div>

    <div class="section">
      <h2>Security Observations</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Uses HTTPS</td><td>${a.security.usesHttps ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has Forms</td><td>${a.security.hasForm ? 'Yes' : 'No'}</td></tr>
        <tr><td>External Links</td><td>${a.security.externalLinks}</td></tr>
        <tr><td>External Links w/o noopener</td><td>${a.security.externalLinksNoReferrer}</td></tr>
        <tr><td>Inline Scripts</td><td>${a.security.inlineScripts}</td></tr>
        <tr><td>Has Iframes</td><td>${a.security.hasIframe ? 'Yes' : 'No'}</td></tr>
        <tr><td>Iframe Sandbox</td><td>${a.security.iframeSandbox ? 'Yes' : 'No'}</td></tr>
        <tr><td>Exposed Emails</td><td>${a.security.exposedEmails.join(', ') || 'None'}</td></tr>
      </table>
      ${a.security.recommendations.length > 0 ? `
      <h3>Security Recommendations</h3>
      <div class="recommendation-box">
        <ul>
          ${a.security.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : ''}
    </div>

    <div class="section">
      <h2>Compliance Checks</h2>
      <table>
        <tr><th>Check</th><th>Status</th></tr>
        <tr><td>DOCTYPE</td><td>${a.compliance.hasDoctype ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Language Attribute</td><td>${a.compliance.hasLangAttribute ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Charset Declaration</td><td>${a.compliance.hasCharsetDeclaration ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Viewport Meta</td><td>${a.compliance.hasViewportMeta ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Robots Meta</td><td>${a.compliance.hasRobotsMeta ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Privacy Link</td><td>${a.compliance.hasPrivacyLink ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Terms Link</td><td>${a.compliance.hasTermsLink ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Cookie Notice</td><td>${a.compliance.hasCookieNotice ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Accessibility Statement</td><td>${a.compliance.hasAccessibilityStatement ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Favicon</td><td>${a.compliance.hasFavicon ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Canonical URL</td><td>${a.compliance.hasCanonical ? 'Present' : 'Missing'}</td></tr>
        <tr><td>Open Graph Tags</td><td>${a.compliance.hasOpenGraph ? 'Present' : 'Missing'}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Test Risks</h2>
      ${i.testRisks.length > 0 ? `
      <div class="risk-box">
        <ul>
          ${i.testRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : '<p>No significant risks identified</p>'}
    </div>

    <div class="section">
      <h2>Recommendations</h2>
      ${i.recommendations.length > 0 ? `
      <div class="recommendation-box">
        <ul>
          ${i.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : '<p>No recommendations</p>'}
    </div>
  `;
  
  html += generateHtmlFooter();
  return html;
}

function generateTestCasesHtml(testCases: TestCase[]): string {
  const grouped = groupByType(testCases);
  
  let html = generateHtmlHeader('Test Cases Report', '');
  
  html += `
    <div class="section">
      <h2>Summary</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${testCases.length}</div>
          <div class="label">Total Test Cases</div>
        </div>
        <div class="metric-card">
          <div class="value">${Object.keys(grouped).length}</div>
          <div class="label">Test Types</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Test Cases by Type</h2>
      <table>
        <tr><th>Test Type</th><th>Count</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th></tr>
        ${Object.entries(grouped).map(([type, cases]) => {
          const critical = cases.filter(c => c.priority === 'critical').length;
          const high = cases.filter(c => c.priority === 'high').length;
          const medium = cases.filter(c => c.priority === 'medium').length;
          const low = cases.filter(c => c.priority === 'low').length;
          return `<tr>
            <td><strong>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</strong></td>
            <td>${cases.length}</td>
            <td>${critical > 0 ? getPriorityBadge('critical') : '0'}</td>
            <td>${high > 0 ? getPriorityBadge('high') : '0'}</td>
            <td>${medium > 0 ? getPriorityBadge('medium') : '0'}</td>
            <td>${low > 0 ? getPriorityBadge('low') : '0'}</td>
          </tr>`;
        }).join('\n        ')}
      </table>
    </div>
  `;
  
  for (const [type, cases] of Object.entries(grouped)) {
    html += `
    <div class="section">
      <h2>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))} Test Cases</h2>
      ${cases.map(tc => `
      <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 15px; background: #fafafa;">
        <h3>${escapeHtml(tc.id)}: ${escapeHtml(tc.title)}</h3>
        <div style="margin: 10px 0;">
          ${getPriorityBadge(tc.priority)} ${getSeverityBadge(tc.severity)}
          <span style="margin-left: 10px; color: #666;"><strong>Duration:</strong> ${escapeHtml(tc.estimatedDuration)}</span>
        </div>
        <p><strong>Tags:</strong> ${tc.tags.map(t => `<code>${escapeHtml(t)}</code>`).join(' ')}</p>
        <p><strong>Description:</strong> ${escapeHtml(tc.description)}</p>
        ${tc.preconditions.length > 0 ? `
        <p><strong>Preconditions:</strong></p>
        <ul>${tc.preconditions.map(p => `<li>${escapeHtml(p)}</li>`).join('\n            ')}</ul>` : ''}
        ${tc.testData ? `
        <p><strong>Test Data:</strong></p>
        <pre><code>${escapeHtml(tc.testData)}</code></pre>` : ''}
        <p><strong>Steps:</strong></p>
        <ol>${tc.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('\n            ')}</ol>
        <p><strong>Expected Results:</strong></p>
        <ol>${tc.expectedResults.map(r => `<li>${escapeHtml(r)}</li>`).join('\n            ')}</ol>
      </div>`).join('')}
    </div>
    `;
  }
  
  html += generateHtmlFooter();
  return html;
}

function generateScenariosHtml(scenarios: TestScenario[]): string {
  let html = generateHtmlHeader('Test Scenarios Report', '');
  
  html += `
    <div class="section">
      <h2>Summary</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${scenarios.length}</div>
          <div class="label">Total Scenarios</div>
        </div>
      </div>
    </div>
  `;
  
  for (const sc of scenarios) {
    html += `
    <div class="section">
      <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 15px; background: #fafafa;">
        <h2>${escapeHtml(sc.id)}: ${escapeHtml(sc.title)}</h2>
        <div style="margin: 10px 0;">
          <span class="badge badge-medium">${escapeHtml(sc.type)}</span>
        </div>
        <p><strong>Tags:</strong> ${sc.tags.map(t => `<code>${escapeHtml(t)}</code>`).join(' ')}</p>
        <p><strong>Description:</strong> ${escapeHtml(sc.description)}</p>
        ${sc.preconditions.length > 0 ? `
        <p><strong>Preconditions:</strong></p>
        <ul>${sc.preconditions.map(p => `<li>${escapeHtml(p)}</li>`).join('\n          ')}</ul>` : ''}
        ${sc.relatedTestCases.length > 0 ? `
        <p><strong>Related Test Cases:</strong></p>
        <ul>${sc.relatedTestCases.map(tcId => `<li><code>${escapeHtml(tcId)}</code></li>`).join('\n          ')}</ul>` : ''}
      </div>
    </div>
    `;
  }
  
  html += generateHtmlFooter();
  return html;
}

function generateTestPlanHtml(plan: TestPlan): string {
  let html = generateHtmlHeader(plan.title, plan.targetUrl);
  
  html += `
    <div class="section">
      <h2>Plan Information</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Version</td><td>${escapeHtml(plan.version)}</td></tr>
        <tr><td>Created</td><td>${escapeHtml(plan.createdAt)}</td></tr>
        <tr><td>Target URL</td><td>${escapeHtml(plan.targetUrl)}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Scope</h2>
      <div class="info-box">
        <p>${escapeHtml(plan.scope)}</p>
      </div>
    </div>

    <div class="section">
      <h2>Out of Scope</h2>
      <ul>
        ${plan.outOfScope.map(item => `<li>${escapeHtml(item)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Test Objectives</h2>
      <ul>
        ${plan.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Test Types Covered</h2>
      <ul>
        ${plan.testTypes.map(t => `<li>${escapeHtml(t)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Test Environment</h2>
      <pre><code>${escapeHtml(plan.environment)}</code></pre>
    </div>

    <div class="section">
      <h2>Test Data Strategy</h2>
      <p>${escapeHtml(plan.testDataStrategy)}</p>
    </div>

    <div class="section">
      <h2>Entry Criteria</h2>
      <ul>
        ${plan.entryCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Exit Criteria</h2>
      <ul>
        ${plan.exitCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Deliverables</h2>
      <ul>
        ${plan.deliverables.map(d => `<li>${escapeHtml(d)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Risks and Mitigations</h2>
      ${plan.risksAndMitigations.map(r => `
      <div class="risk-box">
        <p><strong>Risk:</strong> ${escapeHtml(r.risk)}</p>
        <p><strong>Mitigation:</strong> ${escapeHtml(r.mitigation)}</p>
      </div>`).join('')}
    </div>

    <div class="section">
      <h2>Schedule</h2>
      ${plan.schedule.map(s => `
      <h3>${escapeHtml(s.phase)} (${escapeHtml(s.duration)})</h3>
      <ul>
        ${s.activities.map(a => `<li>${escapeHtml(a)}</li>`).join('\n        ')}
      </ul>`).join('')}
    </div>

    <div class="section">
      <h2>Roles and Responsibilities</h2>
      <table>
        <tr><th>Role</th><th>Responsibility</th></tr>
        ${plan.rolesAndResponsibilities.map(r => `<tr><td><strong>${escapeHtml(r.role)}</strong></td><td>${escapeHtml(r.responsibility)}</td></tr>`).join('\n        ')}
      </table>
    </div>

    <div class="section">
      <h2>Assumptions</h2>
      <ul>
        ${plan.assumptions.map(a => `<li>${escapeHtml(a)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Dependencies</h2>
      <ul>
        ${plan.dependencies.map(d => `<li>${escapeHtml(d)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Tools and Frameworks</h2>
      <ul>
        ${plan.toolsAndFrameworks.map(t => `<li>${escapeHtml(t)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <h2>Defect Management</h2>
      <p>${escapeHtml(plan.defectManagement)}</p>
    </div>

    <div class="section">
      <h2>Communication Plan</h2>
      <p>${escapeHtml(plan.communicationPlan)}</p>
    </div>
  `;
  
  html += generateHtmlFooter();
  return html;
}

function generateRtmHtml(rtm: RtmEntry[]): string {
  const total = rtm.length;
  const covered = rtm.filter(e => e.status === 'covered').length;
  const partial = rtm.filter(e => e.status === 'partial').length;
  const notCovered = rtm.filter(e => e.status === 'not-covered').length;
  const coveragePct = total > 0 ? Math.round(((covered + partial * 0.5) / total) * 100) : 0;
  
  let html = generateHtmlHeader('Requirements Traceability Matrix', '');
  
  html += `
    <div class="section">
      <h2>Coverage Summary</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${total}</div>
          <div class="label">Total Requirements</div>
        </div>
        <div class="metric-card">
          <div class="value">${covered}</div>
          <div class="label">Covered (${total > 0 ? Math.round((covered / total) * 100) : 0}%)</div>
        </div>
        <div class="metric-card">
          <div class="value">${partial}</div>
          <div class="label">Partial</div>
        </div>
        <div class="metric-card">
          <div class="value">${notCovered}</div>
          <div class="label">Not Covered</div>
        </div>
        <div class="metric-card">
          <div class="value">${coveragePct}%</div>
          <div class="label">Overall Coverage</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Requirements Matrix</h2>
      <table>
        <tr><th>Requirement ID</th><th>Description</th><th>Coverage Type</th><th>Status</th><th>Test Cases</th></tr>
        ${rtm.map(entry => `
        <tr>
          <td><strong>${escapeHtml(entry.requirementId)}</strong></td>
          <td>${escapeHtml(entry.requirementDescription)}</td>
          <td>${escapeHtml(entry.coverageType)}</td>
          <td>${getStatusBadge(entry.status)}</td>
          <td>${entry.testCaseIds.length > 0 ? entry.testCaseIds.map(id => `<code>${escapeHtml(id)}</code>`).join(', ') : 'N/A'}</td>
        </tr>`).join('')}
      </table>
    </div>
  `;
  
  if (notCovered > 0) {
    html += `
    <div class="section">
      <h2>Uncovered Requirements</h2>
      <div class="risk-box">
        <ul>
          ${rtm.filter(e => e.status === 'not-covered').map(e => `<li><strong>${escapeHtml(e.requirementId)}:</strong> ${escapeHtml(e.requirementDescription)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
    `;
  }
  
  html += generateHtmlFooter();
  return html;
}

function generateSummaryHtml(
  analysis: PageAnalysisResult,
  testCases: TestCase[],
  scenarios: TestScenario[],
  testPlan: TestPlan,
  rtm: RtmEntry[],
  insights: AnalyzedInsights,
): string {
  const grouped = groupByType(testCases);
  const totalRtm = rtm.length;
  const covered = rtm.filter(e => e.status === 'covered').length;
  const partial = rtm.filter(e => e.status === 'partial').length;
  const notCovered = rtm.filter(e => e.status === 'not-covered').length;
  
  let html = generateHtmlHeader('QA Test Summary Report', analysis.url);
  
  html += `
    <div class="section">
      <h2>Executive Summary</h2>
      <div class="info-box">
        <p>The QA Web Analyzer successfully analyzed the page at <strong>${escapeHtml(analysis.url)}</strong> and generated a comprehensive test suite. The page was classified as a <strong>${escapeHtml(insights.pageType)}</strong> with <strong>${escapeHtml(insights.complexity)}</strong> complexity.</p>
      </div>
    </div>

    <div class="section">
      <h2>Test Suite Overview</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Test Cases</td><td>${testCases.length}</td></tr>
        <tr><td>Test Types</td><td>${Object.keys(grouped).length}</td></tr>
        <tr><td>Test Scenarios</td><td>${scenarios.length}</td></tr>
        <tr><td>RTM Requirements</td><td>${rtm.length}</td></tr>
        <tr><td>Playwright Test Files</td><td>${Object.keys(grouped).length} spec files</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Test Cases by Type</h2>
      <table>
        <tr><th>Type</th><th>Count</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th></tr>
        ${Object.entries(grouped).map(([type, cases]) => {
          const critical = cases.filter(c => c.priority === 'critical').length;
          const high = cases.filter(c => c.priority === 'high').length;
          const medium = cases.filter(c => c.priority === 'medium').length;
          const low = cases.filter(c => c.priority === 'low').length;
          return `<tr>
            <td><strong>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</strong></td>
            <td>${cases.length}</td>
            <td>${critical > 0 ? getPriorityBadge('critical') : '0'}</td>
            <td>${high > 0 ? getPriorityBadge('high') : '0'}</td>
            <td>${medium > 0 ? getPriorityBadge('medium') : '0'}</td>
            <td>${low > 0 ? getPriorityBadge('low') : '0'}</td>
          </tr>`;
        }).join('\n        ')}
      </table>
    </div>

    <div class="section">
      <h2>Coverage Summary</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="value">${totalRtm > 0 ? Math.round(((covered + partial * 0.5) / totalRtm) * 100) : 0}%</div>
          <div class="label">Requirements Coverage</div>
        </div>
        <div class="metric-card">
          <div class="value">${insights.estimatedTestCoverage}%</div>
          <div class="label">Estimated Page Coverage</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Key Risks</h2>
      ${insights.testRisks.length > 0 ? `
      <div class="risk-box">
        <ul>
          ${insights.testRisks.slice(0, 5).map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : '<p>No significant risks identified</p>'}
    </div>

    <div class="section">
      <h2>Top Recommendations</h2>
      ${insights.recommendations.length > 0 ? `
      <div class="recommendation-box">
        <ul>
          ${insights.recommendations.slice(0, 5).map(r => `<li>${escapeHtml(r)}</li>`).join('\n          ')}
        </ul>
      </div>` : '<p>No recommendations</p>'}
    </div>

    <div class="section">
      <h2>Generated Files</h2>
      <table>
        <tr><th>Category</th><th>Files</th></tr>
        <tr><td>Reports (Markdown)</td><td>page-analysis.md, test-cases.md, test-scenarios.md, test-plan.md, rtm.md, test-summary.md</td></tr>
        <tr><td>Reports (HTML)</td><td>page-analysis.html, test-cases.html, test-scenarios.html, test-plan.html, rtm.html, test-summary.html</td></tr>
        <tr><td>Data (JSON)</td><td>page-analysis.json, test-cases.json, test-scenarios.json, test-plan.json, rtm.json, complete-export.json</td></tr>
        <tr><td>Playwright Tests</td><td>*.spec.js files organized by test type</td></tr>
        <tr><td>Playwright Config</td><td>playwright.config.js, package.json</td></tr>
      </table>
    </div>
  `;
  
  html += generateHtmlFooter();
  return html;
}
