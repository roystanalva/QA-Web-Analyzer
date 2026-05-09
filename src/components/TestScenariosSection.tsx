import React, { useState } from 'react';
import type { TestScenario } from '@/lib/types';

interface Props {
  scenarios: TestScenario[];
}

export function TestScenariosSection({ scenarios }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="section">
      <h3>Test Scenarios ({scenarios.length})</h3>
      <p className="section-desc">
        End-to-end test scenarios combining related test cases into complete user workflows.
      </p>

      <div className="scenarios-list">
        {scenarios.map((sc) => (
          <div key={sc.id} className="scenario-card">
            <button
              className="scenario-header"
              onClick={() => toggleExpand(sc.id)}
              type="button"
              aria-expanded={expanded === sc.id}
            >
              <div className="scenario-id">{sc.id}</div>
              <div className="scenario-title">{sc.title}</div>
              <div className="scenario-meta">
                <span className="badge badge-type">{sc.type}</span>
                <span className="scenario-tc-count">{sc.relatedTestCases.length} test cases</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: expanded === sc.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === sc.id && (
              <div className="scenario-body">
                <p><strong>Description:</strong> {sc.description}</p>

                {sc.preconditions.length > 0 && (
                  <div>
                    <strong>Preconditions:</strong>
                    <ul>{sc.preconditions.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}

                <div>
                  <strong>Related Test Cases:</strong>
                  <div className="scenario-tc-list">
                    {sc.relatedTestCases.map((tcId) => (
                      <span key={tcId} className="tag">{tcId}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Tags:</strong>
                  <div className="scenario-tags">
                    {sc.tags.map((tag) => (
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
