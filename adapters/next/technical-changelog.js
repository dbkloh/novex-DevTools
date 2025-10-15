import { NextResponse } from 'next/server';
import { DEVTOOLS_ENABLED } from '../../core/config.js';
import { ensureChangelog, readChangelog } from '../../core/changelog.js';

export function makeGet() {
  return async () => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    await ensureChangelog();
    const md = await readChangelog();
    return new NextResponse(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  };
}