import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DEVTOOLS_ENABLED } from '../../core/config.js';
import { safeJoin, ensureUniquePath, standardFileName, getLanguage } from '../../core/fs.js';

const ROOT = process.cwd();

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const children = await walk(full);
      out.push({ name: e.name, path: path.relative(ROOT, full), type: 'directory', children });
    } else {
      out.push({ name: e.name, path: path.relative(ROOT, full), type: 'file' });
    }
  }
  return out;
}

export function makeGet() {
  return async () => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const src = path.join(ROOT, 'src');
    const tree = await walk(src);
    return NextResponse.json({ name: 'src', path: 'src', type: 'directory', children: tree });
  };
}

export function makePost() {
  return async (req) => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const body = await req.json().catch(() => ({}));
    const mode = ['zip','concat','all_in_one','server'].includes(body?.mode) ? body.mode : 'zip';
    const selected = Array.isArray(body?.paths) ? body.paths : [];
    const srcBase = path.join(ROOT, 'src');

    const resolved = mode === 'all_in_one' ? [] : Array.from(
      new Set(
        selected
          .filter(p => p?.startsWith('src/'))
          .map(p => safeJoin(ROOT, p))
          .filter(Boolean)
      )
    );

    if (mode === 'zip') {
      const zip = new JSZip();
      for (const abs of resolved) {
        const rel = path.relative(ROOT, abs);
        try { zip.file(rel, await fs.readFile(abs)); } catch {}
      }
      const buf = await zip.generateAsync({ type: 'nodebuffer' });
      const name = standardFileName('code-export', '.zip');
      return new NextResponse(buf, { headers: { 'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${name}"` }});
    }

    if (mode === 'concat') {
      let md = `# Code Export\n\n*Date: ${new Date().toLocaleString()}*\n\n`;
      for (const abs of resolved) {
        const rel = path.relative(ROOT, abs);
        try {
          const content = await fs.readFile(abs, 'utf8');
          md += `## \`${rel}\`\n\n\`\`\`${getLanguage(rel)}\n${content}\n\`\`\`\n\n---\n\n`;
        } catch {}
      }
      const name = standardFileName('code-export', '.md');
      return new NextResponse(md, { headers: { 'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${name}"` }});
    }

    if (mode === 'all_in_one') {
      const all = (function listAll(dir) {
        const files = [];
        for (const f of fsSync.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, f.name);
          if (f.isDirectory()) files.push(...listAll(full));
          else files.push(full);
        }
        return files;
      })(srcBase).map(p => path.relative(ROOT, p)).sort();

      let md = `# Full Code Export\n\n*Date: ${new Date().toLocaleString()}*\n\n`;
      for (const rel of all) {
        const full = path.join(ROOT, rel);
        try {
          const content = await fs.readFile(full, 'utf8');
          md += `## \`${rel}\`\n\n\`\`\`${getLanguage(rel)}\n${content}\n\`\`\`\n\n---\n\n`;
        } catch {}
      }
      const name = standardFileName('code-export-full', '.md');
      return new NextResponse(md, { headers: { 'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${name}"` }});
    }

    if (mode === 'server') {
      const stamp = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
      const outDir = path.join(ROOT, 'docs', 'code-export', stamp);
      await fs.mkdir(outDir, { recursive: true });
      for (const abs of resolved) {
        const rel = path.relative(ROOT, abs);
        const dest = await ensureUniquePath(path.join(outDir, rel));
        await fs.mkdir(path.dirname(dest), { recursive: true });
        try { await fs.copyFile(abs, dest); } catch {}
      }
      return NextResponse.json({ success: true, path: `/docs/code-export/${stamp}` });
    }

    return new NextResponse('Unsupported mode', { status: 400 });
  };
}