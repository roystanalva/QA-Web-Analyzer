import React, { useState, useCallback } from 'react';
import type { PageAnalysisResult, TestCase, TestScenario, TestPlan, RtmEntry, ExportFiles } from '@/lib/types';
import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import LoadingOverlay from '@/components/LoadingOverlay';
import ResultsDashboard from '@/components/ResultsDashboard';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    analysis: PageAnalysisResult;
    testCases: TestCase[];
    scenarios: TestScenario[];
    testPlan: TestPlan;
    rtm: RtmEntry[];
    exports: ExportFiles;
  } | null>(null);

  const handleAnalyze = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setResults({
        analysis: data.analysis,
        testCases: data.artifacts.testCases,
        scenarios: data.artifacts.scenarios,
        testPlan: data.artifacts.testPlan,
        rtm: data.artifacts.rtm,
        exports: data.exports,
      });
    } catch (err: any) {
      setError(
        err?.message === 'Failed to fetch'
          ? 'Could not connect to the server. Make sure the application is running.'
          : err?.message || 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="main">
        <section className="hero">
          <div className="hero-content">
            <h2>Analyze. Generate. Test.</h2>
            <p>
              Enter any public webpage URL to automatically generate comprehensive QA artifacts:
              test cases, scenarios, test plans, RTM, and executable Playwright scripts.
            </p>
          </div>
        </section>

        <section className="input-section">
          <UrlInput onSubmit={handleAnalyze} isLoading={isLoading} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <div className="error-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button className="error-dismiss" onClick={dismissError} type="button" aria-label="Dismiss error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {isLoading && <LoadingOverlay />}

        {results && !isLoading && (
          <ResultsDashboard
            analysis={results.analysis}
            testCases={results.testCases}
            scenarios={results.scenarios}
            testPlan={results.testPlan}
            rtm={results.rtm}
            exports={results.exports}
          />
        )}

        {!results && !isLoading && !error && (
          <section className="features-section">
            <div className="features">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Page Analysis</h3>
                <p>Deep inspection of page structure, metadata, forms, links, accessibility, performance, and security signals.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🧪</div>
                <h3>12 Test Types</h3>
                <p>Functional, smoke, regression, ad-hoc, accessibility, security, compliance, performance, load, UI, API, and UAT.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3>Test Plan &amp; RTM</h3>
                <p>Complete test plans with scope, schedule, risks, and a Requirements Traceability Matrix.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎭</div>
                <h3>Playwright Scripts</h3>
                <p>Executable JavaScript test files with tagging, grouping, and cross-browser configuration.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h3>Export Anywhere</h3>
                <p>Download as Markdown reports, JSON data, or Playwright test scripts for CI/CD integration.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏷️</div>
                <h3>Smart Tagging</h3>
                <p>Every test case tagged by type, priority, and severity for easy filtering and execution.</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>QA Web Analyzer &mdash; Generate production-ready QA artifacts from any webpage URL</p>
      </footer>
    </div>
  );
}
