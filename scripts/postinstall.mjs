// Auto-scaffold non destructif pour Next.js
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const P = (...xs) => path.join(ROOT, ...xs);
const exists = fp => fss.existsSync(fp);
const read = fp => fs.readFile(fp, 'utf8');
const write = (fp, s) => fs.writeFile(fp, s);
const mkdirp = dir => fs.mkdir(dir, { recursive: true });
const now = () => new Date().toISOString().replace(/[:.]/g,'-');

const HAS_TS = () =>
  exists(P('tsconfig.json')) || exists(P('app','layout.tsx')) || exists(P('app','page.tsx'));

async function ensureFile(fp, content) {
  if (exists(fp)) return false;
  await mkdirp(path.dirname(fp));
  await write(fp, content.endsWith('\n') ? content : content + '\n');
  return true;
}

async function injectThemeImport() {
  const candidates = [
    P('app','layout.tsx'),
    P('app','layout.jsx'),
    P('pages','_app.tsx'),
    P('pages','_app.jsx'),
  ];
  for (const file of candidates) {
    if (!exists(file)) continue;
    const src = await read(file);
    if (src.includes('@novex/devtools/theme.css')) return { file, added: false };
    const updated = `import "@novex/devtools/theme.css";\n` + src;
    await write(file, updated);
    return { file, added: true };
  }
  return null;
}

// ---- ROUTE catch-all
const ROUTE_TS = `import { NextRequest } from "next/server";
import { makeGet as ecGet,  makePost as ecPost  } from "@novex/devtools/adapters/next/export-code";
import { makeGet as edGet,  makePost as edPost  } from "@novex/devtools/adapters/next/export-docs";
import { makeGet as docGet, makePost as docPost } from "@novex/devtools/adapters/next/dev-docs";
import { makeGet as tcGet }                        from "@novex/devtools/adapters/next/technical-changelog";
import { makePost as scPost }                      from "@novex/devtools/adapters/next/summarize-changelog";
const getExportCode  = ecGet(); const postExportCode = ecPost();
const getExportDocs  = edGet(); const postExportDocs = edPost();
const getDoc         = docGet(); const postDoc        = docPost();
const getTechChangelog = tcGet(); const postSummarizeChangelog = scPost();
export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug ?? [];
  if (slug.length === 0) return new Response(JSON.stringify({ ok:true,endpoints:["export-code","export-docs","[filename]","technical-changelog","summarize-changelog"]}),{headers:{"Content-Type":"application/json"}});
  const [first, ...rest] = slug;
  if (first==="export-code") return getExportCode(req,{params:{} as any});
  if (first==="export-docs") return getExportDocs(req,{params:{} as any});
  if (first==="technical-changelog") return getTechChangelog(req,{params:{} as any});
  if (rest.length===0) return getDoc(req,{params:{filename:first} as any});
  return new Response("Not found",{status:404});
}
export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug ?? [];
  if (slug.length===0) return new Response("Not found",{status:404});
  const [first, ...rest] = slug;
  if (first==="export-code") return postExportCode(req,{params:{} as any});
  if (first==="export-docs") return postExportDocs(req,{params:{} as any});
  if (first==="summarize-changelog") return postSummarizeChangelog(req,{params:{} as any});
  if (rest.length===0) return postDoc(req,{params:{filename:first} as any});
  return new Response("Not found",{status:404});
}
`;
const ROUTE_JS = `import { makeGet as ecGet,  makePost as ecPost  } from "@novex/devtools/adapters/next/export-code";
import { makeGet as edGet,  makePost as edPost  } from "@novex/devtools/adapters/next/export-docs";
import { makeGet as docGet, makePost as docPost } from "@novex/devtools/adapters/next/dev-docs";
import { makeGet as tcGet }                        from "@novex/devtools/adapters/next/technical-changelog";
import { makePost as scPost }                      from "@novex/devtools/adapters/next/summarize-changelog";
const getExportCode  = ecGet(); const postExportCode = ecPost();
const getExportDocs  = edGet(); const postExportDocs = edPost();
const getDoc         = docGet(); const postDoc        = docPost();
const getTechChangelog = tcGet(); const postSummarizeChangelog = scPost();
export async function GET(req, { params }) {
  const slug = (params && params.slug) || [];
  if (slug.length===0) return new Response(JSON.stringify({ok:true,endpoints:["export-code","export-docs","[filename]","technical-changelog","summarize-changelog"]}),{headers:{"Content-Type":"application/json"}});
  const [first, ...rest] = slug;
  if (first==="export-code") return getExportCode(req,{params:{}});
  if (first==="export-docs") return getExportDocs(req,{params:{}});
  if (first==="technical-changelog") return getTechChangelog(req,{params:{}});
  if (rest.length===0) return getDoc(req,{params:{filename:first}});
  return new Response("Not found",{status:404});
}
export async function POST(req, { params }) {
  const slug = (params && params.slug) || [];
  if (slug.length===0) return new Response("Not found",{status:404});
  const [first, ...rest] = slug;
  if (first==="export-code") return postExportCode(req,{params:{}});
  if (first==="export-docs") return postExportDocs(req,{params:{}});
  if (first==="summarize-changelog") return postSummarizeChangelog(req,{params:{}});
  if (rest.length===0) return postDoc(req,{params:{filename:first}});
  return new Response("Not found",{status:404});
}
`;

