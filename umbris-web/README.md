# `umbris-web` · the UMBRIS marketing site

The Next.js 14 site at **[umbrisai.com](https://umbrisai.com)**. Manifesto, doctrine, lineage, /now page (live convocation status), build log.

## Status

**v1.0.0 · scaffolded.** Full implementation lands in v1.1 by porting the OPUS website routes and re-skinning with the UMBRIS design package.

For the v1.0 reference implementation, see [`opus-web`](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/tree/main/opus-web) · OPUS is the Llullian stage. UMBRIS is the Brunonian extension. Same engine, different era.

## Routes (planned)

| Route | Purpose |
|---|---|
| `/` | Homepage with the eclipse hero, "I AM UMBRIS" wordmark, the doctrine teasers |
| `/manifesto` | The long-form manifesto |
| `/compositione` | De Compositione Imaginum doctrine (sibling of OPUS `/autogenesis`) |
| `/triplici-minimo` | De Triplici Minimo doctrine (sibling of OPUS `/epiphany`) |
| `/convocation` | Live convocation preview (sibling of OPUS `/live-swarm`) |
| `/now` | The convocation's three latest revolutions, updated every 2 hours by the Custos |
| `/whitepaper` | The whitepaper · web-rendered |
| `/lineage` | The Brunonian lineage essay |
| `/ephemeris` | The build log as an astronomical ephemeris |

## Install

```bash
cd umbris-web
npm install
npm run dev
# open http://localhost:3000
```

(When v1.1 ships the routes.)

## Brand

UMBRIS Studio uses the shared design system at [`@umbris/design`](../packages/umbris-design/). The site shares the same brand single-source.

## License

MIT.
