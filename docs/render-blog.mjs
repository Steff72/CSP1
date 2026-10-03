import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const modulePath = process.argv[2];
const { marked } = await import(modulePath ? pathToFileURL(resolve(modulePath)).href : 'marked');
const markdown = readFileSync(join(root, 'BLOG.md'), 'utf8');
const title = markdown.match(/^# (.+)$/m)[1];
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (text) => text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const readingTime = Math.ceil(markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).length / 220);
const headings = [];
let html = marked.parse(markdown, { gfm: true });
html = html.replace(/^<h1>.*?<\/h1>\s*/s, '').replace(/^<p><em>Sandro Balz.*?<\/em><\/p>\s*/s, '');
const firstParagraph = html.match(/^<p>(.*?)<\/p>\s*/s);
const lead = firstParagraph[1];
html = html.slice(firstParagraph[0].length);
html = html.replace(/<p><img[^>]+src="assets\/illustrationen\/btc-fruehindikator\.png"[^>]*><\/p>\s*<p><em>Illustration.*?<\/em><\/p>\s*/s, '');

html = html.replace(/<h2>(.*?)<\/h2>/g, (_, label) => {
  const id = slug(label);
  headings.push({ id, label });
  return `<h2 id="${id}"><span class="section-number" aria-hidden="true">${String(headings.length).padStart(2, '0')}</span>${label}</h2>`;
});

html = html.replace(/<p><a href="([^"]+)"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/a><\/p>\s*<p><em>(Abbildung.*?)<\/em><\/p>/gs,
  (_, link, source, alt, caption) => {
    const wide = /modellvergleich|feature-importance|btc-return/.test(source);
    const matrix = /confusion-matrix/.test(source);
    const data = readFileSync(join(root, source));
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    return `<figure class="chart${wide ? ' wide' : ''}${matrix ? ' matrix' : ''}"><div class="figure-frame"><a href="${link}" aria-label="Originalgrafik öffnen: ${alt}"><img src="${source}" alt="${alt}" width="${width}" height="${height}"></a></div><figcaption>${caption}<a class="original-link" href="${link}">Originalgrafik öffnen</a></figcaption></figure>`;
  });

html = html.replace(/<p><img src="(assets\/illustrationen\/[^"]+)" alt="([^"]*)"[^>]*><\/p>\s*<p><em>(Illustration.*?)<\/em><\/p>/gs,
  (_, source, alt, caption) => `<figure class="illustration"><img src="${source}" alt="${alt}" width="1300" height="360"><figcaption>${caption}</figcaption></figure>`);

html = html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
  const results = table.includes('Holdout Balanced Accuracy');
  if (results) table = table.replace(/<tr>\s*<td><strong>XGBoost \+ Bitcoin<\/strong>/g, '<tr class="selected"><td><strong>XGBoost + Bitcoin</strong>');
  return `<div class="table-wrap${results ? ' wide' : ''}" role="region" tabindex="0" aria-label="${results ? 'Vergleich der Validierungs- und Holdout-Ergebnisse' : 'Datentabelle'}">${table}</div>`;
});
html = html.replace(/<p>Alle Holdout-Werte/g, '<p class="table-note">Alle Holdout-Werte');
html = html.replace(/(\d[\d,.]*) %/g, '$1&nbsp;%');

const toc = `<details class="toc"><summary>Im Beitrag</summary><ol>${headings.map(({ id, label }) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ol></details>`;
const firstEnd = html.indexOf('</p>') + 4;
html = html.slice(0, firstEnd) + '\n' + toc + html.slice(firstEnd);

const document = `<!doctype html>
<html lang="de-CH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} · CSP1</title>
  <meta name="description" content="Unsere Time Series Challenge: Wie Bitcoin-Overnight-Daten die Richtung des QQQ-Eröffnungsgaps erklären helfen, weshalb XGBoost vorne liegt und was wir dabei gelernt haben.">
  <meta name="author" content="Sandro Balz und Stefan Binkert">
  <meta name="theme-color" content="#087c78">
  <link rel="stylesheet" href="styles.css">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23172936'/%3E%3Cpath d='M6 23L12 15L18 19L26 8' fill='none' stroke='%2362c6b5' stroke-width='3'/%3E%3C/svg%3E">
</head>
<body id="top">
  <a class="skip-link" href="#beitrag">Zum Beitrag</a>
  <div class="shell">
    <header class="masthead"><a href="#top">CSP1<span class="project-name">Time Series Challenge</span></a><p>FHNW · Data Science &amp; AI</p></header>
    <main>
      <header class="hero">
        <div>
          <p class="eyebrow">Bitcoin · QQQ · Zeitreihen</p>
          <h1>${escape(title)}</h1>
          <p class="hero-lead">${lead}</p>
          <p class="byline"><strong>Sandro Balz &amp; Stefan Binkert</strong><br><time datetime="2026-10-02">2. Oktober 2026</time> · ${readingTime} Minuten Lesezeit</p>
        </div>
        <figure class="hero-figure"><img src="assets/illustrationen/btc-fruehindikator.png" alt="Zielscheibe mit schematischen Kurslinien als Illustration der Prognosefrage" width="580" height="398"><figcaption class="hero-credit">Illustration aus unseren Projektfolien · Seite 2<br>Schematische Linien, keine Messdaten</figcaption></figure>
      </header>
      <section class="result-strip" aria-label="Ergebnis von XGBoost mit Bitcoin im Holdout">
        <p class="result-context">XGBoost mit Bitcoin · Holdout vom 2. Januar bis 31. August 2026</p>
        <dl class="result-values"><div><dt>Accuracy</dt><dd>73,5 %</dd></div><div><dt>Balanced Accuracy</dt><dd>74,0 %</dd></div><div><dt>Handelstage im Test</dt><dd>166</dd></div></dl>
      </section>
      <article class="article" id="beitrag" aria-label="Projektblog">${html}</article>
    </main>
    <footer class="footer"><p>Sandro Balz &amp; Stefan Binkert · CSP1 · FHNW</p><p><a href="material/btc_overnight_qqq_forecasting.ipynb" download>Ausgeführtes Notebook herunterladen</a></p></footer>
  </div>
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), document);
console.log(`Blog erzeugt: ${headings.length} Abschnitte, ${readingTime} Minuten Lesezeit, ${(html.match(/class="chart/g) || []).length} Originalcharts.`);
