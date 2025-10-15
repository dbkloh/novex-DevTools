# @novex/devtools

DevTools centralisé pour mes apps Next.js.  
✔️ mêmes endpoints / comportements que mon DevTools actuel  
✔️ activation/désactivation simple (fichier JSON + env override)  
✔️ sécurisation légère (sandbox chemins, pas d’écrasement)  
✔️ thème automatique via variables CSS de l’app

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Installation (via package.json)](#installation-via-packagejson)
- [Brancher dans une app Next.js](#brancher-dans-une-app-nextjs)
- [Thème (couleurs auto)](#thème-couleurs-auto)
- [Toggle ON/OFF](#toggle-onoff)
- [API / Endpoints](#api--endpoints)
- [Changelog & release](#changelog--release)
- [Notes](#notes)

---

## Fonctionnalités

- **Export code** (`zip`, `concat md`, `full md`, `server copy`)  
- **Export docs** (`zip`, `concat` avec TOC optionnel, `individual`)  
- **Édition docs** avec archivage de l’ancienne version + **bump semver patch**  
- **Noms d’export standards** : `code-export-YYYYMMDD-HHmmss.zip`, etc.  
- **Sécurité simple** : sandbox des chemins (`src/` & `docs/`), **jamais** d’écrasement disque côté export.  
- **Thème** qui s’adapte aux couleurs de l’app via CSS variables.

Structure du package (racine) : `adapters/next`, `core`, `theme.css`, `package.json`.

---

## Installation (via package.json)

> ⚠️ Publie d’abord une **Release** dans ce repo (onglet “Releases” → “Draft a new release” → Tag ex. `v0.1.0` → Publish).

Dans **l’app consommatrice**, édite `package.json` :

```json
{
  "dependencies": {
    "@novex/devtools": "git+https://github.com/dbkloh/novex-DevTools.git#v0.1.0"
  }
}