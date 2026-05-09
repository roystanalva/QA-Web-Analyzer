import type { PageAnalysisResult, PageMetadata, NavigatorInfo } from './types';

function parseMetaContent(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta\\s+[^>]*property=["']og:${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractMetadata(html: string, $: any): PageMetadata {
  const title =
    ($('title').first().text() || '').trim() ||
    parseMetaContent(html, 'title');
  const description =
    parseMetaContent(html, 'description') ||
    parseMetaContent(html, 'Description');
  const charset =
    parseMetaContent(html, 'charset') ||
    (html.match(/charset=["']?([a-zA-Z0-9-]+)/i) || [])[1] ||
    '';
  const viewport = parseMetaContent(html, 'viewport');
  const language =
    ($('html').attr('lang') || $('html').attr('xml:lang') || '').trim();
  const robots = parseMetaContent(html, 'robots');
  const canonicalUrl =
    $('link[rel="canonical"]').attr('href') || '';
  const ogTitle =
    $('meta[property="og:title"]').attr('content') || '';
  const ogDescription =
    $('meta[property="og:description"]').attr('content') || '';
  const ogImage =
    $('meta[property="og:image"]').attr('content') || '';
  const keywords = parseMetaContent(html, 'keywords');
  const author = parseMetaContent(html, 'author');
  const favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '';

  return {
    title,
    description,
    charset,
    viewport,
    language,
    robots,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    keywords,
    author,
    favicon,
  };
}

function extractLinks(html: string, $: any, baseUrl: string) {
  const links: any[] = [];
  const baseHost = new URL(baseUrl).hostname;

  $('a[href]').each((_: number, el: any) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().substring(0, 100);
    const rel = $(el).attr('rel') || '';

    if (!href || href === '#') return;

    let type: string;
    try {
      const url = new URL(href, baseUrl);
      if (href.startsWith('#')) type = 'anchor';
      else if (href.startsWith('mailto:')) type = 'mailto';
      else if (href.startsWith('tel:')) type = 'tel';
      else if (href.startsWith('javascript:')) type = 'javascript';
      else if (url.hostname === baseHost) type = 'internal';
      else type = 'external';
    } catch {
      type = 'unknown';
    }

    links.push({
      href,
      text: text || '(no text)',
      type,
      isFollowed: !rel.includes('nofollow'),
    });
  });

  return links;
}

function extractForms($: any, baseUrl: string) {
  const forms: any[] = [];

  $('form').each((_: number, el: any) => {
    const $form = $(el);
    const fields: any[] = [];

    $form
      .find('input, select, textarea')
      .each((__: number, field: any) => {
        const $field = $(field);
        const tagName = (field.tagName || '').toLowerCase();
        const type = $field.attr('type') || tagName;
        const name = $field.attr('name') || '';
        const id = $field.attr('id') || '';
        const placeholder = $field.attr('placeholder') || '';
        const required =
          $field.attr('required') !== undefined ||
          $field.attr('aria-required') === 'true';
        const maxLength = $field.attr('maxlength')
          ? parseInt($field.attr('maxlength'), 10)
          : null;
        const minLength = $field.attr('minlength')
          ? parseInt($field.attr('minlength'), 10)
          : null;
        const pattern = $field.attr('pattern') || null;
        const autoComplete = $field.attr('autocomplete') || null;
        let label = '';

        if (id) {
          label = $(`label[for="${id}"]`).text().trim();
        }
        if (!label) {
          label =
            $field
              .closest('.form-group, .field, .input-group')
              .find('label')
              .first()
              .text()
              .trim() || '';
        }
        if (!label && $field.attr('aria-label')) {
          label = $field.attr('aria-label') || '';
        }

        fields.push({
          type,
          name,
          id,
          placeholder,
          label,
          required,
          maxLength,
          minLength,
          pattern,
          autoComplete,
        });
      });

    const submitBtn = $form.find('button[type="submit"], input[type="submit"]').first();
    const submitText = submitBtn.text().trim() || submitBtn.attr('value') || 'Submit';

    forms.push({
      action: $form.attr('action') || baseUrl,
      method: ($form.attr('method') || 'get').toUpperCase(),
      id: $form.attr('id') || '',
      name: $form.attr('name') || '',
      fields,
      submitButtonText: submitText,
      hasValidation: fields.some((f: any) => f.required || f.pattern),
      hasFileUpload: fields.some((f: any) => f.type === 'file'),
    });
  });

  return forms;
}

function extractButtons($: any) {
  const buttons: any[] = [];

  $(
    'button, input[type="button"], input[type="submit"], [role="button"]',
  ).each((_: number, el: any) => {
    const $el = $(el);
    const tagName = (el.tagName || '').toLowerCase();

    let text = $el.text().trim();
    if (!text && tagName === 'input') {
      text = $el.attr('value') || '';
    }
    if (!text) text = $el.attr('aria-label') || '(icon button)';

    buttons.push({
      text: text.substring(0, 80),
      type:
        $el.attr('type') ||
        (tagName === 'button' ? 'button' : 'submit'),
      id: $el.attr('id') || '',
      class: $el.attr('class') || '',
      isDisabled: $el.attr('disabled') !== undefined,
      ariaLabel: $el.attr('aria-label') || '',
    });
  });

  return buttons;
}

function extractTables($: any) {
  const tables: any[] = [];

  $('table').each((_: number, el: any) => {
    const $table = $(el);
    const headers: string[] = [];

    $table.find('th').each((__: number, th: any) => {
      headers.push($(th).text().trim());
    });

    const rows = $table.find('tr').length;
    const cols = headers.length || ($table.find('tr').first().find('td, th').length || 0);

    tables.push({
      caption: $table.find('caption').text().trim() || '',
      headers,
      rowCount: rows,
      columnCount: cols,
      hasSummary: $table.attr('summary') !== undefined,
    });
  });

  return tables;
}

function extractImages($: any) {
  const images: any[] = [];

  $('img').each((_: number, el: any) => {
    const $img = $(el);
    const alt = $img.attr('alt') || '';
    images.push({
      src: $img.attr('src') || '',
      alt,
      width: $img.attr('width') || '',
      height: $img.attr('height') || '',
      hasAlt: alt !== undefined,
      isDecorative: alt === '',
    });
  });

  return images;
}

function extractNavElements($: any) {
  const navs: any[] = [];

  $('nav, [role="navigation"]').each((_: number, el: any) => {
    const $el = $(el);
    const label =
      $el.attr('aria-label') ||
      $el.attr('title') ||
      `nav-${navs.length + 1}`;
    navs.push({
      type: (el.tagName || '').toLowerCase(),
      label,
      items: $el.find('a').length,
    });
  });

  return navs;
}

function extractAccessibility($: any) {
  const images = $('img');
  let missingAlt = 0;
  let withAlt = 0;

  images.each((_: number, el: any) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null) missingAlt++;
    else withAlt++;
  });

  const formFields = $('input, select, textarea');
  let labelsMissing = 0;

  formFields.each((_: number, el: any) => {
    const $el = $(el);
    const id = $el.attr('id');
    if (id) {
      if (!$(`label[for="${id}"]`).length && !$el.attr('aria-label')) {
        labelsMissing++;
      }
    } else if (!$el.attr('aria-label') && !$el.closest('label').length) {
      labelsMissing++;
    }
  });

  const contrastWarnings: string[] = [];
  $('[style*="color"]').each((_: number, el: any) => {
    const style = $(el).attr('style') || '';
    if (
      style.includes('color: #') &&
      !style.includes('background')
    ) {
      contrastWarnings.push(
        `Element with color set without background: "${$(el).text().trim().substring(0, 40)}"`,
      );
    }
  });

  const landmarks = new Set<string>();
  $(
    'header, footer, main, nav, aside, section, article, [role="banner"], [role="contentinfo"], [role="main"], [role="complementary"], [role="region"]',
  ).each((_: number, el: any) => {
    const tag = (el.tagName || '').toLowerCase();
    const role = $(el).attr('role') || tag;
    landmarks.add(role);
  });

  const headingLevels: number[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_: number, el: any) => {
    headingLevels.push(
      parseInt((el.tagName || '').toUpperCase().replace('H', ''), 10),
    );
  });

  const headingGapWarnings: string[] = [];
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      headingGapWarnings.push(
        `Heading gap: h${headingLevels[i - 1]} → h${headingLevels[i]}`,
      );
    }
  }

  return {
    ariaLabelCount: $('[aria-label]').length,
    ariaRoleCount: $('[role]').length,
    missingAltText: missingAlt,
    imagesWithAlt: withAlt,
    totalImages: images.length,
    hasSkipNav: $('[href="#main"], [href="#content"], .skip-link, .skip-to-content').length > 0,
    hasLanguageDeclaration: $('[lang]').length > 0,
    hasTitle: $('title').length > 0,
    formLabelsMissing: labelsMissing,
    totalForms: $('form').length,
    hasFocusableElements:
      $('a[href], button, input, select, textarea, [tabindex]').length > 0,
    contrastWarnings: contrastWarnings.slice(0, 10),
    landmarkElements: [...landmarks],
    headingGapWarnings: headingGapWarnings.slice(0, 10),
  };
}

