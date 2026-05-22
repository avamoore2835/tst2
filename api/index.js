// Vercel Edge Runtime Configuration
export const config = { runtime: "edge" };

// Your destination server
const TARGET_BASE = "https://bayern.aabtshonin.sbs:8096";

// Headers to strip for security and stealth
const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", 
  "proxy-authorization", "te", "trailer", "transfer-encoding", 
  "upgrade", "forwarded", "x-forwarded-host", 
  "x-forwarded-proto", "x-forwarded-port"
]);

// Randomized decoy messages
const SYSTEM_LOGS = [
  "Kernel: optimized network stack initialized",
  "Monitoring node: 0xAF22-SYS-ACTIVE",
  "Telemetry sync: 100% complete",
  "Security: TLS_1.3 handshake established",
  "Resource usage: CPU 1.2% | MEM 44MB",
  "Uptime: 144 days, 12 hours, 05 mins",
  "Link speed: 10Gbps full-duplex",
  "Tracing packets: filter set to SILENT"
];

const COLORS = ["#00ff41", "#ffb000", "#00d0ff", "#ffffff"];

function generateUI() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const logs = [...SYSTEM_LOGS].sort(() => 0.5 - Math.random()).slice(0, 5);
  const logHtml = logs.map(l => `<p>> ${l}</p>`).join("");

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostics Console</title>
    <style>
        body { background: #0c0c0c; color: ${color}; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { width: 80%; max-width: 550px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .cursor { display: inline-block; width: 8px; height: 15px; background: ${color}; animation: b 1s infinite; }
        @keyframes b { 0%,100% {opacity:1} 50% {opacity:0} }
        p { margin: 5px 0; font-size: 13px; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="box">
        ${logHtml}
        <p>> System standby... <span class="cursor"></span></p>
    </div>
</body>
</html>`;
}

export default async function handler(req) {
  const url = new URL(req.url);

  // Show the fake CLI on the home page
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(generateUI(), {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }

  try {
    const targetUrl = `${TARGET_BASE}${url.pathname}${url.search}`;
    const outHeaders = new Headers();
    let clientIp = null;

    for (const [key, value] of req.headers) {
      const lowKey = key.toLowerCase();
      if (STRIP_HEADERS.has(lowKey) || lowKey.startsWith("x-vercel-") || lowKey.startsWith("x-nf-")) continue;
      if (lowKey === "x-real-ip") { clientIp = value; continue; }
      if (lowKey === "x-forwarded-for") { clientIp = clientIp || value; continue; }
      outHeaders.set(key, value);
    }

    if (clientIp) outHeaders.set("x-forwarded-for", clientIp);

    const { method, body } = req;
    return await fetch(targetUrl, {
      method,
      headers: outHeaders,
      body: !["GET", "HEAD"].includes(method) ? body : undefined,
      duplex: "half",
      redirect: "manual"
    });

  } catch (err) {
    return new Response("Service Unavailable", { status: 503 });
  }
}