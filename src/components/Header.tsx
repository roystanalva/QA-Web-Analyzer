import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H2v7l6.29 6.29a1 1 0 0 0 1.42 0l5.58-5.58a1 1 0 0 0 0-1.42L9 5Z" />
            <path d="M6 9.01V9" />
            <path d="m15 5 6.3 6.3a1 1 0 0 1 0 1.4L17 17" />
          </svg>
          <h1>QA Web Analyzer</h1>
        </div>
        <p className="header-subtitle">
          Analyze any webpage & generate production-ready QA artifacts
        </p>
      </div>
    </header>
  );
}
