import type {
  TestCase,
  TestScenario,
  TestPlan,
  RtmEntry,
  TestType,
  PageAnalysisResult,
  FormInfo,
} from './types';
import { analyzePage, type AnalyzedInsights } from './analyzer';

let caseCounter = 0;
function nextId(prefix: string): string {
  caseCounter++;
  return `${prefix}_${String(caseCounter).padStart(4, '0')}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSessionNonce(): string {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
}

export function generateArtifacts(analysis: PageAnalysisResult) {
  caseCounter = 0;
  const insights = analyzePage(analysis);
  const sessionNonce = generateSessionNonce();

  const testCases: TestCase[] = [
    ...generateFunctionalTests(analysis, insights),
    ...generateSmokeTests(analysis, insights),
    ...generateRegressionTests(analysis, insights),
    ...generateAdHocTests(analysis, insights),
    ...generateAccessibilityTests(analysis, insights),
    ...generateSecurityTests(analysis, insights),
    ...generateComplianceTests(analysis, insights),
    ...generatePerformanceTests(analysis, insights),
    ...generateLoadTests(analysis, insights),
    ...generateUiTests(analysis, insights),
    ...generateApiTests(analysis, insights),
    ...generateUatTests(analysis, insights),
    ...generateLinkIntegrityTests(analysis, insights),
    ...generateImageIntegrityTests(analysis, insights),
    ...generateSiteSpecificTests(analysis, insights),
    ...generateEdgeCaseTests(analysis, insights, sessionNonce),
    ...generateCrossBrowserTests(analysis, insights),
    ...generateCrossDeviceTests(analysis, insights),
    ...generateResolutionTests(analysis, insights),
  ];

  const scenarios = generateScenarios(testCases, analysis, insights);
  const testPlan = generateTestPlan(analysis, insights, testCases);
  const rtm = generateRtm(testCases, analysis);

  return { testCases, scenarios, testPlan, rtm };
}

function generateFunctionalTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: `Verify page loads with correct content at ${url}`,
    description: 'Validate that the target webpage loads successfully and displays expected content.',
    preconditions: ['Network connectivity is available', 'Target URL is accessible'],
    testData: `URL: ${url}`,
    steps: [
      `Navigate to ${url}`,
      'Wait for the page to fully load',
      'Verify the page title is present',
      'Verify the main content area is rendered',
      'Verify no JavaScript console errors',
    ],
    expectedResults: [
      'Page loads within acceptable time',
      `Page title "${analysis.metadata.title}" is displayed correctly`,
      'All content sections are visible',
      'No console errors or broken resources',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['functional', 'smoke', 'regression'],
    estimatedDuration: '2 min',
  });

  for (let i = 0; i < analysis.forms.length; i++) {
    const form = analysis.forms[i];
    const formLabel = form.id || form.name || `form-${i + 1}`;

    if (form.fields.some((f) => f.type === 'password')) {
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Authentication flow - login with valid credentials (${formLabel})`,
        description: 'Verify that the authentication form accepts valid credentials and redirects to the authenticated area.',
        preconditions: ['Valid test credentials are available', 'Authentication form is visible'],
        testData: `Username/email: testuser@example.com\nPassword: ********`,
        steps: [
          `Navigate to ${url}`,
          `Locate the form: ${formLabel}`,
          `Enter valid username/email in the "${form.fields.find((f) => f.type === 'email' || f.type === 'text')?.name || 'username'}" field`,
          `Enter valid password in the "${form.fields.find((f) => f.type === 'password')?.name || 'password'}" field`,
          `Click "${form.submitButtonText}" button`,
          'Wait for authentication to complete',
        ],
        expectedResults: [
          'Form submits without errors',
          'User is redirected to authenticated area',
          'Welcome message or user identifier is displayed',
          'Session cookie or token is created',
        ],
        priority: 'critical',
        severity: 'blocker',
        tags: ['functional', 'smoke', 'regression', 'security'],
        estimatedDuration: '3 min',
      });

      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Authentication flow - login with invalid credentials (${formLabel})`,
        description: 'Verify that the authentication form rejects invalid credentials with appropriate error message.',
        preconditions: ['Authentication form is visible'],
        testData: 'Username/email: invalid@test.com\nPassword: WrongPass123!',
        steps: [
          `Navigate to ${url}`,
          `Locate the form: ${formLabel}`,
          'Enter an invalid/non-existent username or email',
          'Enter an incorrect password',
          `Click "${form.submitButtonText}" button`,
        ],
        expectedResults: [
          'Form submission is rejected',
          'Appropriate error message is displayed (e.g., "Invalid credentials")',
          'User remains on the login page',
          'No sensitive information is leaked in error message',
        ],
        priority: 'high',
        severity: 'critical',
        tags: ['functional', 'regression', 'security'],
        estimatedDuration: '2 min',
      });
    }

    if (form.fields.some((f) => f.type === 'file')) {
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `File upload functionality (${formLabel})`,
        description: 'Verify that the file upload field accepts valid files and rejects invalid ones.',
        preconditions: ['File upload form is visible', 'Test files are prepared'],
        testData: 'Valid file: test.pdf (< 2MB)\nInvalid file: test.exe (> 5MB)',
        steps: [
          `Navigate to ${url}`,
          `Locate the file upload field`,
          'Select a valid file (PDF under 2MB)',
          'Verify file name is displayed',
          'Submit the form',
          'Repeat with an invalid file type',
        ],
        expectedResults: [
          'Valid file is accepted and uploaded',
          'Invalid file type is rejected with error message',
          'File size validation works correctly',
          'Upload progress indicator is shown (if applicable)',
        ],
        priority: 'high',
        severity: 'major',
        tags: ['functional', 'regression'],
        estimatedDuration: '5 min',
      });
    }

    if (form.fields.filter((f) => f.required).length > 0) {
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Form validation - required fields (${formLabel})`,
        description: 'Verify that the form validates required fields and displays error messages when they are empty.',
        preconditions: ['Target form is visible and loaded'],
        testData: 'All fields left empty',
        steps: [
          `Navigate to ${url}`,
          `Locate the form: ${formLabel}`,
          'Leave all fields empty',
          `Click "${form.submitButtonText}" button`,
          'Observe validation messages',
        ],
        expectedResults: [
          'Form submission is prevented',
          'Error messages are displayed for each required field',
          'Error messages are descriptive and accessible',
          'First invalid field receives focus (accessibility best practice)',
        ],
        priority: 'high',
        severity: 'critical',
        tags: ['functional', 'regression'],
        estimatedDuration: '3 min',
      });

      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Form validation - field constraints (${formLabel})`,
        description: 'Verify that form fields enforce their validation constraints (min/max length, pattern, etc.).',
        preconditions: ['Target form is visible'],
        testData: 'Boundary values for each constrained field',
        steps: [
          `Navigate to ${url}`,
          `Locate the form: ${formLabel}`,
          'For each constrained field, enter values that violate constraints',
          `Click "${form.submitButtonText}" button`,
          'Verify field-level error messages',
          'Enter valid boundary values and re-submit',
        ],
        expectedResults: [
          'Fields with invalid values show appropriate error messages',
          'Fields respect min/max length constraints',
          'Pattern validation works (e.g., email format, phone format)',
          'Form submits successfully when all constraints are met',
        ],
        priority: 'medium',
        severity: 'major',
        tags: ['functional', 'regression'],
        estimatedDuration: '5 min',
      });
    }
  }

  for (const link of analysis.links.filter((l) => l.type === 'internal')) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Internal navigation - "${link.text}" link leads to correct page`,
      description: `Verify that clicking the "${link.text}" internal link navigates to the correct destination page.`,
      preconditions: ['Page is fully loaded', 'Link is visible and clickable'],
      testData: `Link href: ${link.href}`,
      steps: [
        `Navigate to ${url}`,
        `Locate and click the "${link.text}" link`,
        'Wait for the destination page to load',
        'Verify the destination URL matches expectations',
        'Verify the destination page content is relevant',
      ],
      expectedResults: [
        `Clicking "${link.text}" navigates to ${link.href}`,
        'Destination page loads successfully (HTTP 200)',
        'Destination page content is related to the link text',
        'No broken resources on destination page',
        'Browser back button returns to original page',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['functional', 'smoke', 'regression'],
      estimatedDuration: '2 min',
    });
  }

  for (const link of analysis.links.filter((l) => l.type === 'external').slice(0, 20)) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `External link - "${link.text}" is accessible`,
      description: `Verify that the external link "${link.text}" pointing to ${link.href} is reachable and loads correctly.`,
      preconditions: ['Page is fully loaded', 'External network access is available'],
      testData: `External URL: ${link.href}`,
      steps: [
        `Navigate to ${url}`,
        `Locate the "${link.text}" link`,
        'Right-click and copy the link URL',
        `Navigate to ${link.href} directly`,
        'Verify the page loads successfully',
      ],
      expectedResults: [
        'External URL is reachable (HTTP 200)',
        'Destination page loads without errors',
        'No broken redirects',
        'Content is relevant to link text',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['functional', 'regression'],
      estimatedDuration: '2 min',
    });
  }

  if (analysis.buttons.length > 0) {
    const primaryButtons = analysis.buttons.filter(
      (b) => !b.isDisabled && b.type !== 'submit',
    ).slice(0, 3);
    for (const btn of primaryButtons) {
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Button interaction - "${btn.text}" button click behavior`,
        description: `Verify that clicking the "${btn.text}" button triggers the expected behavior.`,
        preconditions: ['Page is fully loaded', 'Button is visible and enabled'],
        testData: `Button identifier: ${btn.id || btn.text}`,
        steps: [
          `Navigate to ${url}`,
          `Locate the "${btn.text}" button`,
          'Verify the button is visible and enabled',
          `Click the "${btn.text}" button`,
          'Observe the result of the click action',
        ],
        expectedResults: [
          'Button click triggers the expected action',
          'No JavaScript errors occur',
          'UI updates appropriately (if toggling content)',
          'Button state changes correctly (if applicable)',
        ],
        priority: 'medium',
        severity: 'major',
        tags: ['functional', 'regression'],
        estimatedDuration: '2 min',
      });
    }
  }

  return tests;
}

function generateSmokeTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-SMOKE'),
    type: 'smoke',
    title: `Smoke - Page loads successfully (HTTP 200) at ${url}`,
    description: 'Critical path check: verify the target URL returns a successful HTTP response.',
    preconditions: ['Application server is running', 'Network is available'],
    testData: `URL: ${url}`,
    steps: [
      `Send HTTP GET request to ${url}`,
      'Check HTTP response status code',
      'Verify response body contains HTML content',
      'Check page title is not empty',
    ],
    expectedResults: [
      'HTTP status code is 200 OK',
      'Response body contains valid HTML',
      `Page title "${analysis.metadata.title}" is present and non-empty`,
      'Page loads within acceptable time threshold',
    ],
    priority: 'critical',
    severity: 'blocker',
    tags: ['smoke', 'regression'],
    estimatedDuration: '1 min',
  });

  tests.push({
    id: nextId('TC-SMOKE'),
    type: 'smoke',
    title: `Smoke - Critical page elements are present`,
    description: 'Verify that the most critical UI elements are present and functional.',
    preconditions: ['Page is fully loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Verify page header/navigation is visible',
      'Verify main content area is rendered',
      'Verify page footer is present',
      'Verify at least one heading is visible',
    ],
    expectedResults: [
      'Header/navigation bar is visible',
      'Main content area is rendered with content',
      'Footer is present',
      'At least one H1 or H2 heading is visible',
    ],
    priority: 'critical',
    severity: 'blocker',
    tags: ['smoke', 'regression'],
    estimatedDuration: '1 min',
  });

  tests.push({
    id: nextId('TC-SMOKE'),
    type: 'smoke',
    title: 'Smoke - No critical console errors on page load',
    description: 'Verify that the page loads without JavaScript console errors.',
    preconditions: ['Browser DevTools is available'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Open browser console',
      'Check for any error messages (exceptions, network errors, etc.)',
      'Check for any warning messages',
    ],
    expectedResults: [
      'No JavaScript exceptions on page load',
      'No 4xx or 5xx network errors for page resources',
      'No unhandled promise rejections',
      'Console is clean (minor warnings may be acceptable)',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['smoke', 'regression'],
    estimatedDuration: '1 min',
  });

  if (analysis.forms.length > 0) {
    tests.push({
      id: nextId('TC-SMOKE'),
      type: 'smoke',
      title: 'Smoke - Forms are present and interactable',
      description: 'Verify that forms on the page are visible and ready for interaction.',
      preconditions: ['Page is fully loaded'],
      testData: 'N/A',
      steps: [
        `Navigate to ${url}`,
        'Verify at least one form exists on the page',
        'Verify form fields are visible and enabled',
        'Verify the submit button is visible and enabled',
      ],
      expectedResults: [
        'Forms are present in the DOM',
        'Form fields are visible and not disabled',
        'Submit buttons are visible and enabled',
        'Form has proper action/method attributes',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['smoke', 'regression', 'functional'],
      estimatedDuration: '2 min',
    });
  }

  tests.push({
    id: nextId('TC-SMOKE'),
    type: 'smoke',
    title: 'Smoke - Page is responsive (viewport rendering)',
    description: 'Verify the page renders correctly at common viewport sizes.',
    preconditions: ['Page is fully loaded'],
    testData: 'Viewports: 1920x1080, 768x1024, 375x667',
    steps: [
      `Navigate to ${url} at 1920x1080 resolution`,
      'Verify no horizontal scrolling',
      'Navigate at 768x1024 (tablet) resolution',
      'Verify content reflows correctly',
      'Navigate at 375x667 (mobile) resolution',
      'Verify mobile menu/adaptations are present',
    ],
    expectedResults: [
      'Page renders without horizontal scroll at 1920x1080',
      'Content is visible and readable at tablet resolution',
      'Mobile version shows appropriate adaptations (hamburger menu, stacked layout)',
      'No overlapping elements at any viewport size',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['smoke', 'regression', 'ui'],
    estimatedDuration: '3 min',
  });

  if (analysis.metadata.ogTitle) {
    tests.push({
      id: nextId('TC-SMOKE'),
      type: 'smoke',
      title: 'Smoke - Social sharing meta tags are present',
      description: 'Verify that Open Graph meta tags exist for social media sharing.',
      preconditions: ['Page is loaded'],
      testData: 'N/A',
      steps: [
        `Navigate to ${url}`,
        'Inspect page source for Open Graph meta tags',
        'Verify og:title is present and non-empty',
        'Verify og:description is present',
        'Verify og:image is present (if applicable)',
      ],
      expectedResults: [
        `og:title tag exists with value "${analysis.metadata.ogTitle}"`,
        'og:description tag exists',
        'og:image tag exists with a valid image URL (if expected)',
        'Social preview would render correctly',
      ],
      priority: 'low',
      severity: 'minor',
      tags: ['smoke'],
      estimatedDuration: '1 min',
    });
  }

  return tests;
}

function generateRegressionTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-REGR'),
    type: 'regression',
    title: `Regression - Core page structure integrity`,
    description: 'Verify that the core page structure (headings, layout, key elements) remains intact after changes.',
    preconditions: ['Baseline page structure is documented', 'Page is fully loaded'],
    testData: 'Baseline: Previously captured page structure snapshot',
    steps: [
      `Navigate to ${url}`,
      'Verify all expected sections are present',
      'Verify heading hierarchy is maintained (H1 → H2 → H3)',
      'Verify navigation structure is intact',
      'Verify footer content is present',
    ],
    expectedResults: [
      'All major page sections are rendered as expected',
      'Heading hierarchy follows proper order (no skipped levels)',
      'Navigation contains all expected links',
      'Footer contains all expected content (copyright, links)',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-REGR'),
    type: 'regression',
    title: `Regression - All internal links return 200`,
    description: 'Verify that all internal links on the page resolve to valid pages.',
    preconditions: ['Page is fully loaded', 'All internal pages are accessible'],
    testData: `Total internal links: ${analysis.links.filter((l) => l.type === 'internal').length}`,
    steps: [
      `Navigate to ${url}`,
      'Collect all internal links from the page',
      'For each internal link, send an HTTP HEAD or GET request',
      'Verify each returns HTTP 200',
      'Identify any broken or redirecting links',
    ],
    expectedResults: [
      'All internal links return HTTP 200 OK',
      'No broken links (4xx or 5xx responses)',
      'Temporary redirects (302) are noted but acceptable',
      'Broken links are reported for investigation',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['regression', 'functional'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-REGR'),
    type: 'regression',
    title: 'Regression - Page load performance regression check',
    description: 'Verify that page load time has not significantly regressed compared to baseline.',
    preconditions: ['Baseline performance metrics are available'],
    testData: 'Baseline load time: ~${analysis.loadTimeMs}ms',
    steps: [
      `Navigate to ${url} with network throttling disabled`,
      'Measure page load time (DOMContentLoaded, Load)',
      'Measure time to first byte (TTFB)',
      'Compare against baseline metrics',
    ],
    expectedResults: [
      'Page load time is within acceptable threshold (within 20% of baseline)',
      'TTFB is below 500ms or comparable to baseline',
      'No significant regression in Core Web Vitals metrics',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['regression', 'performance'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-REGR'),
    type: 'regression',
    title: `Regression - Form submission flow integrity`,
    description: 'Verify that form submissions continue to work correctly after changes.',
    preconditions: ['Form is visible', 'Test data is ready'],
    testData: 'Valid test data for form fields',
    steps: [
      `Navigate to ${url}`,
      'Fill in all required form fields with valid data',
      `Submit the form by clicking submit button`,
      'Verify successful submission response',
      'Verify no regression in validation behavior',
    ],
    expectedResults: [
      'Form submits successfully',
      'Validation rules are still enforced',
      'Success/confirmation message is displayed',
      'No errors introduced by recent changes',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['regression', 'functional'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-REGR'),
    type: 'regression',
    title: 'Regression - CSS/style integrity check',
    description: 'Verify that CSS styles are applied correctly and no visual regressions exist.',
    preconditions: ['Page is loaded', 'Visual baseline is available (optional)'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Check that all expected CSS files are loaded',
      'Verify key elements have correct styling (colors, fonts, spacing)',
      'Check that no elements are visibly broken (missing backgrounds, wrong colors)',
      'Verify responsive breakpoints still work',
    ],
    expectedResults: [
      'All CSS resources load successfully',
      'Visual styling matches design specifications',
      'No missing styles or broken layouts',
      'Responsive design works at all breakpoints',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['regression', 'ui'],
    estimatedDuration: '3 min',
  });

  return tests;
}

function generateAdHocTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-ADHOC'),
    type: 'ad-hoc',
    title: `Ad-hoc - Rapid page reload behavior`,
    description: 'Explore what happens when the page is rapidly reloaded multiple times.',
    preconditions: ['Page is loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Rapidly press F5 or reload button 5 times in quick succession',
      'Observe page behavior after each reload',
      'Check for any caching issues or error states',
    ],
    expectedResults: [
      'Page loads correctly after each reload',
      'No error messages or partial loads',
      'No rate-limiting or lockout occurs',
      'Session/data integrity is maintained',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-ADHOC'),
    type: 'ad-hoc',
    title: 'Ad-hoc - Browser back/forward navigation',
    description: 'Test browser navigation buttons behavior after interacting with the page.',
    preconditions: ['Page is loaded', 'At least one internal link exists'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Click an internal link to navigate to another page',
      'Press browser back button',
      `Verify return to ${url}`,
      'Press browser forward button',
      'Verify forward navigation works',
    ],
    expectedResults: [
      'Back navigation returns to the previous page',
      'Forward navigation re-visits the page',
      'Page state is preserved (or properly reset) on back navigation',
      'No broken UI state after navigation',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc', 'ui'],
    estimatedDuration: '2 min',
  });

  if (analysis.forms.length > 0) {
    tests.push({
      id: nextId('TC-ADHOC'),
      type: 'ad-hoc',
      title: 'Ad-hoc - Form field injection testing',
      description: 'Test form behavior with unexpected or malformed input data.',
      preconditions: ['Form is visible'],
      testData: 'Special characters: <script>alert(1)</script>, SQL injection attempts, very long strings',
      steps: [
        `Navigate to ${url}`,
        'In each form field, enter XSS payload: <script>alert("xss")</script>',
        'Enter SQL injection: \'; DROP TABLE users; --',
        'Enter extremely long strings (5000+ characters)',
        'Enter Unicode/special characters',
        'Submit the form',
      ],
      expectedResults: [
        'XSS payloads are sanitized/escaped (no alert executed)',
        'SQL injection attempts are safely handled',
        'Long strings are truncated or properly validated',
        'Unicode characters are displayed correctly',
        'No application crashes or unexpected errors',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['ad-hoc', 'security'],
      estimatedDuration: '5 min',
    });

    tests.push({
      id: nextId('TC-ADHOC'),
      type: 'ad-hoc',
      title: 'Ad-hoc - Form double-submit prevention',
      description: 'Check if the form prevents double submission.',
      preconditions: ['Form is visible', 'Form submission takes some processing time'],
      testData: 'Valid form data',
      steps: [
        `Navigate to ${url}`,
        'Fill in form fields with valid data',
        'Click submit button rapidly multiple times',
        'Observe whether multiple submissions occur',
      ],
      expectedResults: [
        'Submit button is disabled after first click',
        'Only one form submission is processed',
        'No duplicate entries in backend system',
        'Loading indicator is shown during submission',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['ad-hoc', 'functional'],
      estimatedDuration: '2 min',
    });
  }

  tests.push({
    id: nextId('TC-ADHOC'),
    type: 'ad-hoc',
    title: 'Ad-hoc - Browser tab visibility behavior',
    description: 'Test how the page behaves when browser tab is hidden and shown again.',
    preconditions: ['Page is loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Switch to a different browser tab',
      'Wait 30 seconds',
      'Return to original tab',
      'Observe page state',
    ],
    expectedResults: [
      'Page is still responsive after tab switch',
      'No session timeout or logout',
      'Content is still displayed correctly',
      'Any auto-refresh mechanisms work as expected',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc'],
    estimatedDuration: '2 min',
  });

  return tests;
}

function generateAccessibilityTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;
  const a11y = analysis.accessibility;

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - Page has proper heading hierarchy',
    description: 'Verify that the page uses headings correctly for document structure and screen reader navigation.',
    preconditions: ['Page is fully loaded'],
    testData: `Headings found: ${analysis.headings.length}`,
    steps: [
      `Navigate to ${url}`,
      'Extract all heading elements (H1-H6) in DOM order',
      'Verify exactly one H1 exists at the top of the content',
      'Verify heading levels do not skip (e.g., H1 → H3 without H2)',
      'Verify heading text is descriptive and meaningful',
    ],
    expectedResults: [
      analysis.headings.filter((h) => h.level === 1).length === 1
        ? 'Exactly one H1 heading exists'
        : `H1 count: ${analysis.headings.filter((h) => h.level === 1).length} (expected: 1)`,
      analysis.accessibility.headingGapWarnings.length === 0
        ? 'No heading level gaps (h1→h2→h3 order is correct)'
        : `Heading level gaps detected: ${analysis.accessibility.headingGapWarnings.join(', ')}`,
      'All heading texts are descriptive',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['accessibility', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - Images have alt text',
    description: 'Verify all images have appropriate alternative text for screen readers.',
    preconditions: ['Page is fully loaded'],
    testData: `Total images: ${analysis.images.length}\nWith alt text: ${a11y.imagesWithAlt}\nMissing alt: ${a11y.missingAltText}`,
    steps: [
      `Navigate to ${url}`,
      'Inspect all <img> elements',
      'For each image, check presence of alt attribute',
      'Verify alt text is meaningful (not just filename)',
      'Mark decorative images with alt=""',
    ],
    expectedResults: [
      a11y.missingAltText === 0
        ? 'All images have alt attributes'
        : `${a11y.missingAltText} images missing alt text requires attention`,
      'Informative images have descriptive alt text',
      'Decorative images use empty alt (alt="")',
      'No images use filenames as alt text',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['accessibility', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - Form fields have associated labels',
    description: 'Verify all form inputs have properly associated label elements.',
    preconditions: ['Page is fully loaded', 'Form elements are visible'],
    testData: `Total form fields: ${analysis.forms.reduce((sum, f) => sum + f.fields.length, 0)}\nMissing labels: ${a11y.formLabelsMissing}`,
    steps: [
      `Navigate to ${url}`,
      'For each form input, verify it has an associated label',
      'Check for label[for] + input[id] association',
      'Check for WAI-ARIA aria-label or aria-labelledby',
      'Check for implicit labeling (input inside label)',
    ],
    expectedResults: [
      a11y.formLabelsMissing === 0
        ? 'All form fields have associated labels'
        : `${a11y.formLabelsMissing} form fields missing labels requires attention`,
      'Labels are visible and descriptive',
      'Associations use correct for/id attributes',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['accessibility', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - Keyboard navigation',
    description: 'Verify all interactive elements are reachable and operable via keyboard.',
    preconditions: ['Page is fully loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Press Tab key repeatedly to navigate through all interactive elements',
      'Verify visible focus indicator on each element',
      'Press Enter/Space to activate focused elements',
      'Verify Tab order follows logical document flow',
      'Check for keyboard traps (elements that cannot be tabbed away from)',
    ],
    expectedResults: [
      'All interactive elements are reachable via Tab key',
      'Focus indicator is clearly visible on all elements',
      'Focus order follows logical reading order',
      'No keyboard traps exist',
      'All actions are operable via keyboard alone',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['accessibility', 'regression'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - ARIA landmarks and roles',
    description: 'Verify that ARIA landmarks are used to define page regions.',
    preconditions: ['Page is fully loaded'],
    testData: `Total ARIA roles found: ${a11y.ariaRoleCount}\nARIA labels: ${a11y.ariaLabelCount}`,
    steps: [
      `Navigate to ${url}`,
      'Inspect page for ARIA landmark roles (banner, navigation, main, complementary, contentinfo)',
      'Verify main content has role="main" or is in a <main> element',
      'Verify navigation has role="navigation" or is in a <nav> element',
      'Check for descriptive aria-label on nav elements',
    ],
    expectedResults: [
      'Page has identifiable landmark regions',
      'Main content is wrapped in <main> or role="main"',
      'Navigation regions are identified',
      'ARIA labels are descriptive and unique',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['accessibility'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Accessibility - Color contrast and readability',
    description: 'Verify text has sufficient color contrast against background.',
    preconditions: ['Page is fully loaded'],
    testData: 'WCAG AA standard: 4.5:1 for normal text, 3:1 for large text',
    steps: [
      `Navigate to ${url}`,
      'Use a contrast analyzer tool on body text',
      'Check heading text contrast',
      'Check link text contrast (including hover/focus states)',
      'Check placeholder text contrast',
      'Verify text is readable against background images (if any)',
    ],
    expectedResults: [
      'Body text meets WCAG AA contrast ratio (4.5:1)',
      'Large text meets WCAG AA contrast ratio (3:1)',
      'Link text is distinguishable from body text',
      'No low-contrast text that would be difficult to read',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['accessibility'],
    estimatedDuration: '5 min',
  });

  return tests;
}

function generateSecurityTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const sec = analysis.security;
  const url = analysis.url;

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Security - HTTPS enforcement check',
    description: 'Verify the page enforces HTTPS and does not load mixed content.',
    preconditions: ['Browser/network access is available'],
    testData: `URL: ${url}`,
    steps: [
      `Navigate to ${url}`,
      'Verify URL uses HTTPS protocol',
      'Check for mixed content warnings in browser console',
      'Verify all external resources (scripts, styles, images) are loaded over HTTPS',
      'Check HSTS headers (if accessible)',
    ],
    expectedResults: [
      sec.usesHttps ? 'Page is served over HTTPS' : 'Page is NOT served over HTTPS - CRITICAL ISSUE',
      'No mixed content warnings (passive or active)',
      'All external resources use HTTPS',
      'SSL certificate is valid and trusted',
    ],
    priority: 'critical',
    severity: 'critical',
    tags: ['security', 'regression', 'smoke'],
    estimatedDuration: '2 min',
  });

  if (analysis.forms.length > 0) {
    tests.push({
      id: nextId('TC-SEC'),
      type: 'security',
      title: 'Security - Form submission over HTTPS',
      description: 'Verify that form data is submitted securely.',
      preconditions: ['Form is visible on page'],
      testData: 'Form action endpoints',
      steps: [
        `Navigate to ${url}`,
        'Inspect each form action attribute',
        'Verify form action URL uses HTTPS',
        'Verify form method is POST for sensitive data',
        'Check if CSRF tokens are present (hidden input)',
      ],
      expectedResults: [
        'Form actions point to HTTPS endpoints',
        'Sensitive forms (login, payment) use POST method',
        'CSRF protection tokens are present (recommended)',
        'Form data is encrypted in transit',
      ],
      priority: 'critical',
      severity: 'critical',
      tags: ['security', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-SEC'),
      type: 'security',
      title: 'Security - XSS (Cross-Site Scripting) resistance',
      description: 'Verify that the page and its forms are resistant to XSS attacks.',
      preconditions: ['Page is loaded', 'Form elements are visible'],
      testData: '<script>alert("XSS")</script>, <img src=x onerror=alert(1)>, javascript:alert(1)',
      steps: [
        `Navigate to ${url}`,
        'For each form field, inject XSS payload: <script>alert("xss")</script>',
        'Submit the form or trigger the action',
        'Check if alert dialog is executed',
        'Also test reflected XSS via URL parameters',
      ],
      expectedResults: [
        'XSS payloads are sanitized and not executed',
        'Input is properly HTML-encoded when displayed back',
        'No alert dialog appears',
        'URL parameters are sanitized against XSS',
      ],
      priority: 'critical',
      severity: 'critical',
      tags: ['security', 'regression', 'ad-hoc'],
      estimatedDuration: '5 min',
    });
  }

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Security - External links security',
    description: 'Verify that external links use rel="noopener noreferrer" for security.',
    preconditions: ['Page is loaded'],
    testData: `External links: ${sec.externalLinks}\nMissing noopener: ${sec.externalLinksNoReferrer}`,
    steps: [
      `Navigate to ${url}`,
      'Collect all external links (href pointing to different domain)',
      'Check each link for rel="noopener noreferrer" attribute',
      'Verify links that open in new tab have the protection',
    ],
    expectedResults: [
      sec.externalLinksNoReferrer === 0
        ? 'All external links have proper rel attributes'
        : `${sec.externalLinksNoReferrer} external links missing security attributes`,
      'Links with target="_blank" include rel="noopener"',
      'No tab-nabbing vulnerability exists',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['security', 'regression'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Security - Information disclosure check',
    description: 'Verify that no sensitive information is exposed in the page source or responses.',
    preconditions: ['Page is loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'View page source and check for comments exposing sensitive info',
      'Check for exposed API keys, tokens, or internal URLs in JavaScript',
      'Check for exposed email addresses',
      'Check for version information in headers or meta tags',
      'Inspect cookies for secure and httpOnly flags',
    ],
    expectedResults: [
      'No sensitive data in HTML comments',
      'No exposed API keys or internal URLs',
      sec.exposedEmails.length === 0
        ? 'No email addresses exposed in page text'
        : `${sec.exposedEmails.length} email addresses exposed`,
      'Cookies have Secure and HttpOnly flags where appropriate',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['security', 'regression'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Security - Injected iframe and clickjacking protection',
    description: 'Verify the page protects against clickjacking and iframe injection.',
    preconditions: ['Page is loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Check for X-Frame-Options header (DENY or SAMEORIGIN)',
      'Check for Content-Security-Policy frame-ancestors directive',
      'Check if page loads correctly in an iframe (test manually)',
      'If iframes exist on page, verify sandbox attribute',
    ],
    expectedResults: [
      'Page has X-Frame-Options or CSP frame-ancestors protection',
      'Page cannot be loaded in an iframe on a different origin (if protected)',
      sec.iframeSandbox || !sec.hasIframe
        ? 'Iframes on page use sandbox attribute or no iframes exist'
        : 'Iframes should use sandbox attribute for security',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['security'],
    estimatedDuration: '3 min',
  });

  return tests;
}

function generateComplianceTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const comp = analysis.compliance;
  const url = analysis.url;

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Compliance - GDPR cookie consent check',
    description: 'Verify that the page has a GDPR-compliant cookie consent mechanism.',
    preconditions: ['Page is loaded', 'Browser location is set to EU region'],
    testData: 'GDPR: EU General Data Protection Regulation',
    steps: [
      `Navigate to ${url}`,
      'Check for cookie consent banner/popup',
      'Verify consent options (accept all, reject, customize)',
      'Accept cookies and verify banner disappears',
      'Clear cookies and reload - verify banner reappears',
      'Reject non-essential cookies and verify functionality',
    ],
    expectedResults: [
      comp.hasCookieNotice
        ? 'Cookie consent notice is present'
        : 'Cookie consent notice NOT found - compliance risk',
      'Users can choose to accept or reject non-essential cookies',
      'Banner re-appears after cookie clearing',
      'Page is functional even without accepting non-essential cookies',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['compliance', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Compliance - Privacy and terms links',
    description: 'Verify that privacy policy and terms of service links are present and accessible.',
    preconditions: ['Page is fully loaded'],
    testData: 'Regulatory requirements: GDPR, CCPA, general legal compliance',
    steps: [
      `Navigate to ${url}`,
      'Search footer and header for "Privacy Policy" link',
      'Search for "Terms of Service" or "Terms & Conditions" link',
      'Click each link and verify destination page loads',
      'Verify linked pages contain actual policy content',
    ],
    expectedResults: [
      comp.hasPrivacyLink
        ? 'Privacy policy link is present'
        : 'Privacy policy link NOT found',
      comp.hasTermsLink
        ? 'Terms of service link is present'
        : 'Terms of service link NOT found',
      'Linked pages load correctly with policy content',
      'Policies are up-to-date and specific to the service',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['compliance', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Compliance - HTML5 doctype and language declaration',
    description: 'Verify the page has proper doctype and language attributes for compliance.',
    preconditions: ['Page is loaded'],
    testData: 'WCAG, HTML5 specification',
    steps: [
      `Navigate to ${url}`,
      'View page source',
      'Verify <!DOCTYPE html> is the first line',
      'Verify <html lang="..."> attribute is present',
      'Verify charset declaration exists',
    ],
    expectedResults: [
      comp.hasDoctype
        ? 'DOCTYPE html is declared'
        : 'DOCTYPE declaration is missing - non-compliant',
      comp.hasLangAttribute
        ? `Language is declared: ${analysis.metadata.language || 'present'}`
        : 'Language attribute missing on <html> element',
      comp.hasCharsetDeclaration
        ? 'Charset is declared'
        : 'Charset declaration missing',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['compliance', 'accessibility'],
    estimatedDuration: '1 min',
  });

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Compliance - Viewport and mobile responsiveness',
    description: 'Verify that the page includes proper viewport meta tag for mobile rendering.',
    preconditions: ['Page is loaded'],
    testData: 'Mobile-first indexing, WCAG responsive design requirements',
    steps: [
      `Navigate to ${url}`,
      'Check for <meta name="viewport"> in page head',
      'Verify viewport content includes width=device-width',
      'Verify viewport content includes initial-scale=1',
      'Test page rendering at 320px width (small mobile)',
    ],
    expectedResults: [
      comp.hasViewportMeta
        ? 'Viewport meta tag is present with correct configuration'
        : 'Viewport meta tag is missing - mobile rendering will be incorrect',
      'Content scales correctly on mobile viewports',
      'No horizontal scrolling at 320px width',
      'Text is readable without zooming',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['compliance', 'ui', 'accessibility'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Compliance - Accessibility statement check',
    description: 'Verify that the page provides an accessibility statement or reference.',
    preconditions: ['Page is fully loaded'],
    testData: 'WCAG, Section 508, ADA, EN 301 549',
    steps: [
      `Navigate to ${url}`,
      'Search for "Accessibility" link in footer or navigation',
      'Check for accessibility statement page',
      'Click link and verify page contains accessibility commitment',
      'Check for conformance level (WCAG A, AA, AAA)',
    ],
    expectedResults: [
      comp.hasAccessibilityStatement
        ? 'Accessibility statement or link is present'
        : 'Accessibility statement NOT found - consider adding one',
      'Statement includes conformance level and contact information',
      'Statement is up-to-date',
    ],
    priority: 'medium',
    severity: 'minor',
    tags: ['compliance', 'accessibility'],
    estimatedDuration: '2 min',
  });

  return tests;
}

function generatePerformanceTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const perf = analysis.performance;
  const url = analysis.url;

  tests.push({
    id: nextId('TC-PERF'),
    type: 'performance',
    title: 'Performance - Page load time assessment',
    description: 'Measure and verify that the page loads within acceptable performance thresholds.',
    preconditions: ['Clean browser cache', 'No network throttling (baseline)'],
    testData: `Measured load time: ${analysis.loadTimeMs}ms`,
    steps: [
      `Navigate to ${url} with empty cache`,
      'Record time to first byte (TTFB)',
      'Record DOM Content Loaded time',
      'Record full page load time',
      'Run the test 3 times and calculate average',
    ],
    expectedResults: [
      'TTFB is under 500ms (or within project threshold)',
      'DOM Content Loaded is under 2 seconds',
      'Full page load is under 4 seconds',
      'Performance is consistent across multiple runs (within 10% variance)',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['performance', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-PERF'),
    type: 'performance',
    title: 'Performance - Resource size and count audit',
    description: 'Audit the total page weight and resource count.',
    preconditions: ['Page is loaded with network tab recording'],
    testData: `Scripts: ${perf.externalScripts} external, ${perf.inlineScripts} inline\nStyles: ${perf.externalStyles}\nImages: ${perf.totalImages}\nDOM elements: ${perf.domElements}`,
    steps: [
      `Navigate to ${url}`,
      'Open browser DevTools Network tab',
      'Record total page transfer size (MB)',
      'Count total HTTP requests',
      'Identify largest resources',
      'Check for render-blocking resources',
    ],
    expectedResults: [
      'Total page size is under 3MB (recommended)',
      'Total HTTP requests are under 80 (recommended)',
      'No single resource > 500KB (except images/video)',
      'Render-blocking resources are minimized',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['performance', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-PERF'),
    type: 'performance',
    title: 'Performance - Image optimization audit',
    description: 'Verify that images on the page are properly optimized.',
    preconditions: ['Page is loaded'],
    testData: `Total images: ${analysis.images.length}`,
    steps: [
      `Navigate to ${url}`,
      'Check that images use modern formats (WebP, AVIF)',
      'Check that images have explicit width/height attributes',
      'Check for lazy loading (loading="lazy") on below-fold images',
      'Check image dimensions are not excessively large',
    ],
    expectedResults: [
      'Images use modern compressible formats where supported',
      'Images have explicit dimensions to prevent layout shift',
      'Below-fold images use lazy loading',
      'No excessively large images (dimensions or file size)',
    ],
    priority: 'medium',
    severity: 'minor',
    tags: ['performance'],
    estimatedDuration: '3 min',
  });

  perf.recommendations.forEach((rec, i) => {
    if (i < 3) {
      tests.push({
        id: nextId('TC-PERF'),
        type: 'performance',
        title: `Performance - Recommendation: ${rec.substring(0, 80)}`,
        description: `Validate performance best practice: ${rec}`,
        preconditions: ['Page is loaded with performance analysis tools'],
        testData: `Recommendation: ${rec}`,
        steps: [
          `Navigate to ${url}`,
          `Investigate: ${rec}`,
          'Verify the current state of this performance aspect',
          'Document findings and recommendations',
        ],
        expectedResults: [
          'Performance aspect is evaluated',
          'Recommendation is documented for the development team',
          'Performance improvement opportunities are identified',
        ],
        priority: 'low',
        severity: 'minor',
        tags: ['performance'],
        estimatedDuration: '2 min',
      });
    }
  });

  return tests;
}

function generateLoadTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-LOAD'),
    type: 'load',
    title: 'Load - Concurrent user simulation (10 users)',
    description: 'Simulate 10 concurrent users accessing the page simultaneously to measure response times.',
    preconditions: ['Load testing tool is available (e.g., k6, Artillery, JMeter)'],
    testData: 'Virtual users: 10\nDuration: 2 minutes\nRamp-up: 30 seconds',
    steps: [
      'Configure load test with 10 virtual users',
      'Set ramp-up period to 30 seconds',
      'Set test duration to 2 minutes',
      `Target endpoint: ${url}`,
      'Monitor response times and error rates',
      'Monitor server CPU and memory usage (if accessible)',
    ],
    expectedResults: [
      'Average response time under 2 seconds',
      'P95 response time under 4 seconds',
      'Error rate below 1%',
      'No server crashes or timeouts',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['load', 'performance'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-LOAD'),
    type: 'load',
    title: 'Load - Stress test (50 concurrent users)',
    description: 'Stress test the page with 50 concurrent users to find the breaking point.',
    preconditions: ['Load testing tool is available', 'Server monitoring is accessible'],
    testData: 'Virtual users: 50\nDuration: 5 minutes\nRamp-up: 1 minute',
    steps: [
      'Configure load test with 50 virtual users',
      'Set ramp-up period to 1 minute',
      'Set test duration to 5 minutes',
      `Target endpoint: ${url}`,
      'Monitor for errors, timeouts, and performance degradation',
      'Observe recovery after load subsides',
    ],
    expectedResults: [
      'Page remains accessible under stress',
      'Error rate stays below 5%',
      'System recovers after load subsides',
      'Graceful degradation under extreme load',
    ],
    priority: 'low',
    severity: 'major',
    tags: ['load', 'performance'],
    estimatedDuration: '10 min',
  });

  if (analysis.forms.some((f) => f.fields.length > 0)) {
    tests.push({
      id: nextId('TC-LOAD'),
      type: 'load',
      title: 'Load - Form submission under concurrent load',
      description: 'Test form submission performance under concurrent user load.',
      preconditions: ['Load testing tool is available', 'Test data for form submissions is prepared'],
      testData: 'Virtual users: 20\nSubmission rate: 5/second\nDuration: 3 minutes',
      steps: [
        'Prepare test data for form submissions',
        'Configure 20 virtual users submitting the form',
        'Target form action endpoint',
        'Monitor submission success rate',
        'Measure submission response times',
      ],
      expectedResults: [
        'Form submission success rate > 99%',
        'Average submission time under 3 seconds',
        'No data loss or duplication',
        'Backend handles concurrent submissions',
      ],
      priority: 'low',
      severity: 'major',
      tags: ['load', 'performance'],
      estimatedDuration: '8 min',
    });
  }

  tests.push({
    id: nextId('TC-LOAD'),
    type: 'load',
    title: 'Load - Endurance test (30-minute sustained load)',
    description: 'Verify the page can sustain moderate traffic over an extended period.',
    preconditions: ['Load testing tool is available'],
    testData: 'Virtual users: 15\nDuration: 30 minutes\nThink time: 3-5 seconds between actions',
    steps: [
      'Configure 15 virtual users with realistic think times',
      'Set test duration to 30 minutes',
      `Target endpoint: ${url}`,
      'Monitor for memory leaks or performance degradation over time',
      'Check for increasing response times',
    ],
    expectedResults: [
      'Response times remain stable throughout the test',
      'No memory leak symptoms (monotonically increasing response times)',
      'Error rate stays below 1%',
      'Application remains stable for the full duration',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['load', 'performance'],
    estimatedDuration: '35 min',
  });

  return tests;
}

function generateUiTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-UI'),
    type: 'ui',
    title: 'UI - Visual layout and alignment check',
    description: 'Verify that all UI elements are properly aligned and spaced.',
    preconditions: ['Page is fully loaded at standard desktop resolution (1920x1080)'],
    testData: 'Browser: Chrome 120+ at 1920x1080',
    steps: [
      `Navigate to ${url} at 1920x1080 resolution`,
      'Check overall page layout alignment (header, content, footer)',
      'Verify consistent spacing between elements',
      'Check for overlapping elements',
      'Verify text is not cut off or overflowing containers',
    ],
    expectedResults: [
      'Page layout is properly aligned (grid/flexbox structure)',
      'Consistent margins and padding throughout',
      'No overlapping elements',
      'No text overflow or truncation issues',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['ui', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-UI'),
    type: 'ui',
    title: 'UI - Responsive design across breakpoints',
    description: 'Verify the UI renders correctly across common device breakpoints.',
    preconditions: ['Page is loaded', 'Browser DevTools is available'],
    testData: 'Breakpoints:\n- Desktop: 1920x1080\n- Laptop: 1366x768\n- Tablet: 768x1024\n- Mobile: 375x667',
    steps: [
      `Navigate to ${url}`,
      'Test at desktop breakpoint (1920x1080)',
      'Test at laptop breakpoint (1366x768)',
      'Test at tablet breakpoint (768x1024, portrait)',
      'Test at mobile breakpoint (375x667, portrait)',
      'At each breakpoint, verify content visibility and layout',
    ],
    expectedResults: [
      'Layout adapts correctly at each breakpoint',
      'Navigation switches to hamburger menu on mobile (as expected)',
      'No horizontal scroll at any breakpoint',
      'Content is not hidden or cut off at any breakpoint',
      'Touch targets are adequately sized on mobile (min 44x44px)',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['ui', 'regression', 'smoke'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-UI'),
    type: 'ui',
    title: 'UI - Navigation menu behavior',
    description: 'Verify navigation menu works correctly including dropdowns and mobile menu.',
    preconditions: ['Page is loaded', 'Navigation elements exist'],
    testData: `Navigation elements found: ${analysis.navElements.length}`,
    steps: [
      `Navigate to ${url}`,
      'Verify all top-level navigation items are visible',
      'Test hover/focus on navigation items',
      'If dropdown menus exist, verify they appear on hover/click',
      'Test navigation links navigate to correct sections',
      'On mobile, verify hamburger menu toggle works',
    ],
    expectedResults: [
      'All navigation items are visible and clickable',
      'Dropdown menus appear/disappear correctly',
      'Active/current page is highlighted in navigation',
      'Mobile hamburger menu opens and closes correctly',
      'Navigation links lead to correct pages',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['ui', 'functional', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-UI'),
    type: 'ui',
    title: 'UI - Form UI and interaction states',
    description: 'Verify form UI elements have proper visual states (default, focus, error, disabled).',
    preconditions: ['Page is fully loaded', 'Form elements exist'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Check default styling of all form fields',
      'Click into each field type and verify focus state',
      'Submit form with empty required fields and check error state styling',
      'Check disabled fields styling (if any)',
      'Check placeholder text styling',
    ],
    expectedResults: [
      'All form fields have consistent default styling',
      'Focus states are clearly visible (outline or border change)',
      'Error states are visually distinct (red border, error icon)',
      'Disabled fields have muted styling',
      'Placeholder text has appropriate contrast',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['ui', 'functional'],
    estimatedDuration: '3 min',
  });

  if (analysis.tables.length > 0) {
    tests.push({
      id: nextId('TC-UI'),
      type: 'ui',
      title: 'UI - Table rendering and readability',
      description: 'Verify tables are rendered correctly with proper formatting and readability.',
      preconditions: ['Page is loaded', 'Table elements exist'],
      testData: `Tables found: ${analysis.tables.length}`,
      steps: [
        `Navigate to ${url}`,
        'Verify table headers are visually distinct',
        'Check alternating row colors (zebra striping) if applicable',
        'Verify table is scrollable/responsive on narrow viewports',
        'Check sorting indicators if sortable',
        'Verify pagination controls work correctly (if applicable)',
      ],
      expectedResults: [
        'Table headers are bold and visually distinct',
        'Alternating row colors improve readability (if implemented)',
        'Table scrolls horizontally on narrow screens without breaking layout',
        'Sorting and pagination work correctly (if applicable)',
        'Data is properly aligned within cells',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['ui', 'functional'],
      estimatedDuration: '3 min',
    });
  }

  return tests;
}

function generateApiTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-API'),
    type: 'api',
    title: 'API - Page HTTP response validation',
    description: 'Verify the page endpoint returns correct HTTP response headers and status.',
    preconditions: ['API testing tool is available (e.g., Postman, curl)'],
    testData: `Endpoint: ${url}\nMethod: GET`,
    steps: [
      `Send HTTP GET request to ${url}`,
      'Verify HTTP status code is 200',
      'Verify Content-Type header includes text/html',
      'Verify response headers (Cache-Control, Content-Length)',
      'Verify no security headers leaking information',
    ],
    expectedResults: [
      'HTTP status is 200 OK',
      'Content-Type is text/html; charset=utf-8 (or similar)',
      'Server header does not leak version information',
      'CORS headers are properly configured (if applicable)',
      'Cache-Control headers are set appropriately',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['api', 'smoke', 'functional'],
    estimatedDuration: '1 min',
  });

  if (analysis.forms.some((f) => f.method === 'POST')) {
    analysis.forms
      .filter((f) => f.method === 'POST')
      .forEach((form) => {
        tests.push({
          id: nextId('TC-API'),
          type: 'api',
          title: `API - Form POST submission to ${form.action || url}`,
          description: 'Verify the form endpoint accepts POST requests with valid payload.',
          preconditions: ['API testing tool is available', 'Request payload is prepared'],
          testData: `Endpoint: ${form.action || url}\nMethod: POST\nContent-Type: application/x-www-form-urlencoded`,
          steps: [
            `Send POST request to ${form.action || url}`,
            'Set Content-Type header to application/x-www-form-urlencoded',
            'Include all required form fields in the request body',
            'Send the request',
            'Verify response status and body',
          ],
          expectedResults: [
            'Endpoint returns appropriate HTTP status (200, 201, or 302)',
            'Response body indicates success or redirects',
            'Server-side validation is enforced',
            'No sensitive data in response',
          ],
          priority: 'high',
          severity: 'critical',
          tags: ['api', 'functional', 'regression'],
          estimatedDuration: '2 min',
        });
      });
  }

  tests.push({
    id: nextId('TC-API'),
    type: 'api',
    title: 'API - Page resource endpoints checklist',
    description: 'Verify that all page resources (CSS, JS, images) are accessible via their URLs.',
    preconditions: ['Page has been loaded and resources are known'],
    testData: `Resources to check:\n- ${analysis.performance.externalScripts} external scripts\n- ${analysis.performance.externalStyles} external stylesheets`,
    steps: [
      'Extract all external resource URLs from the page',
      'For each CSS and JS resource URL, send HTTP HEAD request',
      'Verify each returns HTTP 200',
      'Check for 404 or 500 responses',
    ],
    expectedResults: [
      'All CSS and JS resources return HTTP 200',
      'No broken resource URLs',
      'CDN resources are reachable',
      'Resource URLs use HTTPS',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['api', 'smoke', 'regression'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-API'),
    type: 'api',
    title: 'API - Redirect and canonical URL validation',
    description: 'Verify URL redirect chains and canonical URL correctness.',
    preconditions: ['API testing tool is available'],
    testData: `Target URL: ${url}\nCanonical URL: ${analysis.metadata.canonicalUrl || 'Not specified'}`,
    steps: [
      'Send request without following redirects',
      'Record redirect chain (if any)',
      'Verify final destination URL',
      `Check canonical URL: ${analysis.metadata.canonicalUrl || 'N/A'}`,
      'Verify redirect chain is minimal (ideally 0-1 hops)',
    ],
    expectedResults: [
      'Final URL matches expected destination',
      'Redirect chain has minimal hops (ideally 0, at most 2)',
      'Canonical URL points to the correct preferred version',
      'WWW vs non-WWW redirect is consistent',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['api', 'regression'],
    estimatedDuration: '2 min',
  });

  return tests;
}

function generateUatTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-UAT'),
    type: 'uat',
    title: `UAT - Page meets business requirements`,
    description: 'End-user validation that the page fulfills its intended business purpose.',
    preconditions: ['Business requirements document is available', 'Page is fully functional'],
    testData: `Page type identified: ${insights.pageType}`,
    steps: [
      `Navigate to ${url}`,
      `Verify content matches the expected purpose: ${insights.pageType}`,
      'Verify all information presented is accurate and up-to-date',
      'Verify calls-to-action are clear and functional',
      'Verify the page achieves its business goal (e.g., informs, sells, registers)',
    ],
    expectedResults: [
      'Page content aligns with business requirements',
      'Information is accurate, current, and relevant',
      'Calls-to-action are prominent and functional',
      'Page successfully serves its intended purpose',
    ],
    priority: 'critical',
    severity: 'critical',
    tags: ['uat', 'functional'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-UAT'),
    type: 'uat',
    title: 'UAT - User experience and usability assessment',
    description: 'Evaluate the overall user experience, ease of use, and satisfaction.',
    preconditions: ['Page is fully loaded', 'Test user profile is configured'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Assess first impression and visual appeal',
      'Evaluate ease of finding key information',
      'Rate clarity of navigation and labels',
      'Assess load time perception (does it feel fast?)',
      'Evaluate form usability (are instructions clear?)',
      'Rate overall satisfaction',
    ],
    expectedResults: [
      'Page has professional and appealing visual design',
      `Key information is easy to find (headings: ${analysis.headings.length}, links: ${analysis.links.length})`,
      'Navigation labels are clear and intuitive',
      `Page load time of ${analysis.loadTimeMs}ms provides acceptable user experience`,
      'Form instructions and error messages are user-friendly',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['uat', 'ui'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-UAT'),
    type: 'uat',
    title: 'UAT - Cross-browser compatibility',
    description: 'Verify the page works correctly across major browsers from an end-user perspective.',
    preconditions: ['Access to Chrome, Firefox, Safari, Edge browsers'],
    testData: 'Browsers: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)',
    steps: [
      `Open ${url} in Chrome and verify functionality`,
      `Open ${url} in Firefox and compare rendering`,
      `Open ${url} in Safari and verify functionality`,
      `Open ${url} in Edge and verify functionality`,
      'Document any browser-specific issues',
    ],
    expectedResults: [
      'Page renders consistently across all major browsers',
      'All functionality works in all browsers',
      'No browser-specific layout issues',
      'Fonts, colors, and spacing are consistent',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['uat', 'regression', 'ui'],
    estimatedDuration: '10 min',
  });

  tests.push({
    id: nextId('TC-UAT'),
    type: 'uat',
    title: 'UAT - Error handling and fallback behavior',
    description: 'Verify the page handles error scenarios gracefully from an end-user perspective.',
    preconditions: ['Page is loaded', 'Network interruption can be simulated'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Simulate network disconnection',
      'Verify friendly error message is displayed',
      'Reconnect and verify page recovers',
      'Submit a form with invalid data and check error clarity',
    ],
    expectedResults: [
      'Offline/friendly error page or message is displayed when network fails',
      'Error messages are user-friendly and actionable',
      'Page recovers gracefully when network is restored',
      'Form errors clearly indicate which field has an issue and how to fix it',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['uat', 'functional'],
    estimatedDuration: '3 min',
  });

  return tests;
}

function generateLinkIntegrityTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;
  const allLinks = analysis.links;
  const internalLinks = allLinks.filter((l) => l.type === 'internal');
  const externalLinks = allLinks.filter((l) => l.type === 'external');

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: `Link integrity - All ${internalLinks.length} internal links return valid responses`,
    description: `Systematically verify every internal link (${internalLinks.length} found) returns HTTP 200 and loads correctly.`,
    preconditions: ['Page is fully loaded', 'All internal pages are accessible'],
    testData: `Total internal links: ${internalLinks.length}\nLinks: ${internalLinks.map((l) => l.href).join(', ')}`,
    steps: [
      `Navigate to ${url}`,
      'Collect all internal links from the page',
      `For each of the ${internalLinks.length} internal links:`,
      '  - Send HTTP HEAD or GET request',
      '  - Verify HTTP status is 200',
      '  - Check response Content-Type is HTML',
      '  - Log any redirects (301, 302)',
      'Compile list of broken links (4xx, 5xx)',
    ],
    expectedResults: [
      `All ${internalLinks.length} internal links return HTTP 200 OK`,
      'No broken links (4xx or 5xx responses)',
      'Redirect chains are minimal (max 2 hops)',
      'All linked pages load complete HTML content',
      'No dangling or orphaned links',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['functional', 'regression', 'smoke'],
    estimatedDuration: `${Math.max(3, Math.ceil(internalLinks.length * 0.5))} min`,
  });

  if (externalLinks.length > 0) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Link integrity - All ${externalLinks.length} external links are reachable`,
      description: `Verify all ${externalLinks.length} external links are accessible and return valid responses.`,
      preconditions: ['Page is fully loaded', 'External network access is available'],
      testData: `Total external links: ${externalLinks.length}\nLinks: ${externalLinks.map((l) => l.href).join(', ')}`,
      steps: [
        `Navigate to ${url}`,
        'Collect all external links from the page',
        `For each of the ${externalLinks.length} external links:`,
        '  - Send HTTP HEAD request with timeout',
        '  - Verify HTTP status is 200 or 3xx (redirect)',
        '  - Check for SSL certificate validity',
        '  - Log any unreachable or broken links',
      ],
      expectedResults: [
        `All ${externalLinks.length} external links are reachable`,
        'No dead external links (4xx, 5xx)',
        'SSL certificates on external sites are valid',
        'External redirects are recorded',
      ],
      priority: 'high',
      severity: 'major',
      tags: ['functional', 'regression'],
      estimatedDuration: `${Math.max(3, Math.ceil(externalLinks.length * 0.5))} min`,
    });
  }

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: 'Link integrity - Anchor links point to valid page sections',
    description: 'Verify all anchor/hash links (#section) point to existing elements on the page.',
    preconditions: ['Page is fully loaded'],
    testData: `Anchor links: ${allLinks.filter((l) => l.type === 'anchor').length}`,
    steps: [
      `Navigate to ${url}`,
      'Collect all anchor links (href starting with #)',
      'For each anchor link, verify the target element exists in the DOM',
      'Click each anchor link and verify it scrolls to the correct section',
      'Check that anchor IDs are unique',
    ],
    expectedResults: [
      'All anchor links target existing DOM elements',
      'Clicking anchor links scrolls to the correct section',
      'No broken anchor links (target element missing)',
      'Anchor IDs are unique and non-duplicated',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['functional', 'regression'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: 'Link integrity - No duplicate anchor IDs on page',
    description: 'Verify there are no duplicate id attributes that could cause navigation conflicts.',
    preconditions: ['Page is fully loaded'],
    testData: 'All element IDs on the page',
    steps: [
      `Navigate to ${url}`,
      'Extract all elements with id attributes',
      'Check for duplicate IDs',
      'Verify each ID is unique',
      'Document any duplicates found',
    ],
    expectedResults: [
      'All element IDs are unique',
      'No duplicate anchor targets',
      'No JavaScript errors from duplicate IDs',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['functional', 'regression'],
    estimatedDuration: '1 min',
  });

  return tests;
}

function generateImageIntegrityTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;
  const images = analysis.images;

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: `Image integrity - All ${images.length} images load correctly`,
    description: `Verify every image (${images.length} found) on the page loads without errors (no broken image icons).`,
    preconditions: ['Page is fully loaded', 'Image URLs are accessible'],
    testData: `Total images: ${images.length}\nImages: ${images.slice(0, 10).map((i) => i.src).join(', ')}${images.length > 10 ? '...' : ''}`,
    steps: [
      `Navigate to ${url}`,
      'Collect all <img> elements on the page',
      `For each of the ${images.length} images:`,
      '  - Verify the image src URL is valid',
      '  - Send HTTP HEAD request to verify accessibility',
      '  - Check HTTP status is 200',
      '  - Verify Content-Type is image/*',
      '  - Check image dimensions are not zero',
      '  - Verify no broken image placeholder is shown',
    ],
    expectedResults: [
      `All ${images.length} images load successfully (HTTP 200)`,
      'No broken image icons or placeholders',
      'All image URLs are valid and accessible',
      'Image Content-Type headers are correct',
      'No zero-dimension or invisible images',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['functional', 'regression', 'smoke'],
    estimatedDuration: `${Math.max(3, Math.ceil(images.length * 0.3))} min`,
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: 'Image integrity - Images have proper alt text',
    description: 'Verify all images have descriptive alt text for accessibility and broken-image fallback.',
    preconditions: ['Page is fully loaded'],
    testData: `Images with alt: ${images.filter((i) => i.hasAlt && i.alt !== '').length}/${images.length}\nImages without alt: ${images.filter((i) => !i.hasAlt).length}\nDecorative images (alt=""): ${images.filter((i) => i.isDecorative).length}`,
    steps: [
      `Navigate to ${url}`,
      'For each <img> element, inspect the alt attribute',
      'Verify alt text is descriptive (not empty for informative images)',
      'Verify decorative images use alt=""',
      'Check alt text is not just the filename',
      'Verify alt text is concise (under 125 characters)',
    ],
    expectedResults: [
      'All informative images have descriptive alt text',
      'Decorative images have empty alt (alt="")',
      'No images use filenames as alt text',
      'Alt text is under 125 characters',
      'Alt text accurately describes image content',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['accessibility', 'functional', 'regression'],
    estimatedDuration: '3 min',
  });

  if (images.some((i) => i.width && i.height)) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: 'Image integrity - Images have explicit dimensions',
      description: 'Verify all images have width/height attributes to prevent layout shift (CLS).',
      preconditions: ['Page is fully loaded'],
      testData: `Images with dimensions: ${images.filter((i) => i.width && i.height).length}/${images.length}`,
      steps: [
        `Navigate to ${url}`,
        'For each <img> element, check for width and height attributes',
        'Verify dimensions are set before image loads',
        'Check for explicit CSS dimensions as fallback',
        'Measure Cumulative Layout Shift (CLS)',
      ],
      expectedResults: [
        'All images have explicit width and height attributes',
        'No layout shift caused by image loading',
        'CLS score is below 0.1 (good)',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['performance', 'ui'],
      estimatedDuration: '2 min',
    });
  }

  if (images.length > 5) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: 'Image integrity - Images use modern formats and lazy loading',
      description: 'Verify images use modern formats (WebP/AVIF) and lazy loading for below-fold images.',
      preconditions: ['Page is fully loaded'],
      testData: `Total images: ${images.length}`,
      steps: [
        `Navigate to ${url}`,
        'Check image file extensions for modern formats (WebP, AVIF)',
        'Check for <img loading="lazy"> on below-fold images',
        'Verify images use srcset for responsive sizing',
        'Check for <picture> elements for art direction',
      ],
      expectedResults: [
        'Images use modern compressible formats where supported',
        'Below-fold images use loading="lazy"',
        'Responsive images use srcset',
        'No unnecessarily large image files',
      ],
      priority: 'medium',
      severity: 'minor',
      tags: ['performance', 'ui'],
      estimatedDuration: '2 min',
    });
  }

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: 'Image integrity - No mixed content images',
    description: 'Verify all images are loaded over HTTPS when the page is served over HTTPS.',
    preconditions: ['Page is loaded over HTTPS'],
    testData: `Page URL: ${url}`,
    steps: [
      `Navigate to ${url}`,
      'Check all <img> src attributes for http:// URLs',
      'Verify all image URLs use HTTPS or protocol-relative',
      'Check for mixed content warnings in console',
      'Verify no images are blocked by mixed content policy',
    ],
    expectedResults: [
      'All image URLs use HTTPS',
      'No mixed content warnings',
      'No images blocked by browser security',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['security', 'functional'],
    estimatedDuration: '1 min',
  });

  return tests;
}

function generateSiteSpecificTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  if (analysis.forms.length > 0) {
    for (let i = 0; i < analysis.forms.length; i++) {
      const form = analysis.forms[i];
      const formLabel = form.id || form.name || `form-${i + 1}`;

      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Form behavior - ${formLabel} (${form.method}) to ${form.action}`,
        description: `Verify form "${formLabel}" submits correctly via ${form.method} method to ${form.action}.`,
        preconditions: ['Form is visible and loaded'],
        testData: `Form action: ${form.action}\nMethod: ${form.method}\nFields: ${form.fields.length}`,
        steps: [
          `Navigate to ${url}`,
          `Locate form: ${formLabel}`,
          `Verify form action is: ${form.action}`,
          `Verify form method is: ${form.method}`,
          'Fill in all fields with valid test data',
          `Click "${form.submitButtonText}" button`,
          'Verify submission completes successfully',
        ],
        expectedResults: [
          `Form submits to ${form.action} via ${form.method}`,
          'All required fields are validated',
          'Form data is transmitted correctly',
          'Success/confirmation response is received',
        ],
        priority: 'high',
        severity: 'critical',
        tags: ['functional', 'regression'],
        estimatedDuration: '3 min',
      });

      if (form.fields.some((f) => f.type === 'email')) {
        tests.push({
          id: nextId('TC-FUNC'),
          type: 'functional',
          title: `Form validation - Email field format validation (${formLabel})`,
          description: `Verify email fields in form "${formLabel}" properly validate email format.`,
          preconditions: ['Form is visible'],
          testData: 'Valid: test@example.com\nInvalid: not-an-email, @missing.com, test@.com',
          steps: [
            `Navigate to ${url}`,
            `Locate form: ${formLabel}`,
            'Enter invalid email formats in email fields',
            'Submit the form',
            'Verify validation error for invalid emails',
            'Enter valid email format',
            'Verify form accepts valid email',
          ],
          expectedResults: [
            'Invalid email formats are rejected',
            'Clear error message for invalid email',
            'Valid email format is accepted',
            'Email field has proper input type="email"',
          ],
          priority: 'high',
          severity: 'major',
          tags: ['functional', 'regression'],
          estimatedDuration: '2 min',
        });
      }

      if (form.fields.some((f) => f.type === 'password')) {
        tests.push({
          id: nextId('TC-FUNC'),
          type: 'functional',
          title: `Form behavior - Password field masking and security (${formLabel})`,
          description: `Verify password fields in form "${formLabel}" properly mask input and handle security.`,
          preconditions: ['Form is visible'],
          testData: 'Password: TestPass123!',
          steps: [
            `Navigate to ${url}`,
            `Locate form: ${formLabel}`,
            'Type in password field',
            'Verify input is masked (dots/asterisks)',
            'Check browser password manager does not interfere',
            'Verify autocomplete attribute is set appropriately',
          ],
          expectedResults: [
            'Password input is masked (not visible)',
            'Password field has type="password"',
            'No password visible in page source',
            'Autocomplete attribute is set (if applicable)',
          ],
          priority: 'high',
          severity: 'critical',
          tags: ['security', 'functional'],
          estimatedDuration: '2 min',
        });
      }

      if (form.fields.some((f) => f.type === 'tel')) {
        tests.push({
          id: nextId('TC-FUNC'),
          type: 'functional',
          title: `Form validation - Phone number field validation (${formLabel})`,
          description: `Verify phone fields in form "${formLabel}" validate phone number format.`,
          preconditions: ['Form is visible'],
          testData: 'Valid: +1234567890, (555) 123-4567\nInvalid: abc, 123',
          steps: [
            `Navigate to ${url}`,
            `Locate form: ${formLabel}`,
            'Enter invalid phone formats',
            'Submit the form',
            'Verify validation for phone fields',
            'Enter valid phone format',
          ],
          expectedResults: [
            'Phone field uses type="tel"',
            'Invalid phone formats are handled',
            'Phone validation rules are enforced',
          ],
          priority: 'medium',
          severity: 'major',
          tags: ['functional'],
          estimatedDuration: '2 min',
        });
      }
    }
  }

  if (analysis.tables.length > 0) {
    for (let i = 0; i < Math.min(analysis.tables.length, 3); i++) {
      const table = analysis.tables[i];
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Table data - Table ${i + 1} (${table.headers.join(', ').substring(0, 50)}) rendering and data integrity`,
        description: `Verify table ${i + 1} renders correctly with ${table.rowCount} rows and ${table.columnCount} columns.`,
        preconditions: ['Page is fully loaded', 'Table is visible'],
        testData: `Headers: ${table.headers.join(', ')}\nRows: ${table.rowCount}\nColumns: ${table.columnCount}\nCaption: ${table.caption || 'None'}`,
        steps: [
          `Navigate to ${url}`,
          `Locate table ${i + 1}`,
          'Verify table headers are rendered correctly',
          `Verify table has ${table.rowCount} data rows`,
          `Verify table has ${table.columnCount} columns`,
          'Check data alignment in cells',
          'Verify table is scrollable on narrow viewports',
        ],
        expectedResults: [
          'Table headers are displayed correctly',
          `Table has ${table.rowCount} rows of data`,
          'Data is properly aligned in cells',
          'Table is responsive on mobile viewports',
          'Screen reader can navigate table structure',
        ],
        priority: 'medium',
        severity: 'major',
        tags: ['functional', 'ui', 'accessibility'],
        estimatedDuration: '2 min',
      });
    }
  }

  if (analysis.navElements.length > 0) {
    for (const nav of analysis.navElements) {
      tests.push({
        id: nextId('TC-FUNC'),
        type: 'functional',
        title: `Navigation - "${nav.label}" nav with ${nav.items} items is functional`,
        description: `Verify the "${nav.label}" navigation element has ${nav.items} working links.`,
        preconditions: ['Page is fully loaded', 'Navigation is visible'],
        testData: `Nav label: ${nav.label}\nItems: ${nav.items}`,
        steps: [
          `Navigate to ${url}`,
          `Locate navigation: "${nav.label}"`,
          'Verify all navigation links are visible',
          'Verify all navigation links are clickable',
          'Test each link navigates to correct destination',
          'Verify back button returns to page',
        ],
        expectedResults: [
          'All navigation links are visible and accessible',
          'All links navigate to correct destinations',
          'Navigation is keyboard accessible',
          'Back button works correctly',
        ],
        priority: 'high',
        severity: 'major',
        tags: ['functional', 'ui', 'accessibility'],
        estimatedDuration: '3 min',
      });
    }
  }

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'functional',
    title: `Page metadata - Title and description accuracy`,
    description: `Verify page title "${analysis.metadata.title}" accurately represents page content.`,
    preconditions: ['Page is fully loaded'],
    testData: `Title: ${analysis.metadata.title}\nDescription: ${analysis.metadata.description}`,
    steps: [
      `Navigate to ${url}`,
      'Verify page title matches the <title> tag',
      'Verify meta description matches visible content',
      'Check title is not empty',
      'Check title is under 60 characters',
      'Check description is under 160 characters',
    ],
    expectedResults: [
      'Page title is accurate and descriptive',
      'Title is under 60 characters for SEO',
      'Meta description is under 160 characters',
      'Title and description match page content',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['compliance', 'seo'],
    estimatedDuration: '1 min',
  });

  if (analysis.metadata.canonicalUrl) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: 'Canonical URL - Points to correct page',
      description: `Verify canonical URL ${analysis.metadata.canonicalUrl} points to the correct page.`,
      preconditions: ['Page is fully loaded'],
      testData: `Canonical URL: ${analysis.metadata.canonicalUrl}`,
      steps: [
        `Navigate to ${url}`,
        'Inspect <link rel="canonical"> tag',
        'Verify canonical URL is accessible',
        'Verify canonical URL matches page URL',
        'Check for canonical URL conflicts',
      ],
      expectedResults: [
        'Canonical URL is valid and accessible',
        'Canonical URL matches or is appropriate for the page',
        'No conflicting canonical tags',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['compliance', 'seo'],
      estimatedDuration: '1 min',
    });
  }

  return tests;
}

function generateEdgeCaseTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
  sessionNonce: string,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'ad-hoc',
    title: `Edge case - Rapid consecutive page reloads (session: ${sessionNonce.substring(0, 4)})`,
    description: 'Verify page stability under rapid consecutive reload actions.',
    preconditions: ['Page is loaded'],
    testData: `Session: ${sessionNonce}\nReload count: 10`,
    steps: [
      `Navigate to ${url}`,
      'Press F5 rapidly 10 times in succession',
      'Wait for final load to complete',
      'Verify page renders correctly',
      'Check for any JavaScript errors',
      'Verify no duplicate form submissions',
    ],
    expectedResults: [
      'Page loads correctly after each reload',
      'No JavaScript errors or exceptions',
      'No duplicate requests or submissions',
      'Page state is clean after rapid reloads',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc', 'edge-case'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'ad-hoc',
    title: 'Edge case - Browser back/forward button after form interaction',
    description: 'Verify browser history navigation works correctly after form interactions.',
    preconditions: ['Page is loaded', 'Forms exist on page'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Fill in form fields partially',
      'Click a link to navigate away',
      'Press browser back button',
      'Verify form state is preserved or correctly reset',
      'Press forward button',
      'Verify forward navigation works',
    ],
    expectedResults: [
      'Back navigation returns to the page',
      'Form state is handled correctly (preserved or reset)',
      'No data loss or corruption',
      'Forward navigation works correctly',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc', 'edge-case', 'ui'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Edge case - URL parameter injection and manipulation',
    description: 'Test page behavior when malicious or unexpected URL parameters are added.',
    preconditions: ['Page is loaded'],
    testData: `Base URL: ${url}\nTest params: ?id=1 OR 1=1, ?search=<script>alert(1)</script>, ?redirect=javascript:alert(1)`,
    steps: [
      `Navigate to ${url}?id=1%20OR%201%3D1`,
      'Verify no SQL injection occurs',
      `Navigate to ${url}?search=<script>alert(1)</script>`,
      'Verify XSS is prevented',
      `Navigate to ${url}?redirect=javascript:alert(1)`,
      'Verify URL redirect injection is blocked',
      'Check page handles malformed parameters gracefully',
    ],
    expectedResults: [
      'SQL injection attempts are safely handled',
      'XSS payloads are sanitized',
      'URL redirect injection is prevented',
      'Page handles malformed parameters gracefully',
      'No application errors or crashes',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['security', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Edge case - HTTP method tampering (PUT, DELETE, PATCH)',
    description: 'Verify the page only accepts expected HTTP methods.',
    preconditions: ['API testing tools available'],
    testData: `Target URL: ${url}\nMethods: PUT, DELETE, PATCH, OPTIONS, TRACE`,
    steps: [
      `Send PUT request to ${url}`,
      `Send DELETE request to ${url}`,
      `Send PATCH request to ${url}`,
      `Send OPTIONS request to ${url}`,
      `Send TRACE request to ${url}`,
      'Verify each returns appropriate response',
    ],
    expectedResults: [
      'PUT/DELETE/PATCH return 405 Method Not Allowed',
      'OPTIONS returns allowed methods (if CORS enabled)',
      'TRACE is disabled (security best practice)',
      'No sensitive data exposed in error responses',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['security', 'edge-case'],
    estimatedDuration: '2 min',
  });

  tests.push({
    id: nextId('TC-PERF'),
    type: 'performance',
    title: 'Edge case - Page performance under slow 3G throttling',
    description: 'Verify page loads and is usable under slow network conditions.',
    preconditions: ['Browser DevTools available', 'Network throttling enabled'],
    testData: 'Network: Slow 3G (400 kbps down, 400 ms RTT)',
    steps: [
      `Navigate to ${url} with Slow 3G throttling`,
      'Measure time to first meaningful paint',
      'Measure time to interactive (TTI)',
      'Verify page content is visible during load',
      'Check for progressive rendering',
      'Verify no network timeout errors',
    ],
    expectedResults: [
      'Page loads within 10 seconds on slow 3G',
      'Content is visible progressively during load',
      'No timeout or connection errors',
      'Page is interactive within acceptable threshold',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['performance', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-PERF'),
    type: 'performance',
    title: 'Edge case - Memory leak detection during long session',
    description: 'Verify no memory leaks occur during extended page usage.',
    preconditions: ['Browser DevTools memory profiler available'],
    testData: 'Session duration: 5 minutes of active interaction',
    steps: [
      `Navigate to ${url}`,
      'Take heap snapshot baseline',
      'Interact with page (scroll, click, navigate) for 5 minutes',
      'Take another heap snapshot',
      'Compare memory usage',
      'Check for detached DOM nodes',
    ],
    expectedResults: [
      'Memory usage remains stable',
      'No significant memory growth (> 10%)',
      'No detached DOM nodes accumulating',
      'Page remains responsive throughout',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['performance', 'edge-case'],
    estimatedDuration: '8 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Edge case - Screen reader navigation compatibility',
    description: 'Verify the page works correctly with screen readers (NVDA, VoiceOver, JAWS).',
    preconditions: ['Screen reader is available'],
    testData: 'Screen readers: NVDA (Windows), VoiceOver (macOS), JAWS (Windows)',
    steps: [
      `Navigate to ${url} with screen reader`,
      'Navigate through all headings using H key',
      'Navigate through all links using Tab key',
      'Navigate through all form fields',
      'Verify all images have alt text read aloud',
      'Verify ARIA landmarks are announced',
      'Verify form labels are announced',
    ],
    expectedResults: [
      'All headings are announced correctly',
      'All links have descriptive text',
      'Form fields have associated labels announced',
      'ARIA landmarks are properly identified',
      'Page structure is navigable via screen reader',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['accessibility', 'edge-case'],
    estimatedDuration: '10 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Edge case - Focus management and trap testing',
    description: 'Verify focus is properly managed and no keyboard traps exist.',
    preconditions: ['Page is fully loaded'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Tab through all interactive elements',
      'Verify focus order follows logical flow',
      'Check for keyboard traps (cannot tab away)',
      'Verify focus is visible on all elements',
      'Test Shift+Tab for reverse navigation',
      'Verify focus returns to trigger after modal close (if any)',
    ],
    expectedResults: [
      'All interactive elements are focusable',
      'No keyboard traps exist',
      'Focus indicator is visible',
      'Focus order is logical',
      'Focus management follows WAI-ARIA practices',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['accessibility', 'edge-case'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-A11Y'),
    type: 'accessibility',
    title: 'Edge case - Text scaling and zoom (200%)',
    description: 'Verify page remains usable when text is scaled to 200%.',
    preconditions: ['Page is fully loaded'],
    testData: 'Text scale: 200% (WCAG 1.4.4)',
    steps: [
      `Navigate to ${url}`,
      'Use Ctrl+Plus to zoom to 200%',
      'Verify text is readable without horizontal scrolling',
      'Verify no content is cut off or overlaps',
      'Verify all functionality still works',
      'Check form fields are still usable',
    ],
    expectedResults: [
      'Text scales to 200% without loss of content',
      'No horizontal scrolling required',
      'All content remains visible and readable',
      'All functionality works at 200% zoom',
      'No text truncation or overflow',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['accessibility', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Edge case - Content Security Policy (CSP) validation',
    description: 'Verify the page has proper Content Security Policy headers.',
    preconditions: ['Page is loaded', 'Network inspection tools available'],
    testData: 'CSP directives to check: script-src, style-src, img-src, default-src',
    steps: [
      `Navigate to ${url}`,
      'Inspect response headers for Content-Security-Policy',
      'Check for inline script restrictions',
      'Check for external resource restrictions',
      'Verify no unsafe-eval or unsafe-inline',
      'Test if CSP blocks XSS attempts',
    ],
    expectedResults: [
      'CSP header is present and properly configured',
      'Inline scripts are restricted (or nonce-based)',
      'External resources are whitelisted',
      'No unsafe-eval or unsafe-inline',
      'CSP prevents XSS attacks',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['security', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-SEC'),
    type: 'security',
    title: 'Edge case - Sensitive data exposure in JavaScript',
    description: 'Verify no sensitive data is exposed in JavaScript variables, comments, or source code.',
    preconditions: ['Page is loaded', 'View page source available'],
    testData: 'Search patterns: API keys, tokens, passwords, internal URLs, emails',
    steps: [
      `Navigate to ${url}`,
      'View page source',
      'Search for API keys or tokens',
      'Search for hardcoded passwords',
      'Search for internal URLs or localhost references',
      'Search for email addresses',
      'Check JavaScript console for sensitive data',
      'Inspect network requests for sensitive data in URLs',
    ],
    expectedResults: [
      'No API keys or tokens in source code',
      'No hardcoded passwords',
      'No internal URLs exposed',
      'Emails are obfuscated or not present',
      'No sensitive data in console logs',
      'No sensitive data in URL parameters',
    ],
    priority: 'high',
    severity: 'critical',
    tags: ['security', 'edge-case'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'ad-hoc',
    title: 'Edge case - Double-click prevention on all interactive elements',
    description: 'Verify all buttons and links prevent double-click/double-submission.',
    preconditions: ['Page is fully loaded', 'Interactive elements exist'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Identify all clickable buttons and links',
      'Double-click each element rapidly',
      'Verify no duplicate actions occur',
      'Check for duplicate form submissions',
      'Verify loading states prevent re-clicks',
    ],
    expectedResults: [
      'No duplicate form submissions',
      'No duplicate page navigations',
      'Loading states prevent re-clicks',
      'All interactive elements handle double-click',
    ],
    priority: 'medium',
    severity: 'major',
    tags: ['functional', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'ad-hoc',
    title: 'Edge case - Page behavior with JavaScript disabled',
    description: 'Verify the page degrades gracefully without JavaScript.',
    preconditions: ['JavaScript can be disabled in browser'],
    testData: 'JavaScript: Disabled',
    steps: [
      'Disable JavaScript in browser settings',
      `Navigate to ${url}`,
      'Verify core content is still visible',
      'Verify navigation still works',
      'Verify forms are still submittable',
      'Re-enable JavaScript and verify full functionality',
    ],
    expectedResults: [
      'Core content is visible without JavaScript',
      'Navigation works without JavaScript',
      'Forms are submittable without JavaScript',
      'No blank or broken pages',
      'Progressive enhancement is implemented',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc', 'edge-case', 'accessibility'],
    estimatedDuration: '5 min',
  });

  tests.push({
    id: nextId('TC-FUNC'),
    type: 'ad-hoc',
    title: 'Edge case - Online/offline connectivity transitions',
    description: 'Verify page handles network connectivity changes gracefully.',
    preconditions: ['Page is loaded', 'Network can be toggled'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url}`,
      'Verify page loads successfully',
      'Simulate network disconnection',
      'Verify offline message is displayed',
      'Attempt interactive actions (click, form submit)',
      'Reconnect network',
      'Verify page recovers and syncs',
    ],
    expectedResults: [
      'Offline state is detected and communicated',
      'User receives friendly offline message',
      'Page recovers when network is restored',
      'No data loss during connectivity transitions',
    ],
    priority: 'low',
    severity: 'minor',
    tags: ['ad-hoc', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-COMP'),
    type: 'compliance',
    title: 'Edge case - Cookie consent banner behavior and persistence',
    description: 'Verify cookie consent banner appears, persists choice, and can be modified.',
    preconditions: ['Page is loaded', 'Cookies can be cleared'],
    testData: 'N/A',
    steps: [
      `Navigate to ${url} with cleared cookies`,
      'Verify cookie consent banner appears',
      'Accept cookies and verify banner disappears',
      'Reload page and verify banner does not reappear',
      'Clear cookies and reload',
      'Verify banner reappears',
      'Reject non-essential cookies',
      'Verify page still functions correctly',
    ],
    expectedResults: [
      'Cookie consent banner appears on first visit',
      'Choice is persisted in cookies',
      'Banner does not reappear after choice',
      'Page functions with non-essential cookies rejected',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['compliance', 'edge-case'],
    estimatedDuration: '3 min',
  });

  tests.push({
    id: nextId('TC-UAT'),
    type: 'uat',
    title: 'Edge case - Cross-browser rendering consistency',
    description: 'Verify page renders consistently across Chrome, Firefox, Safari, and Edge.',
    preconditions: ['Access to multiple browsers'],
    testData: 'Browsers: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+',
    steps: [
      `Open ${url} in Chrome`,
      'Take screenshot at 1920x1080',
      `Open ${url} in Firefox`,
      'Compare rendering with Chrome',
      `Open ${url} in Safari`,
      'Compare rendering',
      `Open ${url} in Edge`,
      'Compare rendering',
      'Document any differences',
    ],
    expectedResults: [
      'Layout is consistent across all browsers',
      'Fonts render correctly in all browsers',
      'Colors and spacing are consistent',
      'No browser-specific layout issues',
      'All functionality works in all browsers',
    ],
    priority: 'high',
    severity: 'major',
    tags: ['uat', 'edge-case', 'ui'],
    estimatedDuration: '10 min',
  });

  return tests;
}

function generateCrossBrowserTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  const browsers = [
    {
      name: 'Google Chrome',
      version: 'latest',
      engine: 'Blink',
      focus: 'rendering, JavaScript, CSS, forms, media',
    },
    {
      name: 'Mozilla Firefox',
      version: 'latest',
      engine: 'Gecko',
      focus: 'rendering, JavaScript, CSS, forms, media',
    },
    {
      name: 'Safari',
      version: 'latest',
      engine: 'WebKit',
      focus: 'rendering, WebKit specific, CSS prefixes, touch events',
    },
    {
      name: 'Microsoft Edge',
      version: 'latest',
      engine: 'Chromium (Blink)',
      focus: 'rendering, Chromium compatibility, IE legacy considerations',
    },
  ];

  for (const browser of browsers) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - Page rendering on ${browser.name} ${browser.version}`,
      description: `Verify that ${url} renders correctly in ${browser.name} ${browser.version} (${browser.engine}) with no visual layout differences.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'Network connectivity is available',
        'Target URL is accessible',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nEngine: ${browser.engine}\nURL: ${url}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        `Navigate to ${url}`,
        'Wait for the page to fully load',
        'Verify page layout matches the expected design',
        'Verify all images and media load correctly',
        'Check for rendering anomalies or layout shifts',
        'Compare rendering with Chrome baseline if available',
      ],
      expectedResults: [
        'Page layout renders correctly without distortions',
        'All visual elements are properly positioned',
        'No broken images or missing media',
        'Text is rendered with correct fonts and sizes',
        'No layout shifts during page load',
        'Page matches baseline rendering within acceptable tolerance',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-browser', 'functional', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - JavaScript execution on ${browser.name} ${browser.version}`,
      description: `Verify that all JavaScript on ${url} executes correctly in ${browser.name} ${browser.version} without errors.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'JavaScript is enabled',
        'Browser DevTools console is accessible',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nEngine: ${browser.engine}\nURL: ${url}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        'Open browser DevTools console',
        `Navigate to ${url}`,
        'Wait for the page to fully load',
        'Check console for JavaScript errors or warnings',
        'Interact with dynamic page elements (dropdowns, modals, etc.)',
        'Verify JavaScript-driven animations work smoothly',
        'Test any form validation logic',
      ],
      expectedResults: [
        'No JavaScript errors in the browser console',
        'No unhandled exceptions or promise rejections',
        'Dynamic elements function correctly',
        'Form validation logic works as expected',
        'Animations and transitions are smooth',
        'No JavaScript-related performance issues',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-browser', 'functional', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - Form interaction on ${browser.name} ${browser.version}`,
      description: `Verify that all forms on ${url} are fully interactable and functional in ${browser.name} ${browser.version}.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'Page forms are visible',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nURL: ${url}\nForms found: ${analysis.forms.length}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        `Navigate to ${url}`,
        'Locate all forms on the page',
        'Fill in text fields with test data',
        'Select dropdown options',
        'Check and uncheck checkboxes and radio buttons',
        'Test date pickers and color pickers if present',
        'Submit the form with valid data',
        'Submit the form with invalid data to test validation',
      ],
      expectedResults: [
        'All form fields accept input correctly',
        'Dropdown menus function properly',
        'Checkboxes and radio buttons toggle correctly',
        'Form validation messages display appropriately',
        'Form submission completes without errors',
        'Autocomplete suggestions work if implemented',
        'Form retains input on validation failure',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-browser', 'functional', 'regression'],
      estimatedDuration: '4 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - CSS styling consistency on ${browser.name} ${browser.version}`,
      description: `Verify that CSS styles on ${url} are applied consistently in ${browser.name} ${browser.version}.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'Page is fully loaded',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nEngine: ${browser.engine}\nURL: ${url}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        `Navigate to ${url}`,
        'Inspect key CSS properties (colors, fonts, spacing)',
        'Verify CSS Grid and Flexbox layouts render correctly',
        'Check CSS custom properties (variables) are applied',
        'Test CSS transitions and animations',
        'Verify media queries trigger at correct breakpoints',
        'Check for missing CSS prefixes that may cause issues',
      ],
      expectedResults: [
        'All CSS styles are applied as designed',
        'CSS Grid and Flexbox layouts render correctly',
        'CSS variables are properly inherited',
        'Transitions and animations are smooth',
        'Media queries function at correct breakpoints',
        'No missing vendor prefixes causing visual issues',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['cross-browser', 'functional', 'ui'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - Media playback on ${browser.name} ${browser.version}`,
      description: `Verify that all media elements (images, video, audio) on ${url} load and play correctly in ${browser.name} ${browser.version}.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'Page contains media elements',
        'Audio output is available for testing',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nURL: ${url}\nImages: ${analysis.images.length}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        `Navigate to ${url}`,
        'Verify all images load and display correctly',
        'If video elements exist, play and pause the video',
        'If audio elements exist, play and pause the audio',
        'Test media controls (play, pause, volume, fullscreen)',
        'Verify responsive images load appropriate sizes',
        'Check lazy loading behavior for below-fold media',
      ],
      expectedResults: [
        'All images load without broken placeholders',
        'Video elements play and pause correctly',
        'Audio elements play and pause correctly',
        'Media controls are functional',
        'Responsive images adapt to viewport',
        'Lazy loading triggers for off-screen media',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['cross-browser', 'functional'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-browser - Console errors check on ${browser.name} ${browser.version}`,
      description: `Verify that ${url} produces no console errors in ${browser.name} ${browser.version} during normal page usage.`,
      preconditions: [
        `${browser.name} ${browser.version} is installed`,
        'Browser DevTools console is accessible',
      ],
      testData: `Browser: ${browser.name} ${browser.version}\nURL: ${url}`,
      steps: [
        `Open ${browser.name} ${browser.version}`,
        'Clear browser console',
        `Navigate to ${url}`,
        'Wait for full page load',
        'Record all console errors, warnings, and info messages',
        'Interact with page elements (click buttons, open menus)',
        'Navigate through internal links and back',
        'Review console output for issues',
      ],
      expectedResults: [
        'No JavaScript errors in console',
        'No network-related errors (4xx, 5xx)',
        'No mixed content warnings',
        'Warnings are acceptable (deprecation notices, etc.)',
        'No uncaught promise rejections',
        'Console is clean during normal usage flow',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-browser', 'functional', 'regression'],
      estimatedDuration: '2 min',
    });
  }

  return tests;
}

function generateCrossDeviceTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  const devices = [
    {
      name: 'iPhone 15 Pro',
      viewport: '393x852',
      os: 'iOS 17',
      browser: 'Safari',
    },
    {
      name: 'iPhone 14',
      viewport: '390x844',
      os: 'iOS 16',
      browser: 'Safari',
    },
    {
      name: 'Samsung Galaxy S24',
      viewport: '360x780',
      os: 'Android 14',
      browser: 'Chrome',
    },
    {
      name: 'Google Pixel 8',
      viewport: '412x915',
      os: 'Android 14',
      browser: 'Chrome',
    },
    {
      name: 'iPad Pro 12.9"',
      viewport: '1024x1366',
      os: 'iPadOS 17',
      browser: 'Safari',
    },
    {
      name: 'iPad Air',
      viewport: '820x1180',
      os: 'iPadOS 16',
      browser: 'Safari',
    },
    {
      name: 'Samsung Galaxy Tab S9',
      viewport: '800x1280',
      os: 'Android 14',
      browser: 'Chrome',
    },
  ];

  for (const device of devices) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-device - Viewport rendering on ${device.name} (${device.viewport})`,
      description: `Verify that ${url} renders correctly within the ${device.viewport} viewport on ${device.name} (${device.os}, ${device.browser}).`,
      preconditions: [
        `${device.name} or emulator is available`,
        `${device.browser} browser is installed`,
        'Network connectivity is available',
      ],
      testData: `Device: ${device.name}\nViewport: ${device.viewport}\nOS: ${device.os}\nBrowser: ${device.browser}\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${device.viewport}`,
        `Set user agent to ${device.name} (${device.os})`,
        `Navigate to ${url}`,
        'Wait for the page to fully load',
        'Verify the layout adapts to the viewport',
        'Verify no horizontal scrollbar appears',
        'Verify all content is visible within the viewport',
        'Check that text is readable without zooming',
        'Verify touch-friendly element sizing',
      ],
      expectedResults: [
        'Page layout adapts correctly to the viewport',
        'No horizontal scrollbar appears',
        'All content is visible without horizontal scrolling',
        'Text is readable at native resolution without zooming',
        'Interactive elements are touch-friendly (min 44x44px)',
        'No overlapping or cut-off elements',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-device', 'functional', 'ui', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-device - Touch interactions on ${device.name}`,
      description: `Verify that all touch gestures and interactions work correctly on ${device.name} (${device.os}) at ${url}.`,
      preconditions: [
        `${device.name} or emulator is available`,
        'Touch input is enabled',
        'Page contains interactive elements',
      ],
      testData: `Device: ${device.name}\nViewport: ${device.viewport}\nOS: ${device.os}\nURL: ${url}`,
      steps: [
        `Set device emulation to ${device.name}`,
        `Navigate to ${url}`,
        'Tap on navigation links and buttons',
        'Swipe horizontally on carousels or sliders if present',
        'Swipe vertically to scroll the page',
        'Long-press on elements that support it',
        'Pinch to zoom on content areas',
        'Double-tap to zoom if supported',
        'Test pull-to-refresh if implemented',
      ],
      expectedResults: [
        'Tap interactions trigger the expected actions',
        'Horizontal swipe gestures work on carousels',
        'Vertical scrolling is smooth and responsive',
        'Long-press triggers context menus where expected',
        'Pinch-to-zoom functions correctly',
        'Double-tap zoom works on content areas',
        'No accidental tap targets or ghost clicks',
        'Touch feedback (ripple, highlight) is visible',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-device', 'functional', 'ui'],
      estimatedDuration: '4 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-device - Responsive layout on ${device.name} (${device.viewport})`,
      description: `Verify that the responsive layout of ${url} adjusts properly at the ${device.viewport} breakpoint on ${device.name}.`,
      preconditions: [
        `${device.name} or emulator is available`,
        'Page is fully loaded',
      ],
      testData: `Device: ${device.name}\nViewport: ${device.viewport}\nOS: ${device.os}\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${device.viewport}`,
        `Navigate to ${url}`,
        'Verify navigation adapts (hamburger menu on small screens)',
        'Verify content columns stack vertically if needed',
        'Verify images scale appropriately',
        'Verify tables are horizontally scrollable',
        'Verify footer content stacks correctly',
        'Check that the correct breakpoint is triggered',
      ],
      expectedResults: [
        'Navigation switches to mobile-friendly pattern',
        'Multi-column layouts stack appropriately',
        'Images scale down proportionally',
        'Tables are scrollable without breaking layout',
        'Footer content stacks vertically on narrow screens',
        'Correct responsive breakpoint is active',
        'No content is hidden or inaccessible',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['cross-device', 'functional', 'ui', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-device - Font scaling on ${device.name} (${device.os})`,
      description: `Verify that text on ${url} remains readable and properly scaled on ${device.name} at various system font size settings.`,
      preconditions: [
        `${device.name} or emulator is available`,
        'Device system font size can be adjusted',
      ],
      testData: `Device: ${device.name}\nOS: ${device.os}\nViewport: ${device.viewport}\nURL: ${url}`,
      steps: [
        `Set device to default font size`,
        `Navigate to ${url}`,
        'Verify text is readable at default font size',
        'Increase system font size to large',
        'Reload the page and verify text scales up',
        'Verify no text is clipped or overflows containers',
        'Verify navigation and buttons remain functional',
        'Reset font size to default and verify normalization',
      ],
      expectedResults: [
        'Text is readable at default font size',
        'Text scales up when system font size increases',
        'No text clipping or overflow at larger font sizes',
        'Layout remains intact with larger text',
        'Navigation remains functional at all font sizes',
        'Form fields accommodate larger text',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['cross-device', 'functional', 'accessibility'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Cross-device - Navigation patterns on ${device.name} (${device.viewport})`,
      description: `Verify that navigation patterns on ${url} are appropriate and functional for ${device.name} at ${device.viewport}.`,
      preconditions: [
        `${device.name} or emulator is available`,
        'Navigation elements are present on the page',
      ],
      testData: `Device: ${device.name}\nViewport: ${device.viewport}\nOS: ${device.os}\nBrowser: ${device.browser}\nURL: ${url}`,
      steps: [
        `Set device emulation to ${device.name}`,
        `Navigate to ${url}`,
        'Locate the primary navigation element',
        'Open mobile menu (hamburger) if on narrow viewport',
        'Tap on navigation links and verify destinations',
        'Close the mobile menu',
        'Scroll down and verify sticky/fixed navigation behavior',
        'Use back gesture/button to return to the page',
        'Verify breadcrumb navigation if present',
      ],
      expectedResults: [
        'Mobile menu opens and closes correctly',
        'Navigation links are touch-friendly and tappable',
        'Navigation leads to correct destinations',
        'Sticky/fixed navigation remains accessible while scrolling',
        'Back gesture returns to the previous page',
        'Breadcrumb navigation is functional and visible',
        'Active/current page is indicated in navigation',
      ],
      priority: 'high',
      severity: 'major',
      tags: ['cross-device', 'functional', 'ui'],
      estimatedDuration: '3 min',
    });
  }

  return tests;
}

function generateResolutionTests(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestCase[] {
  const tests: TestCase[] = [];
  const url = analysis.url;

  const resolutions = [
    { width: 3840, height: 2160, label: '4K UHD' },
    { width: 2560, height: 1440, label: 'QHD/2K' },
    { width: 1920, height: 1080, label: 'Full HD' },
    { width: 1366, height: 768, label: 'HD Laptop' },
    { width: 1280, height: 720, label: 'HD' },
    { width: 1024, height: 768, label: 'XGA/Tablet landscape' },
    { width: 768, height: 1024, label: 'Tablet portrait' },
    { width: 375, height: 812, label: 'Mobile portrait' },
  ];

  for (const res of resolutions) {
    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Resolution - Layout integrity at ${res.width}x${res.height} (${res.label})`,
      description: `Verify that ${url} maintains layout integrity at ${res.width}x${res.height} (${res.label}) resolution.`,
      preconditions: [
        'Browser is available with resolution control',
        'Network connectivity is available',
      ],
      testData: `Resolution: ${res.width}x${res.height} (${res.label})\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${res.width}x${res.height}`,
        `Navigate to ${url}`,
        'Wait for the page to fully load',
        'Verify the overall page layout is intact',
        'Verify header and footer span the correct width',
        'Verify content sections are properly contained',
        'Check that no elements overflow the viewport',
        'Verify images and media scale correctly',
      ],
      expectedResults: [
        'Page layout is properly structured at this resolution',
        'Header and footer render correctly at full width',
        'Content sections are contained within the viewport',
        'No elements overflow or cause horizontal scrolling',
        'Images and media scale proportionally',
        'Text columns are properly sized for the viewport',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['resolution', 'functional', 'ui', 'regression'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Resolution - No horizontal scroll at ${res.width}x${res.height} (${res.label})`,
      description: `Verify that ${url} does not produce a horizontal scrollbar at ${res.width}x${res.height} (${res.label}) resolution.`,
      preconditions: [
        'Browser is available with resolution control',
      ],
      testData: `Resolution: ${res.width}x${res.height} (${res.label})\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${res.width}x${res.height}`,
        `Navigate to ${url}`,
        'Wait for the page to fully load',
        'Check document.documentElement.scrollWidth vs clientWidth',
        'Verify no horizontal scrollbar appears',
        'Scroll horizontally if scrollbar exists and note overflow elements',
        'Check for elements with fixed widths exceeding viewport',
      ],
      expectedResults: [
        'No horizontal scrollbar appears',
        'Document scrollWidth does not exceed clientWidth',
        'All elements fit within the viewport width',
        'No text or content is clipped horizontally',
        'Tables are contained or scrollable within their container',
        'No fixed-width elements break the layout',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['resolution', 'functional', 'ui'],
      estimatedDuration: '2 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Resolution - Content visibility at ${res.width}x${res.height} (${res.label})`,
      description: `Verify that all important content on ${url} is visible and accessible at ${res.width}x${res.height} (${res.label}) resolution.`,
      preconditions: [
        'Browser is available with resolution control',
        'Page is fully loaded',
      ],
      testData: `Resolution: ${res.width}x${res.height} (${res.label})\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${res.width}x${res.height}`,
        `Navigate to ${url}`,
        'Verify the page title and heading are visible',
        'Verify main content is visible above the fold',
        'Scroll down and verify all content sections load',
        'Verify images are visible and not hidden',
        'Check that no content is hidden behind sticky elements',
        'Verify all text is visible and not truncated',
      ],
      expectedResults: [
        'Page title and primary heading are visible',
        'Main content is accessible above the fold',
        'All content sections are visible when scrolled to',
        'All images render and are visible',
        'No content is hidden behind sticky headers or footers',
        'All text is visible without truncation',
      ],
      priority: 'high',
      severity: 'critical',
      tags: ['resolution', 'functional', 'ui'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Resolution - Text readability at ${res.width}x${res.height} (${res.label})`,
      description: `Verify that all text on ${url} is readable and properly sized at ${res.width}x${res.height} (${res.label}) resolution.`,
      preconditions: [
        'Browser is available with resolution control',
        'Page is fully loaded',
      ],
      testData: `Resolution: ${res.width}x${res.height} (${res.label})\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${res.width}x${res.height}`,
        `Navigate to ${url}`,
        'Verify body text font size is at least 14px',
        'Verify heading sizes are proportional to viewport',
        'Check line height and letter spacing are comfortable',
        'Verify text contrast against background',
        'Check that text is not overlapping or cut off',
        'Verify link text is distinguishable from body text',
      ],
      expectedResults: [
        'Body text is at least 14px for readability',
        'Heading sizes are proportional and hierarchical',
        'Line height is between 1.4 and 1.8 for comfortable reading',
        'Text contrast meets WCAG AA standards',
        'No text overlapping or being cut off',
        'Link text is visually distinguishable',
        'Text scales appropriately for the resolution',
      ],
      priority: 'medium',
      severity: 'major',
      tags: ['resolution', 'functional', 'ui', 'accessibility'],
      estimatedDuration: '3 min',
    });

    tests.push({
      id: nextId('TC-FUNC'),
      type: 'functional',
      title: `Resolution - Navigation usability at ${res.width}x${res.height} (${res.label})`,
      description: `Verify that navigation elements on ${url} are usable and accessible at ${res.width}x${res.height} (${res.label}) resolution.`,
      preconditions: [
        'Browser is available with resolution control',
        'Navigation elements are present on the page',
      ],
      testData: `Resolution: ${res.width}x${res.height} (${res.label})\nURL: ${url}`,
      steps: [
        `Set browser viewport to ${res.width}x${res.height}`,
        `Navigate to ${url}`,
        'Verify navigation is visible and accessible',
        'Verify navigation links are tappable/clickable',
        'If mobile menu exists, verify it opens and closes',
        'Test that navigation links lead to correct pages',
        'Verify search functionality is accessible if present',
        'Check that navigation does not overlap content',
      ],
      expectedResults: [
        'Navigation is visible and accessible',
        'All navigation links are within the viewport or accessible via menu',
        'Mobile hamburger menu works if applicable',
        'Navigation links are large enough for touch interaction',
        'Search bar is accessible and functional',
        'Navigation does not overlap or obscure content',
        'Active page is indicated in navigation',
      ],
      priority: 'high',
      severity: 'major',
      tags: ['resolution', 'functional', 'ui'],
      estimatedDuration: '3 min',
    });
  }

  return tests;
}

function generateScenarios(
  allTestCases: TestCase[],
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
): TestScenario[] {
  const scenarios: TestScenario[] = [];
  const url = analysis.url;

  scenarios.push({
    id: nextId('SCEN'),
    title: `End-to-end user journey: Page exploration`,
    description: `Complete user journey navigating and interacting with the page at ${url}`,
    type: 'functional',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'functional' || tc.type === 'smoke')
      .slice(0, 8)
      .map((tc) => tc.id),
    preconditions: ['Browser is open', 'Network connectivity is available'],
    tags: ['e2e', 'functional', 'smoke'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: `Form submission and validation workflow`,
    description: 'Complete workflow covering form interaction, validation, and submission.',
    type: 'functional',
    relatedTestCases: allTestCases
      .filter((tc) =>
        tc.tags.includes('functional') &&
        (tc.title.toLowerCase().includes('form') || tc.title.toLowerCase().includes('validation')),
      )
      .slice(0, 10)
      .map((tc) => tc.id),
    preconditions: ['Form fields are visible', 'Test data is prepared'],
    tags: ['e2e', 'functional', 'regression'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Accessibility compliance verification',
    description: 'Verify the page meets WCAG accessibility standards.',
    type: 'accessibility',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'accessibility')
      .map((tc) => tc.id),
    preconditions: ['Screen reader or accessibility testing tools are available'],
    tags: ['accessibility', 'compliance'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Security posture assessment',
    description: 'Evaluate the security posture of the page and its interactions.',
    type: 'security',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'security')
      .map((tc) => tc.id),
    preconditions: ['Security testing tools are available', 'Authorization for security testing is obtained'],
    tags: ['security', 'regression'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Performance and load testing scenario',
    description: 'Assess page performance under various conditions and load levels.',
    type: 'performance',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'performance' || tc.type === 'load')
      .map((tc) => tc.id),
    preconditions: ['Performance testing tools are available', 'Baseline metrics are established'],
    tags: ['performance', 'load'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Cross-browser and responsive design validation',
    description: 'Ensure consistent experience across browsers and devices.',
    type: 'ui',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'ui')
      .map((tc) => tc.id),
    preconditions: ['Access to multiple browsers and device emulators'],
    tags: ['ui', 'uat', 'regression'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Regression suite: Core functionality',
    description: 'Comprehensive regression check of core page features.',
    type: 'regression',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'regression' || tc.tags.includes('regression'))
      .slice(0, 15)
      .map((tc) => tc.id),
    preconditions: ['Page is deployed with changes to test'],
    tags: ['regression', 'functional'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'End-to-end user acceptance testing',
    description: 'User acceptance testing from a real end-user perspective.',
    type: 'uat',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'uat')
      .map((tc) => tc.id),
    preconditions: ['Staging/production environment is available', 'Business stakeholders are available for review'],
    tags: ['uat', 'e2e'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Ad-hoc exploratory testing session',
    description: 'Exploratory testing to uncover unexpected issues and edge cases.',
    type: 'ad-hoc',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'ad-hoc')
      .map((tc) => tc.id),
    preconditions: ['Testing environment is ready', 'Exploratory testing charter is prepared'],
    tags: ['ad-hoc', 'exploratory'],
  });

  scenarios.push({
    id: nextId('SCEN'),
    title: 'Compliance and regulatory review',
    description: 'Verify compliance with relevant regulations (GDPR, accessibility, etc.).',
    type: 'compliance',
    relatedTestCases: allTestCases
      .filter((tc) => tc.type === 'compliance')
      .map((tc) => tc.id),
    preconditions: ['Regulatory requirements checklist is available'],
    tags: ['compliance', 'legal'],
  });

  return scenarios;
}

function generateTestPlan(
  analysis: PageAnalysisResult,
  insights: AnalyzedInsights,
  allTestCases: TestCase[],
): TestPlan {
  const url = analysis.url;
  const testTypes: TestType[] = [
    'functional', 'smoke', 'regression', 'ad-hoc',
    'accessibility', 'security', 'compliance', 'performance',
    'load', 'ui', 'api', 'uat',
  ];

  const testTypeCounts = testTypes.map(
    (type) =>
      `${type.charAt(0).toUpperCase() + type.slice(1)}: ${allTestCases.filter((tc) => tc.type === type).length}`,
  );

  const tags = [
    ...new Set(allTestCases.flatMap((tc) => tc.tags)),
  ];

  return {
    id: nextId('TP'),
    title: `Test Plan - ${analysis.metadata.title || url}`,
    version: '1.0',
    createdAt: new Date().toISOString(),
    targetUrl: url,
    scope: `This test plan covers comprehensive testing of the webpage at ${url}. The scope includes functional testing, UI validation, accessibility compliance, security assessment, performance evaluation, and cross-browser compatibility. Total test cases: ${allTestCases.length} across ${testTypes.length} test types.`,
    outOfScope: [
      'Backend API testing beyond page interactions',
      'Database performance and schema validation',
      'Third-party service integration testing (beyond UI)',
      'Infrastructure and deployment testing',
      'Mobile native application testing (browser-only)',
    ],
    objectives: [
      'Verify all page functionality works as expected',
      'Ensure the page is accessible to users with disabilities',
      'Validate security best practices are followed',
      'Confirm the page renders correctly across browsers',
      'Assess page performance and load handling',
      'Verify compliance with relevant regulations',
      `Achieve ${Math.min(insights.estimatedTestCoverage + 20, 95)}% test coverage target`,
      'Identify critical defects before production release',
    ],
    testTypes,
    environment: 'Browser: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)\n' +
      'Resolution: 1920x1080 (desktop), 768x1024 (tablet), 375x667 (mobile)\n' +
      'Network: Broadband (50 Mbps), Throttled 3G (1.5 Mbps)\n' +
      'OS: Windows 10/11, macOS 14, iOS 17, Android 14',
    testDataStrategy: 'Test data will be generated per test case requirements. Forms will use synthetic test data. No production or PII data should be used.',
    entryCriteria: [
      'Target URL is accessible and returns HTTP 200',
      'Test environment is provisioned and configured',
      'Required test tools are installed (Playwright, browser drivers)',
      'Test data is prepared',
      'All stakeholders have approved the test plan',
    ],
    exitCriteria: [
      'All critical and high-priority test cases pass',
      'Test coverage threshold (85%) is met',
      'No open blocker or critical defects',
      'Accessibility violations are documented and addressed',
      'Performance metrics meet SLAs',
      'Test summary report is published',
    ],
    deliverables: [
      'Test cases document (.md / .json)',
      'Test scenarios document',
      'Test plan document',
      'Requirements Traceability Matrix (RTM)',
      'Playwright test scripts (.js)',
      'Test execution report',
      'Defect report (if any found)',
    ],
    risksAndMitigations: [
      {
        risk: 'Target page may change during testing',
        mitigation: 'Take a snapshot/baseline at the start; document version tested',
      },
      {
        risk: 'Forms may require valid backend data',
        mitigation: 'Coordinate with development team for test accounts or mock data',
      },
      {
        risk: 'Performance tests may be affected by network conditions',
        mitigation: 'Run performance tests in controlled environment; use relative comparisons',
      },
      {
        risk: 'Security tests may trigger alerts',
        mitigation: 'Coordinate with security team; obtain written authorization',
      },
    ],
    schedule: [
      {
        phase: 'Test Planning',
        duration: '1 day',
        activities: [
          'Review page analysis results',
          'Define test scope and objectives',
          'Prepare test data',
        ],
      },
      {
        phase: 'Test Development',
        duration: '2-3 days',
        activities: [
          'Create and review test cases',
          'Generate Playwright test scripts',
          'Set up test environment',
        ],
      },
      {
        phase: 'Test Execution',
        duration: '2-3 days',
        activities: [
          'Execute smoke and functional tests',
          'Run regression test suite',
          'Perform security and accessibility testing',
          'Execute performance and load tests',
        ],
      },
      {
        phase: 'Test Reporting',
        duration: '1 day',
        activities: [
          'Analyze test results',
          'Document defects',
          'Generate test summary report',
          'Present findings to stakeholders',
        ],
      },
    ],
    rolesAndResponsibilities: [
      {
        role: 'QA Engineer',
        responsibility: 'Test case creation, execution, defect reporting',
      },
      {
        role: 'Automation Engineer',
        responsibility: 'Playwright script development and maintenance',
      },
      {
        role: 'Security Specialist',
        responsibility: 'Security test review and advanced security testing',
      },
      {
        role: 'Product Owner',
        responsibility: 'UAT validation and sign-off',
      },
    ],
    assumptions: [
      'Target URL is stable and accessible throughout testing',
      'Test environment mirrors production configuration',
      'All required test tools are available and licensed',
      'Development team is available to resolve blocking issues',
    ],
    dependencies: [
      'Page must be deployed to a testable environment',
      'Test data / credentials must be provisioned',
      'Required browser versions must be installed',
      'Network access to target URL and CDN resources',
    ],
    toolsAndFrameworks: [
      'Playwright (test automation framework)',
      'Accessibility tools (axe-core, WAVE, Lighthouse)',
      'Browser DevTools (performance, network analysis)',
      'Load testing tool (k6, Artillery, or equivalent)',
      'API testing tool (Postman, curl)',
    ],
    defectManagement: 'Defects will be logged with: title, description, steps to reproduce, expected vs actual result, severity (blocker/critical/major/minor/trivial), priority (critical/high/medium/low), environment details, screenshots/logs. Severity-Priority matrix: Blocker/Critical = fix immediately, Major/High = fix within sprint, Minor/Medium = fix in next sprint, Trivial/Low = backlog.',
    communicationPlan: 'Daily standup updates during execution phase. Weekly status report to stakeholders. Immediate notification for blocker/critical defects. Final test summary report at conclusion.',
  };
}

function generateRtm(
  allTestCases: TestCase[],
  analysis: PageAnalysisResult,
): RtmEntry[] {
  const entries: RtmEntry[] = [];

  const reqMap: Record<string, { desc: string; type: 'functional' | 'non-functional' | 'regression' }> = {
    'REQ-001': { desc: 'Page loads successfully with correct content', type: 'functional' },
    'REQ-002': { desc: 'Navigation links work correctly', type: 'functional' },
    'REQ-003': { desc: 'Forms validate and submit correctly', type: 'functional' },
    'REQ-004': { desc: 'Authentication works (if applicable)', type: 'functional' },
    'REQ-005': { desc: 'Buttons trigger correct actions', type: 'functional' },
    'REQ-006': { desc: 'Page is keyboard accessible', type: 'non-functional' },
    'REQ-007': { desc: 'Images have alt text', type: 'non-functional' },
    'REQ-008': { desc: 'Form fields have labels', type: 'non-functional' },
    'REQ-009': { desc: 'Page uses HTTPS', type: 'non-functional' },
    'REQ-010': { desc: 'External links are secure (noopener)', type: 'non-functional' },
    'REQ-011': { desc: 'Page is GDPR compliant (cookie notice, privacy)', type: 'non-functional' },
    'REQ-012': { desc: 'Page loads within performance thresholds', type: 'non-functional' },
    'REQ-013': { desc: 'Page is responsive across devices', type: 'non-functional' },
    'REQ-014': { desc: 'Page has proper HTML structure (doctype, lang)', type: 'non-functional' },
    'REQ-015': { desc: 'Page handles concurrent users', type: 'non-functional' },
    'REQ-016': { desc: 'UI renders correctly (layout, alignment)', type: 'functional' },
    'REQ-017': { desc: 'API endpoints respond correctly', type: 'functional' },
    'REQ-018': { desc: 'Page meets business requirements', type: 'functional' },
    'REQ-019': { desc: 'Error handling is user-friendly', type: 'functional' },
    'REQ-020': { desc: 'Page has proper heading hierarchy', type: 'non-functional' },
  };

  for (const [reqId, req] of Object.entries(reqMap)) {
    let matchingTests: string[] = [];

    const keywords = req.desc.toLowerCase().split(' ');
    const relevantKeywords = keywords.filter(
      (k) => k.length > 3 && !['with', 'that', 'have', 'across', 'within', 'their', 'works'].includes(k),
    );

    for (const tc of allTestCases) {
      const combined = `${tc.title} ${tc.description} ${tc.tags.join(' ')}`.toLowerCase();
      const matches = relevantKeywords.filter((kw) => combined.includes(kw));
      if (matches.length >= 2) {
        matchingTests.push(tc.id);
      }
    }

    if (matchingTests.length > 0) {
      entries.push({
        id: nextId('RTM'),
        requirementId: reqId,
        requirementDescription: req.desc,
        testCaseIds: matchingTests.slice(0, 5),
        coverageType: req.type,
        status: matchingTests.length >= 2 ? 'covered' : 'partial',
      });
    }
  }

  const uncoveredReqs = Object.entries(reqMap).filter(
    ([id]) => !entries.some((e) => e.requirementId === id),
  );
  for (const [reqId, req] of uncoveredReqs) {
    entries.push({
      id: nextId('RTM'),
      requirementId: reqId,
      requirementDescription: req.desc,
      testCaseIds: [],
      coverageType: req.type,
      status: 'not-covered',
    });
  }

  return entries;
}
