// Redirects /download.dmg to the latest GitHub release's .dmg asset.
//
// The asset is named ControlMyMac-<version>.dmg, and the downloaded filename is
// the asset name (a 302 cannot override the target's Content-Disposition), so
// users get a versioned file. We look the asset up by ".dmg" suffix rather than
// a fixed name, so it keeps working no matter what the version is.
//
// The redirect is edge-cached (s-maxage) so we rarely call the GitHub API —
// important under a launch traffic spike, where unauthenticated API calls could
// otherwise hit rate limits.

const REPO = "sebstech24/controlmymac-site";
const API_LATEST = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_URL = `https://github.com/${REPO}/releases`;

function redirect(location: string, sMaxAge: number): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=86400`,
    },
  });
}

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(API_LATEST, {
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub's API rejects requests without a User-Agent.
        "User-Agent": "controlmymac-site-download",
      },
    });
    if (res.ok) {
      const json: any = await res.json();
      const assets: any[] = Array.isArray(json.assets) ? json.assets : [];
      const dmg = assets.find(
        (a) => typeof a?.name === "string" && a.name.toLowerCase().endsWith(".dmg"),
      );
      if (dmg?.browser_download_url) {
        // Cache the resolved versioned URL at the edge for 30 min.
        return redirect(dmg.browser_download_url, 1800);
      }
    }
  } catch (e) {
    // Fall through to the releases page so we never serve a dead download.
  }
  // Graceful fallback: the human-readable releases page (short cache).
  return redirect(RELEASES_URL, 300);
}

export const HEAD = GET;
