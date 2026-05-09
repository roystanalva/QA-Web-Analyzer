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
