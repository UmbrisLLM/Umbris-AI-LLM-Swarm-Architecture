/**
 * /api/manifest · server-side proxy for the convocation manifest.
 *
 * The /convocation page polls THIS route every 30s instead of going
 * directly to raw.githubusercontent.com. Why · the GitHub raw URL has
 * a 5-minute CDN cache that ignores `cache: 'no-store'` from the
 * client; even with a `?t=...` cache-buster, jsdelivr-style CDN edges
 * can serve stale.
 *
 * This route runs on Vercel's edge runtime and forces `cache: 'no-store'`
 * on the upstream fetch, so the upstream cache is bypassed entirely.
 * We then set a short 10-second public cache on our response, so a
 * burst of polls from many viewers shares one upstream call but the
 * page never sees content more than ~10s stale.
 *
 * Result · a new commit to the manifest is visible on the convocation
 * page within ~30s of landing on GitHub, no more 5-minute waits.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const UPSTREAM =
  "https://raw.githubusercontent.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/main/lore/revolutions/auto/manifest.json";

export async function GET(): Promise<Response> {
  try {
    const upstream = await fetch(`${UPSTREAM}?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        // Tell GitHub raw we want fresh content
        "user-agent": "umbris-web/edge-proxy",
        "cache-control": "no-cache",
      },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          error: `upstream ${upstream.status}`,
          updated_at: new Date().toISOString(),
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        },
      );
    }

    const body = await upstream.text();

    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        // Short public cache · a burst of polls shares one upstream
        // fetch but we never serve more than 10s stale.
        "cache-control":
          "public, max-age=10, s-maxage=10, stale-while-revalidate=30",
        // Surface where the data came from for debugging
        "x-umbris-source": "github-raw",
        "x-umbris-fetched-at": new Date().toISOString(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "unknown",
        updated_at: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }
}
