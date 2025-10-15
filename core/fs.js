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