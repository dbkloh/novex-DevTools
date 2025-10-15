import fs from 'node:fs/promises';
import path from 'node:path';

/** Toggle simple : JSON + override par NEXT_PUBLIC_DEVTOOLS=true */
export async function DEVTOOLS_ENABLED() {
  if (String(process.env.NEXT_PUBLIC_DEVTOOLS).toLowerCase() === 'true') return true;
  const p = path.join(process.cwd(), 'docs', 'devtools.config.json');
  try {
    const j = JSON.parse(await fs.readFile(p, 'utf8'));
    return !!j.enabled;
  } catch {
    // défaut: ON en dev, OFF en prod
    return process.env.NODE_ENV !== 'production';
  }
}