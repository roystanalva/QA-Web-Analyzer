import React, { useState, useCallback } from 'react';
import type { ExportFiles } from '@/lib/types';

interface DownloadPanelProps {
  exports: ExportFiles;
  pageUrl: string;
}

export default function DownloadPanel({ exports, pageUrl }: DownloadPanelProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const downloadFile = useCallback(
    (filename: string, content: string, category: string) => {
      setDownloading(filename);
      try {
        const blob = new Blob([content], { type: getMimeType(filename) });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('tests/', '').replace('reports/', '').replace('json/', '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download failed:', err);
      } finally {
        setTimeout(() => setDownloading(null), 1000);
      }
    },
    [],
  );

  const downloadAll = useCallback(() => {
    setDownloading('all');
    try {
      for (const file of exports.markdown) {
        const blob = new Blob([file.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-${file.filename.replace('/', '-').replace('reports-', '')}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      for (const file of exports.json) {
        const blob = new Blob([file.content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-${file.filename.replace('/', '-').replace('json-', '')}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      for (const file of exports.playwright) {
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
      console.error('Batch download failed');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  }, [exports]);

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const allCount = exports.markdown.length + exports.json.length + exports.playwright.length;

  return (
    <div className="download-panel">
      <div className="download-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Artifacts
        </h3>
        <div className="download-actions">
          <button className="btn btn-primary" onClick={downloadAll} disabled={downloading === 'all'}>
            {downloading === 'all' ? 'Downloading...' : `Download All (${allCount} files)`}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => copyToClipboard(JSON.stringify({ exports }, null, 2))}
          >
            {copied ? 'Copied!' : 'Copy JSON to Clipboard'}
          </button>
        </div>
      </div>

      <div className="download-sections">
        <DownloadSection
          title="Markdown Reports"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          files={exports.markdown}
          onDownload={downloadFile}
          downloading={downloading}
        />
        <DownloadSection
          title="JSON Data"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          }
          files={exports.json}
          onDownload={downloadFile}
          downloading={downloading}
        />
        <DownloadSection
          title="Playwright Tests"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          }
          files={exports.playwright}
          onDownload={downloadFile}
          downloading={downloading}
        />
      </div>
    </div>
  );
}

interface DownloadSectionProps {
  title: string;
  icon: React.ReactNode;
  files: { filename: string; content: string }[];
  onDownload: (filename: string, content: string, category: string) => void;
  downloading: string | null;
}

function DownloadSection({ title, icon, files, onDownload, downloading }: DownloadSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="download-section">
      <button
        className="download-section-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        {icon}
        <span>{title} ({files.length})</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {!collapsed && (
        <div className="download-section-body">
          {files.map((file) => (
            <div key={file.filename} className="download-item">
              <span className="download-filename" title={file.filename}>
                {file.filename.replace('tests/', '').replace('reports/', '').replace('json/', '')}
              </span>
              <div className="download-item-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => onDownload(file.filename, file.content, title)}
                  disabled={downloading === file.filename}
                >
                  {downloading === file.filename ? '...' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getMimeType(filename: string): string {
  if (filename.endsWith('.md')) return 'text/markdown';
  if (filename.endsWith('.json')) return 'application/json';
  if (filename.endsWith('.js') || filename.endsWith('.mjs')) return 'text/javascript';
  return 'text/plain';
}
