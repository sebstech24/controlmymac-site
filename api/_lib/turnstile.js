export async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.VERCEL_ENV !== "production";
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: remoteIp || undefined,
    }),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}
