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