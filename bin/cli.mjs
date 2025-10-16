#!/usr/bin/env node
// @novex/devtools postinstall — scaffold non destructif dans l'app consommatrice
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';

const PKG_DIR = process.cwd();                         // node_modules/@novex/devtools
const APP = process.env.INIT_CWD || path.resolve(PKG_DIR, '..', '..', '..'); // racine app
const J = (...xs) => path.join(APP, ...xs);
const ex = p => fss.existsSync(p);
const rd = p => fs.readFile(p, 'utf8');
const wr = (p, s) => fs.writeFile(p, s.endsWith('\n') ? s : s + '\n');
const mk = d => fs.mkdir(d, { recursive: true });
const now = () => new Date().toISOString().replace(/[:.]/g,'-');
const silent = process.argv.includes('--silent');
const log = (...a) => { if(!silent) console.log('[novex-devtools]', ...a); };

function appBase() { return ex(J('src','app')) ? ['src','app'] : ['app']; }
function hasTS() { return ex(J('tsconfig.json')) || ex(J(...appBase(),'layout.tsx')); }

async function ensureFile(fp, content) {
  if (ex(fp)) return false;
  await mk(path.dirname(fp));
  await wr(fp, content);
  return true;
}

async function injectTheme() {
  const base = appBase();
  const cands = [
    J(...base,'layout.tsx'),
    J(...base,'layout.jsx'),
    J('pages','_app.tsx'),
    J('pages','_app.jsx')
  ];
  for (const f of cands) {
    if (!ex(f)) continue;
    const src = await rd(f);
    if (src.includes('@novex/devtools/theme.css')) return { file:f, added:false };
    await wr(f, `import "@novex/devtools/theme.css";\n` + src);
    return { file:f, added:true };
  }
  return null;
}

function stripBadImports(src){
  return src
    .replace(/^\s*import\s*\{\s*DevTools\s*\}\s*from\s*['"]@novex\/devtools['"];\s*$/m, '') // au cas où
    .replace(/^\s*import\s+['"]@novex\/devtools['"];\s*$/m, '');
}

async function integrateSettings() {
  const base = appBase();
  const isTS = hasTS(); const ext = isTS ? 'tsx' : 'jsx';

  // Card stub (re-export du composant du package)
  const card = J(...base,'settings', `_DevtoolsCard.${ext}`);
  const cardCreated = await ensureFile(card, `export { DevtoolsCard as default } from "@novex/devtools/ui/card";\n`);

  // Page Settings existante ?
  const pageTSX = J(...base,'settings','page.tsx');
  const pageJSX = J(...base,'settings','page.jsx');
  const page = ex(pageTSX) ? pageTSX : (ex(pageJSX) ? pageJSX : null);

  if (page) {
    const backup = `${page}.novex-backup-${now()}`;
    let src = await rd(page);
    const orig = src;
    src = stripBadImports(src);
    if (!src.includes("from \"@novex/devtools\"") && !src.includes("from '@novex/devtools'")) {
      src = `import { DevTools } from "@novex/devtools";\n` + src;
    }
    if (!src.includes('<DevTools')) {
      if (src.includes('</main>'))      src = src.replace('</main>', '  <DevTools />\n</main>');
      else if (src.includes('return (')) src = src.replace(/return\s*\(\s*/, m => m + '\n  <DevTools />\n');
      else                               src += '\n<DevTools />\n';
    }
    if (src !== orig) {
      await wr(backup, orig);
      await wr(page, src);
      return { integrated:true, backup, cardCreated };
    }
    return { integrated:false, backup:null, cardCreated };
  } else {
    const newPage = J(...base,'settings', `page.${ext}`);
    await mk(path.dirname(newPage));
    await wr(newPage, `import { DevTools } from "@novex/devtools";
export default function SettingsPage(){
  return (
    <main style={{padding:16}}>
      <h1>Settings</h1>
      <DevTools />
    </main>
  );
}\n`);
    return { created:true, page:newPage, cardCreated };
  }
}

async function ensureRoute() {
  const base = appBase();
  const isTS = hasTS(); const ext = isTS ? 'ts' : 'js';
  const dir = J(...base,'api','devtools','[[...slug]]');
  await mk(dir);
  const route = J(...base,'api','devtools','[[...slug]]', `route.${ext}`);
  const created = await ensureFile(route, `export { GET, POST } from "@novex/devtools/route";\n`);
  return { route, created };
}

async function main(){
  try{
    // 1) config ON/OFF (jamais écrasée si existe)
    const cfgCreated = await ensureFile(J('docs','devtools.config.json'), '{ "enabled": true }\n');

    // 2) route catch-all
    const { route, created: routeCreated } = await ensureRoute();

    // 3) thème
    const theme = await injectTheme();

    // 4) settings (integrate/create)
    const settings = await integrateSettings();

    log('scaffold done', { app: APP, created: { config: cfgCreated, route: routeCreated, card: settings.cardCreated }, theme, settings });
  }catch(e){
    if(!silent) console.warn('[novex-devtools] postinstall error:', e?.message || e);
    process.exit(0); // ne bloque jamais l'install
  }
}
main();
