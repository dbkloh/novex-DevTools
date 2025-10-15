import path from 'node:path';
import fs from 'node:fs/promises';

export function safeJoin(baseDir, relativePath) {
  if (!relativePath || relativePath.includes('..')) return null;
  const resolved = path.resolve(baseDir, relativePath);
  if (!resolved.startsWith(path.resolve(baseDir))) return null;
  return resolved;
}

export async function ensureUniquePath(targetPath) {
  const { dir, name, ext } = path.parse(targetPath);
  let candidate = targetPath, i = 1;
  while (true) {
    try { await fs.access(candidate); candidate = path.join(dir, `${name}-${i}${ext}`); i++; }
    catch { return candidate; }
  }
}

export async function safeWriteFile(targetPath, data) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const unique = await ensureUniquePath(targetPath);
  await fs.writeFile(unique, data);
  return unique;
}

export function standardFileName(prefix, ext) {
  const d = new Date(), p = n => String(n).padStart(2,'0');
  const stamp = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `${prefix}-${stamp}${ext}`;
}

export function getLanguage(filePath) {
  const ext = path.extname(filePath).slice(1);
  const map = { ts:'ts', tsx:'tsx', js:'js', jsx:'jsx', json:'json', md:'md', css:'css', html:'html' };
  return map[ext] || '';
}