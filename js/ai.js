import {
  hosts,
  vms,
  datastores,
  alerts,
  getClusterStats,
  getEstimatedSavings,
  getSmartLicenseAlerts,
  getLicenseCalendarEvents,
  getVmInventorySource,
} from "./data.js";

const SUGGESTED_QUESTIONS = [
  "What should I fix first today?",
  "Which VMs are under the most stress?",
  "Summarize license renewals for leadership",
  "Are we wasting money on licenses or cloud?",
  "Which host needs attention?",
];

/** Gather live platform state for AI reasoning (no external API required). */
export function buildPlatformContext() {
  const stats = getClusterStats();
  const savings = getEstimatedSavings();
  const licenseAlerts = getSmartLicenseAlerts().filter((a) => a.tier !== "safe");
  const calendar = getLicenseCalendarEvents();
  const hotVms = [...vms]
    .filter((v) => v.power === "poweredOn")
    .sort((a, b) => b.cpu + b.mem - (a.cpu + a.mem))
    .slice(0, 5);
  const hotHosts = [...hosts].sort((a, b) => b.cpu + b.memory - (a.cpu + a.memory));
  const storageRisk = datastores
    .map((d) => ({ name: d.name, pct: Math.round((d.used / d.capacity) * 100) }))
    .filter((d) => d.pct >= 80);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  return {
    stats,
    savings,
    licenseAlerts,
    nextRenewal: calendar[0] || null,
    hotVms,
    hotHosts,
    storageRisk,
    criticalAlerts,
    vmSource: getVmInventorySource(),
    poweredOn: vms.filter((v) => v.power === "poweredOn").length,
  };
}

export function generateDailyBrief() {
  const ctx = buildPlatformContext();
  const lines = [];
  const { stats, hotHosts, hotVms, criticalAlerts, licenseAlerts, savings, storageRisk } = ctx;

  lines.push(
    `Your cluster has **${stats.hosts} hosts** and **${stats.vms} VMs** (${ctx.poweredOn} powered on). Overall health score is **${stats.health}%** with average CPU **${stats.avgCpu}%** and memory **${stats.avgMem}%**.`
  );

  if (criticalAlerts.length) {
    lines.push(
      `**${criticalAlerts.length} critical alert(s)** need immediate ops focus — top item: *${criticalAlerts[0].title}* on ${criticalAlerts[0].source}.`
    );
  }

  const warnHost = hotHosts.find((h) => h.status === "warning" || h.cpu >= 75 || h.memory >= 80);
  if (warnHost) {
    lines.push(
      `Host **${warnHost.name.split(".")[0]}** is under pressure (CPU ${warnHost.cpu}%, memory ${warnHost.memory}%). Consider vMotion or capacity review before adding workloads.`
    );
  }

  if (hotVms.length && hotVms[0].cpu >= 70) {
    lines.push(
      `Highest VM load: **${hotVms[0].name}** at ${hotVms[0].cpu}% CPU / ${hotVms[0].mem}% memory on ${hotVms[0].host.split(".")[0]}.`
    );
  }

  if (storageRisk.length) {
    lines.push(
      `Storage risk on **${storageRisk.map((s) => `${s.name} (${s.pct}%)`).join(", ")}** — plan cleanup or expansion this quarter.`
    );
  }

  if (licenseAlerts.length) {
    const top = licenseAlerts[0];
    lines.push(
      `Licensing: **${licenseAlerts.length} contract(s)** in critical/warning window. Next priority: *${top.headline}* (${top.days} days).`
    );
  }

  lines.push(
    `FinOps estimate: about **$${savings.monthlyUsd.toLocaleString()}/month** saved vs a public-cloud benchmark for current VM sizing (tune assumptions in data).`
  );

  return lines;
}

