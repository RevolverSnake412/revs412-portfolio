import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';

const dist = resolve('dist');
const base = process.env.BASE_PATH || '/';
const basePath = base === '/' ? '/' : `/${base.replace(/^\/+|\/+$/g, '')}/`;
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
if (!existsSync(join(dist, 'resume', 'index.html')) || !existsSync(join(dist, 'fr', 'resume', 'index.html'))) throw new Error('Resume pages are missing from dist. Run the Astro build first.');
const fileForRequest = async (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.startsWith(basePath) ? decoded.slice(basePath.length) : decoded.replace(/^\/+/, '');
  const normalizedPath = normalize(relativePath || 'index.html');
  if (isAbsolute(normalizedPath) || normalizedPath === '..' || normalizedPath.startsWith(`..${sep}`)) return undefined;
  const candidate = join(dist, normalizedPath);
  if (existsSync(candidate) && (await stat(candidate)).isDirectory()) return join(candidate, 'index.html');
  return existsSync(candidate) ? candidate : undefined;
};
const server = createServer(async (request, response) => {
  try {
    const file = await fileForRequest(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (!file) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(500); response.end('Unable to serve resume'); }
});
await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to start the local resume server.');
let browser;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  const pdfOptions = { format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } };
  const generate = async (path, fileName) => {
    await page.goto(`http://127.0.0.1:${address.port}${basePath}${path}`, { waitUntil: 'networkidle' });
    if (await page.locator('.resume-entry').count() === 0) throw new Error(`Resume page did not render entries: ${path}`);
    await page.pdf({ path: join(dist, fileName), ...pdfOptions });
    await page.pdf({ path: resolve('public', fileName), ...pdfOptions });
  };
  await generate('resume/print/', 'Oussama-Ait-Agnaou-Resume.pdf');
  await generate('fr/resume/print/', 'Oussama-Ait-Agnaou-CV-Francais.pdf');
} finally { await browser?.close(); await new Promise((resolveServer) => server.close(resolveServer)); }
