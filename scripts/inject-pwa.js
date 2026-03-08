/**
 * Post-build script to inject PWA meta tags into dist/index.html.
 * Expo Metro bundler does not natively inject manifest link or
 * Apple PWA meta tags, so we do it after build.
 */
const fs = require('fs');
const path = require('path');

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distHtml)) {
  console.error('dist/index.html not found. Run `npx expo export --platform web` first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf-8');

const pwaTags = `
    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="BURO.">
    <link rel="apple-touch-icon" href="pwa-icon-192.png">`;

// Inject before </head>
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', pwaTags + '\n  </head>');
  fs.writeFileSync(distHtml, html, 'utf-8');
  console.log('PWA meta tags injected into dist/index.html');
} else {
  console.log('PWA meta tags already present');
}
