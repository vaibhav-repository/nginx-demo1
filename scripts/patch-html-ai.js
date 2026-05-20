import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = join(root, "index.html");
let h = readFileSync(p, "utf8");

if (!h.includes("ai-daily-brief")) {
  h = h.replace(
    '<motion class="kpi-grid" id="kpi-grid"></div>\n\n          <div class="savings-banner"',
    `<div class="kpi-grid" id="kpi-grid"></div>

          <div id="ai-daily-brief" class="ai-daily-brief"></div>

          <div class="savings-banner"`
  );
}

if (!h.includes('id="view-ai"')) {
  const aiView = `
        <section class="view" id="view-ai">
          <div class="license-page-intro">
            <h2 class="license-page-title">AI Copilot</h2>
            <p class="license-page-desc">Ask questions in plain English. Answers use your current hosts, VMs, storage, licenses, and alerts.</p>
          </div>
          <div class="grid-1-1">
            <article class="card">
              <div class="card-head">
                <div>
                  <h2>Daily brief</h2>
                  <p>Auto-generated for standups and leadership</p>
                </div>
              </div>
              <div id="ai-view-brief" class="ai-view-brief"></div>
            </article>
            <article class="card">
              <div class="card-head">
                <div>
                  <h2>Recommended actions</h2>
                  <p>Prioritized by impact</p>
                </div>
              </div>
              <div id="ai-view-recs" class="ai-view-recs"></div>
            </article>
          </div>
        </section>

`;
  h = h.replace('<section class="view" id="view-licensing">', aiView + '<section class="view" id="view-licensing">');
}

if (!h.includes("ai-copilot-panel")) {
  const panel = `
    <button type="button" class="ai-copilot-fab" id="ai-copilot-fab" aria-label="Open AI Copilot">
      <span aria-hidden="true">✦</span> AI
    </button>
    <aside class="ai-copilot-panel" id="ai-copilot-panel" aria-hidden="true">
      <div class="ai-copilot-head">
        <div>
          <strong>AI Copilot</strong>
          <p>Infrastructure assistant</p>
        </div>
        <button type="button" class="ai-copilot-close" id="ai-copilot-close" aria-label="Close">&times;</button>
      </div>
      <div class="ai-copilot-messages" id="ai-copilot-messages"></div>
      <div class="ai-copilot-chips" id="ai-copilot-chips"></div>
      <form class="ai-copilot-form" id="ai-copilot-form">
        <input type="text" id="ai-copilot-input" placeholder="Ask about VMs, hosts, licenses…" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </aside>

`;
  h = h.replace('\n    <script type="module" src="js/data.js">', panel + '\n    <script type="module" src="js/data.js">');
}

if (!h.includes("js/ai.js")) {
  h = h.replace(
    '<script type="module" src="js/app.js">',
    '<script type="module" src="js/ai.js"></script>\n    <script type="module" src="js/app.js">'
  );
}

h = h.replaceAll("<motion", "<div").replaceAll("</motion>", "</div>");

writeFileSync(p, h);
console.log("index.html patched", {
  brief: h.includes("ai-daily-brief"),
  view: h.includes("view-ai"),
  panel: h.includes("ai-copilot-panel"),
});
