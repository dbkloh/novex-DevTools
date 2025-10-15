import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { DEVTOOLS_ENABLED } from '../../core/config.js';
import { safeJoin, standardFileName } from '../../core/fs.js';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const README = path.join(ROOT, 'README.md');

export function makeGet() {
  return async () => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const files = (await fs.readdir(DOCS)).filter(f => f.endsWith('.md'));
    return NextResponse.json(files);
  };
}

export function makePost() {
  return async (req) => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const body = await req.json().catch(() => ({}));
    const files = Array.isArray(body?.files) ? body.files : [];
    const mode = ['zip','concat','individual'].includes(body?.mode) ? body.mode : 'zip';
    const includeReadme = !!body?.includeReadme;
    const addTimestamp = !!body?.addTimestamp;
    const toc = !!body?.toc; // option bonus: TOC auto

    if (!files.length) return new NextResponse('No files selected', { status: 400 });

    if (mode === 'zip') {
      const zip = new JSZip();
      for (const name of files) {
        const fp = safeJoin(DOCS, name);
        if (!fp) continue;
        try { zip.file(name, await fs.readFile(fp)); } catch {}
      }
      const buf = await zip.generateAsync({ type: 'nodebuffer' });
      const out = standardFileName('docs-export', '.zip');
      return new NextResponse(buf, { headers: { 'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${out}"` }});
    }

    if (mode === 'concat') {
      const sep = `\n\n---\n\n`;
      let md = '';
      const tocItems = [];
      for (const name of files) {
        const fp = includeReadme && name === 'README.md' ? README : safeJoin(DOCS, name);
        if (!fp) continue;
        try {
          const content = await fs.readFile(fp, 'utf8');
          md += `# ${name}\n\n${content}\n${sep}`;
          if (toc) {
            for (const line of content.split('\n')) {
              const m = /^(#{1,6})\s+(.*)$/.exec(line.trim());
              if (m) {
                const depth = m[1].length;
                const title = m[2].replace(/[`*_]/g,'').trim();
                tocItems.push(`${'  '.repeat(depth-1)}- ${title} *(in ${name})*`);
              }
            }
          }
        } catch {}
      }
      if (toc && tocItems.length) {
        md = `# Table of Contents\n\n${tocItems.join('\n')}\n\n---\n\n` + md;
      }
      const out = standardFileName('docs-export', '.md');
      return new NextResponse(md, { headers: { 'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${out}"` }});
    }

    if (mode === 'individual') {
      const [first] = files;
      const fp = safeJoin(DOCS, first);
      if (!fp) return new NextResponse('Bad path', { status: 400 });
      try {
        const content = await fs.readFile(fp);
        const name = addTimestamp ? (first.replace(/\.md$/,'') + '-' + Date.now() + '.md') : first;
        return new NextResponse(content, { headers: { 'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${name}"` }});
      } catch {
        return new NextResponse('File not found', { status: 404 });
      }
    }

    return new NextResponse('Unsupported mode', { status: 400 });
  };
}

adapters/next/dev-docs.js

import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import { DEVTOOLS_ENABLED } from '../../core/config.js';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const HISTORY = path.join(DOCS, '.history');

async function readVersion(name) {
  try {
    const v = JSON.parse(await fs.readFile(path.join(DOCS, `${name}.version.json`), 'utf8'))?.version;
    return typeof v === 'string' ? v : '0.0.0';
  } catch { return '0.0.0'; }
}
async function writeVersion(name, version) {
  await fs.writeFile(path.join(DOCS, `${name}.version.json`), JSON.stringify({ version }, null, 2));
}

export function makeGet() {
  return async (_req, { params }) => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const filename = (params?.filename || '').toString();
    if (!/^[a-z0-9_-]+$/i.test(filename)) return new NextResponse('Invalid filename', { status: 400 });
    const mdPath = path.join(DOCS, `${filename}.md`);
    let content = '';
    try { content = await fs.readFile(mdPath, 'utf8'); } catch { content = ''; }
    const version = await readVersion(filename);
    return NextResponse.json({ content, version });
  };
}

export function makePost() {
  return async (req, { params }) => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const filename = (params?.filename || '').toString();
    if (!/^[a-z0-9_-]+$/i.test(filename)) return new NextResponse('Invalid filename', { status: 400 });
    const body = await req.json().catch(() => ({}));
    const newContent = String(body?.content ?? '');

    const mdPath = path.join(DOCS, `${filename}.md`);
    let old = '';
    try { old = await fs.readFile(mdPath, 'utf8'); } catch {}

    if (old) {
      await fs.mkdir(HISTORY, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g,'-');
      await fs.writeFile(path.join(HISTORY, `${filename}-${stamp}.md`), old);
    }

    await fs.writeFile(mdPath, newContent);

    const prev = await readVersion(filename);
    const next = semver.valid(prev) ? semver.inc(prev, 'patch') : '0.0.1';
    await writeVersion(filename, next);

    return NextResponse.json({ success: true, newVersion: next });
  };
}

theme.css  (les couleurs suivent celles de l’app)

:root {
  --nvx-bg: var(--background, #0b0b0d);
  --nvx-fg: var(--foreground, #eaeaea);
  --nvx-card: var(--card, var(--background, #111));
  --nvx-border: var(--border, rgba(255,255,255,0.1));
  --nvx-primary: var(--primary, #7c5cff);
  --nvx-muted: var(--muted, #9aa0a6);
}
.nvx-devtools { color: var(--nvx-fg); background: var(--nvx-bg); }
.nvx-devtools .card { background: var(--nvx-card); border: 1px solid var(--nvx-border); border-radius: 10px; }
.nvx-devtools .btn-primary { background: var(--nvx-primary); color: #fff; }
.nvx-devtools .muted { color: var(--nvx-muted); }