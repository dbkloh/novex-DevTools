import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const FILE = path.join(DOCS, 'changelog.md');

export async function ensureChangelog() {
  try { await fs.access(FILE); }
  catch {
    await fs.mkdir(DOCS, { recursive: true });
    await fs.writeFile(FILE, '# Technical Changelog\n\n');
  }
  return FILE;
}

export async function readChangelog() {
  await ensureChangelog();
  return fs.readFile(FILE, 'utf8');
}

/** Extrait les entrées dont la date du titre est dans [fromISO, toISO].
 * Format attendu des titres: "## [x.y.z] - YYYY-MM-DD HH:mm" (HH:mm optionnel).
 */
export function summarizeChangelog(md, fromISO, toISO) {
  if (!md) return '';
  const from = fromISO ? new Date(fromISO) : new Date('1970-01-01');
  const to   = toISO   ? new Date(toISO)   : new Date('9999-12-31');

  const lines = md.split('\n');
  let out = [];
  let include = false;

  const parseDate = (line) => {
    const m = line.match(/^##\s*\[[^\]]+\]\s*-\s*([0-9]{4}-[0-9]{2}-[0-9]{2})(?:\s+([0-9]{2}:[0-9]{2}))?/);
    if (!m) return null;
    const iso = m[1] + 'T' + (m[2] ? m[2] + ':00' : '00:00:00');
    return new Date(iso);
  };

  for (const line of lines) {
    const dt = parseDate(line);
    if (dt) include = (dt >= from && dt <= to);
    if (include) out.push(line);
  }
  return out.join('\n').trim();
}