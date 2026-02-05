# Cocktail Chat MCP App

A small MCP app that fetches cocktail data from Convex and renders it in a hosted MCP UI.

## What This Project Does

- Exposes an MCP tool: `show_cocktail_recipe`
- Looks up cocktail data from Convex (`cocktails:getCocktailBySlug`)
- Returns structured tool output for an MCP app UI
- Serves a built single-file HTML MCP resource (`text/html;profile=mcp-app`)

## Tech Stack

- TypeScript + Node.js
- [Convex](https://www.convex.dev/) for data and image URLs
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- `@modelcontextprotocol/ext-apps` for MCP App tool/resource helpers
- Vite + `vite-plugin-singlefile` for bundling the UI

## Project Structure

- `/convex`
  - Convex schema and query functions
  - `convex/cocktails.ts` powers cocktail lookup
- `/mcp`
  - MCP server entrypoints and app UI
  - `mcp/server.ts` registers MCP tool + MCP app resource
  - `mcp/main.ts` runs server over stdio (default) or HTTP (`--http`)
  - `mcp/src/*` UI source files
  - `mcp/dist/*` built single-file app output
- `/scripts/seedConvexCocktails.js`
  - Seeds cocktails, ingredients, and image asset assignments
- `/images_2`
  - Local image files used during seed

## Prerequisites

- Node.js 18+
- npm
- Convex project initialized and reachable

## Environment

Create/update `.env.local` with at least:

```bash
CONVEX_URL=https://<your-deployment>.convex.cloud
```

Optional values used in local workflows:

```bash
CONVEX_DEPLOYMENT=dev:<name>
CONVEX_SITE_URL=https://<your-deployment>.convex.site
```

## Install

```bash
npm install
```

## Common Commands

- Start Convex dev: `npm run convex:dev`
- Seed data + assets: `npm run seed:cocktails`
- Build MCP app UI bundle: `npm run mcp:build`
- Run MCP server (stdio): `npm run mcp:serve`
- Run MCP server (HTTP): `npm run mcp:serve:http`

## Typical Local Flow

1. `npm install`
2. Ensure `.env.local` has `CONVEX_URL`
3. `npm run convex:dev`
4. `npm run seed:cocktails`
5. `npm run mcp:build`
6. `npm run mcp:serve` (or `npm run mcp:serve:http`)

## MCP Notes

- Tool registered in `mcp/server.ts`: `show_cocktail_recipe`
- Resource URI: `ui://cocktails/mcp-app.html`
- Resource CSP currently allows Convex image origin via:
  - `_meta.ui.csp.resourceDomains`

If your Convex deployment URL changes, update the `resourceDomains` value in `mcp/server.ts`.

## Troubleshooting

- `Missing CONVEX_URL in .env.local`
  - Add/fix `CONVEX_URL` in `.env.local`
- `MCP app bundle not found. Run npm run mcp:build first.`
  - Build the UI before starting the MCP server
- Images not loading in host
  - Verify the Convex domain is included in MCP resource CSP (`resourceDomains`)

