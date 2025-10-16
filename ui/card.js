'use client';
import React, { useState } from 'react';

export function DevtoolsCard() {
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState([]);

  async function listDocs(){
    try{
      setStatus("Chargement docs…");
      const r = await fetch("/api/devtools/export-docs");
      if(!r.ok){ setStatus("DevTools OFF ou erreur"); return; }
      const j = await r.json();
      setDocs(Array.isArray(j) ? j : []);
      setStatus("OK");
    }catch{ setStatus("Erreur"); }
  }

  async function exportZip(){
    try{
      setStatus("Export ZIP…");
      const r = await fetch("/api/devtools/export-code",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ paths:["src"], mode:"zip" })
      });
      if(!r.ok){ setStatus("Erreur export"); return; }
      const b = await r.blob();
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = "code-export.zip"; a.click();
      URL.revokeObjectURL(url);
      setStatus("ZIP téléchargé");
    }catch{ setStatus("Erreur"); }
  }

  return React.createElement(
    'section',
    { className: 'nvx-devtools', style: { marginTop: 16 } },
    React.createElement(
      'div',
      { className: 'card', style: { padding: 16, border: '1px solid var(--border,#ddd)', borderRadius: 12 } },
      React.createElement('h2', { style: { marginTop: 0 } }, 'DevTools'),
      React.createElement('p', { className: 'muted' },
        'ON/OFF via ', React.createElement('code', null, 'docs/devtools.config.json')
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        React.createElement('button', { onClick: listDocs }, 'Lister docs'),
        React.createElement('button', { onClick: exportZip }, 'Exporter code (zip)')
      ),
      React.createElement('p', null, status),
      docs && docs.length > 0
        ? React.createElement('ul', null, docs.map(d => React.createElement('li', { key: d }, d)))
        : null
    )
  );
}
