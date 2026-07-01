import type { NextApiRequest, NextApiResponse } from 'next';
import type { AnalyzeResponse } from '@/lib/types';
import { crawlPage } from '@/lib/crawler';
import { analyzePage } from '@/lib/analyzer';
import { generateArtifacts } from '@/lib/artifact-generator';
import { generateAllExports } from '@/lib/export-pipeline';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: { sizeLimit: '1mb' },
  },
};

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeUrl(str: string): string {
  let url = str.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>,
) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Use POST.`,
    });
  }

  try {
    const rawUrl = req.body?.url || '';
    const url = sanitizeUrl(rawUrl);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required. Please provide a valid webpage URL.',
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid URL format. URL must start with http:// or https:// and be a valid address.',
      });
    }

    console.log(`[Analyze] Starting analysis for: ${url}`);

    const analysis = await crawlPage(url);
    console.log(`[Analyze] Crawl completed in ${analysis.loadTimeMs}ms`);

    const insights = analyzePage(analysis);
    console.log(`[Analyze] Analysis completed. Page type: ${insights.pageType}`);

    const accessibilityErrors = insights.accessibilityErrors || [];
    const issues = insights.issues || [];
    if (accessibilityErrors.length > 0) {
      const critical = accessibilityErrors.filter((e) => e.severity === 'critical').length;
      const warnings = accessibilityErrors.filter((e) => e.severity === 'warning').length;
      console.log(`[Analyze] Accessibility issues: ${critical} critical, ${warnings} warnings`);
    }
    if (issues.length > 0) {
      console.log(`[Analyze] Detailed issues generated: ${issues.length}`);
    }

    const artifacts = generateArtifacts(analysis);
    console.log(
      `[Analyze] Artifacts generated: ${artifacts.testCases.length} test cases, ${artifacts.scenarios.length} scenarios`,
    );

    const exports = generateAllExports(
      analysis,
      insights,
      artifacts.testCases,
      artifacts.scenarios,
      artifacts.testPlan,
      artifacts.rtm,
    );
    console.log(
      `[Analyze] Export files: ${exports.markdown.length} md, ${exports.json.length} json, ${exports.playwright.length} playwright files`,
    );

    const totalTime = Date.now() - startTime;
    console.log(`[Analyze] Total processing time: ${totalTime}ms`);

    return res.status(200).json({
      success: true,
      analysis,
      artifacts,
      exports,
      accessibilityErrors,
      issues,
    });
  } catch (error: any) {
    const message = error?.message || 'An unknown error occurred';
    const statusCode =
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('aborted')
        ? 502
        : message.includes('timeout') || message.includes('TIMEOUT')
          ? 504
          : 500;

    console.error(`[Analyze] Error (${statusCode}):`, message);

    return res.status(statusCode).json({
      success: false,
      error: getErrorMessage(message, statusCode),
    });
  }
}

function getErrorMessage(message: string, statusCode: number): string {
  if (message.includes('ENOTFOUND')) {
    return `Could not resolve the domain name. Please check that the URL is correct and the domain exists.`;
  }
  if (message.includes('ECONNREFUSED')) {
    return `Connection refused by the server at the target URL. The server may be down or blocking requests.`;
  }
  if (message.includes('aborted') || message.includes('timeout') || message.includes('TIMEOUT')) {
    return `Request timed out. The page took too long to respond (over 30 seconds). Try a simpler or faster-loading URL.`;
  }
  if (message.includes('certificate') || message.includes('SSL') || message.includes('CERT')) {
    return `SSL/TLS certificate error. The target site has an invalid or self-signed certificate.`;
  }
  if (message.includes('ECONNRESET')) {
    return `Connection was reset by the server. The target server may have closed the connection unexpectedly.`;
  }
  if (statusCode === 502) {
    return `Could not reach the target URL. ${message}`;
  }
  return `Analysis failed: ${message}`;
}