export function generateRecommendations(view = "overview") {
  const ctx = buildPlatformContext();
  const items = [];

  const add = (priority, title, body, action) => {
    items.push({ priority, title, body, action });
  };

  if (view === "overview" || view === "hosts") {
    const h = ctx.hotHosts[0];
    if (h && (h.cpu >= 70 || h.memory >= 75)) {
      add(
        "high",
        "Balance host load",
        `${h.name.split(".")[0]} is at ${h.cpu}% CPU and ${h.memory}% memory. Use DRS or move noisy VMs before peak hours.`,
        { goto: "hosts" }
      );
    }
  }

  if (view === "overview" || view === "vms") {
    const stressed = vms.filter((v) => v.power === "poweredOn" && (v.cpu >= 80 || v.mem >= 85));
    stressed.slice(0, 2).forEach((v) => {
      add(
        "high",
        `Right-size or scale ${v.name}`,
        `Running at ${v.cpu}% CPU / ${v.mem}% memory. Check ready time, add vCPU/RAM, or split the workload.`,
        { goto: "vms" }
      );
    });
    const off = vms.filter((v) => v.power === "poweredOff");
    if (off.length) {
      add(
        "medium",
        "Reclaim idle VMs",
        `${off.length} VM(s) powered off — archive or delete if not needed for DR/testing to reduce clutter and license noise.`,
        { goto: "vms" }
      );
    }
  }

  if (view === "overview" || view === "storage") {
    ctx.storageRisk.forEach((s) => {
      add(
        "high",
        `Expand or reclaim ${s.name}`,
        `Datastore is ${s.pct}% full. Run storage reclamation, delete snapshots, or approve capacity purchase.`,
        { goto: "storage" }
      );
    });
  }

  if (view === "overview" || view === "licensing" || view === "alerts") {
    ctx.licenseAlerts.slice(0, 2).forEach((la) => {
      add(
        la.tier === "critical" ? "high" : "medium",
        `Renewal: ${la.contractId}`,
        la.detail.replace(/\*\*/g, ""),
        { goto: "licensing" }
      );
    });
  }

  if (view === "overview" || view === "alerts") {
    ctx.criticalAlerts.forEach((a) => {
      add("high", a.title, a.message, { goto: "alerts" });
    });
  }

  if (view === "overview" && ctx.savings.monthlyUsd > 0) {
    add(
      "low",
      "Validate FinOps assumptions",
      `Dashboard shows ~$${ctx.savings.monthlyUsd.toLocaleString()}/mo savings vs cloud list. Share with finance if renewal or cloud migration is on the agenda.`,
      { goto: "overview" }
    );
  }

  if (!items.length) {
    add(
      "low",
      "No urgent AI flags",
      "Utilization, alerts, and renewals look stable. Keep monitoring and refresh after vCenter sync.",
      null
    );
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 5);
}

export function explainAlert(alertId) {
  const a = alerts.find((x) => x.id === alertId);
  if (!a) return "Alert not found.";

  if (a.severity === "critical" && a.title.toLowerCase().includes("memory")) {
    return `**What it means:** A host is running out of free memory, so VMs may balloon, swap, or fail to power on.\n\n**Likely cause:** Memory overcommit, a spike on ${a.source}, or missing reservations on large VMs.\n\n**What to do:** 1) Check host memory in vCenter. 2) vMotion the top consumers off this host. 3) Add RAM or hosts if trend persists. 4) Review memory reservations and limits.`;
  }
  if (a.title.toLowerCase().includes("datastore")) {
    return `**What it means:** A datastore is nearing capacity; new disks and snapshots may fail.\n\n**What to do:** Delete old snapshots, move VMs to another datastore, or expand the LUN/vSAN policy. Plan change window if production growth continues.`;
  }
  if (a.title.toLowerCase().includes("cpu ready")) {
    return `**What it means:** The VM is waiting for CPU time on the host (contention), not necessarily that the guest OS is at 100%.\n\n**What to do:** Check host CPU%, co-located heavy VMs, and CPU reservations. Consider fewer vCPUs (right-sizing) or moving the VM to a quieter host.`;
  }
  return `**Summary:** ${a.message}\n\n**Suggested next step:** Open ${a.source} in vCenter, confirm metric trend for 15+ minutes, then apply your runbook for "${a.title}". Escalate if customer-facing workloads are affected.`;
}

