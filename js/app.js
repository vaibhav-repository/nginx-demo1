import {
  hosts,
  vms,
  datastores,
  dvswitches,
  alerts,
  generateTimeSeries,
  generateNetworkSeries,
  getClusterStats,
  getEstimatedSavings,
  savingsAssumptions,
  setVmsFromServer,
  resetVmsToDemo,
} from "./data.js";
import {
  initUtilizationChart,
  initStorageChart,
  initNetworkChart,
  refreshCharts,
} from "./charts.js";
import {
  renderLicensingView,
  renderLicenseOverviewBanner,
  updateLicenseNavBadge,
} from "./licensing.js";
import { refreshAllAi, initAiCopilot, explainAlert } from "./ai.js";

const VIEW_META = {
  overview: {
    title: "Infrastructure Overview",
    subtitle: "Real-time health across your data center",
  },
  hosts: { title: "ESXi Hosts", subtitle: "Hypervisor performance and capacity" },
  vms: { title: "Virtual Machines", subtitle: "Inventory and resource consumption" },
  storage: { title: "Datastores", subtitle: "Capacity planning and utilization" },
  network: { title: "Network", subtitle: "Distributed switching and throughput" },
  licensing: {
    title: "Licensing snapshot",
    subtitle: "Renewals, spend, and executive priorities",
  },
  alerts: { title: "Alert Center", subtitle: "Events requiring attention" },
  ai: {
    title: "AI Copilot",
    subtitle: "Plain-language answers from your infrastructure data",
  },
};

