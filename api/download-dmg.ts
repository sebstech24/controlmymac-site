const DIRECT_DMG_URL =
  "https://github.com/sebstech24/controlmymac-site/releases/latest/download/ControlMyMac.dmg";
const RELEASES_URL = "https://github.com/sebstech24/controlmymac-site/releases";

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(DIRECT_DMG_URL, {
      method: "HEAD",
      redirect: "manual",
    });
    if (res.status >= 200 && res.status < 400) {
      return Response.redirect(DIRECT_DMG_URL, 302);
    }
  } catch (e) {
    // Fall through to the releases page; do not expose a dead download.
  }

  return Response.redirect(RELEASES_URL, 302);
}

export const HEAD = GET;
