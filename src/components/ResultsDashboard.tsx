import React, { useState } from 'react';
import type {
  PageAnalysisResult,
  TestCase,
  TestScenario,
  TestPlan,
  RtmEntry,
  ExportFiles,
  AccessibilityError,
  Issue,
} from '@/lib/types';
import { TestCasesSection } from './TestCasesSection';
import { TestScenariosSection } from './TestScenariosSection';
import { TestPlanSection } from './TestPlanSection';
import { RtmSection } from './RtmSection';
import { PlaywrightSection } from './PlaywrightSection';
import { IssuesSection } from './IssuesSection';
import DownloadPanel from './DownloadPanel';

interface ResultsDashboardProps {
  analysis: PageAnalysisResult;
  testCases: TestCase[];
  scenarios: TestScenario[];
  testPlan: TestPlan;
  rtm: RtmEntry[];
  exports: ExportFiles;
  accessibilityErrors?: AccessibilityError[];
  issues?: Issue[];
}

export default function ResultsDashboard({
  analysis,
  testCases,
  scenarios,
  testPlan,
  rtm,
  exports,
  accessibilityErrors = [],
  issues = [],
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'analysis', label: 'Page Analysis', icon: '🔍' },
    { id: 'techstack', label: 'Tech Stack', icon: '🛠️' },
    { id: 'issues', label: `Issues (${issues.length})`, icon: '🐛' },
    { id: 'testcases', label: `Test Cases (${testCases.length})`, icon: '✅' },
    { id: 'scenarios', label: `Scenarios (${scenarios.length})`, icon: '📋' },
    { id: 'testplan', label: 'Test Plan', icon: '📄' },
    { id: 'rtm', label: `RTM (${rtm.length})`, icon: '🔗' },
    { id: 'playwright', label: 'Playwright Scripts', icon: '🎭' },
    { id: 'download', label: 'Download', icon: '⬇️' },
  ];

  const groupedByType = groupByType(testCases);

  const summaryCards = [
    { label: 'Total Test Cases', value: testCases.length, color: '#3b82f6' },
    { label: 'Test Types', value: Object.keys(groupedByType).length, color: '#8b5cf6' },
    { label: 'Scenarios', value: scenarios.length, color: '#10b981' },
    { label: 'RTM Requirements', value: rtm.length, color: '#f59e0b' },
    { label: 'Playwright Files', value: exports.playwright.length, color: '#ef4444' },
    { label: 'Downloadable Files', value: exports.markdown.length + exports.json.length + exports.playwright.length, color: '#06b6d4' },
    ...(accessibilityErrors.length > 0 ? [{ label: 'A11y Issues', value: accessibilityErrors.length, color: '#f43f5e' }] : []),
  ];

  const testTypeLabels: Record<string, string> = {
    functional: 'Functional', smoke: 'Smoke', regression: 'Regression',
    'ad-hoc': 'Ad-hoc', accessibility: 'Accessibility', security: 'Security',
    compliance: 'Compliance', performance: 'Performance', load: 'Load',
    ui: 'UI', api: 'API', uat: 'UAT',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Analysis Results for <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="result-url">{analysis.url}</a></h2>
        <p className="dashboard-meta">
          Page: &ldquo;{analysis.metadata.title}&rdquo; &middot;
          Load time: {analysis.loadTimeMs}ms &middot;
          Status: {analysis.statusCode}
        </p>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-view">
            <div className="summary-cards">
              {summaryCards.map((card) => (
                <div key={card.label} className="summary-card" style={{ borderTopColor: card.color }}>
                  <div className="summary-card-value" style={{ color: card.color }}>{card.value}</div>
                  <div className="summary-card-label">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="summary-breakdown">
              <h3>Test Cases by Type</h3>
              <div className="breakdown-grid">
                {Object.entries(groupedByType).map(([type, cases]) => {
                  const pcts: Record<string, number> = {};
                  cases.forEach((c) => { pcts[c.priority] = (pcts[c.priority] || 0) + 1; });
                  return (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-header">
                        <span className="breakdown-type">{testTypeLabels[type] || type}</span>
                        <span className="breakdown-count">{cases.length}</span>
                      </div>
                      <div className="breakdown-bar">
                        <div className="breakdown-fill" style={{
                          width: `${(cases.length / testCases.length) * 100}%`,
                          background: getTypeColor(type),
                        }} />
                      </div>
                      <div className="breakdown-priorities">
                        {pcts.critical > 0 && <span className="priority-badge critical">{pcts.critical} critical</span>}
                        {pcts.high > 0 && <span className="priority-badge high">{pcts.high} high</span>}
                        {pcts.medium > 0 && <span className="priority-badge medium">{pcts.medium} med</span>}
                        {pcts.low > 0 && <span className="priority-badge low">{pcts.low} low</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {accessibilityErrors.length > 0 && (
              <div className="summary-a11y-errors">
                <h3>Accessibility Issues</h3>
                <div className="a11y-errors-grid">
                  {accessibilityErrors.filter((e) => e.severity === 'critical').length > 0 && (
                    <div className="a11y-error-severity critical">
                      <span className="a11y-severity-badge">Critical</span>
                      <ul>
                        {accessibilityErrors.filter((e) => e.severity === 'critical').slice(0, 5).map((err, i) => (
                          <li key={i}>
                            <strong>{err.category}:</strong> {err.message}
                            {err.wcag && <span className="a11y-wcag-tag">WCAG {err.wcag}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accessibilityErrors.filter((e) => e.severity === 'warning').length > 0 && (
                    <div className="a11y-error-severity warning">
                      <span className="a11y-severity-badge">Warnings</span>
                      <ul>
                        {accessibilityErrors.filter((e) => e.severity === 'warning').slice(0, 5).map((err, i) => (
                          <li key={i}>
                            <strong>{err.category}:</strong> {err.message}
                            {err.wcag && <span className="a11y-wcag-tag">WCAG {err.wcag}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-view">
            <PageAnalysisCard analysis={analysis} />
          </div>
        )}

        {activeTab === 'techstack' && (
          <div className="techstack-view">
            <TechStackSection analysis={analysis} />
          </div>
        )}

        {activeTab === 'issues' && (
          <IssuesSection issues={issues} />
        )}

        {activeTab === 'testcases' && (
          <TestCasesSection testCases={testCases} />
        )}

        {activeTab === 'scenarios' && (
          <TestScenariosSection scenarios={scenarios} />
        )}

        {activeTab === 'testplan' && (
          <TestPlanSection testPlan={testPlan} />
        )}

        {activeTab === 'rtm' && (
          <RtmSection rtm={rtm} />
        )}

        {activeTab === 'playwright' && (
          <PlaywrightSection files={exports.playwright} targetUrl={analysis.url} />
        )}

        {activeTab === 'download' && (
          <DownloadPanel exports={exports} pageUrl={analysis.url} />
        )}
      </div>
    </div>
  );
}

function PageAnalysisCard({ analysis }: { analysis: PageAnalysisResult }) {
  const acc = analysis.accessibility;
  const perf = analysis.performance;
  const sec = analysis.security;
  const comp = analysis.compliance;

  const sections = [
    {
      title: 'Metadata',
      items: [
        ['Title', analysis.metadata.title],
        ['Description', analysis.metadata.description],
        ['Language', analysis.metadata.language],
        ['Charset', analysis.metadata.charset],
        ['Viewport', analysis.metadata.viewport],
        ['Canonical URL', analysis.metadata.canonicalUrl],
        ['Robots', analysis.metadata.robots],
        ['Favicon', analysis.metadata.favicon],
      ].filter(([, v]) => v),
    },
    {
      title: 'Content Stats',
      items: [
        ['Words', analysis.wordCount],
        ['Headings', analysis.headings.length],
        ['Links', analysis.links.length],
        ['Forms', analysis.forms.length],
        ['Buttons', analysis.buttons.length],
        ['Images', analysis.images.length],
        ['Tables', analysis.tables.length],
        ['Lists', analysis.listCount],
        ['Iframes', analysis.iframeCount],
        ['Paragraphs', analysis.paragraphCount],
      ],
    },
    {
      title: 'Accessibility',
      items: [
        ['Images w/ Alt', `${acc.imagesWithAlt}/${acc.totalImages}`],
        ['Missing Alt', acc.missingAltText],
        ['Form Labels Missing', acc.formLabelsMissing],
        ['ARIA Labels', acc.ariaLabelCount],
        ['ARIA Roles', acc.ariaRoleCount],
        ['Skip Nav', acc.hasSkipNav ? 'Yes' : 'No'],
        ['Language Declared', acc.hasLanguageDeclaration ? 'Yes' : 'No'],
      ],
    },
    {
      title: 'Performance',
      items: [
        ['Load Time', `${analysis.loadTimeMs}ms`],
        ['External Scripts', perf.externalScripts],
        ['Inline Scripts', perf.inlineScripts],
        ['External Styles', perf.externalStyles],
        ['DOM Elements', perf.domElements],
        ['Large DOM', perf.hasLargeDom ? 'Yes' : 'No'],
      ],
    },
    {
      title: 'Security',
      items: [
        ['HTTPS', sec.usesHttps ? 'Yes' : 'No'],
        ['Has Forms', sec.hasForm ? 'Yes' : 'No'],
        ['External Links', sec.externalLinks],
        ['Missing noopener', sec.externalLinksNoReferrer],
        ['Inline Scripts', sec.inlineScripts],
        ['Iframes', sec.hasIframe ? 'Yes' : 'No'],
      ],
    },
    {
      title: 'Compliance',
      items: [
        ['DOCTYPE', comp.hasDoctype ? '✓' : '✗'],
        ['Lang Attribute', comp.hasLangAttribute ? '✓' : '✗'],
        ['Charset', comp.hasCharsetDeclaration ? '✓' : '✗'],
        ['Viewport', comp.hasViewportMeta ? '✓' : '✗'],
        ['Privacy Link', comp.hasPrivacyLink ? '✓' : '✗'],
        ['Terms Link', comp.hasTermsLink ? '✓' : '✗'],
        ['Cookie Notice', comp.hasCookieNotice ? '✓' : '✗'],
        ['Favicon', comp.hasFavicon ? '✓' : '✗'],
        ['Canonical', comp.hasCanonical ? '✓' : '✗'],
        ['Open Graph', comp.hasOpenGraph ? '✓' : '✗'],
      ],
    },
  ];

  return (
    <div className="analysis-grid">
      {sections.map((section) => (
        <div key={section.title} className="analysis-card">
          <h4>{section.title}</h4>
          <table className="analysis-table">
            <tbody>
              {section.items.map(([key, val]) => (
                <tr key={String(key)}>
                  <td className="analysis-key">{String(key)}</td>
                  <td className="analysis-value">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    functional: '#3b82f6', smoke: '#10b981', regression: '#8b5cf6',
    'ad-hoc': '#f59e0b', accessibility: '#06b6d4', security: '#ef4444',
    compliance: '#14b8a6', performance: '#f97316', load: '#eab308',
    ui: '#ec4899', api: '#6366f1', uat: '#84cc16',
  };
  return colors[type] || '#6b7280';
}

function groupByType(testCases: TestCase[]): Record<string, TestCase[]> {
  const groups: Record<string, TestCase[]> = {};
  for (const tc of testCases) {
    if (!groups[tc.type]) groups[tc.type] = [];
    groups[tc.type].push(tc);
  }
  return groups;
}

function TechStackSection({ analysis }: { analysis: PageAnalysisResult }) {
  const a = analysis;
  const desc = a.metadata.description || '';
  const title = a.metadata.title || '';
  const combined = `${title} ${desc}`.toLowerCase();

  const techStack: { category: string; items: { name: string; confidence: string; evidence: string }[] }[] = [];

  const serverTech: { name: string; confidence: string; evidence: string }[] = [];
  if (a.security.usesHttps) serverTech.push({ name: 'HTTPS/SSL', confidence: 'confirmed', evidence: 'Page served over HTTPS' });
  if (a.compliance.hasDoctype) serverTech.push({ name: 'HTML5', confidence: 'confirmed', evidence: 'DOCTYPE html declaration present' });
  if (a.metadata.charset) serverTech.push({ name: a.metadata.charset.toUpperCase(), confidence: 'confirmed', evidence: 'Charset meta tag found' });
  if (a.compliance.hasViewportMeta) serverTech.push({ name: 'Responsive Design', confidence: 'confirmed', evidence: 'Viewport meta tag present' });
  if (a.performance.inlineScripts > 0) serverTech.push({ name: 'Server-Side Rendering', confidence: 'likely', evidence: `${a.performance.inlineScripts} inline scripts detected` });
  if (a.iframeCount > 0) serverTech.push({ name: 'Embedded Content (iframes)', confidence: 'confirmed', evidence: `${a.iframeCount} iframe(s) found` });
  if (serverTech.length > 0) techStack.push({ category: 'Server & Protocol', items: serverTech });

  const frontendTech: { name: string; confidence: string; evidence: string }[] = [];
  if (a.performance.externalStyles > 0) frontendTech.push({ name: 'CSS Stylesheets', confidence: 'confirmed', evidence: `${a.performance.externalStyles} external stylesheets` });
  if (a.performance.externalScripts > 0) frontendTech.push({ name: 'JavaScript', confidence: 'confirmed', evidence: `${a.performance.externalScripts} external scripts` });
  if (a.performance.inlineScripts > 0) frontendTech.push({ name: 'Inline JavaScript', confidence: 'confirmed', evidence: `${a.performance.inlineScripts} inline scripts` });
  if (a.semanticElements.length > 0) frontendTech.push({ name: 'Semantic HTML5', confidence: 'confirmed', evidence: `Uses: ${a.semanticElements.join(', ')}` });
  if (a.accessibility.ariaRoleCount > 0 || a.accessibility.ariaLabelCount > 0) frontendTech.push({ name: 'WAI-ARIA', confidence: 'confirmed', evidence: `${a.accessibility.ariaRoleCount} roles, ${a.accessibility.ariaLabelCount} labels` });
  if (a.forms.length > 0) frontendTech.push({ name: 'HTML Forms', confidence: 'confirmed', evidence: `${a.forms.length} form(s) with ${a.forms.reduce((s, f) => s + f.fields.length, 0)} fields` });
  if (a.tables.length > 0) frontendTech.push({ name: 'HTML Tables', confidence: 'confirmed', evidence: `${a.tables.length} table(s)` });
  if (a.images.some((i) => i.src.endsWith('.webp') || i.src.endsWith('.avif'))) frontendTech.push({ name: 'Modern Image Formats (WebP/AVIF)', confidence: 'confirmed', evidence: 'Modern image formats detected' });
  if (a.images.some((i) => i.src.includes('data:'))) frontendTech.push({ name: 'Data URIs', confidence: 'confirmed', evidence: 'Inline data URIs found' });
  if (a.performance.domElements > 1000) frontendTech.push({ name: 'Complex SPA-like Structure', confidence: 'likely', evidence: `${a.performance.domElements} DOM elements` });
  if (frontendTech.length > 0) techStack.push({ category: 'Frontend', items: frontendTech });

  const frameworks: { name: string; confidence: string; evidence: string }[] = [];
  const scriptSrcs = a.security.recommendations.join(' ').toLowerCase();
  if (combined.includes('react') || combined.includes('next')) frameworks.push({ name: 'React/Next.js', confidence: 'detected', evidence: 'References in page metadata' });
  if (combined.includes('angular')) frameworks.push({ name: 'Angular', confidence: 'detected', evidence: 'References in page metadata' });
  if (combined.includes('vue')) frameworks.push({ name: 'Vue.js', confidence: 'detected', evidence: 'References in page metadata' });
  if (combined.includes('bootstrap')) frameworks.push({ name: 'Bootstrap', confidence: 'detected', evidence: 'References in page metadata' });
  if (combined.includes('tailwind')) frameworks.push({ name: 'Tailwind CSS', confidence: 'detected', evidence: 'References in page metadata' });
  if (combined.includes('jquery') || combined.includes('jquery')) frameworks.push({ name: 'jQuery', confidence: 'detected', evidence: 'References in page metadata' });
  if (a.forms.some((f) => f.fields.some((fd) => fd.autoComplete))) frameworks.push({ name: 'Form Auto-complete', confidence: 'confirmed', evidence: 'autocomplete attributes present' });
  if (frameworks.length > 0) techStack.push({ category: 'Frameworks & Libraries', items: frameworks });

  const seoTech: { name: string; confidence: string; evidence: string }[] = [];
  if (a.metadata.ogTitle || a.metadata.ogDescription || a.metadata.ogImage) seoTech.push({ name: 'Open Graph Protocol', confidence: 'confirmed', evidence: 'OG meta tags present' });
  if (a.compliance.hasCanonical) seoTech.push({ name: 'Canonical URLs', confidence: 'confirmed', evidence: 'Canonical link tag present' });
  if (a.compliance.hasRobotsMeta) seoTech.push({ name: 'Robots Meta', confidence: 'confirmed', evidence: 'Robots meta tag present' });
  if (a.compliance.hasSitemap) seoTech.push({ name: 'Sitemap', confidence: 'confirmed', evidence: 'Sitemap reference found' });
  if (a.metadata.favicon) seoTech.push({ name: 'Favicon', confidence: 'confirmed', evidence: 'Favicon link present' });
  if (seoTech.length > 0) techStack.push({ category: 'SEO & Meta', items: seoTech });

  const a11yTech: { name: string; confidence: string; evidence: string }[] = [];
  if (a.accessibility.hasSkipNav) a11yTech.push({ name: 'Skip Navigation', confidence: 'confirmed', evidence: 'Skip nav link present' });
  if (a.accessibility.hasLanguageDeclaration) a11yTech.push({ name: 'Language Declaration', confidence: 'confirmed', evidence: 'lang attribute present' });
  if (a.accessibility.landmarkElements.length > 0) a11yTech.push({ name: 'ARIA Landmarks', confidence: 'confirmed', evidence: `Landmarks: ${a.accessibility.landmarkElements.join(', ')}` });
  if (a.accessibility.hasFocusableElements) a11yTech.push({ name: 'Keyboard Navigation', confidence: 'likely', evidence: 'Focusable elements present' });
  if (a.compliance.hasAccessibilityStatement) a11yTech.push({ name: 'Accessibility Statement', confidence: 'confirmed', evidence: 'A11y statement link found' });
  if (a11yTech.length > 0) techStack.push({ category: 'Accessibility', items: a11yTech });

  const securityTech: { name: string; confidence: string; evidence: string }[] = [];
  if (a.security.usesHttps) securityTech.push({ name: 'HTTPS Encryption', confidence: 'confirmed', evidence: 'SSL/TLS active' });
  if (a.security.hasForm) securityTech.push({ name: 'Form Security', confidence: 'confirmed', evidence: `${a.security.formActions.length} form action(s)` });
  if (a.security.hasIframe) securityTech.push({ name: 'Iframe Embedding', confidence: 'confirmed', evidence: `Iframe sandbox: ${a.security.iframeSandbox ? 'yes' : 'no'}` });
  if (a.security.hasCsp) securityTech.push({ name: 'Content Security Policy', confidence: 'confirmed', evidence: 'CSP headers detected' });
  if (a.security.exposedEmails.length > 0) securityTech.push({ name: 'Email Obfuscation', confidence: 'not detected', evidence: `${a.security.exposedEmails.length} exposed email(s)` });
  if (securityTech.length > 0) techStack.push({ category: 'Security', items: securityTech });

  const contentInfo: { name: string; confidence: string; evidence: string }[] = [];
  contentInfo.push({ name: 'Page Type', confidence: 'classified', evidence: 'Analyzed via metadata and structure' });
  contentInfo.push({ name: 'Word Count', confidence: 'measured', evidence: `${a.wordCount} words` });
  contentInfo.push({ name: 'Content Structure', confidence: 'analyzed', evidence: `${a.headings.length} headings, ${a.paragraphCount} paragraphs, ${a.listCount} lists` });
  contentInfo.push({ name: 'Navigation Complexity', confidence: 'analyzed', evidence: `${a.navElements.length} nav elements, ${a.links.length} links` });
  contentInfo.push({ name: 'Media Content', confidence: 'analyzed', evidence: `${a.images.length} images, ${a.tables.length} tables` });
  techStack.push({ category: 'Content Analysis', items: contentInfo });

  return (
    <div className="techstack-section">
      <div className="techstack-header">
        <h3>Website Technology Stack &amp; Description</h3>
        <p className="techstack-url">{a.url}</p>
      </div>

      <div className="techstack-overview">
        <div className="techstack-overview-card">
          <h4>Application Description</h4>
          <p className="techstack-description">
            {a.metadata.description || `This is a ${a.metadata.title || 'web page'} accessible at ${a.url}.`}
          </p>
          <div className="techstack-meta">
            <span><strong>Title:</strong> {a.metadata.title || 'N/A'}</span>
            <span><strong>Type:</strong> {a.metadata.ogTitle ? 'Social-Media Optimized' : 'Standard Web Page'}</span>
            <span><strong>Language:</strong> {a.metadata.language || 'Not declared'}</span>
            <span><strong>Status:</strong> HTTP {a.statusCode}</span>
            <span><strong>Load Time:</strong> {a.loadTimeMs}ms</span>
          </div>
        </div>
      </div>

      <div className="techstack-grid">
        {techStack.map((section) => (
          <div key={section.category} className="techstack-card">
            <h4>{section.category}</h4>
            <div className="techstack-items">
              {section.items.map((item) => (
                <div key={item.name} className="techstack-item">
                  <div className="techstack-item-header">
                    <span className="techstack-item-name">{item.name}</span>
                    <span className={`techstack-confidence ${item.confidence}`}>{item.confidence}</span>
                  </div>
                  <p className="techstack-evidence">{item.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