function extractPerformance($: any) {
  const scripts = $('script');
  let externalScripts = 0;
  let inlineScripts = 0;

  scripts.each((_: number, el: any) => {
    if ($(el).attr('src')) externalScripts++;
    else inlineScripts++;
  });

  const styles = $('link[rel="stylesheet"]').length;
  const domElements = $('*').length;

  const recommendations: string[] = [];
  if (domElements > 1500) recommendations.push('Large DOM size (>1500 elements) - consider virtualization or lazy rendering');
  if (externalScripts > 15) recommendations.push(`High number of external scripts (${externalScripts}) - consider bundling and deferring`);
  if (styles > 5) recommendations.push(`Multiple external stylesheets (${styles}) - consider consolidating`);
  if ($('img[loading="lazy"]').length < $('img').length * 0.5 && $('img').length > 10) {
    recommendations.push('Consider adding lazy loading to below-the-fold images');
  }

  return {
    externalScripts,
    inlineScripts,
    externalStyles: styles,
    totalImages: $('img').length,
    totalRequests: externalScripts + styles + $('img').length,
    domElements,
    hasRenderBlocking: externalScripts > 5,
    hasLargeDom: domElements > 2000,
    recommendations,
  };
}

function extractSecurity($: any, baseUrl: string) {
  const hasForm = $('form').length > 0;
  const formActions: { action: string; isExternal: boolean }[] = [];
  const baseHost = new URL(baseUrl).hostname;

  $('form[action]').each((_: number, el: any) => {
    const action = $(el).attr('action') || '';
    try {
      const actionUrl = new URL(action, baseUrl);
      formActions.push({
        action,
        isExternal: actionUrl.hostname !== baseHost,
      });
    } catch {
      formActions.push({ action, isExternal: false });
    }
  });

  const externalLinks = $(
    `a[href^="http"]:not([href*="${baseHost}"])`,
  );
  let noReferrer = 0;
  externalLinks.each((_: number, el: any) => {
    const rel = $(el).attr('rel') || '';
    if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
      noReferrer++;
    }
  });

  const emails: string[] = [];
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/g;
  const textContent = $('body').text();
  let match;
  while ((match = emailRegex.exec(textContent)) !== null) {
    if (!match[1].includes('.png') && !match[1].includes('.jpg')) {
      emails.push(match[1]);
    }
  }

  const hasInlineScripts = $('script:not([src])').length > 0;
  const recommendations: string[] = [];

  if (!baseUrl.startsWith('https')) {
    recommendations.push('Page is not served over HTTPS');
  }
  if (hasForm && formActions.some((f) => f.isExternal)) {
    recommendations.push('Form submits to external domain - verify security implications');
  }
  if (noReferrer > 0) {
    recommendations.push(`${noReferrer} external links missing rel="noopener noreferrer"`);
  }
  if (hasInlineScripts) {
    recommendations.push('Inline scripts detected - consider CSP implementation');
  }

  return {
    usesHttps: baseUrl.startsWith('https'),
    hasForm,
    formActions,
    externalLinks: externalLinks.length,
    externalLinksNoReferrer: noReferrer,
    inlineScripts: $('script:not([src])').length,
    hasIframe: $('iframe').length > 0,
    iframeSandbox: $('iframe[sandbox]').length > 0,
    hasDataUris: htmlContainsDataUris($),
    hasCsp: false,
    exposedEmails: [...new Set(emails)],
    recommendations,
  };
}

