import { analyzePage } from '../src/lib/analyzer';
import type { PageAnalysisResult } from '../src/lib/types';

function createMockAnalysis(overrides: Partial<PageAnalysisResult> = {}): PageAnalysisResult {
  return {
    url: 'https://example.com',
    statusCode: 200,
    loadTimeMs: 500,
    metadata: {
      title: 'Example Page',
      description: 'An example page for testing',
      charset: 'UTF-8',
      viewport: 'width=device-width, initial-scale=1',
      language: 'en',
      robots: '',
      canonicalUrl: '',
      ogTitle: 'Example OG',
      ogDescription: 'OG description',
      ogImage: '',
      keywords: '',
      author: '',
      favicon: '',
    },
    headings: [
      { level: 1, text: 'Welcome' },
      { level: 2, text: 'Section 1' },
      { level: 2, text: 'Section 2' },
    ],
    links: [
      { href: '/page1', text: 'Page 1', type: 'internal', isFollowed: true },
      { href: '/page2', text: 'Page 2', type: 'internal', isFollowed: true },
      { href: 'https://external.com', text: 'External', type: 'external', isFollowed: false },
    ],
    forms: [
      {
        action: '/submit',
        method: 'POST',
        id: 'contact-form',
        name: 'contact',
        fields: [
          { type: 'text', name: 'name', id: 'name', placeholder: '', label: 'Name', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
          { type: 'email', name: 'email', id: 'email', placeholder: '', label: 'Email', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
        ],
        submitButtonText: 'Send',
        hasValidation: true,
        hasFileUpload: false,
      },
    ],
    buttons: [
      { text: 'Send', type: 'submit', id: 'submit-btn', class: '', isDisabled: false, ariaLabel: '' },
      { text: 'Cancel', type: 'button', id: 'cancel-btn', class: '', isDisabled: false, ariaLabel: '' },
    ],
    tables: [
      { caption: 'Data Table', headers: ['ID', 'Name'], rowCount: 5, columnCount: 2, hasSummary: false },
    ],
    images: [
      { src: 'img1.jpg', alt: 'Image 1', width: '100', height: '100', hasAlt: true, isDecorative: false },
      { src: 'img2.jpg', alt: '', width: '200', height: '200', hasAlt: true, isDecorative: true },
    ],
    navElements: [
      { type: 'nav', label: 'Main', items: 3 },
    ],
    accessibility: {
      ariaLabelCount: 2,
      ariaRoleCount: 1,
      missingAltText: 0,
      imagesWithAlt: 2,
      totalImages: 2,
      hasSkipNav: false,
      hasLanguageDeclaration: true,
      hasTitle: true,
      formLabelsMissing: 0,
      totalForms: 1,
      hasFocusableElements: true,
      contrastWarnings: [],
      landmarkElements: ['main', 'navigation'],
      headingGapWarnings: [],
    },
    performance: {
      externalScripts: 3,
      inlineScripts: 1,
      externalStyles: 2,
      totalImages: 2,
      totalRequests: 7,
      domElements: 500,
      hasRenderBlocking: false,
      hasLargeDom: false,
      recommendations: [],
    },
    security: {
      usesHttps: true,
      hasForm: true,
      formActions: [{ action: '/submit', isExternal: false }],
      externalLinks: 1,
      externalLinksNoReferrer: 1,
      inlineScripts: 1,
      hasIframe: false,
      iframeSandbox: false,
      hasDataUris: false,
      hasCsp: false,
      exposedEmails: [],
      recommendations: [],
    },
    compliance: {
      hasDoctype: true,
      hasLangAttribute: true,
      hasCharsetDeclaration: true,
      hasViewportMeta: true,
      hasRobotsMeta: false,
      hasPrivacyLink: true,
      hasTermsLink: true,
      hasCookieNotice: false,
      hasAccessibilityStatement: false,
      hasSitemap: false,
      hasFavicon: true,
      hasCanonical: false,
      hasOpenGraph: true,
    },
    wordCount: 300,
    paragraphCount: 8,
    listCount: 2,
    iframeCount: 0,
    semanticElements: ['nav', 'main', 'footer'],
    navigator: { userAgent: '', platform: '' },
    ...overrides,
  };
}

describe('analyzePage', () => {
  it('should determine page type for a form-heavy page', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.pageType).toBeTruthy();
  });

  it('should identify main functionality', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.mainFunctionality.length).toBeGreaterThan(0);
    expect(result.mainFunctionality.some((f) => f.toLowerCase().includes('form'))).toBe(true);
    expect(result.mainFunctionality.some((f) => f.toLowerCase().includes('link'))).toBe(true);
  });

  it('should infer user flows', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.userFlows.length).toBeGreaterThan(0);
    expect(result.userFlows.some((f) => f.toLowerCase().includes('form'))).toBe(true);
    expect(result.userFlows.some((f) => f.toLowerCase().includes('navigation'))).toBe(true);
  });

  it('should identify critical elements', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.criticalElements.length).toBeGreaterThan(0);
    expect(result.criticalElements.some((e) => e.includes('Page title'))).toBe(true);
  });

  it('should assess risks', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.testRisks).toBeDefined();
  });

  it('should generate recommendations', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.recommendations).toBeDefined();
  });

  it('should assess complexity correctly', () => {
    const simpleAnalysis = createMockAnalysis({
      forms: [],
      buttons: [],
      links: [],
      tables: [],
      images: [],
      wordCount: 50,
    });
    const result = analyzePage(simpleAnalysis);
    expect(['low', 'medium', 'high']).toContain(result.complexity);
  });

  it('should estimate coverage', () => {
    const result = analyzePage(createMockAnalysis());
    expect(result.estimatedTestCoverage).toBeGreaterThanOrEqual(0);
    expect(result.estimatedTestCoverage).toBeLessThanOrEqual(100);
  });

  it('should classify authentication page correctly', () => {
    const authAnalysis = createMockAnalysis({
      metadata: { ...createMockAnalysis().metadata, title: 'Sign In - Login Page' },
      forms: [
        {
          action: '/login',
          method: 'POST',
          id: 'login-form',
          name: 'login',
          fields: [
            { type: 'email', name: 'email', id: 'email', placeholder: '', label: 'Email', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
            { type: 'password', name: 'password', id: 'password', placeholder: '', label: 'Password', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
            { type: 'text', name: 'name', id: 'name', placeholder: '', label: 'Name', required: false, maxLength: null, minLength: null, pattern: null, autoComplete: null },
            { type: 'checkbox', name: 'remember', id: 'remember', placeholder: '', label: 'Remember me', required: false, maxLength: null, minLength: null, pattern: null, autoComplete: null },
            { type: 'hidden', name: 'csrf', id: 'csrf', placeholder: '', label: '', required: false, maxLength: null, minLength: null, pattern: null, autoComplete: null },
          ],
          submitButtonText: 'Sign In',
          hasValidation: true,
          hasFileUpload: false,
        },
      ],
    });
    const result = analyzePage(authAnalysis);
    expect(result.pageType.toLowerCase()).toContain('authentication');
  });

  it('should detect missing heading structure', () => {
    const noH1 = createMockAnalysis({
      headings: [{ level: 2, text: 'Section' }],
    });
    const result = analyzePage(noH1);
    expect(result.testRisks.some((r) => r.includes('H1'))).toBe(true);
  });

  it('should detect accessibility risks', () => {
    const badA11y = createMockAnalysis({
      accessibility: {
        ...createMockAnalysis().accessibility,
        missingAltText: 5,
        formLabelsMissing: 3,
      },
    });
    const result = analyzePage(badA11y);
    expect(result.testRisks.some((r) => r.includes('alt text'))).toBe(true);
    expect(result.testRisks.some((r) => r.includes('labels'))).toBe(true);
  });

  it('should handle edge case of empty page', () => {
    const empty = createMockAnalysis({
      headings: [],
      links: [],
      forms: [],
      buttons: [],
      tables: [],
      images: [],
      wordCount: 0,
      paragraphCount: 0,
      listCount: 0,
    });
    const result = analyzePage(empty);
    expect(result).toBeDefined();
    expect(result.pageType).toBeTruthy();
  });
});
