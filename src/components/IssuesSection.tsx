import React, { useState } from 'react';
import type { Issue } from '@/lib/types';

interface Props {
  issues: Issue[];
}

export function IssuesSection({ issues }: Props) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = [...new Set(issues.map((i) => i.category))];
  const severities = ['critical', 'major', 'minor'];

  const filtered = issues.filter((i) => {
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    return true;
  });

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="section issues-section">
      <div className="issues-summary-bar">
        <div className="issues-stat critical">
          <span className="issues-stat-value">{criticalCount}</span>
          <span className="issues-stat-label">Critical</span>
        </div>
        <div className="issues-stat major">
          <span className="issues-stat-value">{majorCount}</span>
          <span className="issues-stat-label">Major</span>
        </div>
        <div className="issues-stat minor">
          <span className="issues-stat-value">{minorCount}</span>
          <span className="issues-stat-label">Minor</span>
        </div>
        <div className="issues-stat total">
          <span className="issues-stat-value">{issues.length}</span>
          <span className="issues-stat-label">Total Issues</span>
        </div>
      </div>

      <div className="section-toolbar">
        <div className="filter-group">
          <label htmlFor="issue-severity-filter">Severity:</label>
          <select id="issue-severity-filter" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="all">All Severities</option>
            {severities.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="issue-category-filter">Category:</label>
          <select id="issue-category-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <span className="filter-count">{filtered.length} of {issues.length} issues</span>
      </div>

      <div className="issues-list">
        {filtered.length === 0 && (
          <p className="empty-state">No issues match the selected filters.</p>
        )}
        {filtered.map((issue) => (
          <div key={issue.id} className={`issue-card severity-${issue.severity}`}>
            <button
              className="issue-header"
              onClick={() => toggleExpand(issue.id)}
              type="button"
              aria-expanded={expanded === issue.id}
            >
              <div className="issue-id">{issue.id}</div>
              <div className="issue-title">{issue.title}</div>
              <div className="issue-meta">
                <span className={`badge badge-severity badge-${issue.severity}`}>{issue.severity}</span>
                <span className="badge badge-category">{issue.category}</span>
                {issue.wcag && <span className="badge badge-wcag">WCAG {issue.wcag}</span>}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: expanded === issue.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === issue.id && (
              <div className="issue-body">
                <p className="issue-description">{issue.description}</p>

                {issue.affectedElement && (
                  <div className="issue-detail">
                    <strong>Affected Element:</strong>
                    <code className="issue-element">{issue.affectedElement}</code>
                  </div>
                )}

                <div className="issue-detail">
                  <strong>Steps to Reproduce:</strong>
                  <ol>{issue.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>

                <div className="issue-detail issue-comparison">
                  <div className="issue-comparison-item expected">
                    <strong>Expected Result:</strong>
                    <p>{issue.expectedResult}</p>
                  </div>
                  <div className="issue-comparison-item actual">
                    <strong>Actual Result:</strong>
                    <p>{issue.actualResult}</p>
                  </div>
                </div>

                <div className="issue-detail issue-recommendation">
                  <strong>Recommendation:</strong>
                  <p>{issue.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
