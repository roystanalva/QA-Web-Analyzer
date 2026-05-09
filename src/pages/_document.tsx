import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="QA Web Analyzer - Generate test cases, scenarios, test plans, RTM, and Playwright scripts from any webpage URL" />
        <meta name="theme-color" content="#0f172a" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
