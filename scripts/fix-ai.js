import { readFileSync, writeFileSync } from "fs";

const p = new URL("../js/ai.js", import.meta.url);
let s = readFileSync(p, "utf8");

s = s.replace(
  /  `\n    \.replaceAll\("<div", "<div"\)\n    \.replaceAll\("<\/div>", "<\/motion>"\);\n}/,
  "  `;\n  document.getElementById(\"ai-regen-brief\")?.addEventListener(\"click\", renderAiDailyBrief);\n}"
);

s = s.replace(
  /    div\.innerHTML = role === "user" \? `<p>\$\{html\}<\/p>` : `<div class="ai-msg-body">\$\{mdToHtml\(html\)\}<\/div>`;\n    if \(role === "assistant"\) div\.innerHTML = `<motion class="ai-msg-body">\$\{mdToHtml\(html\)\}<\/motion>`;/,
  `    if (role === "user") {
      div.innerHTML = \`<p>\${html.replace(/</g, "&lt;")}</p>\`;
    } else {
      div.innerHTML = \`<div class="ai-msg-body">\${mdToHtml(html)}</motion>\`;
    }`
);

writeFileSync(p, s);
console.log("fixed");
