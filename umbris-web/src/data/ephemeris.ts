/**
 * Shared ephemeris entries · the convocation's astronomical record
 * of its own revolutions. Single source of truth.
 *
 * Consumed by the homepage Ephemeris component (horizontal scroll
 * preview) and the dedicated /ephemeris timeline page when it exists.
 *
 * Add new entries at the END so the timeline reads top → bottom in
 * chronological order. The homepage component reverses for newest-first.
 */

export interface EphemerisEntry {
  date: string;
  headline: string;
  body: string;
  /** Path to a 1080×1080 artwork that represents the revolution. */
  image: string;
}

export const BUILD_LOG_START = new Date("2026-05-13T00:00:00Z");

/**
 * formatDate · render an ISO date in the UMBRIS register.
 *   "2026-05-13" → "13 MAY"
 *   "TBD"        → "TBD"
 *
 * For places with more room (the sticky indicator, the footer) you
 * can pass `withYear: true` to get "13 MAY · MMXXVI".
 */
export function formatDate(iso: string, opts: { withYear?: boolean } = {}): string {
  if (!iso || iso === "TBD") return "TBD";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const month = d.toLocaleString("en", { month: "short", timeZone: "UTC" }).toUpperCase();
  if (!opts.withYear) return `${day} ${month}`;
  const year = d.getUTCFullYear();
  const roman = toRoman(year);
  return `${day} ${month} · ${roman}`;
}

// Minimal Roman-numeral helper (handles up to 3999 · plenty).
function toRoman(n: number): string {
  if (n <= 0 || n >= 4000) return String(n);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [value, symbol] of map) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

export const EPHEMERIS_ENTRIES: EphemerisEntry[] = [
  {
    date: "2026-05-13",
    headline: "Revolution I · the founding cast",
    body: "Re-reading Bruno's De Umbris Idearum (1582) and asking why no large-language-model framework treats triangulation as a first-class discipline. A single model defending its first thought kept feeling like one shadow swearing it is the form. The seed of UMBRIS: nine planetary intelligences arguing on one substrate, none speaking to each other, all writing to the Umbra.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-15",
    headline: "Revolution II · the doctrines land",
    body: "Wrote the two Bruno doctrines into the lore tree. De Compositione Imaginum · how the convocation builds itself, sealed as the Eclipse. De Triplici Minimo · the three permanent disciplines that keep the convocation honest with itself. The hermetic register felt earned, not borrowed.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-17",
    headline: "Revolution III · the design system",
    body: "Locked @umbris/design as the single source of truth. Cosmic violet (#9C7BD9), pure void black, lunar pearl lunar, the rare warm corona flash reserved for verified visions. Albertus for the display register, EB Garamond for prose, Berkeley Mono for hashes and costs. The site is a grimoire rendered in computational chrome.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-19",
    headline: "Revolution IV · the nine planets",
    body: "Settled the nine planetary roles. Mercurius and Luna scout. Venus gathers. Mars challenges. Sol synthesises. Iuppiter adjudicates. Saturnus falsifies. Caelum acts. Umbra holds the centre as substrate. Each role got a one-line descriptor, a glyph, and a system-prompt sketch. The architecture stopped feeling provisional.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-21",
    headline: "Revolution V · umbris-core ships",
    body: "umbris-core finished end-to-end in Python. Umbra substrate, nine planetary agents, the orchestrator with the bounded verification loop, full provenance ledger in honest USD, JSONL trace output. Eighteen unit tests pass. The convocation runs against the Anthropic API and writes shadows that survive Saturnus.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-23",
    headline: "Revolution VI · the Eclipse hero",
    body: "Built the Eclipse in React Three Fiber. Pitch-black eclipsed body, violet corona ring, a cosmic nebula behind it, and a single warm corona flash at one o'clock as the only allowed concession to gold. Mouse parallax lets the visitor tilt the whole frame toward the cursor. First moment the brand felt fully alive.",
    image: "/brand/profile.png",
  },
  {
    date: "2026-05-25",
    headline: "Revolution VII · the convocation page",
    body: "Ported the full OPUS homepage stack and rewrote every voice into the Brunonian register. Manifesto, Principles, Architecture, LiveConvocation, Casting, Compositione, Ephemeris, Materials. The convocation now has a face the public can land on and understand in one scroll.",
    image: "/brand/profile.png",
  },
  {
    date: "TBD",
    headline: "Revolution N · the real convocation in the browser",
    body: "umbris-core deployed on Modal. A Vercel API route proxies via Server-Sent Events. The Live Convocation component begins consuming actual Records from a live deliberation against the Anthropic API. The demo becomes the product. Cost is honest, provenance is downloadable, every visitor can cast the convocation a real question.",
    image: "/brand/profile.png",
  },
];
