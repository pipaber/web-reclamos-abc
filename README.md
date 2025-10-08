# web-reclamos-abc

A small React + TypeScript web application scaffolded with Create React App. This repository contains the source code, build output, and configuration for a single-page application that integrates with a backend API (see `package.json` for proxy settings).

This README gives a concise, professional overview to help contributors and maintainers get started quickly: goals, how to run locally, build and deploy tips, testing, and a short contributing guide.

## Table of contents

- About
- Tech stack
- Quick start
	- Prerequisites
	- Install
	- Run development server
- Available scripts
- Build & deploy
- Environment & API
- Testing
- Linting & formatting
- Contributing
- Troubleshooting

## About

`web-reclamos-abc` is a frontend client intended to manage and display user complaints (reclamos) for the ABC service. The project is structured as a Create React App (CRA) TypeScript project and is styled using Tailwind CSS (PostCSS + Autoprefixer configured in the repo).

Core goals:

- Provide a responsive SPA for creating, listing, and viewing complaints.
- Keep a minimal, testable, and accessible codebase.
- Ship optimized production builds for static hosting or integration with a backend server.

## Tech stack

- React 19 with TypeScript
- Create React App (react-scripts)
- Tailwind CSS (PostCSS + Autoprefixer)
- Testing libraries from Testing Library family

See `package.json` for exact dependency versions.

## Quick start

### Prerequisites

- Node.js (LTS recommended, e.g. 18.x or 20.x)
- npm (bundled with Node) or yarn/pnpm if you prefer

On Windows, using PowerShell (pwsh.exe) is fine — the commands below are cross-platform.

### Install

1. Clone the repository and cd into the project directory.
2. Install dependencies:

```powershell
npm install
```

or with yarn:

```powershell
yarn
```

### Run the development server

Start the app in development mode (hot reload enabled):

```powershell
npm start
```

This runs `react-scripts start`. By default the app opens at http://localhost:3000 and the dev server proxies API requests to the backend configured in `package.json` under the `proxy` field.

## Available scripts

Relevant npm scripts (see `package.json`):

- `npm start` - Runs the app in development mode (react-scripts start).
- `npm test` - Runs the test runner (react-scripts test).
- `npm run build` - Builds the app for production to the `build/` folder.
- `npm run eject` - Ejects the CRA configuration (one-way operation).

Use `npm run <script>` when invoking scripts that contain dashes.

## Build & deploy

Create an optimized production build:

```powershell
npm run build
```

The output will be placed in the `build/` directory. You can serve this folder with any static hosting solution (Netlify, Vercel, GitHub Pages, Surge) or place the files behind your backend server. Ensure your server rewrites unknown routes to `index.html` for SPA routing.

### Recommended production checks

- Verify the `homepage` setting in `package.json` (if deploying to a subpath).
- Confirm environment-dependent API endpoints are set on the server or injected at build time.
- Run a simple local static server to smoke test the build:

```powershell
npm install -g serve
serve -s build
```

## Environment & API

The repo includes a `proxy` entry in `package.json` that forwards API requests in development to:

```
http://13.222.79.184:8001
```

For production, point your client to the correct backend URL via environment variables or server configuration. CRA supports environment variables with the `REACT_APP_` prefix. Create a `.env` file at the project root for local overrides (don't commit secrets):

```
REACT_APP_API_BASE=https://api.example.com
```

Access it in code as `process.env.REACT_APP_API_BASE`.

## Testing

Run unit and integration tests with:

```powershell
npm test
```

This runs the CRA test runner which supports watch mode and a one-off run. See individual test files under `src/` (e.g. `App.test.tsx`) for examples.

## Linting & formatting

This project doesn't include ESLint/Prettier config files beyond CRA defaults. If you add linting or formatting, consider adding Husky + lint-staged to run checks before commits.

## Contributing

Contributions are welcome. A simple workflow to contribute:

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`.
2. Install dependencies and run the app locally.
3. Add tests for new logic or components.
4. Open a pull request describing the changes and rationale.

Keep PRs small and focused. If your change is non-trivial, open an issue first to discuss design.

## Troubleshooting

- Problem: Dev server doesn't proxy to backend. Check the `proxy` field in `package.json` and ensure your API server is reachable from your machine.
- Problem: CSS not updating after Tailwind edits. Ensure PostCSS and Tailwind are configured and restart the dev server when changing PostCSS config.

If you hit build errors, run the build locally and inspect the stack trace. Common fixes include correcting imports, installing missing types (for TypeScript), or adjusting browserlist targets.

## Files & structure

Key files and folders:

- `src/` - Application source (TSX, CSS, tests).
- `public/` - Static assets and HTML template.
- `build/` - Production build output (generated by `npm run build`).
- `package.json` - Scripts and dependencies.
- `tailwind.config.js`, `postcss.config.js` - Tailwind & PostCSS config.

## Next steps / Improvements

- Add CI (GitHub Actions) for build and tests on PRs.
- Add ESLint + Prettier with a consistent code style.
- Add end-to-end tests (Cypress) for core user flows.

---

If you'd like, I can also:

- Add a CONTRIBUTING.md and CODE_OF_CONDUCT.md.
- Wire up a GitHub Actions workflow for tests and builds.
- Add a simple CI preview deploy (Netlify or Vercel config).

Tell me which follow-up you'd prefer and I'll implement it.