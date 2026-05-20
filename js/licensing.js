import {
  licenseClusters,
  getLicenseCalendarEvents,
  getSmartLicenseAlerts,
  getLicensingNavBadgeCount,
  getLicensingOverviewStrip,
} from "./data.js";

function usd(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function boldFromMarkdown(s) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function tierEmoji(tier) {
  if (tier === "critical") return "🔴";
  if (tier === "warning") return "🟠";
  return "🟢";
}

export function renderLicenseOverviewBanner() {
  const el = document.getElementById("license-overview-banner");
  if (!el) return;
  const strip = getLicensingOverviewStrip();
  if (!strip) {
    el.className = "license-top-banner hidden";
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");
  el.className = `license-top-banner license-top-banner--${strip.tier}`;
  el.innerHTML = `
    <div class="license-top-banner-inner">
      <span class="license-top-ico" aria-hidden="true">📋</span>
      <div>
        <strong>${strip.title}</strong>
        <p>${strip.message}</p>
      </div>
      <a href="#" class="link-btn license-top-link" data-goto="licensing">View snapshot →</a>
    </div>
  `;
  el.querySelector("[data-goto]")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent("goto-view", { detail: "licensing" }));
  });
}

export function updateLicenseNavBadge() {
  const badge = document.getElementById("license-nav-badge");
  if (!badge) return;
  const n = getLicensingNavBadgeCount();
  badge.textContent = String(n);
  badge.classList.toggle("hidden", n === 0);
}

export function renderLicensingView() {
  const kpi = document.getElementById("license-exec-kpis");
  const priorities = document.getElementById("license-exec-priorities");
  const renewals = document.getElementById("license-exec-renewals");

  const events = getLicenseCalendarEvents();
  const totalAnnual = licenseClusters.reduce(
    (s, c) => s + c.licenses.reduce((t, l) => t + l.annualCostUsd, 0),
    0
  );
  const criticalN = events.filter((e) => e.tier === "critical").length;
  const warnN = events.filter((e) => e.tier === "warning").length;
  const actionCount = criticalN + warnN;
  const next = events[0];
  const riskKpiClass =
    criticalN > 0 ? "license-exec-kpi--critical" : warnN > 0 ? "license-exec-kpi--risk" : "license-exec-kpi--clear";
  const nextLabel = next
    ? `${next.product.split(" ")[0]} · ${new Date(`${next.expiresOn}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
    : "—";

  if (kpi) {
    kpi.innerHTML = `
      <article class="license-exec-kpi">
        <span class="license-exec-kpi-label">Annual license run-rate</span>
        <strong class="license-exec-kpi-val">${usd(totalAnnual)}</strong>
        <span class="license-exec-kpi-hint">Portfolio total (demo)</span>
      </article>
      <article class="license-exec-kpi ${riskKpiClass}">
        <span class="license-exec-kpi-label">Contracts needing attention</span>
        <strong class="license-exec-kpi-val">${actionCount}</strong>
        <span class="license-exec-kpi-hint">Critical (&lt;7d) or warning (&lt;30d)</span>
      </article>
      <article class="license-exec-kpi">
        <span class="license-exec-kpi-label">Soonest renewal</span>
        <strong class="license-exec-kpi-val license-exec-kpi-val--sm">${nextLabel}</strong>
        <span class="license-exec-kpi-hint">${next ? `${next.daysRemaining} days · ${next.clusterName}` : "No data"}</span>
      </article>
    `;
  }

  if (priorities) {
    const top = getSmartLicenseAlerts()
      .filter((a) => a.tier === "critical" || a.tier === "warning")
      .slice(0, 3);

    if (!top.length) {
      priorities.innerHTML = `
        <p class="license-exec-allclear">🟢 No license items in the critical or 30-day warning window at portfolio level.</p>
      `;
    } else {
      priorities.innerHTML = `
        <ul class="license-exec-priority-list">
          ${top
            .map(
              (a) => `
            <li class="license-exec-priority license-exec-priority--${a.tier}">
              <span class="license-exec-priority-tier">${tierEmoji(a.tier)} ${a.tier}</span>
              <strong>${a.headline}</strong>
              <p>${boldFromMarkdown(a.detail)}</p>
              <span class="license-exec-priority-meta">${a.clusterName} · ${a.contractId}</span>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }
  }

  if (renewals) {
    renewals.innerHTML = events
      .map((ev) => {
        const exp = new Date(`${ev.expiresOn}T12:00:00`);
        const dateStr = exp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `
        <tr>
          <td>
            <strong>${ev.product}</strong><br/>
            <span class="muted small">${ev.edition}</span>
          </td>
          <td>${ev.clusterName}</td>
          <td class="mono">${dateStr}</td>
          <td><span class="license-pill license-pill--${ev.tier}">${tierEmoji(ev.tier)} ${ev.daysRemaining}d</span></td>
          <td class="mono">${usd(ev.annualCostUsd)}</td>
        </tr>
      `;
      })
      .join("");
  }

  updateLicenseNavBadge();
}
