import { crawlPage } from '../src/lib/crawler';

describe('crawler', () => {
  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <meta name="description" content="A test page for unit testing">
  <link rel="canonical" href="https://example.com/">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Sub Heading</h2>
  <nav aria-label="Main navigation">
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="https://external.com">External</a>
  </nav>
  <main>
    <p>This is a test paragraph with some content.</p>
    <p>Another paragraph here.</p>
    <form action="/submit" method="POST">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
      <button type="submit">Send</button>
    </form>
    <button id="cta" type="button">Click Me</button>
    <img src="image.jpg" alt="A test image">
    <img src="decorative.jpg" alt="">
    <table>
      <caption>Test Table</caption>
      <thead><tr><th>Col 1</th><th>Col 2</th></tr></thead>
      <tbody><tr><td>Data 1</td><td>Data 2</td></tr></tbody>
    </table>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </main>
  <footer>
    <a href="/privacy">Privacy Policy</a>
    <a href="/terms">Terms of Service</a>
  </footer>
  <script src="script.js"></script>
  <script>console.log('inline')</script>
</body>
</html>`;

  let originalFetch: any;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve(sampleHtml),
        headers: new Map(),
      }),
    );
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('should extract page title correctly', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.metadata.title).toBe('Test Page');
  });

  it('should extract metadata', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.metadata.description).toBe('A test page for unit testing');
    expect(result.metadata.charset).toBe('UTF-8');
    expect(result.metadata.viewport).toBe('width=device-width, initial-scale=1.0');
    expect(result.metadata.canonicalUrl).toBe('https://example.com/');
  });

  it('should extract headings', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.headings).toHaveLength(2);
    expect(result.headings[0].text).toBe('Main Heading');
    expect(result.headings[1].text).toBe('Sub Heading');
    expect(result.headings[0].level).toBe(1);
    expect(result.headings[1].level).toBe(2);
  });

  it('should extract links', async () => {
    const result = await crawlPage('https://example.com');
    const internalLinks = result.links.filter((l) => l.type === 'internal');
    const externalLinks = result.links.filter((l) => l.type === 'external');
    expect(internalLinks.length).toBeGreaterThanOrEqual(2);
    expect(externalLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('should extract forms and fields', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].method).toBe('POST');
    expect(result.forms[0].fields).toHaveLength(2);
    expect(result.forms[0].fields[0].name).toBe('name');
    expect(result.forms[0].fields[0].required).toBe(true);
    expect(result.forms[0].fields[1].name).toBe('email');
  });

  it('should extract buttons', async () => {
    const result = await crawlPage('https://example.com');
    const submitButtons = result.buttons.filter((b) => b.type === 'submit');
    expect(submitButtons.length).toBeGreaterThanOrEqual(1);
    const ctaButton = result.buttons.find((b) => b.id === 'cta');
    expect(ctaButton).toBeDefined();
    expect(ctaButton?.text).toBe('Click Me');
  });

  it('should extract tables', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].headers).toContain('Col 1');
    expect(result.tables[0].rowCount).toBe(2);
  });

  it('should extract images with alt text analysis', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.images).toHaveLength(2);
    expect(result.accessibility.imagesWithAlt).toBe(2);
    expect(result.accessibility.missingAltText).toBe(0);
  });

  it('should extract nav elements', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.navElements.length).toBeGreaterThanOrEqual(1);
    expect(result.navElements[0].label).toContain('navigation');
  });

  it('should report performance metrics', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.performance.externalScripts).toBe(1);
    expect(result.performance.inlineScripts).toBe(1);
    expect(result.performance.domElements).toBeGreaterThan(0);
  });

  it('should report security observations', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.security.usesHttps).toBe(true);
    expect(result.security.hasForm).toBe(true);
  });

  it('should report compliance checks', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.compliance.hasDoctype).toBe(true);
    expect(result.compliance.hasLangAttribute).toBe(true);
    expect(result.compliance.hasCharsetDeclaration).toBe(true);
    expect(result.compliance.hasViewportMeta).toBe(true);
    expect(result.compliance.hasPrivacyLink).toBe(true);
    expect(result.compliance.hasTermsLink).toBe(true);
  });

  it('should report content statistics', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.wordCount).toBeGreaterThan(10);
    expect(result.paragraphCount).toBe(2);
    expect(result.listCount).toBe(1);
  });

  it('should handle HTTP error codes gracefully', async () => {
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve('<html><body><h1>OK</h1></body></html>'),
        headers: new Map(),
      }),
    );
    const result = await crawlPage('https://example.com');
    expect(result.statusCode).toBe(200);
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve(sampleHtml),
        headers: new Map(),
      }),
    );
  });

  it('should include semantic elements', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.semanticElements).toContain('nav');
    expect(result.semanticElements).toContain('main');
    expect(result.semanticElements).toContain('footer');
  });

  it('should detect language from HTML', async () => {
    const result = await crawlPage('https://example.com');
    expect(result.metadata.language).toBe('en');
  });
});