/** Natural-language Q&A over inventory (local intelligence; swap for LLM via /api/ai/ask later). */
export function answerCopilotQuestion(question) {
  const q = question.trim().toLowerCase();
  if (!q) return "Ask anything about your hosts, VMs, storage, licenses, or alerts.";

  const ctx = buildPlatformContext();
  const { stats, hotHosts, hotVms, savings, licenseAlerts, storageRisk, criticalAlerts } = ctx;

  if (/fix first|priority|urgent|today|what should/.test(q)) {
    const recs = generateRecommendations("overview").filter((r) => r.priority === "high");
    if (!recs.length) return "Nothing critical right now. Monitor host **" + hotHosts[0]?.name.split(".")[0] + "** and refresh after the next sync.";
    return recs.map((r, i) => `**${i + 1}. ${r.title}** — ${r.body}`).join("\n\n");
  }

  if (/summar|brief|overview|status|health/.test(q)) {
    return generateDailyBrief().join("\n\n");
  }

  if (/vm|virtual machine|guest/.test(q)) {
    if (/stress|hot|high|cpu|memory|worst/.test(q)) {
      if (!hotVms.length) return "No powered-on VMs in inventory.";
      return hotVms
        .map(
          (v, i) =>
            `**${i + 1}. ${v.name}** — ${v.cpu}% CPU, ${v.mem}% mem, ${v.vcpu} vCPU / ${v.ram} GB on ${v.host.split(".")[0]}`
        )
        .join("\n");
    }
    if (/how many|count/.test(q)) {
      return `You have **${stats.vms}** VMs total, **${ctx.poweredOn}** powered on. Data source: **${ctx.vmSource}** inventory.`;
    }
    return `**${stats.vms}** VMs (${ctx.poweredOn} on). Top by utilization: **${hotVms[0]?.name || "n/a"}**. Open the Virtual Machines tab for the full table.`;
  }

  if (/host|esxi|hypervisor/.test(q)) {
    const h = hotHosts[0];
    return hosts
      .map(
        (x) =>
          `**${x.name.split(".")[0]}** — ${x.status}, CPU ${x.cpu}%, mem ${x.memory}%, ${x.vms} VMs`
      )
      .join("\n") + (h ? `\n\n**Focus:** ${h.name.split(".")[0]} has the highest combined load.` : "");
  }

  if (/license|renewal|subscription|contract/.test(q)) {
    if (/leadership|director|executive|summary/.test(q)) {
      const cal = getLicenseCalendarEvents().slice(0, 3);
      return (
        `**License summary for leadership:**\n` +
        cal
          .map(
            (e) =>
              `• **${e.product} (${e.edition})** — ${e.daysRemaining} days, ${e.utilizationPct}% of licensed cores used, **$${e.annualCostUsd.toLocaleString()}/yr**`
          )
          .join("\n") +
        (licenseAlerts.length
          ? `\n\n**Action:** ${licenseAlerts.length} contract(s) need attention before renewal windows close.`
          : "")
      );
    }
    if (licenseAlerts.length) {
      return licenseAlerts
        .slice(0, 3)
        .map((a) => `**${a.tier.toUpperCase()}** — ${a.headline}: ${a.detail.replace(/\*\*/g, "")}`)
        .join("\n\n");
    }
    return "No licenses in critical or 30-day warning window. Check the Licensing tab for the full renewal calendar.";
  }

  if (/cost|save|money|finops|spend|cloud/.test(q)) {
    return `Estimated **$${savings.monthlyUsd.toLocaleString()}/month** (~**$${savings.annualUsd.toLocaleString()}/year**) vs a public-cloud list benchmark for your powered-on workloads. Cloud-equivalent list price ~**$${savings.cloudBenchmarkMonthly.toLocaleString()}/mo** before your on-prem savings factor.`;
  }

  if (/storage|datastore|disk|capacity/.test(q)) {
    if (!storageRisk.length) return "No datastore is above 80% in current data.";
    return storageRisk
      .map((s) => `**${s.name}** is **${s.pct}%** full — plan expansion or reclamation.`)
      .join("\n");
  }

  if (/alert|incident|problem/.test(q)) {
    if (!alerts.length) return "No alerts in the feed.";
    return alerts
      .map((a) => `**[${a.severity}]** ${a.title} — ${a.message} (*${a.time}*)`)
      .join("\n");
  }

  const vmMatch = vms.find((v) => q.includes(v.name.toLowerCase()));
  if (vmMatch) {
    return `**${vmMatch.name}** is **${vmMatch.power === "poweredOn" ? "powered on" : "off"}** on ${vmMatch.host}, ${vmMatch.vcpu} vCPU / ${vmMatch.ram} GB RAM. Usage: ${vmMatch.cpu}% CPU, ${vmMatch.mem}% memory. Guest: ${vmMatch.guest}. Datastore: ${vmMatch.datastore}.`;
  }

  return (
    "I can help with priorities, VM/host stress, storage, licenses, costs, and alerts. Try:\n" +
    SUGGESTED_QUESTIONS.map((s) => `• ${s}`).join("\n")
  );
}

