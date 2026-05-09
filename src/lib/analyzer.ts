import type {
  PageAnalysisResult,
  AccessibilitySignals,
  PerformanceHints,
  SecurityObservations,
  ComplianceChecks,
} from './types';

export interface AnalyzedInsights {
  pageType: string;
  mainFunctionality: string[];
  userFlows: string[];
  criticalElements: string[];
  testRisks: string[];
  recommendations: string[];
  complexity: 'low' | 'medium' | 'high';
  estimatedTestCoverage: number;
}

export function analyzePage(analysis: PageAnalysisResult): AnalyzedInsights {
  const insights: AnalyzedInsights = {
    pageType: determinePageType(analysis),
    mainFunctionality: extractMainFunctionality(analysis),
    userFlows: inferUserFlows(analysis),
    criticalElements: identifyCriticalElements(analysis),
    testRisks: assessRisks(analysis),
    recommendations: generateRecommendations(analysis),
    complexity: assessComplexity(analysis),
    estimatedTestCoverage: estimateCoverage(analysis),
  };

  return insights;
}

function determinePageType(analysis: PageAnalysisResult): string {
  const { metadata, forms, links, headings } = analysis;

  const title = (metadata.title || '').toLowerCase();
  const description = (metadata.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  if (forms.length > 0 && forms.some((f) => f.fields.length >= 5)) {
    if (combined.includes('login') || combined.includes('sign in') || combined.includes('log in')) {
      return 'Authentication Page';
    }
    if (combined.includes('register') || combined.includes('sign up') || combined.includes('create account')) {
      return 'Registration Page';
    }
    if (
      combined.includes('checkout') ||
      combined.includes('payment') ||
      combined.includes('order')
    ) {
      return 'Checkout / Payment Page';
    }
    if (
      combined.includes('contact') ||
      combined.includes('feedback') ||
      combined.includes('support')
    ) {
      return 'Contact / Feedback Page';
    }
    return 'Data Entry Page';
  }

  if (
    combined.includes('search') ||
    links.filter((l) => l.text.toLowerCase().includes('search')).length > 0
  ) {
    return 'Search Results Page';
  }

  const headingText = headings
    .map((h) => h.text.toLowerCase())
    .join(' ');
  if (
    headingText.includes('product') &&
    (headingText.includes('detail') || headingText.includes('description'))
  ) {
    return 'Product Detail Page';
  }
  if (
    headingText.includes('dashboard') ||
    headingText.includes('overview') ||
    headingText.includes('home')
  ) {
    return 'Dashboard / Home Page';
  }
  if (
    headingText.includes('article') ||
    headingText.includes('blog') ||
    headingText.includes('news')
  ) {
    return 'Content / Article Page';
  }

  if (links.filter((l) => l.type === 'internal').length > 20) {
    return 'Portal / Navigation Hub';
  }

  if (forms.length > 0) {
    return 'Interactive Page';
  }

  if (headings.length <= 2 && analysis.wordCount < 200) {
    return 'Landing / Splash Page';
  }

  return 'General Web Page';
}

function extractMainFunctionality(analysis: PageAnalysisResult): string[] {
  const functionality: string[] = [];

  if (analysis.forms.length > 0) {
    functionality.push('Form data submission');
    analysis.forms.forEach((f) => {
      const fieldTypes = f.fields.map((fd) => fd.type);
      if (fieldTypes.includes('email')) functionality.push('Email input handling');
      if (fieldTypes.includes('password')) functionality.push('Authentication');
      if (fieldTypes.includes('file')) functionality.push('File upload');
      if (fieldTypes.includes('tel')) functionality.push('Phone number input');
      if (fieldTypes.includes('number')) functionality.push('Numeric input');
      if (fieldTypes.includes('date')) functionality.push('Date selection');
      if (fieldTypes.includes('checkbox')) functionality.push('Multi-select options');
      if (fieldTypes.includes('radio')) functionality.push('Single-select options');
      if (fieldTypes.includes('select') || fieldTypes.includes('select-one')) {
        functionality.push('Dropdown selection');
      }
      if (fieldTypes.includes('textarea')) functionality.push('Multi-line text input');
    });
  }

  if (analysis.links.length > 0) {
    functionality.push(`${analysis.links.length} navigable links`);
    const internalCount = analysis.links.filter((l) => l.type === 'internal').length;
    const externalCount = analysis.links.filter((l) => l.type === 'external').length;
    if (internalCount > 0) functionality.push(`Internal navigation (${internalCount} links)`);
    if (externalCount > 0) functionality.push(`External navigation (${externalCount} links)`);
  }

  if (analysis.buttons.length > 0) {
    const submitBtns = analysis.buttons.filter((b) => b.type === 'submit');
    if (submitBtns.length > 0) functionality.push(`${submitBtns.length} submission actions`);
  }

  if (analysis.images.length > 0) {
    functionality.push(`Media display (${analysis.images.length} images)`);
  }

  if (analysis.tables.length > 0) {
    functionality.push(`Data table display (${analysis.tables.length} tables)`);
  }

  if (analysis.navElements.length > 0) {
    functionality.push(`${analysis.navElements.length} navigation structures`);
  }

  if (analysis.metadata.ogImage || analysis.metadata.ogTitle) {
    functionality.push('Social media sharing support (Open Graph)');
  }

  return [...new Set(functionality)];
}

function inferUserFlows(analysis: PageAnalysisResult): string[] {
  const flows: string[] = [];

  const hasForm = analysis.forms.length > 0;
  const hasLoginForm = analysis.forms.some((f) =>
    f.fields.some((fd) => fd.type === 'password'),
  );
  const hasSearch = analysis.links.some(
    (l) =>
      l.text.toLowerCase().includes('search') ||
      l.href.toLowerCase().includes('search'),
  );
  const hasContactForm = analysis.forms.some((f) =>
    f.fields.some((fd) => fd.type === 'email' && fd.label.toLowerCase().includes('email')),
  );

  if (hasLoginForm) {
    flows.push('User login flow (valid credentials)');
    flows.push('User login flow (invalid credentials)');
    flows.push('Password recovery flow');
  }

  if (hasForm) {
    flows.push('Form fill and submit flow');
    flows.push('Form validation error flow');
    flows.push('Required field validation');
  }

  if (hasSearch) {
    flows.push('Search functionality flow');
    flows.push('Search with no results');
    flows.push('Search with special characters');
  }

  flows.push('Page navigation flow (internal links)');
  flows.push('External link navigation');

  if (hasContactForm) {
    flows.push('Contact form submission flow');
  }

  if (analysis.buttons.length > 0) {
    flows.push('Button interaction flow (click actions)');
  }

  if (analysis.headings.length > 0) {
    flows.push('Content hierarchy verification flow');
  }

  flows.push('Page accessibility review flow');
  flows.push('Responsive layout verification flow');

  if (analysis.security.usesHttps) {
    flows.push('HTTPS/SSL security verification');
  }

  if (analysis.tables.length > 0) {
    flows.push('Tabular data review flow');
    flows.push('Table sorting/pagination (if applicable)');
  }

  if (analysis.images.some((img) => !img.hasAlt || img.alt === '')) {
    flows.push('Image alt-text verification flow');
  }

  return flows;
}

function identifyCriticalElements(analysis: PageAnalysisResult): string[] {
  const critical: string[] = [];

  if (analysis.metadata.title) {
    critical.push('Page title / meta title');
  }
  if (analysis.metadata.description) {
    critical.push('Meta description');
  }

  if (analysis.headings.length > 0) {
    const h1s = analysis.headings.filter((h) => h.level === 1);
    h1s.forEach((h) => critical.push(`Main heading (H1): "${h.text}"`));
  }

  analysis.forms.forEach((f, i) => {
    const requiredFields = f.fields.filter((fd) => fd.required);
    if (requiredFields.length > 0) {
      requiredFields.forEach((fd) =>
        critical.push(`Required form field: "${fd.label || fd.name}"`),
      );
    }
    if (f.submitButtonText) {
      critical.push(`Submit action: "${f.submitButtonText}"`);
    }
  });

  analysis.buttons
    .filter((b) => b.type === 'submit')
    .forEach((b) => critical.push(`Submit button: "${b.text}"`));

  const topLinks = analysis.links
    .filter((l) => l.type === 'internal')
    .slice(0, 5);
  topLinks.forEach((l) => critical.push(`Navigation link: "${l.text}" → ${l.href}`));

  if (analysis.accessibility.hasSkipNav) {
    critical.push('Skip navigation link');
  }

  if (analysis.security.usesHttps) {
    critical.push('HTTPS encryption');
  }

  return critical.slice(0, 20);
}

function assessRisks(analysis: PageAnalysisResult): string[] {
  const risks: string[] = [];

  if (analysis.accessibility.missingAltText > 0) {
    risks.push(
      `${analysis.accessibility.missingAltText} images missing alt text (accessibility risk)`,
    );
  }

  if (analysis.accessibility.formLabelsMissing > 0) {
    risks.push(
      `${analysis.accessibility.formLabelsMissing} form fields missing labels (usability risk)`,
    );
  }

  if (!analysis.compliance.hasDoctype) {
    risks.push('Missing DOCTYPE declaration (rendering risk)');
  }

  if (!analysis.compliance.hasViewportMeta) {
    risks.push('Missing viewport meta tag (mobile rendering risk)');
  }

  if (analysis.performance.externalScripts > 10) {
    risks.push(
      `High number of external scripts (${analysis.performance.externalScripts}) - performance risk`,
    );
  }

  if (analysis.performance.domElements > 2000) {
    risks.push('Large DOM size - performance risk');
  }

  if (
    analysis.security.externalLinksNoReferrer > 0 &&
    analysis.security.externalLinks > 0
  ) {
    const ratio = analysis.security.externalLinksNoReferrer / analysis.security.externalLinks;
    if (ratio > 0.5) {
      risks.push(
        `${analysis.security.externalLinksNoReferrer} external links without noopener noreferrer (security risk)`,
      );
    }
  }

  if (analysis.headings.length > 0) {
    const h1Count = analysis.headings.filter((h) => h.level === 1).length;
    if (h1Count === 0) risks.push('No H1 heading found (SEO/accessibility risk)');
    if (h1Count > 1) risks.push('Multiple H1 headings found (SEO risk)');
  }

  if (analysis.forms.some((f) => !f.hasValidation)) {
    risks.push('Forms without client-side validation (data quality risk)');
  }

  if (analysis.security.exposedEmails.length > 0) {
    risks.push(
      `${analysis.security.exposedEmails.length} email addresses exposed in page (spam/security risk)`,
    );
  }

  if (!analysis.compliance.hasPrivacyLink) {
    risks.push('No privacy policy link found (compliance risk)');
  }

  if (!analysis.compliance.hasCookieNotice) {
    risks.push('No cookie consent notice detected (GDPR compliance risk)');
  }

  if (analysis.accessibility.headingGapWarnings.length > 0) {
    risks.push('Heading level gaps detected (accessibility risk)');
  }

  return risks.slice(0, 15);
}

function generateRecommendations(analysis: PageAnalysisResult): string[] {
  const recs: string[] = [];

  if (analysis.accessibility.missingAltText > 0) {
    recs.push('Add descriptive alt text to all images');
  }

  if (analysis.accessibility.formLabelsMissing > 0) {
    recs.push('Associate all form fields with labels using for/id attributes');
  }

  if (!analysis.compliance.hasViewportMeta) {
    recs.push('Add viewport meta tag for mobile responsiveness');
  }

  if (analysis.performance.externalScripts > 8) {
    recs.push(
      'Reduce external script count - consider bundling and async/defer loading',
    );
  }

  if (!analysis.compliance.hasPrivacyLink) {
    recs.push('Add a privacy policy link to comply with data protection regulations');
  }

  if (!analysis.compliance.hasCookieNotice) {
    recs.push('Implement cookie consent notice for GDPR compliance');
  }

  if (analysis.accessibility.headingGapWarnings.length > 0) {
    recs.push('Fix heading hierarchy - avoid skipping levels (e.g., h1 → h3)');
  }

  if (analysis.headings.filter((h) => h.level === 1).length === 0) {
    recs.push('Add at least one H1 heading for proper document structure and SEO');
  }

  if (analysis.security.exposedEmails.length > 0) {
    recs.push('Obfuscate or hide email addresses to prevent scraping');
  }

  if (
    analysis.security.externalLinksNoReferrer > 0
  ) {
    recs.push('Add rel="noopener noreferrer" to all external links');
  }

  if (analysis.performance.hasLargeDom) {
    recs.push('Optimize DOM size - consider lazy rendering for off-screen content');
  }

  recs.push(...analysis.performance.recommendations.filter((r) => !recs.includes(r)));

  return recs.slice(0, 15);
}

function assessComplexity(analysis: PageAnalysisResult): 'low' | 'medium' | 'high' {
  let score = 0;

  if (analysis.forms.length > 2) score += 2;
  else if (analysis.forms.length > 0) score += 1;

  if (analysis.buttons.length > 10) score += 2;
  else if (analysis.buttons.length > 5) score += 1;

  if (analysis.links.length > 50) score += 2;
  else if (analysis.links.length > 20) score += 1;

  if (analysis.tables.length > 2) score += 1;

  if (analysis.images.length > 20) score += 1;
  else if (analysis.images.length > 10) score += 1;

  if (analysis.wordCount > 1000) score += 1;

  if (analysis.forms.some((f) => f.fields.length > 5)) score += 1;
  if (analysis.navElements.length > 2) score += 1;
  if (analysis.iframeCount > 0) score += 1;

  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

function estimateCoverage(analysis: PageAnalysisResult): number {
  const checks = [
    !!analysis.metadata.title,
    !!analysis.metadata.description,
    analysis.headings.filter((h) => h.level === 1).length > 0,
    analysis.accessibility.hasLanguageDeclaration,
    analysis.accessibility.hasTitle,
    analysis.compliance.hasDoctype,
    analysis.compliance.hasCharsetDeclaration,
    analysis.compliance.hasViewportMeta,
    analysis.compliance.hasFavicon,
    analysis.compliance.hasCanonical,
    analysis.security.usesHttps,
    analysis.accessibility.hasFocusableElements,
    analysis.forms.every((f) => f.hasValidation),
    analysis.images.filter((i) => i.hasAlt).length / (analysis.images.length || 1) > 0.5,
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}