function htmlContainsDataUris($: any): boolean {
  let found = false;
  $('[src], [href], style').each((_: number, el: any) => {
    const val =
      $(el).attr('src') ||
      $(el).attr('href') ||
      $(el).text() ||
      '';
    if (val.includes('data:')) found = true;
  });
  return found;
}

function extractCompliance($: any, html: string) {
  return {
    hasDoctype: html.trim().startsWith('<!DOCTYPE') || html.trim().startsWith('<!doctype'),
    hasLangAttribute: $('html').attr('lang') !== undefined,
    hasCharsetDeclaration:
      $('meta[charset]').length > 0 ||
      $('meta[http-equiv="Content-Type"]').length > 0,
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    hasRobotsMeta: $('meta[name="robots"]').length > 0,
    hasPrivacyLink:
      $('a[href*="privacy"], a[href*="privacy-policy"], a[href*="datenschutz"]').length > 0,
    hasTermsLink:
      $('a[href*="terms"], a[href*="conditions"], a[href*="tos"], a[href*="agreement"]').length > 0,
    hasCookieNotice:
      $('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]').length > 0,
    hasAccessibilityStatement:
      $('a[href*="accessibility"], a[href*="a11y"]').length > 0,
    hasSitemap:
      $('link[rel="sitemap"]').length > 0 ||
      $('a[href*="sitemap"]').length > 0,
    hasFavicon: $('link[rel*="icon"]').length > 0,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    hasOpenGraph:
      $('meta[property^="og:"]').length > 0,
  };
}

