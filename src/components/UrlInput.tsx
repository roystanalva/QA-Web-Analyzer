import React, { useState, type FormEvent } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL');
      return;
    }

    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }

    try {
      new URL(normalized);
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        onSubmit(normalized);
      } else {
        setError('URL must start with http:// or https://');
      }
    } catch {
      setError('Invalid URL format. Please enter a valid webpage URL.');
    }
  }

  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit} className="url-input-form" noValidate>
        <div className="url-input-wrapper">
          <svg className="url-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://example.com"
            className="url-input"
            disabled={isLoading}
            aria-label="Webpage URL to analyze"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </form>
      {error && <p className="url-error">{error}</p>}
    </div>
  );
}
