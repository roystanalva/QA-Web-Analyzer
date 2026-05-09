import React from 'react';

export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner-large" />
        <h2>Analyzing Webpage...</h2>
        <div className="loading-steps">
          <p><span className="loading-step active">1</span> Crawling page structure</p>
          <p><span className="loading-step">2</span> Extracting metadata & elements</p>
          <p><span className="loading-step">3</span> Running analysis engine</p>
          <p><span className="loading-step">4</span> Generating test artifacts</p>
          <p><span className="loading-step">5</span> Creating Playwright scripts</p>
        </div>
      </div>
    </div>
  );
}
