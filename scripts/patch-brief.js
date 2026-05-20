import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const p = join(dirname(fileURLToPath(import.meta.url)), "..", "index.html");
let h = readFileSync(p, "utf8");
if (!h.includes("ai-daily-brief")) {
  h = h.replace(
    /(<div class="kpi-grid" id="kpi-grid"><\/div>)/,
    `$1\n\n          <div id="ai-daily-brief" class="ai-daily-brief"></div>`
  );
  writeFileSync(p, h);
  console.log("added brief");
} else {
  console.log("already has brief");
}
