/**
 * Post-build script to inject PWA meta tags into dist/index.html.
 * Expo Metro bundler does not natively inject manifest link or
 * Apple PWA meta tags, so we do it after build.
 */
const fs = require('fs');
const path = require('path');

// Read baseUrl from app.json
const appJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf-8'),
);
const baseUrl = appJson?.expo?.experiments?.baseUrl || '';

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distHtml)) {
  console.error('dist/index.html not found. Run `npx expo export --platform web` first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf-8');

const pwaTags = `
    <!-- PWA -->
    <link rel="manifest" href="${baseUrl}/manifest.json">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="BURO.">
    <link rel="apple-touch-icon" href="${baseUrl}/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="${baseUrl}/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="${baseUrl}/pwa-icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="${baseUrl}/pwa-icon-512.png">`;

// 1. Add viewport-fit=cover to viewport meta tag (required for black-translucent status bar)
if (html.includes('name="viewport"') && !html.includes('viewport-fit=cover')) {
  html = html.replace(
    /(<meta[^>]*name="viewport"[^>]*content="[^"]*)/,
    '$1, viewport-fit=cover',
  );
  console.log('viewport-fit=cover added');
}

// 2. Set body/html to cover full viewport with dark bg for splash,
//    then React app paints over it with the light theme.
if (!html.includes('background-color')) {
  html = html.replace(
    '<body>',
    '<body style="background-color:#0A0510;">',
  );
  console.log('Splash body background added');
}

// 2b. Make html/body/root fill full viewport including safe areas
const safeAreaCSS = `
    <style id="pwa-safe-area">
      html, body, #root {
        min-height: 100vh;
        min-height: 100dvh;
      }
    </style>`;
if (!html.includes('pwa-safe-area')) {
  html = html.replace('</head>', safeAreaCSS + '\n  </head>');
  console.log('Safe area CSS added');
}

// 3. Inject PWA meta tags before </head>
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', pwaTags + '\n  </head>');
  console.log('PWA meta tags injected (baseUrl: ' + (baseUrl || '/') + ')');
} else {
  console.log('PWA meta tags already present');
}

fs.writeFileSync(distHtml, html, 'utf-8');
console.log('dist/index.html updated');
