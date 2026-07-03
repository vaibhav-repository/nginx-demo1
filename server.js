import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { answerCopilotQuestion } from "./js/ai.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const VM_INVENTORY_PATH = join(__dirname, "data", "vm-inventory.json");

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const pathname = (req.url || "/").split("?")[0];

  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "esxi-dashboard" });
    return;
  }

  if (pathname === "/api/vms" && req.method === "GET") {
    try {
      const raw = await readFile(VM_INVENTORY_PATH, "utf8");
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.vms;
      if (!Array.isArray(list) || list.length === 0) {
        sendJson(res, 200, {
          source: "demo",
          vms: null,
          message: "vm-inventory.json exists but `vms` is empty or invalid. Using UI demo data.",
        });
        return;
      }
      sendJson(res, 200, {
        source: "inventory",
        vms: list,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      sendJson(res, 200, {
        source: "demo",
        vms: null,
        message: "No data/vm-inventory.json — UI uses built-in demo VMs. Copy data/vm-inventory.example.json to data/vm-inventory.json.",
      });
    }
    return;
  }

  if (pathname === "/api/ai/ask" && req.method === "POST") {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const question = String(body.question || "").trim();
      if (!question) {
        sendJson(res, 400, { error: "question is required" });
        return;
      }
      sendJson(res, 200, {
        answer: answerCopilotQuestion(question),
        engine: "vsphere-insight-local",
      });
    } catch (e) {
      sendJson(res, 500, { error: "Failed to process question", detail: String(e.message) });
    }
    return;
  }

  let filePath = pathname === "/" ? "/index.html" : pathname;
  const abs = join(__dirname, filePath);

  try {
    const data = await readFile(abs);
    res.writeHead(200, { "Content-Type": MIME[extname(abs)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, HOST, () => {
  console.log(`vSphere Insight → http://localhost:${PORT}`);
  console.log(`  GET /api/health  — backend check`);
  console.log(`  GET /api/vms     — load data/vm-inventory.json (optional)`);
  console.log(`  POST /api/ai/ask — AI copilot (local intelligence)`);
});
