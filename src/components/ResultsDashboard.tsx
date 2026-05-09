import React, { useState } from 'react';
import type {
  PageAnalysisResult,
  TestCase,
  TestScenario,
  TestPlan,
  RtmEntry,
  ExportFiles,
} from '@/lib/types';
import { TestCasesSection } from './TestCasesSection';
import { TestScenariosSection } from './TestScenariosSection';
import { TestPlanSection } from './TestPlanSection';
import { RtmSection } from './RtmSection';
import { PlaywrightSection } from './PlaywrightSection';
import DownloadPanel from './DownloadPanel';

interface ResultsDashboardProps {
  analysis: PageAnalysisResult;
  testCases: TestCase[];
  scenarios: TestScenario[];
  testPlan: TestPlan;
  rtm: RtmEntry[];
  exports: ExportFiles;
}

export default function ResultsDashboard({
  analysis,
  testCases,
  scenarios,
  testPlan,
  rtm,
  exports,
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'analysis', label: 'Page Analysis', icon: '🔍' },
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
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-view">
            <PageAnalysisCard analysis={analysis} />
          </div>
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
