import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const configuredUrl = JSON.parse(readFileSync('site.config.json', 'utf8')).siteUrl;
const siteUrl = (process.env.SITE_URL || configuredUrl).replace(/\/$/, '');
const origin = new URL(siteUrl);
if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('SITE_URL must be an HTTPS origin without a path, query, or fragment');
}

const output = 'dist';
const pages = [];
const today = new Date().toISOString().slice(0, 10);

function lastModified(file) {
  const changes = execFileSync('git', ['status', '--porcelain', '--', file], { encoding: 'utf8' }).trim();
  if (changes) return today;
  const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { encoding: 'utf8' }).trim();
  if (!date) throw new Error(`Cannot determine Git modification date for ${file}; build with full Git history`);
  return date;
}

function walk(directory = '.') {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (directory === '.' && ['.git', '.github', 'docs', 'dist'].includes(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isDirectory()) {
      walk(file);
    } else if (item.name.endsWith('.html')) {
      const route = file === 'index.html' ? '/' : file.endsWith('/index.html')
        ? `/${file.slice(0, -'index.html'.length)}` : `/${file}`;
      const source = readFileSync(file, 'utf8');
      if (!source.includes('__SITE_URL__')) throw new Error(`${file} is missing a SITE_URL placeholder`);
      const html = source.replaceAll('__SITE_URL__', siteUrl);
      if (html.includes('__SITE_URL__')) throw new Error(`Unresolved SITE_URL in ${file}`);
      const target = path.join(output, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, html);
      if (!/<meta name="robots" content="noindex/i.test(html)) {
        pages.push({ route, lastmod: lastModified(file) });
      }
    } else if (['.css', '.svg', '.json', '.js'].includes(path.extname(file)) && !['site.config.json', 'build.mjs'].includes(item.name)) {
      const target = path.join(output, file);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(file, target);
    }
  }
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output);
walk();
pages.sort((a, b) => a.route.localeCompare(b.route));
const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
for (const page of pages) {
  xml.push(`  <url><loc>${siteUrl}${page.route}</loc><lastmod>${page.lastmod}</lastmod></url>`);
}
xml.push('</urlset>');
writeFileSync(path.join(output, 'sitemap.xml'), `${xml.join('\n')}\n`);
writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`Built ${pages.length} indexable pages in ${output}/ for ${siteUrl}`);