const KPI_ICONS = {
  hosts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="6" rx="1"/><rect x="2" y="14" width="20" height="6" rx="1"/></svg>`,
  vms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>`,
  storage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/></svg>`,
};

let hostFilter = "all";
let vmFilter = "all";
let alertFilter = "all";
let timeSeries = generateTimeSeries();

async function hydrateVmsFromApi() {
  const badge = $("#vm-data-badge");
  try {
    const r = await fetch("/api/vms", { cache: "no-store" });
    if (!r.ok) throw new Error("API error");
    const j = await r.json();
    if (j.source === "inventory" && Array.isArray(j.vms) && j.vms.length > 0) {
      setVmsFromServer(j.vms);
      if (badge) {
        badge.textContent = j.updatedAt
          ? `Your VMs · API · ${new Date(j.updatedAt).toLocaleString()}`
          : "Your VMs · loaded from API";
        badge.className = "vm-data-badge vm-data-badge--live";
        badge.title = "Served from data/vm-inventory.json via GET /api/vms";
      }
    } else {
      resetVmsToDemo();
      if (badge) {
        badge.textContent = "Demo VMs (add data/vm-inventory.json)";
        badge.className = "vm-data-badge vm-data-badge--demo";
        badge.title = j.message || "Start server with Node and add data/vm-inventory.json to show your inventory.";
      }
    }
  } catch {
    if (badge) {
      badge.textContent = "Demo VMs · API unreachable";
      badge.className = "vm-data-badge vm-data-badge--offline";
      badge.title = "Use: node server.js then open http://localhost:5173 — or file:// cannot call /api/vms.";
    }
  }
}

function $(sel) {
  return document.querySelector(sel);
}

function $$(sel) {
  return [...document.querySelectorAll(sel)];
}

function usageClass(val) {
  if (val >= 85) return "critical";
  if (val >= 70) return "high";
  return "";
}

function renderHostTile(h) {
  const shortName = h.name.split(".")[0];
  return `
    <article class="host-tile" data-status="${h.status}" data-name="${h.name}">
      <div class="host-tile-head">
        <h3>${shortName}</h3>
        <span class="status-pill ${h.status}">${h.status}</span>
      </div>
      <p class="host-meta">${h.model} · ${h.ip} · ${h.vms} VMs · ${h.uptime}</p>
      <div class="metric-rows">
        <div class="metric-row">
          <span>CPU</span>
          <div class="bar"><span class="cpu" style="width:${h.cpu}%"></span></div>
          <span class="val">${h.cpu}%</span>
        </div>
        <div class="metric-row">
          <span>MEM</span>
          <div class="bar"><span class="mem" style="width:${h.memory}%"></span></div>
          <span class="val">${h.memory}%</span>
        </div>
        <div class="metric-row">
          <span>DSK</span>
          <div class="bar"><span class="disk" style="width:${h.disk}%"></span></div>
          <span class="val">${h.disk}%</span>
        </div>
      </div>
    </article>
  `;
}

function formatUsd(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function renderSavings() {
  const el = $("#savings-banner");
  if (!el) return;

  const s = getEstimatedSavings();
  el.innerHTML = `
    <div class="savings-banner-inner">
      <div class="savings-badge" aria-hidden="true">$</div>
      <div class="savings-body">
        <span class="savings-tag">FinOps estimate</span>
        <h2 class="savings-title" id="savings-title">Estimated savings vs cloud benchmark</h2>
        <div class="savings-row">
          <div>
            <span class="savings-amount">${formatUsd(s.monthlyUsd)}</span>
            <span class="savings-period">/ month</span>
          </div>
          <div class="savings-stats">
            <span>Run-rate <strong>${formatUsd(s.annualUsd)}</strong> / year</span>
            <span>Cloud list equiv. <strong>${formatUsd(s.cloudBenchmarkMonthly)}</strong> / mo</span>
          </div>
        </div>
        <p class="savings-foot">
          Based on <strong>${s.poweredCount}</strong> powered-on workloads
          (<strong>${s.totalVcpu}</strong> vCPU, <strong>${s.totalRamGb}</strong> GB RAM).
          Savings = <strong>${Math.round(savingsAssumptions.avoidedCloudSpendShare * 100)}%</strong> of the cloud list benchmark (tune rates in <code style="font-family:var(--mono);font-size:0.68rem">savingsAssumptions</code> in <code style="font-family:var(--mono);font-size:0.68rem">data.js</code>).
        </p>
      </div>
    </div>
  `;
}

function renderKpis() {
  const s = getClusterStats();
  const items = [
    {
      key: "hosts",
      label: "ESXi hosts",
      value: s.hosts,
      sub: "All connected",
      trend: "neutral",
      trendText: "100% up",
      pct: 100,
      accent: "#38bdf8",
    },
    {
      key: "vms",
      label: "Virtual machines",
      value: s.vms,
      sub: `${s.poweredOn} powered on`,
      trend: "up",
      trendText: "+2 this week",
      pct: Math.round((s.poweredOn / s.vms) * 100),
      accent: "#a78bfa",
    },
    {
      key: "cpu",
      label: "Avg CPU usage",
      value: s.avgCpu + "%",
      sub: "Cluster-wide",
      trend: s.avgCpu > 70 ? "down" : "neutral",
      trendText: s.avgCpu > 70 ? "Elevated" : "Normal",
      pct: s.avgCpu,
      accent: "#34d399",
    },
    {
      key: "storage",
      label: "Storage used",
      value: s.storagePct + "%",
      sub: "Across datastores",
      trend: s.storagePct > 80 ? "down" : "up",
      trendText: s.storagePct > 80 ? "Watch capacity" : "Healthy",
      pct: s.storagePct,
      accent: "#fbbf24",
    },
  ];

  $("#kpi-grid").innerHTML = items
    .map(
      (k) => `
    <article class="kpi-card" style="--kpi-accent: ${k.accent}">
      <div class="kpi-top">
        <span class="kpi-icon">${KPI_ICONS[k.key]}</span>
        <span class="kpi-trend ${k.trend}">${k.trendText}</span>
      </div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-label">${k.label} · ${k.sub}</div>
      <div class="kpi-bar"><span style="width:${k.pct}%"></span></div>
    </article>
  `
    )
    .join("");
}

function renderHealthBreakdown() {
  const items = [
    { label: "Compute", score: 92 },
    { label: "Memory", score: 86 },
    { label: "Storage", score: 96 },
    { label: "Network", score: 98 },
  ];

  $("#health-breakdown").innerHTML = items
    .map(
      (i) => `
    <li>
      <span>${i.label}</span>
      <div class="bar-mini"><span style="width:${i.score}%"></span></div>
      <strong>${i.score}%</strong>
    </li>
  `
    )
    .join("");

  const ring = $("#health-ring");
  const score = getClusterStats().health;
  const circumference = 2 * Math.PI * 52;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference - (score / 100) * circumference;
  $("#health-score").textContent = score;
}

function renderHosts(container, list, limit) {
  const filtered =
    hostFilter === "all" ? list : list.filter((h) => h.status === hostFilter);
  const slice = limit ? filtered.slice(0, limit) : filtered;
  container.innerHTML = slice.map(renderHostTile).join("");
  if ($("#host-count")) {
    $("#host-count").textContent = `${filtered.length} host${filtered.length !== 1 ? "s" : ""}`;
  }
}

function renderAlerts(container, list, limit) {
  const filtered =
    alertFilter === "all" ? list : list.filter((a) => a.severity === alertFilter);
  const slice = limit ? filtered.slice(0, limit) : filtered;

  container.innerHTML = slice
    .map(
      (a) => `
    <li class="alert-item" data-severity="${a.severity}">
      <span class="alert-severity ${a.severity}"></span>
      <div class="alert-body">
        <strong>${a.title}</strong>
        <p>${a.message}</p>
      </div>
      <div class="alert-meta">
        <time>${a.time}</time>
        <span>${a.source}</span>
        <button type="button" class="ai-explain-btn" data-alert-id="${a.id}">✦ Explain</button>
      </div>
    </li>
  `
    )
    .join("");

  container.querySelectorAll(".ai-explain-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = explainAlert(btn.dataset.alertId);
      document.getElementById("ai-copilot-panel")?.classList.add("open");
      document.dispatchEvent(
        new CustomEvent("ai-copilot-message", { detail: { role: "assistant", text } })
      );
    });
  });
}

function renderVmTable() {
  const filtered =
    vmFilter === "all" ? vms : vms.filter((v) => v.power === vmFilter);
  $("#vm-count").textContent = `${filtered.length} virtual machine${filtered.length !== 1 ? "s" : ""}`;

  $("#vm-tbody").innerHTML = filtered
    .map((v) => {
      const on = v.power === "poweredOn";
      return `
      <tr data-name="${v.name}" data-host="${v.host}">
        <td>
          <div class="vm-name">
            <span class="vm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            </span>
            <div>
              <strong>${v.name}</strong>
              <span>${v.guest}</span>
            </div>
          </div>
        </td>
        <td><span class="power-badge ${on ? "on" : "off"}">${on ? "Powered on" : "Powered off"}</span></td>
        <td style="font-family:var(--mono);font-size:0.75rem;color:var(--text-muted)">${v.host.split(".")[0]}</td>
        <td>${v.vcpu}</td>
        <td>${v.ram} GB</td>
        <td class="usage-cell ${usageClass(v.cpu)}">${on ? v.cpu + "%" : "—"}</td>
        <td class="usage-cell ${usageClass(v.mem)}">${on ? v.mem + "%" : "—"}</td>
        <td style="font-family:var(--mono);font-size:0.75rem">${v.datastore}</td>
      </tr>
    `;
    })
    .join("");
}

function renderStorageKpis() {
  const total = datastores.reduce((s, d) => s + d.capacity, 0);
  const used = datastores.reduce((s, d) => s + d.used, 0);
  const free = +(total - used).toFixed(1);
  const pct = Math.round((used / total) * 100);

  $("#storage-kpis").innerHTML = `
    <article class="kpi-card" style="--kpi-accent:#38bdf8">
      <div class="kpi-top"><span class="kpi-icon">${KPI_ICONS.storage}</span></div>
      <div class="kpi-value">${total} TB</div>
      <div class="kpi-label">Total capacity</div>
    </article>
    <article class="kpi-card" style="--kpi-accent:#fbbf24">
      <div class="kpi-top"><span class="kpi-icon">${KPI_ICONS.storage}</span></div>
      <div class="kpi-value">${used} TB</div>
      <div class="kpi-label">Provisioned · ${pct}% used</div>
      <div class="kpi-bar"><span style="width:${pct}%"></span></div>
    </article>
    <article class="kpi-card" style="--kpi-accent:#34d399">
      <div class="kpi-top"><span class="kpi-icon">${KPI_ICONS.storage}</span></div>
      <div class="kpi-value">${free} TB</div>
      <div class="kpi-label">Free space remaining</div>
    </article>
  `;
}

function renderDatastoreList() {
  $("#datastore-list").innerHTML = datastores
    .map((d) => {
      const pct = Math.round((d.used / d.capacity) * 100);
      return `
      <li class="ds-item">
        <div class="ds-item-head">
          <strong>${d.name}</strong>
          <span>${d.type}</span>
        </div>
        <div class="ds-item-head" style="margin-bottom:0.35rem">
          <span style="font-size:0.75rem;color:var(--text-muted)">${d.used} / ${d.capacity} TB</span>
          <span style="font-size:0.75rem;font-family:var(--mono);color:${pct > 80 ? "var(--warning)" : "var(--text)"}">${pct}%</span>
        </div>
        <div class="ds-bar"><span style="width:${pct}%"></span></div>
      </li>
    `;
    })
    .join("");
}

function renderDvswitches() {
  $("#dvswitch-list").innerHTML = dvswitches
    .map((d) => {
      const pct = Math.round((d.used / d.ports) * 100);
      return `
      <li class="dvs-item">
        <div class="dvs-item-head">
          <strong>${d.name}</strong>
          <span>${d.throughput} Gbps</span>
        </div>
        <div class="dvs-item-head" style="margin-bottom:0.35rem">
          <span style="font-size:0.75rem;color:var(--text-muted)">${d.used} / ${d.ports} ports</span>
          <span style="font-size:0.75rem;font-family:var(--mono)">${pct}%</span>
        </div>
        <div class="dvs-bar"><span style="width:${pct}%"></span></div>
      </li>
    `;
    })
    .join("");
}

function switchView(view) {
  $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
  const meta = VIEW_META[view];
  $("#page-title").textContent = meta.title;
  $("#page-subtitle").textContent = meta.subtitle;
  $("#sidebar")?.classList.remove("open");
  if (view === "licensing") {
    renderLicensingView();
  }
  refreshAllAi(view);
}

function getActiveView() {
  const active = document.querySelector(".view.active");
  if (!active) return "overview";
  return active.id.replace("view-", "");
}

function handleSearch(q) {
  const term = q.trim().toLowerCase();
  if (!term) {
    $$("[data-name]").forEach((el) => el.classList.remove("hidden"));
    return;
  }

  $$("#vm-tbody tr").forEach((row) => {
    const match =
      row.dataset.name?.toLowerCase().includes(term) ||
      row.dataset.host?.toLowerCase().includes(term);
    row.classList.toggle("hidden", !match);
  });

  $$(".host-tile").forEach((tile) => {
    tile.classList.toggle("hidden", !tile.dataset.name?.toLowerCase().includes(term));
  });
}

function simulateRefresh() {
  timeSeries = generateTimeSeries();
  refreshCharts(timeSeries);
  hosts.forEach((h) => {
    h.cpu = Math.min(99, Math.max(5, h.cpu + Math.round((Math.random() - 0.5) * 6)));
    h.memory = Math.min(99, Math.max(5, h.memory + Math.round((Math.random() - 0.5) * 4)));
  });
  void hydrateVmsFromApi().then(() => {
    renderKpis();
    renderSavings();
    renderLicenseOverviewBanner();
    if ($("#view-licensing")?.classList.contains("active")) {
      renderLicensingView();
    } else {
      updateLicenseNavBadge();
    }
    renderHosts($("#host-grid-preview"), hosts, 4);
    renderHosts($("#host-grid-full"), hosts);
    renderVmTable();
    renderAlerts($("#alert-preview"), alerts, 3);
    renderAlerts($("#alert-list-full"), alerts);
    refreshAllAi(getActiveView());
    $("#last-refresh").textContent = new Date().toLocaleTimeString();
  });
}

function init() {
  renderKpis();
  renderSavings();
  renderLicenseOverviewBanner();
  renderLicensingView();
  renderHealthBreakdown();
  renderHosts($("#host-grid-preview"), hosts, 4);
  renderHosts($("#host-grid-full"), hosts);
  renderAlerts($("#alert-preview"), alerts, 3);
  renderAlerts($("#alert-list-full"), alerts);
  renderVmTable();
  renderStorageKpis();
  renderDatastoreList();
  renderDvswitches();

  initUtilizationChart($("#chart-utilization"), timeSeries);
  initStorageChart($("#chart-storage"), datastores);
  initNetworkChart($("#chart-network"), generateNetworkSeries());

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  $$("[data-goto]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(link.dataset.goto);
    });
  });

  document.addEventListener("goto-view", (e) => {
    const v = e.detail;
    if (v) switchView(v);
  });

  $$(".filter-chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".filter-chip[data-filter]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      hostFilter = chip.dataset.filter;
      renderHosts($("#host-grid-full"), hosts);
    });
  });

  $$(".filter-chip[data-vm-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".filter-chip[data-vm-filter]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      vmFilter = chip.dataset.vmFilter;
      renderVmTable();
    });
  });

  $$(".filter-chip[data-alert]").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".filter-chip[data-alert]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      alertFilter = chip.dataset.alert;
      renderAlerts($("#alert-list-full"), alerts);
    });
  });

  $$(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".range-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const range = btn.dataset.range;
      const hours = range === "1h" ? 1 : range === "7d" ? 168 : 24;
      timeSeries = generateTimeSeries(hours);
      refreshCharts(timeSeries);
    });
  });

  $("#global-search")?.addEventListener("input", (e) => handleSearch(e.target.value));
  $("#refresh-btn")?.addEventListener("click", simulateRefresh);
  $("#menu-toggle")?.addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  setInterval(simulateRefresh, 30000);

  initAiCopilot();
  $("#ai-copilot-top-btn")?.addEventListener("click", () => {
    document.getElementById("ai-copilot-fab")?.click();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await hydrateVmsFromApi();
  init();
  refreshAllAi("overview");
});
