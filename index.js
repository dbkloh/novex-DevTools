// Entrypoint "neutre" pour éviter les erreurs de résolution racine.
// NB: les APIs réelles sont sous @novex/devtools/adapters/next/* (+ theme.css).
export const info = {
  name: "@novex/devtools",
  message: "Use subpath exports, e.g. @novex/devtools/adapters/next/export-code",
  versionHint: "Pinned via git tag or branch"
};
export default info;