interface CheerioStatic {
  (selector: string): any;
  html(): string;
}

export async function crawlPage(url: string): Promise<PageAnalysisResult> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  let html: string;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    html = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const loadTimeMs = Date.now() - startTime;

  const cheerio = require('cheerio');
  const $: CheerioStatic = cheerio.load(html);

  const metadata = extractMetadata(html, $);
  const headings: any[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_: number, el: any) => {
    headings.push({
      level: parseInt((el.tagName || '').toUpperCase().replace('H', ''), 10),
      text: $(el).text().trim().substring(0, 120),
    });
  });

  const links = extractLinks(html, $, url);
  const forms = extractForms($, url);
  const buttons = extractButtons($);
  const tables = extractTables($);
  const images = extractImages($);
  const navElements = extractNavElements($);
  const accessibility = extractAccessibility($);
  const performance = extractPerformance($);
  const security = extractSecurity($, url);
  const compliance = extractCompliance($, html);

  const wordCount = ($('body').text().match(/\S+/g) || []).length;
  const paragraphCount = $('p').length;
  const listCount = $('ul, ol').length;
  const iframeCount = $('iframe').length;

  const semanticElements: string[] = [];
  $(
    'header, footer, main, nav, aside, article, section, figure, figcaption, details, summary, mark, time',
  ).each((_: number, el: any) => {
    const tag = (el.tagName || '').toLowerCase();
    if (!semanticElements.includes(tag)) semanticElements.push(tag);
  });

  return {
    url,
    statusCode: response.status,
    loadTimeMs,
    metadata,
    headings,
    links,
    forms,
    buttons,
    tables,
    images,
    navElements,
    accessibility,
    performance,
    security,
    compliance,
    wordCount,
    paragraphCount,
    listCount,
    iframeCount,
    semanticElements,
    navigator: { userAgent: '', platform: '' },
  };
}