// ---- UI DevtoolsCard (TSX/JSX)
const CARD_TSX = `"use client";
import { useState } from "react";

export default function DevtoolsCard() {
  const [status,setStatus] = useState("");
  const [docs,setDocs] = useState<string[]>([]);
  async function pingDocs(){
    setStatus("Chargement docs…");
    const r = await fetch("/api/devtools/export-docs");
    if(!r.ok){ setStatus("DevTools OFF ou erreur"); return;}
    setDocs(await r.json()); setStatus("OK");
  }
  async function exportZip(){
    setStatus("Export ZIP…");
    const r = await fetch("/api/devtools/export-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paths:["src"],mode:"zip"})});
    if(!r.ok){ setStatus("Erreur export"); return;}
    const b = await r.blob(); const url = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href=url; a.download="code-export.zip"; a.click(); URL.revokeObjectURL(url);
    setStatus("ZIP téléchargé");
  }
  return (
    <section className="nvx-devtools" style={{marginTop:16}}>
      <div className="card" style={{padding:16}}>
        <h2 style={{marginTop:0}}>DevTools</h2>
        <p className="muted">ON/OFF via <code>docs/devtools.config.json</code></p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={pingDocs}>Lister docs</button>
          <button className="btn-primary" onClick={exportZip}>Exporter code (zip)</button>
        </div>
        <p>{status}</p>
        {docs.length>0 && <ul>{docs.map(d=><li key={d}>{d}</li>)}</ul>}
      </div>
    </section>
  );
}
`;

const CARD_JSX = `"use client";
import { useState } from "react";

export default function DevtoolsCard(){
  const [status,setStatus] = useState("");
  const [docs,setDocs] = useState([]);
  async function pingDocs(){
    setStatus("Chargement docs…");
    const r = await fetch("/api/devtools/export-docs");
    if(!r.ok){ setStatus("DevTools OFF ou erreur"); return;}
    setDocs(await r.json()); setStatus("OK");
  }
  async function exportZip(){
    setStatus("Export ZIP…");
    const r = await fetch("/api/devtools/export-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paths:["src"],mode:"zip"})});
    if(!r.ok){ setStatus("Erreur export"); return;}
    const b = await r.blob(); const url = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href=url; a.download="code-export.zip"; a.click(); URL.revokeObjectURL(url);
    setStatus("ZIP téléchargé");
  }
  return (
    <section className="nvx-devtools" style={{marginTop:16}}>
      <div className="card" style={{padding:16}}>
        <h2 style={{marginTop:0}}>DevTools</h2>
        <p className="muted">ON/OFF via <code>docs/devtools.config.json</code></p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={pingDocs}>Lister docs</button>
          <button className="btn-primary" onClick={exportZip}>Exporter code (zip)</button>
        </div>
        <p>{status}</p>
        {docs.length>0 && <ul>{docs.map(d=><li key={d}>{d}</li>)}</ul>}
      </div>
    </section>
  );
}
`;

