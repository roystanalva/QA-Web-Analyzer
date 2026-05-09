import { generateArtifacts } from '../src/lib/artifact-generator';
import type { PageAnalysisResult } from '../src/lib/types';

function createMockAnalysis(): PageAnalysisResult {
  return {
    url: 'https://example.com',
    statusCode: 200,
    loadTimeMs: 500,
    metadata: {
      title: 'Example Page',
      description: 'An example page',
      charset: 'UTF-8',
      viewport: 'width=device-width, initial-scale=1',
      language: 'en',
      robots: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      keywords: '',
      author: '',
      favicon: '',
    },
    headings: [{ level: 1, text: 'Welcome' }, { level: 2, text: 'About' }],
    links: [
      { href: '/home', text: 'Home', type: 'internal', isFollowed: true },
      { href: 'https://other.com', text: 'Other', type: 'external', isFollowed: false },
    ],
    forms: [
      {
        action: '/submit', method: 'POST', id: 'form1', name: 'contact',
        fields: [
          { type: 'text', name: 'name', id: 'name', placeholder: '', label: 'Name', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
          { type: 'email', name: 'email', id: 'email', placeholder: '', label: 'Email', required: true, maxLength: null, minLength: null, pattern: null, autoComplete: null },
        ],
        submitButtonText: 'Send', hasValidation: true, hasFileUpload: false,
      },
    ],
    buttons: [
      { text: 'Send', type: 'submit', id: 'btn1', class: '', isDisabled: false, ariaLabel: '' },
      { text: 'Learn More', type: 'button', id: 'btn2', class: '', isDisabled: false, ariaLabel: '' },
    ],
    tables: [{ caption: 'Data', headers: ['Col1'], rowCount: 3, columnCount: 1, hasSummary: false }],
    images: [
      { src: 'img.jpg', alt: 'desc', width: '100', height: '100', hasAlt: true, isDecorative: false },
    ],
    navElements: [{ type: 'nav', label: 'Main', items: 2 }],
    accessibility: {
      ariaLabelCount: 1, ariaRoleCount: 1, missingAltText: 0, imagesWithAlt: 1, totalImages: 1,
      hasSkipNav: false, hasLanguageDeclaration: true, hasTitle: true,
      formLabelsMissing: 0, totalForms: 1, hasFocusableElements: true,
      contrastWarnings: [], landmarkElements: ['main'], headingGapWarnings: [],
    },
    performance: {
      externalScripts: 2, inlineScripts: 1, externalStyles: 1, totalImages: 1,
      totalRequests: 4, domElements: 300, hasRenderBlocking: false, hasLargeDom: false, recommendations: [],
    },
    security: {
      usesHttps: true, hasForm: true,
      formActions: [{ action: '/submit', isExternal: false }],
      externalLinks: 1, externalLinksNoReferrer: 1, inlineScripts: 1,
      hasIframe: false, iframeSandbox: false, hasDataUris: false, hasCsp: false,
      exposedEmails: [], recommendations: [],
    },
    compliance: {
      hasDoctype: true, hasLangAttribute: true, hasCharsetDeclaration: true,
      hasViewportMeta: true, hasRobotsMeta: false, hasPrivacyLink: true,
      hasTermsLink: true, hasCookieNotice: false, hasAccessibilityStatement: false,
      hasSitemap: false, hasFavicon: true, hasCanonical: false, hasOpenGraph: true,
    },
    wordCount: 200, paragraphCount: 5, listCount: 1, iframeCount: 0,
    semanticElements: ['nav', 'main'],
    navigator: { userAgent: '', platform: '' },
  };
}

describe('artifact-generator', () => {
  it('should generate test cases for all types', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const types = [...new Set(testCases.map((tc) => tc.type))];
    expect(types).toContain('functional');
    expect(types).toContain('smoke');
    expect(types).toContain('regression');
    expect(types).toContain('accessibility');
    expect(types).toContain('security');
    expect(types).toContain('compliance');
    expect(types).toContain('performance');
    expect(types).toContain('ui');
    expect(types).toContain('api');
    expect(types).toContain('uat');
  });

  it('should generate scenarios', () => {
    const { scenarios } = generateArtifacts(createMockAnalysis());
    expect(scenarios.length).toBeGreaterThan(0);
    scenarios.forEach((s) => {
      expect(s.id).toMatch(/^SCEN_/);
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
    });
  });

  it('should generate a test plan', () => {
    const { testPlan } = generateArtifacts(createMockAnalysis());
    expect(testPlan.id).toMatch(/^TP_/);
    expect(testPlan.title).toBeTruthy();
    expect(testPlan.scope).toBeTruthy();
    expect(testPlan.objectives.length).toBeGreaterThan(0);
    expect(testPlan.risksAndMitigations.length).toBeGreaterThan(0);
    expect(testPlan.schedule.length).toBeGreaterThan(0);
  });

  it('should generate RTM entries', () => {
    const { rtm } = generateArtifacts(createMockAnalysis());
    expect(rtm.length).toBeGreaterThan(0);
    rtm.forEach((entry) => {
      expect(entry.requirementId).toMatch(/^REQ-/);
      expect(entry.coverageType).toBeTruthy();
    });
  });

  it('should generate test cases with valid structure', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    testCases.forEach((tc) => {
      expect(tc.id).toMatch(/^TC-/);
      expect(tc.title).toBeTruthy();
      expect(tc.description).toBeTruthy();
      expect(tc.steps.length).toBeGreaterThan(0);
      expect(tc.expectedResults.length).toBeGreaterThan(0);
      expect(tc.tags.length).toBeGreaterThan(0);
      expect(['critical', 'high', 'medium', 'low']).toContain(tc.priority);
      expect(['blocker', 'critical', 'major', 'minor', 'trivial']).toContain(tc.severity);
    });
  });

  it('should include UI test cases', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const uiTests = testCases.filter((tc) => tc.type === 'ui');
    expect(uiTests.length).toBeGreaterThan(0);
  });

  it('should include API test cases', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const apiTests = testCases.filter((tc) => tc.type === 'api');
    expect(apiTests.length).toBeGreaterThan(0);
  });

  it('should include UAT test cases', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const uatTests = testCases.filter((tc) => tc.type === 'uat');
    expect(uatTests.length).toBeGreaterThan(0);
  });

  it('should assign sensible priorities', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const smokeTests = testCases.filter((tc) => tc.type === 'smoke');
    smokeTests.forEach((tc) => {
      expect(['critical', 'high']).toContain(tc.priority);
    });
  });

  it('should include load and adhoc tests', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    const types = testCases.map((tc) => tc.type);
    expect(types).toContain('load');
    expect(types).toContain('ad-hoc');
  });

  it('should generate test cases with sequential IDs', () => {
    const { testCases } = generateArtifacts(createMockAnalysis());
    expect(testCases[0].id).toBe('TC-FUNC_0001');
  });
});
