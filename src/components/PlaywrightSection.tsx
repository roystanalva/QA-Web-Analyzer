import React, { useState, useCallback } from 'react';

interface Props {
  files: { filename: string; content: string }[];
  targetUrl: string;
}

export function PlaywrightSection({ files, targetUrl }: Props) {
  const [selectedFile, setSelectedFile] = useState<string>(
    files.length > 0 ? files[0].filename : '',
  );
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const selectedContent = files.find((f) => f.filename === selectedFile)?.content || '';

  const copyCode = useCallback(() => {
    if (!selectedContent) return;
    navigator.clipboard.writeText(selectedContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selectedContent]);

  const downloadScripts = useCallback(() => {
    setDownloading(true);
    try {
      for (const file of files) {
        const blob = new Blob([file.content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-${file.filename.replace('/', '-')}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      console.error('Download failed');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  }, [files]);

  return (
    <div className="section playwright-section">
      <div className="playwright-header">
        <div>
          <h3>Generated Playwright Test Scripts</h3>
          <p className="section-desc">
            Runnable test scripts generated for <code>{targetUrl}</code>. 
            {files.length > 0 && ` (${files.length} files)`}
          </p>
        </div>
        <div className="playwright-actions">
          <button className="btn btn-primary" onClick={downloadScripts} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download All Scripts'}
          </button>
        </div>
      </div>

      <div className="playwright-instructions">
        <h4>How to Run</h4>
        <pre className="code-block">
{`# 1. Install dependencies
npm install

# 2. Run all tests
npx playwright test

# 3. Run by tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@security"

# 4. Run by browser
npx playwright test --project chromium
npx playwright test --project firefox

# 5. View HTML report
npx playwright show-report`}
        </pre>
      </div>

      <div className="playwright-browser">
        <div className="playwright-file-list">
          {files.map((file) => (
            <button
              key={file.filename}
              className={`playwright-file ${selectedFile === file.filename ? 'playwright-file-active' : ''}`}
              onClick={() => setSelectedFile(file.filename)}
              type="button"
              title={file.filename}
            >
              {file.filename.replace('tests/', '').replace('.spec.js', '')}
            </button>
          ))}
        </div>
        <div className="playwright-code-view">
          <div className="playwright-code-header">
            <span className="playwright-filename-label">{selectedFile}</span>
            <button className="btn btn-sm" onClick={copyCode}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="playwright-code">
            <code>{selectedContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
