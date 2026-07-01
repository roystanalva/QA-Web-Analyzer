export type TestType =
  | 'functional'
  | 'smoke'
  | 'regression'
  | 'ad-hoc'
  | 'accessibility'
  | 'security'
  | 'compliance'
  | 'performance'
  | 'load'
  | 'ui'
  | 'api'
  | 'uat';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Severity = 'blocker' | 'critical' | 'major' | 'minor' | 'trivial';

export interface TestCase {
  id: string;
  type: TestType;
  title: string;
  description: string;
  preconditions: string[];
  testData: string;
  steps: string[];
  expectedResults: string[];
  priority: Priority;
  severity: Severity;
  tags: string[];
  estimatedDuration: string;
}

export interface TestScenario {
  id: string;
  title: string;
  description: string;
  type: TestType;
  relatedTestCases: string[];
  preconditions: string[];
  tags: string[];
}

export interface RtmEntry {
  id: string;
  requirementId: string;
  requirementDescription: string;
  testCaseIds: string[];
  coverageType: 'functional' | 'non-functional' | 'regression';
  status: 'covered' | 'partial' | 'not-covered';
}

export interface TestPlan {
  id: string;
  title: string;
  version: string;
  createdAt: string;
  targetUrl: string;
  scope: string;
  outOfScope: string[];
  objectives: string[];
  testTypes: TestType[];
  environment: string;
  testDataStrategy: string;
  entryCriteria: string[];
  exitCriteria: string[];
  deliverables: string[];
  risksAndMitigations: { risk: string; mitigation: string }[];
  schedule: { phase: string; duration: string; activities: string[] }[];
  rolesAndResponsibilities: { role: string; responsibility: string }[];
  assumptions: string[];
  dependencies: string[];
  toolsAndFrameworks: string[];
  defectManagement: string;
  communicationPlan: string;
}

export interface PageHeading {
  level: number;
  text: string;
}

export interface PageLink {
  href: string;
  text: string;
  type: 'internal' | 'external' | 'anchor' | 'mailto' | 'tel' | 'javascript' | 'unknown';
  isFollowed: boolean;
}

export interface FormField {
  type: string;
  name: string;
  id: string;
  placeholder: string;
  label: string;
  required: boolean;
  maxLength: number | null;
  minLength: number | null;
  pattern: string | null;
  autoComplete: string | null;
}

export interface FormInfo {
  action: string;
  method: string;
  id: string;
  name: string;
  fields: FormField[];
  submitButtonText: string;
  hasValidation: boolean;
  hasFileUpload: boolean;
}

export interface ButtonInfo {
  text: string;
  type: 'button' | 'submit' | 'reset';
  id: string;
  class: string;
  isDisabled: boolean;
  ariaLabel: string;
}

export interface TableInfo {
  caption: string;
  headers: string[];
  rowCount: number;
  columnCount: number;
  hasSummary: boolean;
}

export interface ImageInfo {
  src: string;
  alt: string;
  width: string;
  height: string;
  hasAlt: boolean;
  isDecorative: boolean;
}

export interface NavElement {
  type: string;
  label: string;
  items: number;
}

export interface AccessibilitySignals {
  ariaLabelCount: number;
  ariaRoleCount: number;
  missingAltText: number;
  imagesWithAlt: number;
  totalImages: number;
  hasSkipNav: boolean;
  hasLanguageDeclaration: boolean;
  hasTitle: boolean;
  formLabelsMissing: number;
  totalForms: number;
  hasFocusableElements: boolean;
  contrastWarnings: string[];
  landmarkElements: string[];
  headingGapWarnings: string[];
}

export interface PerformanceHints {
  externalScripts: number;
  inlineScripts: number;
  externalStyles: number;
  totalImages: number;
  totalRequests: number;
  domElements: number;
  hasRenderBlocking: boolean;
  hasLargeDom: boolean;
  recommendations: string[];
}

export interface SecurityObservations {
  usesHttps: boolean;
  hasForm: boolean;
  formActions: { action: string; isExternal: boolean }[];
  externalLinks: number;
  externalLinksNoReferrer: number;
  inlineScripts: number;
  hasIframe: boolean;
  iframeSandbox: boolean;
  hasDataUris: boolean;
  hasCsp: boolean;
  exposedEmails: string[];
  recommendations: string[];
}

export interface ComplianceChecks {
  hasDoctype: boolean;
  hasLangAttribute: boolean;
  hasCharsetDeclaration: boolean;
  hasViewportMeta: boolean;
  hasRobotsMeta: boolean;
  hasPrivacyLink: boolean;
  hasTermsLink: boolean;
  hasCookieNotice: boolean;
  hasAccessibilityStatement: boolean;
  hasSitemap: boolean;
  hasFavicon: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
}

export interface PageMetadata {
  title: string;
  description: string;
  charset: string;
  viewport: string;
  language: string;
  robots: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
  author: string;
  favicon: string;
}

export interface NavigatorInfo {
  userAgent: string;
  platform: string;
}

export interface PageAnalysisResult {
  url: string;
  statusCode: number;
  loadTimeMs: number;
  metadata: PageMetadata;
  headings: PageHeading[];
  links: PageLink[];
  forms: FormInfo[];
  buttons: ButtonInfo[];
  tables: TableInfo[];
  images: ImageInfo[];
  navElements: NavElement[];
  accessibility: AccessibilitySignals;
  performance: PerformanceHints;
  security: SecurityObservations;
  compliance: ComplianceChecks;
  wordCount: number;
  paragraphCount: number;
  listCount: number;
  iframeCount: number;
  semanticElements: string[];
  navigator: NavigatorInfo;
}

export interface GeneratedArtifacts {
  testCases: TestCase[];
  scenarios: TestScenario[];
  testPlan: TestPlan;
  rtm: RtmEntry[];
}

export interface ExportFiles {
  markdown: { filename: string; content: string }[];
  json: { filename: string; content: string }[];
  playwright: { filename: string; content: string }[];
  html: { filename: string; content: string }[];
}

export interface AnalyzeResponse {
  success: boolean;
  error?: string;
  analysis?: PageAnalysisResult;
  artifacts?: GeneratedArtifacts;
  exports?: ExportFiles;
  accessibilityErrors?: AccessibilityError[];
  issues?: Issue[];
}

export interface AccessibilityError {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  element?: string;
  wcag?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  wcag?: string;
  steps: string[];
  expectedResult: string;
  actualResult: string;
  affectedElement?: string;
  recommendation: string;
}
