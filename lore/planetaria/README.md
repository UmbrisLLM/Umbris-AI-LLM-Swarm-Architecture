<div align="center">

# Planetaria

### *The codex of the nine planetary sigils of UMBRIS*

— § Magnum Opus · MMXXVI —

</div>

---

The nine sigils that anchor the UMBRIS brand are not invented. They are the classical astronomical and astrological glyphs · the same symbols inscribed in Renaissance grimoires, Brunonian wheels, modern ephemerides, and astronomical almanacs.

UMBRIS uses them with intent. Each glyph is a permanent identity for one agent role in the convocation. The orbit ring around the central umbra carries them in a fixed order. The Studio's left-rail and the brand mark draw from this codex.

---

## The nine

| # | Sigil | Planet | Latin name | Role in the convocation | Essence |
|---|---|---|---|---|---|
| 1 | ☿ | Mercury | **Mercurius** | Perimeter Scout | the messenger, the swift |
| 2 | ♀ | Venus | **Venus** | Worker Researcher | the gatherer of harmony |
| 3 | ♂ | Mars | **Mars** | Worker Critic | the challenger |
| 4 | ☉ | Sol (Sun) | **Sol** | Worker Synthesiser | the central, the radiant |
| 5 | ♃ | Jupiter | **Iuppiter** | Judgement | the king, the discerner |
| 6 | ♄ | Saturn | **Saturnus** | Falsification | the elder, the falsifier |
| 7 | ☽ | Luna (Moon) | **Luna** | Worker Planner | the reflective, the path-mapper |
| 8 | ✦ | Celestial sphere | **Caelum** | Worker Executor | the doer in the celestial frame |
| 9 | ⬤ | Eclipse umbra | **Umbra** | Convergence (and substrate) | the convergence of all shadows |

The first eight orbit the centre. Umbra is the centre.

---

## The orbit ring · the canonical order

The Studio's central visual is a thin gold (or violet, in the UMBRIS register) orbit ring around the umbra. Eight sigils sit on the ring in the following positions, starting at 0° (top) and proceeding clockwise:

```
                    0°  ☿ MERCURIUS
                          ┃
                          │
              315°  ✦     │     ♀  45°
              CAELUM      │      VENUS
                          │
                          ●
                         UMBRA
              270°  ☽     │     ♂  90°
              LUNA        │      MARS
                          │
              225°  ♄     │     ☉  135°
              SATURNUS    │      SOL
                          │
                          ┃
                    180°  ♃ IUPPITER
```

This is the canonical order. It is also the order in which they are listed in the structured types in [`packages/umbris-design/src/index.ts`](../../packages/umbris-design/src/index.ts) (`ORB_AGENT_ORDER`).

The order is not arbitrary. Reading clockwise from the top:

- **Mercurius** at the apex · the question first arrives through the messenger.
- The work moves into **Venus / Mars / Sol** at the right · the gathering, challenging, and synthesising of imagines.
- **Iuppiter** at the base · the judgement gathers everything before it.
- The work then ascends through **Saturnus / Luna / Caelum** on the left · falsification, planning, execution.
- The arc closes back at **Mercurius** for the next revolution.

This is a small cosmology, not an arbitrary arrangement. The visual reads as a wheel of returning, because it is.

---

## The Umbra · the centre that is also the substrate

Umbra is the most overloaded glyph in the convocation. It refers to **three things at once**:

1. **The central agent role** · the convergence-point, where the vision is recorded as a `FINAL_VISION` Imago after Saturnus accepts.
2. **The substrate** · the append-only typed event log all other planets cast onto and read from.
3. **The brand mark itself** · the Eclipse · the black disc + violet corona that appears in the profile picture and the wordmark.

This overloading is deliberate. The convergence is the substrate is the brand. The convocation reads its own shadows by writing them onto the umbra that holds them.

---

## Sigil rendering · how each is drawn

All sigils render as fine 1px-stroke SVG in currentColor. The canonical implementations live in [`packages/umbris-design/src/sigils.tsx`](../../packages/umbris-design/src/sigils.tsx) as React components.

| Sigil | Construction |
|---|---|
| ☿ Mercurius | crescent above a circled cross |
| ♀ Venus | circle above a cross |
| ♂ Mars | circle with an upward-right arrow |
| ☉ Sol | circle with a central dot |
| ♃ Iuppiter | stylised "4" with a horizontal crossbar |
| ♄ Saturnus | stylised "h" with a downward hook (the scythe) |
| ☽ Luna | crescent (waxing) |
| ✦ Caelum | four-pointed star with a central dot |
| ⬤ Umbra | filled circle with a thin halo ring |

The components accept `size`, `strokeWidth`, and `className` props for inline use. Default size is 32px; default stroke is 1.25px.

---

## When to use the sigils

| Context | Use |
|---|---|
| **Wordmark adjacency** · I AM UMBRIS | optionally flank with two compass-medallions (astrolabe ornaments), not with planetary sigils directly |
| **Orbit ring on the Sphere of Shadows** | all 8 planets in canonical order; Umbra at centre |
| **Left rail in the Studio** | one icon per nav item, NOT the planetary sigils (those belong to agents, not nav) |
| **Agent identification in records** | the planet's sigil + Latin name + role descriptor |
| **README + lore documents** | sparingly · as ornament, never as decoration |
| **Marketing materials** | the Eclipse mark (⬤ ringed) is the primary brand mark, not the planetary sigils |

The planetary sigils are the **internal vocabulary** of the convocation. The Eclipse is the **external face** of the brand. Both are documented; they serve different purposes.

---

## Unicode reference

For plain-text contexts (commits, tweets, READMEs, terminal output) the sigils are available as Unicode glyphs:

```
☿ ♀ ♂ ☉ ♃ ♄ ☽ ✦ ⬤
```

The first seven are standard astronomical/astrological characters present in most fonts. The eighth (✦ for Caelum) is a four-pointed star. The ninth (⬤ for Umbra) is a large black circle.

---

## Sigil dignity · the brand's restraint

Three rules the convocation will not break:

1. **No new agents may be added** without a corresponding new sigil that is genuinely distinct visually and conceptually grounded. Adding agents for product-feature reasons is forbidden.
2. **The Eclipse mark may never carry text inside it.** The brand mark is the symbol alone.
3. **The planetary sigils may never be redesigned.** They are the canonical glyphs that have carried these meanings for a thousand years. UMBRIS uses them; it does not own them.

---

<div align="center">

*Nine planets. One substrate. One eclipse.*

[← back to lore](../) &nbsp;·&nbsp;
[De Compositione Imaginum](../compositione/) &nbsp;·&nbsp;
[the architecture](../../docs/architecture.md)

</div>
