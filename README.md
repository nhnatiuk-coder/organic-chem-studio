# Organic Chem Studio

Build a separate, polished web application named "Organic Nomenclature Studio" designed as a Canvas-ready organic chemistry practice activity.

Core student experience:

- Landing screen briefly explains two modes: "Draw from a Name" and "Name from a Structure".
- Practice setup lets students select mode (mixed / draw / name), difficulty (intro, intermediate, challenge), and number of questions (5, 10, 15, 20).
- The question runner has a clear progress indicator, question number, score, and a small optional hint button.
- Draw-from-name: prompt displays either an IUPAC name or a common name and an embedded Ketcher molecular editor area for drawing. Include a visible, polished Ketcher integration placeholder/component with a clearly labeled fallback demo drawing panel if Ketcher cannot load during preview. Build a clean integration seam suitable for actual Ketcher iframe or React component API integration. On submission, export submitted structure (SMILES/Molfile where integration is available) and check structure identity against stored canonical SMILES; while in preview fallback include understandable feedback rather than claiming auto-structure grading if the editor has not supplied molecular data.
- Name-from-structure: display a clear skeletal drawing (render SVG locally from structured question data, not a remote image), accept a typed answer, normalize capitalization, whitespace, punctuation, hyphens and standard parenthetical spelling differences. Accept all approved answer aliases, including both appropriate IUPAC and common names.
- Feedback shows correct/incorrect, accepted correct names, a concise explanation, and Next Question. First incorrect attempt must keep the question active and reveal a hint; after a second attempt show the answer.

Question content requirements:

- Seed at least 30 genuinely distinct molecules. Do not merely vary a leaving group or a simple substituent on the same skeleton.
- Cover alkanes, cycloalkanes, branched alkanes, alkenes (including E/Z where applicable), alkynes, alcohols, ethers, aldehydes, ketones, carboxylic acids, esters, amines, alkyl halides, benzene derivatives, phenols, and simple amides.
- Each molecule record must include canonical SMILES, displayName, acceptedNames array with IUPAC and common-name variants where widely used, difficulty, topic, helpful hint, explanation, and an SVG structure rendering or enough data to render a crisp SVG.
- Examples must include acetone/propan-2-one, isopropyl alcohol/propan-2-ol, toluene/methylbenzene, phenol/benzenol, acetic acid/ethanoic acid, diethyl ether/ethoxyethane, and isopropylamine/propan-2-amine.
- Make questions randomly selected without repeats until the active set ends.

Instructor/admin experience:

- Add a clearly separated Instructor Guide screen explaining how to edit the question bank, add aliases, enable a real Ketcher editor, host the app, and place it in Canvas as an External URL or iframe embed.
- Provide downloadable-friendly JSON export/import controls for question-bank records in the UI, and use localStorage to preserve any edits for demo purposes.
- Include a simple instructor setting to toggle common names accepted on/off (when off, only stored IUPAC-style aliases count).

Technical/design:

- Use React + TypeScript, accessible semantic controls, Tailwind/shadcn-style design, responsive layout, no sign-in requirement, and robust localStorage.
- Use calm chemistry-inspired visual styling (navy, teal, amber; ample whitespace) with original simple line icons, not stock images.
- Do not claim native Canvas grade passback or LTI support. State that the standalone version is embed/launch-ready and that grade passback needs a later LTI integration.
- Build all screens and functional demo interactions. Seed the complete data bank in the code, not as opaque mock data.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8b820bbc-bfd8-48c8-b200-c9bd4774b3ec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## CU Launch / Azure publishing

The repository runs as a root Express app. Express serves the production files
and forwards page requests to the existing TanStack Start application.

Use Node.js 24 (24.14.1 or newer) and npm. Ketcher 3.18 requires this Node version. `package-lock.json` is the deployment
lockfile and replaces the original Bun lockfile:

```sh
npm ci
npm run build:azure
npm run test:azure
npm start
```

- Entry point: `server.js`; production startup command: `npm start`.
- The server listens on `0.0.0.0` using Azure's `PORT` environment variable
  (defaults to `3000` locally).
- The build produces `dist/client` and `dist/server`. Both folders must
  be included with `server.js`, `package.json`, and the production dependencies.
  `dist` is generated during publishing and should not be committed.
- `nitro.config.ts` prevents Nitro from treating the Express launcher as its
  own handler. `vite.config.ts` selects the Node middleware build target.
- Ketcher's WebAssembly engine is built and served locally with the app.
- No database or secret environment variables are required for student practice.
  Progress continues to be stored in the student's browser.
- `npm run dev` starts the development server; `npm run preview` starts the
  production Express server after a build.

In [CU Launch](https://launch.cedarville.edu), add the repository as an existing
GitHub app, then retry publishing preparation after these changes have been
pushed to the repository that CU Launch scans. If CU Launch has already created
its managed Cedarville copy, apply the changes to that copy as well. Let the
portal generate its Azure workflow and hosting settings.

The automated deployment test starts the production server on an assigned port
and checks the home, practice, and results routes, the stylesheet, the Ketcher
WebAssembly response, and the existing instructor and missing-page 404 behavior.

## Cloudflare Workers publishing

Use the same Node.js 24 runtime as the Azure build. `.node-version` selects
24.19.0 for Cloudflare's build environment. If the dashboard already defines
`NODE_VERSION`, set it to 24.19.0 as well.

Build command:

```sh
npm run build:cloudflare
```

Keep the existing deploy command:

```sh
npx wrangler deploy --config .output/server/wrangler.json --name organic-chem-studio
```

The Cloudflare build generates `.output/server/wrangler.json`, its Worker entry,
and static assets under `.output/public`. The Azure build continues to generate
`dist/client` and `dist/server` for `npm start`; neither target overwrites the
other target's output.

The existing `npm run build` command also selects Cloudflare automatically when
Cloudflare Workers Builds supplies `WORKERS_CI=1`. Outside that environment it
uses the Azure/Express target. Use `build:azure` or `build:cloudflare` to choose
explicitly. Lovable keeps its own publishing target through its config wrapper.

To verify both targets locally:

```sh
npm run build:azure
npm run build:cloudflare
npm run test:all
```

`npm test` and `npm run test:azure` test the production Express server after an Azure build.
`npm run test:cloudflare` checks the generated Worker configuration and Ketcher
WebAssembly assets after a Cloudflare build. Each target can be tested independently;
`npm run test:all` checks both after building both targets.
