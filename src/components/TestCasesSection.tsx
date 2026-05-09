import React, { useState } from 'react';
import type { TestCase } from '@/lib/types';

interface Props {
  testCases: TestCase[];
}

const TEST_TYPE_LABELS: Record<string, string> = {
  functional: 'Functional', smoke: 'Smoke', regression: 'Regression',
  'ad-hoc': 'Ad-hoc', accessibility: 'Accessibility', security: 'Security',
  compliance: 'Compliance', performance: 'Performance', load: 'Load',
  ui: 'UI', api: 'API', uat: 'UAT',
};

export function TestCasesSection({ testCases }: Props) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const types = [...new Set(testCases.map((tc) => tc.type))];
  const priorities = [...new Set(testCases.map((tc) => tc.priority))];

  const filtered = testCases.filter((tc) => {
    if (filterType !== 'all' && tc.type !== filterType) return false;
    if (filterPriority !== 'all' && tc.priority !== filterPriority) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="section testcases-section">
      <div className="section-toolbar">
        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select id="type-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{TEST_TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="priority-filter">Priority:</label>
          <select id="priority-filter" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <span className="filter-count">{filtered.length} of {testCases.length} test cases</span>
      </div>

      <div className="test-cases-list">
        {filtered.length === 0 && (
          <p className="empty-state">No test cases match the selected filters.</p>
        )}
        {filtered.map((tc) => (
          <div key={tc.id} className={`test-case-card priority-${tc.priority}`}>
            <button
              className="test-case-header"
              onClick={() => toggleExpand(tc.id)}
              type="button"
              aria-expanded={expanded === tc.id}
            >
              <div className="test-case-id">{tc.id}</div>
              <div className="test-case-title">{tc.title}</div>
              <div className="test-case-meta">
                <span className={`badge badge-${tc.type}`}>{TEST_TYPE_LABELS[tc.type] || tc.type}</span>
                <span className={`badge badge-priority badge-${tc.priority}`}>{tc.priority}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: expanded === tc.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === tc.id && (
              <div className="test-case-body">
                <p className="test-case-desc">{tc.description}</p>

                {tc.preconditions.length > 0 && (
                  <div className="test-case-detail">
                    <strong>Preconditions:</strong>
                    <ul>{tc.preconditions.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}

                {tc.testData && (
                  <div className="test-case-detail">
                    <strong>Test Data:</strong>
                    <pre className="test-data-pre">{tc.testData}</pre>
                  </div>
                )}

                <div className="test-case-detail">
                  <strong>Steps:</strong>
                  <ol>{tc.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>

                <div className="test-case-detail">
                  <strong>Expected Results:</strong>
                  <ol>{tc.expectedResults.map((r, i) => <li key={i}>{r}</li>)}</ol>
                </div>

                <div className="test-case-footer">
                  <span><strong>Severity:</strong> {tc.severity}</span>
                  <span><strong>Duration:</strong> {tc.estimatedDuration}</span>
                  <div className="test-case-tags">
                    {tc.tags.map((tag) => (
                      <span key={tag} className="tag">@{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
