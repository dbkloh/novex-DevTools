import { NextResponse } from 'next/server';
import { DEVTOOLS_ENABLED } from '../../core/config.js';
import { readChangelog, summarizeChangelog } from '../../core/changelog.js';

export function makePost() {
  return async (req) => {
    if (!(await DEVTOOLS_ENABLED())) return new NextResponse('DevTools disabled', { status: 403 });
    const body = await req.json().catch(() => ({}));
    const from = body?.from || null; // ex: "2025-10-01"
    const to   = body?.to   || null; // ex: "2025-10-16"
    const md = await readChangelog();
    const summary = summarizeChangelog(md, from, to);
    return new NextResponse(summary, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  };
}