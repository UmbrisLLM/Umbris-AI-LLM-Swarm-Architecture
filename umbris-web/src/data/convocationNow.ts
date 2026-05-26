/**
 * convocationNow — the three latest revolutions the convocation has surfaced.
 *
 * Single source of truth for the /now page.
 *
 * Rules:
 *   1. Never more than three entries at a time.
 *   2. Newest entries first.
 *   3. When a fourth entry is added, the oldest one is removed.
 *   4. Every "shipped" entry must have a real commitHash on the main
 *      branch of the public repository — the page is provable, not
 *      decorative.
 *   5. The Custos sentinel (when v1.1 lands) writes between vigilia
 *      markers in this file to keep the page autonomous.
 */

export type RevolutionStatus = "in-progress" | "shipped";

export interface CandidateOption {
  label: string;
  thesis: string;
}

export interface Revolution {
  numeral: string;
  title: string;
  description: string;
  status: RevolutionStatus;
  date: string;
  commitHash?: string;
  loreRef?: string;
  candidates?: CandidateOption[];
  decideIn?: string;
}

export const REPO_BASE =
  "https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture";

export const CONVOCATION_NOW: Revolution[] = [
  {
    numeral: "I",
    title: "UMBRIS · Opening the Convocation",
    description:
      "The founding revolution. The Brunonian sibling of OPUS opens its own repository, ships its doctrines (De Compositione Imaginum + De Triplici Minimo), publishes the whitepaper, and commits to the three permanent disciplines. The convocation has cast its first shadow.",
    status: "shipped",
    date: "2026-05-26",
    commitHash: "5e24119",
    loreRef: "lore/revolutions/2026-05-26_opening-the-convocation.md",
  },
  {
    numeral: "II",
    title: "The website lands · tryumbris.com goes live",
    description:
      "The marketing site ships under UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/umbris-web. Eclipse hero on the homepage, all three doctrine routes (compositione, triplici-minimo, manifesto), the live /now page, full Brunonian register from top to bottom.",
    status: "in-progress",
    date: "2026-05-26",
    decideIn: "the present revolution",
  },
  {
    numeral: "III",
    title: "v1.1 work item · port the engine, the Studio, the Custos",
    description:
      "Three engineering ports remain: umbris-core (Python convocation engine), umbris-studio (Tauri + Next.js HUD with the Sphere of Shadows), and the Custos autonomous sentinel running every 2 hours via GitHub Actions. The doctrine and the brand are in. The execution layer follows.",
    status: "in-progress",
    date: "2026-05-26",
    decideIn: "v1.1 release window",
  },
];
