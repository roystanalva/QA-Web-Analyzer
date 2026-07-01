import type {
  PageAnalysisResult,
  AccessibilitySignals,
  PerformanceHints,
  SecurityObservations,
  ComplianceChecks,
  AccessibilityError,
  Issue,
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
  accessibilityErrors: AccessibilityError[];
  issues: Issue[];
}

export function analyzePage(analysis: PageAnalysisResult): AnalyzedInsights {
  const accessibilityErrors = detectAccessibilityErrors(analysis);
  const issues = generateIssues(analysis, accessibilityErrors);

  const insights: AnalyzedInsights = {
    pageType: determinePageType(analysis),
    mainFunctionality: extractMainFunctionality(analysis),
    userFlows: inferUserFlows(analysis),
    criticalElements: identifyCriticalElements(analysis),
    testRisks: assessRisks(analysis),
    recommendations: generateRecommendations(analysis),
    complexity: assessComplexity(analysis),
    estimatedTestCoverage: estimateCoverage(analysis),
    accessibilityErrors,
    issues,
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

function generateIssues(analysis: PageAnalysisResult, errors: AccessibilityError[]): Issue[] {
  const issues: Issue[] = [];
  let issueCounter = 0;

  for (const error of errors) {
    issueCounter++;
    const id = `ISSUE-${String(issueCounter).padStart(3, '0')}`;
    const severity = error.severity === 'critical' ? 'critical' : error.severity === 'warning' ? 'major' : 'minor';

    const issueMap: Record<string, { title: string; description: string; steps: string[]; expectedResult: string; actualResult: string; recommendation: string; affectedElement?: string }> = {
      'HTTP Error': {
        title: `Website not accessible (HTTP ${analysis.statusCode})`,
        description: `The target URL returned an HTTP ${analysis.statusCode} status code, making the page inaccessible to users and search engines.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'Observe the HTTP response status code',
          'Check if the page content is displayed',
          'Verify if an error page is shown instead',
        ],
        expectedResult: 'Page returns HTTP 200 and displays content',
        actualResult: `Page returned HTTP ${analysis.statusCode}`,
        recommendation: 'Fix the server configuration or URL to ensure the page is accessible',
      },
      'Document Structure': {
        title: error.message.includes('DOCTYPE') ? 'Missing DOCTYPE declaration' : 'Missing page title',
        description: error.message.includes('DOCTYPE')
          ? 'The document is missing a DOCTYPE declaration, which may cause browsers to render the page in quirks mode with unpredictable layout behavior.'
          : 'The page is missing a <title> element, which is essential for screen readers, browser tabs, and search engine results.',
        steps: [
          `Navigate to ${analysis.url}`,
          'View page source (Ctrl+U or Cmd+U)',
          error.message.includes('DOCTYPE')
            ? 'Check if <!DOCTYPE html> is the first line of the document'
            : 'Check if <title> element exists in the <head> section',
          'Verify the element is properly formatted',
        ],
        expectedResult: error.message.includes('DOCTYPE')
          ? '<!DOCTYPE html> is present as the first line of the HTML document'
          : '<title> element exists with descriptive text in the <head>',
        actualResult: error.message.includes('DOCTYPE')
          ? 'DOCTYPE declaration is missing'
          : '<title> element is missing',
        recommendation: error.message.includes('DOCTYPE')
          ? 'Add <!DOCTYPE html> as the first line of the HTML document'
          : 'Add a descriptive <title> element in the <head> section of the page',
      },
      'Language': {
        title: 'Missing language declaration',
        description: 'The page or html element is missing a lang attribute, preventing screen readers from determining the correct language for pronunciation.',
        steps: [
          `Navigate to ${analysis.url}`,
          'View page source',
          'Locate the <html> element',
          'Check for lang attribute (e.g., lang="en")',
        ],
        expectedResult: '<html lang="en"> (or appropriate language code) is present',
        actualResult: 'lang attribute is missing from <html> element',
        recommendation: 'Add lang attribute to the <html> element (e.g., <html lang="en">)',
        affectedElement: '<html>',
      },
      'Mobile Accessibility': {
        title: 'Missing viewport meta tag',
        description: 'The page lacks a viewport meta tag, causing it to not render properly on mobile devices.',
        steps: [
          `Navigate to ${analysis.url} on a mobile device`,
          'Check if the page scales correctly',
          'Verify text is readable without zooming',
          'View page source for <meta name="viewport">',
        ],
        expectedResult: 'Page scales to device width and text is readable without zooming',
        actualResult: 'Page does not scale properly on mobile devices',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>',
        affectedElement: '<meta name="viewport">',
      },
      'Images': {
        title: 'Images missing alt text',
        description: `${analysis.accessibility.missingAltText} images on the page are missing alt text attributes, making them inaccessible to screen reader users.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'Inspect all <img> elements on the page',
          'Check each image for an alt attribute',
          'Verify alt text is descriptive for informative images',
          'Verify decorative images use alt=""',
        ],
        expectedResult: `All ${analysis.images.length} images have appropriate alt text`,
        actualResult: `${analysis.accessibility.missingAltText} images are missing alt text`,
        recommendation: 'Add descriptive alt text to all informative images; use alt="" for decorative images',
        affectedElement: 'img',
      },
      'Forms': {
        title: 'Form fields missing labels',
        description: `${analysis.accessibility.formLabelsMissing} form fields are missing associated labels, making them inaccessible to screen reader users.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'Locate all form fields (input, select, textarea)',
          'For each field, check for an associated <label> element',
          'Verify label[for] matches input[id] or input is wrapped in <label>',
          'Check for aria-label or aria-labelledby attributes',
        ],
        expectedResult: 'All form fields have associated labels via for/id, wrapping, or ARIA attributes',
        actualResult: `${analysis.accessibility.formLabelsMissing} form fields have no associated label`,
        recommendation: 'Add <label for="fieldId"> for each form field, or use aria-label attribute',
        affectedElement: 'input, select, textarea',
      },
      'Navigation': {
        title: 'Missing skip navigation link',
        description: 'The page lacks a skip navigation link, forcing keyboard users to tab through all navigation links to reach main content.',
        steps: [
          `Navigate to ${analysis.url}`,
          'Press Tab key to start keyboard navigation',
          'Count how many Tab presses are needed to reach main content',
          'Check for a "Skip to main content" link at the top',
        ],
        expectedResult: 'A skip navigation link is available as the first focusable element',
        actualResult: 'No skip navigation link found',
        recommendation: 'Add a visually hidden skip link: <a href="#main" class="skip-link">Skip to main content</a>',
        affectedElement: '<body> or <header>',
      },
      'Structure': {
        title: error.message.includes('gap') ? 'Heading hierarchy gaps' : error.message.includes('No H1') ? 'Missing H1 heading' : 'Multiple H1 headings',
        description: error.message.includes('gap')
          ? 'The heading hierarchy has gaps (e.g., h1 followed by h3), disrupting screen reader navigation.'
          : error.message.includes('No H1')
          ? 'The page has no H1 heading, which is the primary heading for screen reader navigation and SEO.'
          : `The page has ${analysis.headings.filter((h) => h.level === 1).length} H1 headings, but should have exactly one.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'View page source or use a heading outline tool',
          'List all headings in DOM order: H1, H2, H3, etc.',
          'Verify heading levels increase by only one (H1 → H2 → H3)',
        ],
        expectedResult: error.message.includes('gap')
          ? 'Heading levels increase sequentially without gaps'
          : 'Exactly one H1 heading exists at the top of the content',
        actualResult: error.message.includes('gap')
          ? `Heading gaps found: ${analysis.accessibility.headingGapWarnings.join(', ')}`
          : error.message.includes('No H1')
          ? 'No H1 heading found'
          : `${analysis.headings.filter((h) => h.level === 1).length} H1 headings found`,
        recommendation: 'Restructure headings to follow sequential order (H1 → H2 → H3) with exactly one H1',
        affectedElement: 'h1-h6',
      },
      'ARIA': {
        title: 'Missing ARIA roles and labels',
        description: 'The page has no ARIA roles or labels, reducing accessibility for assistive technology users.',
        steps: [
          `Navigate to ${analysis.url}`,
          'Inspect interactive elements for role attributes',
          'Check for aria-label on buttons, links, and form controls',
          'Verify landmark roles are used (main, navigation, banner, etc.)',
        ],
        expectedResult: 'ARIA roles and labels are used to enhance accessibility',
        actualResult: 'No ARIA roles or labels found on the page',
        recommendation: 'Add appropriate ARIA roles and labels to interactive elements and landmarks',
      },
      'Color Contrast': {
        title: 'Color contrast issues detected',
        description: `${analysis.accessibility.contrastWarnings.length} potential color contrast issues found, which may make text difficult to read.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'Use a contrast checking tool (e.g., WebAIM Contrast Checker)',
          'Check text color against background color',
          'Verify contrast ratio meets WCAG AA (4.5:1 for normal text)',
        ],
        expectedResult: 'All text meets WCAG AA contrast ratio of 4.5:1',
        actualResult: `${analysis.accessibility.contrastWarnings.length} contrast issues detected`,
        recommendation: 'Adjust text or background colors to achieve minimum 4.5:1 contrast ratio',
      },
      'Landmarks': {
        title: 'Missing landmark elements',
        description: 'The page lacks semantic landmark elements (header, main, nav, footer), preventing screen readers from navigating page regions.',
        steps: [
          `Navigate to ${analysis.url}`,
          'Check for <header>, <main>, <nav>, <footer> elements',
          'Verify ARIA landmark roles are used as alternatives',
          'Test with a screen reader to verify landmark navigation',
        ],
        expectedResult: 'Page has identifiable landmark regions (header, main, nav, footer)',
        actualResult: 'No landmark elements found on the page',
        recommendation: 'Wrap page sections in semantic HTML5 elements: <header>, <main>, <nav>, <footer>',
      },
      'Document': {
        title: 'Missing favicon',
        description: 'The page does not have a favicon, making it less recognizable in browser tabs and bookmarks.',
        steps: [
          `Navigate to ${analysis.url}`,
          'Check the browser tab for a favicon icon',
          'View page source for <link rel="icon">',
        ],
        expectedResult: 'A favicon is displayed in the browser tab',
        actualResult: 'No favicon found',
        recommendation: 'Add <link rel="icon" href="/favicon.ico"> to the <head> section',
      },
      'SEO': {
        title: 'Missing canonical URL',
        description: 'The page does not specify a canonical URL, which may cause search engines to index duplicate versions.',
        steps: [
          `Navigate to ${analysis.url}`,
          'View page source',
          'Search for <link rel="canonical">',
          'Verify the canonical URL points to the preferred version',
        ],
        expectedResult: '<link rel="canonical" href="..."> is present and points to the correct URL',
        actualResult: 'No canonical URL specified',
        recommendation: 'Add <link rel="canonical" href="preferred-url"> to the <head> section',
      },
      'Privacy': {
        title: 'Email addresses exposed',
        description: `${analysis.security.exposedEmails.length} email address(es) are visible in the page text, potentially attracting spam.`,
        steps: [
          `Navigate to ${analysis.url}`,
          'View page source',
          'Search for email patterns (user@domain.com)',
          'Check if emails are obfuscated or plain text',
        ],
        expectedResult: 'Email addresses are obfuscated or hidden from scrapers',
        actualResult: `${analysis.security.exposedEmails.length} email(s) found in plain text`,
        recommendation: 'Obfuscate email addresses using JavaScript, contact forms, or HTML entities',
      },
      'Security': {
        title: 'Page not served over HTTPS',
        description: 'The page is served over HTTP, transmitting all data in plaintext without encryption.',
        steps: [
          `Navigate to ${analysis.url}`,
          'Check the URL bar for HTTPS lock icon',
          'Verify the URL starts with https://',
          'Check for mixed content warnings',
        ],
        expectedResult: 'Page loads over HTTPS with a valid SSL certificate',
        actualResult: 'Page is served over HTTP (unencrypted)',
        recommendation: 'Configure SSL/TLS certificate and redirect all HTTP traffic to HTTPS',
      },
    };

    const template = issueMap[error.category] || {
      title: error.message,
      description: error.message,
      steps: [
        `Navigate to ${analysis.url}`,
        `Inspect the ${error.element || 'page'} for the issue`,
        'Verify the issue exists',
        'Document the finding',
      ],
      expectedResult: 'No issues found',
      actualResult: error.message,
      recommendation: 'Address the identified issue',
    };

    issues.push({
      id,
      title: template.title,
      description: template.description,
      severity,
      category: error.category,
      wcag: error.wcag,
      steps: template.steps,
      expectedResult: template.expectedResult,
      actualResult: template.actualResult,
      affectedElement: error.element || template.affectedElement,
      recommendation: template.recommendation,
    });
  }

  return issues;
}

function detectAccessibilityErrors(analysis: PageAnalysisResult): AccessibilityError[] {
  const errors: AccessibilityError[] = [];
  const seen = new Set<string>();
  const a11y = analysis.accessibility;
  const comp = analysis.compliance;

  function add(error: AccessibilityError) {
    const key = `${error.category}:::${error.severity}`;
    if (!seen.has(key)) {
      seen.add(key);
      errors.push(error);
    }
  }

  if (analysis.statusCode >= 400) {
    add({
      severity: 'critical',
      category: 'HTTP Error',
      message: `Website returned HTTP ${analysis.statusCode} - the page may not be accessible`,
      wcag: '2.1.1',
    });
  }

  if (!comp.hasDoctype) {
    add({
      severity: 'critical',
      category: 'Document Structure',
      message: 'Missing DOCTYPE declaration - browsers may render the page in quirks mode',
      wcag: '4.1.1',
    });
  }

  if (!comp.hasLangAttribute) {
    add({
      severity: 'critical',
      category: 'Language',
      message: 'Missing lang attribute on <html> element - screen readers cannot determine page language',
      wcag: '3.1.1',
    });
  }

  if (!a11y.hasTitle) {
    add({
      severity: 'critical',
      category: 'Document Structure',
      message: 'Missing <title> element - page has no accessible name',
      wcag: '2.4.2',
    });
  }

  if (!comp.hasViewportMeta) {
    add({
      severity: 'critical',
      category: 'Mobile Accessibility',
      message: 'Missing viewport meta tag - page is not mobile accessible',
      wcag: '1.4.10',
    });
  }

  if (a11y.missingAltText > 0) {
    add({
      severity: 'critical',
      category: 'Images',
      message: `${a11y.missingAltText} images are missing alt text - screen readers cannot describe these images`,
      element: 'img',
      wcag: '1.1.1',
    });
  }

  if (a11y.formLabelsMissing > 0) {
    add({
      severity: 'critical',
      category: 'Forms',
      message: `${a11y.formLabelsMissing} form fields are missing associated labels - screen readers cannot identify these fields`,
      element: 'input, select, textarea',
      wcag: '1.3.1',
    });
  }

  if (!a11y.hasSkipNav) {
    add({
      severity: 'warning',
      category: 'Navigation',
      message: 'No skip navigation link found - keyboard users must tab through all navigation to reach main content',
      wcag: '2.4.1',
    });
  }

  if (a11y.headingGapWarnings.length > 0) {
    add({
      severity: 'warning',
      category: 'Structure',
      message: `Heading hierarchy has gaps: ${a11y.headingGapWarnings.join(', ')} - screen reader navigation is disrupted`,
      element: 'h1-h6',
      wcag: '1.3.1',
    });
  }

  const h1Count = analysis.headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    add({
      severity: 'warning',
      category: 'Structure',
      message: 'No H1 heading found - page has no main heading for screen reader navigation',
      element: 'h1',
      wcag: '1.3.1',
    });
  } else if (h1Count > 1) {
    add({
      severity: 'warning',
      category: 'Structure',
      message: `Multiple H1 headings found (${h1Count}) - page should have exactly one main heading`,
      element: 'h1',
      wcag: '1.3.1',
    });
  }

  if (!a11y.hasLanguageDeclaration) {
    add({
      severity: 'warning',
      category: 'Language',
      message: 'No lang attribute detected on any element - language information is missing for assistive technology',
      wcag: '3.1.1',
    });
  }

  if (a11y.ariaRoleCount === 0 && a11y.ariaLabelCount === 0) {
    add({
      severity: 'warning',
      category: 'ARIA',
      message: 'No ARIA roles or labels found - page may lack proper semantic structure for assistive technology',
      wcag: '4.1.2',
    });
  }

  if (a11y.contrastWarnings.length > 0) {
    add({
      severity: 'warning',
      category: 'Color Contrast',
      message: `${a11y.contrastWarnings.length} potential color contrast issues detected - text may be difficult to read`,
      wcag: '1.4.3',
    });
  }

  if (a11y.landmarkElements.length === 0) {
    add({
      severity: 'warning',
      category: 'Landmarks',
      message: 'No landmark elements found (header, main, nav, footer) - screen readers cannot navigate page regions',
      wcag: '1.3.1',
    });
  }

  if (!comp.hasFavicon) {
    add({
      severity: 'info',
      category: 'Document',
      message: 'No favicon found - page may not be easily identifiable in browser tabs',
    });
  }

  if (!comp.hasCanonical) {
    add({
      severity: 'info',
      category: 'SEO',
      message: 'No canonical URL specified - search engines may index duplicate content',
    });
  }

  if (analysis.security.exposedEmails.length > 0) {
    add({
      severity: 'info',
      category: 'Privacy',
      message: `${analysis.security.exposedEmails.length} email addresses exposed in page text - potential spam risk`,
    });
  }

  if (!analysis.security.usesHttps) {
    add({
      severity: 'critical',
      category: 'Security',
      message: 'Page is not served over HTTPS - data transmitted in plaintext',
      wcag: '2.5.3',
    });
  }

  return errors;
}