function mdToHtml(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export function renderAiDailyBrief() {
  const el = document.getElementById("ai-daily-brief");
  if (!el) return;
  const lines = generateDailyBrief();
  el.innerHTML = `
    <div class="ai-brief-inner">
      <div class="ai-brief-head">
        <span class="ai-spark" aria-hidden="true">✦</span>
        <div>
          <h2 id="ai-brief-title">AI daily brief</h2>
          <p>Plain-language summary from your live inventory</p>
        </div>
        <button type="button" class="ai-regen-btn" id="ai-regen-brief" title="Regenerate brief">Refresh</button>
      </div>
      <div class="ai-brief-body">${lines.map((l) => `<p>${mdToHtml(l)}</p>`).join("")}</div>
    </div>
  `;
  document.getElementById("ai-regen-brief")?.addEventListener("click", renderAiDailyBrief);
}

export function renderAiContextStrip(view) {
  const el = document.getElementById("ai-context-strip");
  if (!el) return;
  const recs = generateRecommendations(view);
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="ai-strip-inner">
      <span class="ai-strip-label"><span class="ai-spark">✦</span> AI suggestions</span>
      <ul class="ai-strip-list">
        ${recs
          .map(
            (r) => `
          <li class="ai-strip-item ai-strip-item--${r.priority}">
            <strong>${r.title}</strong>
            <span>${r.body}</span>
            ${
              r.action?.goto
                ? `<button type="button" class="ai-strip-go" data-goto="${r.action.goto}">Open →</button>`
                : ""
            }
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;
  el.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("goto-view", { detail: btn.dataset.goto }));
    });
  });
}

let copilotHistory = [];

export function initAiCopilot() {
  const panel = document.getElementById("ai-copilot-panel");
  const fab = document.getElementById("ai-copilot-fab");
  const closeBtn = document.getElementById("ai-copilot-close");
  const form = document.getElementById("ai-copilot-form");
  const input = document.getElementById("ai-copilot-input");
  const messages = document.getElementById("ai-copilot-messages");
  const chips = document.getElementById("ai-copilot-chips");

  if (!panel || !fab) return;

  const open = () => {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    input?.focus();
  };
  const close = () => {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  };

  fab.addEventListener("click", () => (panel.classList.contains("open") ? close() : open()));
  closeBtn?.addEventListener("click", close);

  if (chips) {
    chips.innerHTML = SUGGESTED_QUESTIONS.map(
      (q) => `<button type="button" class="ai-chip" data-q="${q.replace(/"/g, "&quot;")}">${q}</button>`
    ).join("");
    chips.querySelectorAll(".ai-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (input) input.value = btn.dataset.q || "";
        submitCopilotQuestion(btn.dataset.q || "");
      });
    });
  }

  function appendMessage(role, html) {
    if (!messages) return;
    const div = document.createElement("div");
    div.className = `ai-msg ai-msg--${role}`;
    if (role === "user") {
      div.innerHTML = `<p>${html.replace(/</g, "&lt;")}</p>`;
    } else {
      div.innerHTML = `<div class="ai-msg-body">${mdToHtml(html)}</div>`;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function submitCopilotQuestion(text) {
    const q = (text || input?.value || "").trim();
    if (!q) return;
    if (input) input.value = "";
    appendMessage("user", q);
    copilotHistory.push({ role: "user", content: q });

    let answer;
    try {
      const r = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (r.ok) {
        const j = await r.json();
        answer = j.answer;
      } else {
        answer = answerCopilotQuestion(q);
      }
    } catch {
      answer = answerCopilotQuestion(q);
    }

    appendMessage("assistant", answer);
    copilotHistory.push({ role: "assistant", content: answer });
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitCopilotQuestion();
  });

  document.addEventListener("ai-copilot-message", (e) => {
    const { role, text } = e.detail || {};
    if (text) appendMessage(role || "assistant", text);
    open();
  });

  if (messages && !copilotHistory.length) {
    appendMessage(
      "assistant",
      "Hi — I'm your **infrastructure copilot**. I read hosts, VMs, storage, licenses, and alerts from this dashboard. Ask what to fix first, or tap a suggestion below."
    );
  }
}

export function renderAiView() {
  const brief = document.getElementById("ai-view-brief");
  const recs = document.getElementById("ai-view-recs");
  if (brief) {
    brief.innerHTML = generateDailyBrief()
      .map((l) => `<p>${mdToHtml(l)}</p>`)
      .join("");
  }
  if (recs) {
    const all = [
      ...generateRecommendations("overview"),
      ...generateRecommendations("vms"),
      ...generateRecommendations("licensing"),
    ];
    const seen = new Set();
    const unique = all.filter((r) => {
      const k = r.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    recs.innerHTML = unique
      .slice(0, 8)
      .map(
        (r) => `
      <article class="ai-rec-card ai-rec-card--${r.priority}">
        <span class="ai-rec-priority">${r.priority}</span>
        <h3>${r.title}</h3>
        <p>${r.body}</p>
      </article>
    `
      )
      .join("");
  }
}

export function refreshAllAi(view = "overview") {
  renderAiDailyBrief();
  renderAiContextStrip(view);
  if (document.getElementById("view-ai")?.classList.contains("active")) {
    renderAiView();
  }
}

export { SUGGESTED_QUESTIONS, mdToHtml };
