import React, { useState } from 'react';
import type { TestPlan } from '@/lib/types';

interface Props {
  testPlan: TestPlan;
}

export function TestPlanSection({ testPlan }: Props) {
  const [activeSection, setActiveSection] = useState<string>('scope');

  const sections = [
    { id: 'scope', label: 'Scope' },
    { id: 'objectives', label: 'Objectives' },
    { id: 'criteria', label: 'Entry/Exit Criteria' },
    { id: 'risks', label: 'Risks' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'roles', label: 'Roles' },
  ];

  return (
    <div className="section">
      <h3>{testPlan.title}</h3>
      <p className="section-desc">Version {testPlan.version} &middot; {new Date(testPlan.createdAt).toLocaleString()}</p>

      <div className="plan-tabs">
        {sections.map((s) => (
          <button
            key={s.id}
            className={`plan-tab ${activeSection === s.id ? 'plan-tab-active' : ''}`}
            onClick={() => setActiveSection(s.id)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="plan-content">
        {activeSection === 'scope' && (
          <div>
            <h4>Scope</h4>
            <p>{testPlan.scope}</p>
            <h4>Out of Scope</h4>
            <ul>{testPlan.outOfScope.map((item, i) => <li key={i}>{item}</li>)}</ul>
            <h4>Deliverables</h4>
            <ul>{testPlan.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
            <h4>Test Types Covered</h4>
            <div className="tag-list">{testPlan.testTypes.map((t) => <span key={t} className="tag">{t}</span>)}</div>
          </div>
        )}

        {activeSection === 'objectives' && (
          <div>
            <h4>Objectives</h4>
            <ul>{testPlan.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
            <h4>Assumptions</h4>
            <ul>{testPlan.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            <h4>Dependencies</h4>
            <ul>{testPlan.dependencies.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        )}

        {activeSection === 'criteria' && (
          <div>
            <h4>Entry Criteria</h4>
            <ul>{testPlan.entryCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
            <h4>Exit Criteria</h4>
            <ul>{testPlan.exitCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
            <h4>Test Data Strategy</h4>
            <p>{testPlan.testDataStrategy}</p>
            <h4>Environment</h4>
            <pre className="plan-pre">{testPlan.environment}</pre>
          </div>
        )}

        {activeSection === 'risks' && (
          <div>
            <h4>Risks and Mitigations</h4>
            {testPlan.risksAndMitigations.map((r, i) => (
              <div key={i} className="risk-item">
                <div className="risk-risk"><strong>Risk:</strong> {r.risk}</div>
                <div className="risk-mitigation"><strong>Mitigation:</strong> {r.mitigation}</div>
              </div>
            ))}
            <h4>Defect Management</h4>
            <p>{testPlan.defectManagement}</p>
            <h4>Communication Plan</h4>
            <p>{testPlan.communicationPlan}</p>
          </div>
        )}

        {activeSection === 'schedule' && (
          <div>
            <h4>Schedule</h4>
            {testPlan.schedule.map((s, i) => (
              <div key={i} className="schedule-item">
                <div className="schedule-phase">
                  <strong>{s.phase}</strong> <span className="schedule-duration">({s.duration})</span>
                </div>
                <ul>{s.activities.map((a, j) => <li key={j}>{a}</li>)}</ul>
              </div>
            ))}
            <h4>Tools and Frameworks</h4>
            <ul>{testPlan.toolsAndFrameworks.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}

        {activeSection === 'roles' && (
          <div>
            <h4>Roles and Responsibilities</h4>
            {testPlan.rolesAndResponsibilities.map((r, i) => (
              <div key={i} className="role-item">
                <strong>{r.role}</strong>: {r.responsibility}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
