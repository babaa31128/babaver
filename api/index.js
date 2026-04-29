export const config = { runtime: "edge" };

const __T = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

const __H = new Set([
  "host","connection","keep-alive","proxy-authenticate","proxy-authorization",
  "te","trailer","transfer-encoding","upgrade","forwarded",
  "x-forwarded-host","x-forwarded-proto","x-forwarded-port"
]);

export default async function __h(rq) {
  if (!__T) {
    return new Response("Misconfigured: TARGET_DOMAIN is not set", { status: 500 });
  }

  try {
    const i = rq.url.indexOf("/", 8);
    const u = i < 0 ? __T + "/" : __T + rq.url.slice(i);

    const h = new Headers();
    let ip;

    for (const entry of rq.headers.entries()) {
      const k = entry[0], v = entry[1];

      if (__H.has(k) || k.startsWith("x-vercel-")) continue;

      if (k === "x-real-ip" || k === "x-forwarded-for") {
        if (!ip) ip = v;
        continue;
      }

      h.set(k, v);
    }

    if (ip) h.set("x-forwarded-for", ip);

    const m = rq.method;
    const b = (m === "GET" || m === "HEAD") ? undefined : rq.body;

    return await fetch(u, {
      method: m,
      headers: h,
      body: b,
      duplex: "half",
      redirect: "manual"
    });

  } catch (e) {
    console.error("relay error:", e);
    return new Response("Bad Gateway: Tunnel Failed", { status: 502 });
  }
}
