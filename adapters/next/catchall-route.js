// ESM pur, pas de JSX — safe en node_modules
import { makeGet as ecGet,  makePost as ecPost  } from "./export-code.js";
import { makeGet as edGet,  makePost as edPost  } from "./export-docs.js";
import { makeGet as docGet, makePost as docPost } from "./dev-docs.js";
import { makeGet as tcGet }                        from "./technical-changelog.js";
import { makePost as scPost }                      from "./summarize-changelog.js";

const getExportCode  = ecGet();  const postExportCode  = ecPost();
const getExportDocs  = edGet();  const postExportDocs  = edPost();
const getDoc         = docGet(); const postDoc         = docPost();
const getTechChangelog = tcGet();
const postSummarizeChangelog = scPost();

export async function GET(req, ctx) {
  const slug = (ctx && ctx.params && ctx.params.slug) || [];
  if (!slug.length) {
    return new Response(JSON.stringify({
      ok: true, endpoints: ["export-code","export-docs","[filename]","technical-changelog","summarize-changelog"]
    }), { headers: { "Content-Type":"application/json" } });
  }
  const [first, ...rest] = slug;
  if (first==="export-code")         return getExportCode(req,{params:{}});
  if (first==="export-docs")         return getExportDocs(req,{params:{}});
  if (first==="technical-changelog") return getTechChangelog(req,{params:{}});
  if (!rest.length)                  return getDoc(req,{params:{filename:first}});
  return new Response("Not found",{status:404});
}

export async function POST(req, ctx) {
  const slug = (ctx && ctx.params && ctx.params.slug) || [];
  if (!slug.length) return new Response("Not found",{status:404});
  const [first, ...rest] = slug;
  if (first==="export-code")         return postExportCode(req,{params:{}});
  if (first==="export-docs")         return postExportDocs(req,{params:{}});
  if (first==="summarize-changelog") return postSummarizeChangelog(req,{params:{}});
  if (!rest.length)                  return postDoc(req,{params:{filename:first}});
  return new Response("Not found",{status:404});
}
