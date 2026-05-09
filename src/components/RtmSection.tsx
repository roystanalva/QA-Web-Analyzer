import React, { useState } from 'react';
import type { RtmEntry } from '@/lib/types';

interface Props {
  rtm: RtmEntry[];
}

export function RtmSection({ rtm }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = rtm.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const covered = rtm.filter((e) => e.status === 'covered').length;
  const partial = rtm.filter((e) => e.status === 'partial').length;
  const notCovered = rtm.filter((e) => e.status === 'not-covered').length;
  const coveragePct = rtm.length > 0
    ? Math.round(((covered + partial * 0.5) / rtm.length) * 100)
    : 0;

  return (
    <div className="section">
      <h3>Requirements Traceability Matrix</h3>
      <p className="section-desc">
        Mapping requirements to test cases for coverage analysis.
      </p>

      <div className="rtm-stats">
        <div className="rtm-stat">
          <span className="rtm-stat-value">{rtm.length}</span>
          <span className="rtm-stat-label">Total Requirements</span>
        </div>
        <div className="rtm-stat">
          <span className="rtm-stat-value" style={{ color: '#10b981' }}>{covered}</span>
          <span className="rtm-stat-label">Covered</span>
        </div>
        <div className="rtm-stat">
          <span className="rtm-stat-value" style={{ color: '#f59e0b' }}>{partial}</span>
          <span className="rtm-stat-label">Partial</span>
        </div>
        <div className="rtm-stat">
          <span className="rtm-stat-value" style={{ color: '#ef4444' }}>{notCovered}</span>
          <span className="rtm-stat-label">Not Covered</span>
        </div>
        <div className="rtm-stat">
          <span className="rtm-stat-value" style={{ color: '#8b5cf6' }}>{coveragePct}%</span>
          <span className="rtm-stat-label">Coverage</span>
        </div>
      </div>

      <div className="rtm-progress">
        <div className="rtm-progress-bar">
          <div className="rtm-progress-covered" style={{ width: `${(covered / rtm.length) * 100}%` }} />
          <div className="rtm-progress-partial" style={{ width: `${(partial / rtm.length) * 100}%` }} />
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="rtm-filter">Status:</label>
        <select id="rtm-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="covered">Covered</option>
          <option value="partial">Partial</option>
          <option value="not-covered">Not Covered</option>
        </select>
      </div>

      {notCovered > 0 && statusFilter !== 'covered' && (
        <div className="rtm-warning">
          <strong>⚠️ {notCovered} requirement(s) not covered by any test case.</strong>
          {statusFilter === 'all' && ' Use the filter above to view uncovered requirements.'}
        </div>
      )}

      <div className="rtm-table-wrapper">
        <table className="rtm-table">
          <thead>
            <tr>
              <th>Req ID</th>
              <th>Description</th>
              <th>Type</th>
              <th>Status</th>
              <th>Test Cases</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className={`rtm-row rtm-${entry.status}`}>
                <td className="rtm-req-id">{entry.requirementId}</td>
                <td>{entry.requirementDescription}</td>
                <td><span className="badge badge-type">{entry.coverageType}</span></td>
                <td>
                  <span className={`rtm-status status-${entry.status}`}>
                    {entry.status === 'covered' ? '✓' : entry.status === 'partial' ? '◐' : '✗'}
                    {' '}{entry.status}
                  </span>
                </td>
                <td>
                  {entry.testCaseIds.length > 0
                    ? entry.testCaseIds.map((id) => <span key={id} className="tag">{id}</span>)
                    : <span className="rtm-no-tests">No tests</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