// injecte import et JSX dans une page settings existante
async function integrateIntoSettings(pagePath, isTS) {
  const backup = `${pagePath}.novex-backup-${now()}`;
  const src = await read(pagePath);
  if (src.includes('_DevtoolsCard') || src.includes('<DevtoolsCard')) return { modified:false, backup:null }; // déjà intégré

  // 1) import
  const importLine = `import DevtoolsCard from "./_DevtoolsCard";\n`;
  let updated = importLine + src;

  // 2) JSX : insérer avant </main> si présent, sinon avant la fin du return
  if (updated.includes('</main>')) {
    updated = updated.replace('</main>', '  <DevtoolsCard />\n</main>');
  } else if (updated.includes('return (')) {
    updated = updated.replace(/return\s*\(\s*/, match => match + '\n  <DevtoolsCard />\n');
  } else {
    // fallback : append
    updated = updated + '\n{/* Devtools */}\n<DevtoolsCard />\n';
  }

  // backup + write
  await write(backup, src);
  await write(pagePath, updated);
  return { modified:true, backup };
}

async function createSettingsPage(baseDir, isTS) {
  const ext = isTS ? 'tsx' : 'jsx';
  const page = P('app','settings','page.'+ext);
  const content = `export default function SettingsPage(){
  return (
    <main style={{padding:16}}>
      <h1>Settings</h1>
      <DevtoolsCard />
    </main>
  );
}
import DevtoolsCard from "./_DevtoolsCard";
`;
  await mkdirp(path.dirname(page));
  await write(page, content);
  return page;
}

async function main() {
  try {
    if (String(process.env.NOVEX_DEVTOOLS_NO_POSTINSTALL).toLowerCase() === 'true') return;

    const isTS = HAS_TS();

    // 1) config
    const cfg = await ensureFile(P('docs','devtools.config.json'), '{ "enabled": true }\n');

    // 2) route catch-all
    const routeDir = P('app','api','devtools','[[...slug]]');
    await mkdirp(routeDir);
    const routePath = P('app','api','devtools','[[...slug]]', `route.${isTS ? 'ts' : 'js'}`);
    const routeCreated = await ensureFile(routePath, isTS ? ROUTE_TS : ROUTE_JS);

    // 3) thème
    const theme = await injectThemeImport();

    // 4) DevtoolsCard
    const cardPath = P('app','settings','_DevtoolsCard.'+(isTS?'tsx':'jsx'));
    const cardCreated = await ensureFile(cardPath, isTS ? CARD_TSX : CARD_JSX);

    // 5) Settings page : intégrer ou créer
    const settingsCandidates = [P('app','settings','page.tsx'), P('app','settings','page.jsx')];
    let settingsAction = null;
    let settingsModified = false;
    let settingsBackup = null;

    const existing = settingsCandidates.find(exists);
    if (existing) {
      const res = await integrateIntoSettings(existing, isTS);
      settingsAction = 'integrated';
      settingsModified = res.modified;
      settingsBackup = res.backup;
    } else {
      const createdPath = await createSettingsPage('app/settings', isTS);
      settingsAction = 'created';
      settingsModified = true;
      settingsBackup = null;
    }

    console.log('[novex-devtools] postinstall report:', {
      created: { config: cfg, route: routeCreated, card: cardCreated },
      theme: theme || null,
      settings: { action: settingsAction, modified: settingsModified, backup: settingsBackup }
    });
  } catch (e) {
    console.warn('[novex-devtools] postinstall error (ignored):', e?.message || e);
  }
}

main();
