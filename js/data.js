export const hosts = [
  {
    id: "esxi-01",
    name: "esxi-prod-01.dc.local",
    ip: "10.10.1.11",
    version: "ESXi 8.0 U2",
    model: "Dell R750",
    status: "healthy",
    cpu: 42,
    memory: 61,
    disk: 58,
    vms: 18,
    uptime: "142d 6h",
    physicalCores: 64,
  },
  {
    id: "esxi-02",
    name: "esxi-prod-02.dc.local",
    ip: "10.10.1.12",
    version: "ESXi 8.0 U2",
    model: "Dell R750",
    status: "healthy",
    cpu: 38,
    memory: 55,
    disk: 62,
    vms: 16,
    uptime: "142d 6h",
    physicalCores: 64,
  },
  {
    id: "esxi-03",
    name: "esxi-prod-03.dc.local",
    ip: "10.10.1.13",
    version: "ESXi 8.0 U2",
    model: "HPE DL380",
    status: "warning",
    cpu: 78,
    memory: 84,
    disk: 71,
    vms: 22,
    uptime: "89d 12h",
    physicalCores: 64,
  },
  {
    id: "esxi-04",
    name: "esxi-prod-04.dc.local",
    ip: "10.10.1.14",
    version: "ESXi 8.0 U2",
    model: "HPE DL380",
    status: "healthy",
    cpu: 51,
    memory: 48,
    disk: 45,
    vms: 14,
    uptime: "142d 6h",
    physicalCores: 64,
  },
];

/**
 * Cluster → licenses → host mapping (demo). Replace with vCenter / CMDB sync.
 * Expiry dates are ISO (YYYY-MM-DD). UI tiers: critical &lt;7d, warning &lt;30d, safe ≥30d.
 */
export const licenseClusters = [
  {
    id: "dc-prod-01",
    name: "DC-PROD-01",
    vcenter: "vc-prod-01.dc.local",
    hostIds: ["esxi-01", "esxi-02", "esxi-03", "esxi-04"],
    renewalContact: "procurement@example.com",
    licenses: [
      {
        id: "vsp-epl",
        product: "VMware vSphere",
        edition: "Enterprise Plus",
        contractId: "ENT-44821",
        expiresOn: "2026-05-24",
        renewalVendor: "Broadcom L1",
        licensedCores: 256,
        usedCores: 236,
        annualCostUsd: 58000,
        monthlyGrowthPct: 1.8,
      },
      {
        id: "vsan-adv",
        product: "VMware vSAN",
        edition: "Advanced",
        contractId: "VSAN-9921",
        expiresOn: "2026-06-10",
        renewalVendor: "Broadcom L1",
        licensedCores: 128,
        usedCores: 112,
        annualCostUsd: 31200,
        monthlyGrowthPct: 2.2,
      },
      {
        id: "aria-std",
        product: "VMware Aria Suite",
        edition: "Standard (observability)",
        contractId: "ARIA-2210",
        expiresOn: "2026-09-01",
        renewalVendor: "Partner VAR",
        licensedCores: 256,
        usedCores: 96,
        annualCostUsd: 18400,
        monthlyGrowthPct: 0.9,
      },
    ],
  },
  {
    id: "dc-dr-01",
    name: "DC-DR-01",
    vcenter: "vc-dr.dc.local",
    hostIds: ["esxi-dr-01", "esxi-dr-02"],
    renewalContact: "dr-ops@example.com",
    licenses: [
      {
        id: "vsp-std-dr",
        product: "VMware vSphere",
        edition: "Standard",
        contractId: "ENT-DR-1102",
        expiresOn: "2026-06-05",
        renewalVendor: "Partner VAR",
        licensedCores: 64,
        usedCores: 32,
        annualCostUsd: 12000,
        monthlyGrowthPct: 0.4,
      },
    ],
  },
];

export const drHostsForLicensing = [
  {
    id: "esxi-dr-01",
    name: "esxi-dr-01.dr.dc.local",
    ip: "10.20.1.11",
    model: "Dell R640",
    physicalCores: 16,
  },
  {
    id: "esxi-dr-02",
    name: "esxi-dr-02.dr.dc.local",
    ip: "10.20.1.12",
    model: "Dell R640",
    physicalCores: 16,
  },
];

/** Built-in demo inventory (used when no `data/vm-inventory.json` is served by the API). */
const DEFAULT_VMS = [
  {
    id: "vm-001",
    name: "sql-primary-01",
    guest: "Windows Server 2022",
    host: "esxi-prod-01.dc.local",
    power: "poweredOn",
    vcpu: 8,
    ram: 32,
    cpu: 34,
    mem: 72,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-002",
    name: "sql-replica-01",
    guest: "Windows Server 2022",
    host: "esxi-prod-02.dc.local",
    power: "poweredOn",
    vcpu: 8,
    ram: 32,
    cpu: 28,
    mem: 68,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-003",
    name: "k8s-master-01",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-03.dc.local",
    power: "poweredOn",
    vcpu: 4,
    ram: 16,
    cpu: 61,
    mem: 79,
    datastore: "DS-NVMe-02",
  },
  {
    id: "vm-004",
    name: "k8s-worker-01",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-03.dc.local",
    power: "poweredOn",
    vcpu: 8,
    ram: 32,
    cpu: 88,
    mem: 91,
    datastore: "DS-NVMe-02",
  },
  {
    id: "vm-005",
    name: "k8s-worker-02",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-03.dc.local",
    power: "poweredOn",
    vcpu: 8,
    ram: 32,
    cpu: 82,
    mem: 86,
    datastore: "DS-NVMe-02",
  },
  {
    id: "vm-006",
    name: "ad-dc-01",
    guest: "Windows Server 2019",
    host: "esxi-prod-01.dc.local",
    power: "poweredOn",
    vcpu: 4,
    ram: 8,
    cpu: 12,
    mem: 41,
    datastore: "DS-SAS-01",
  },
  {
    id: "vm-007",
    name: "nginx-lb-01",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-04.dc.local",
    power: "poweredOn",
    vcpu: 2,
    ram: 4,
    cpu: 22,
    mem: 38,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-008",
    name: "nginx-lb-02",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-04.dc.local",
    power: "poweredOn",
    vcpu: 2,
    ram: 4,
    cpu: 19,
    mem: 35,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-009",
    name: "backup-repo-01",
    guest: "Rocky Linux 9",
    host: "esxi-prod-02.dc.local",
    power: "poweredOn",
    vcpu: 4,
    ram: 16,
    cpu: 45,
    mem: 52,
    datastore: "DS-SAS-01",
  },
  {
    id: "vm-010",
    name: "dev-sandbox-01",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-04.dc.local",
    power: "poweredOff",
    vcpu: 2,
    ram: 8,
    cpu: 0,
    mem: 0,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-011",
    name: "monitoring-01",
    guest: "Ubuntu 22.04 LTS",
    host: "esxi-prod-01.dc.local",
    power: "poweredOn",
    vcpu: 4,
    ram: 8,
    cpu: 31,
    mem: 58,
    datastore: "DS-SSD-01",
  },
  {
    id: "vm-012",
    name: "erp-app-01",
    guest: "RHEL 8",
    host: "esxi-prod-02.dc.local",
    power: "poweredOn",
    vcpu: 6,
    ram: 24,
    cpu: 56,
    mem: 64,
    datastore: "DS-SAS-01",
  },
];

/** Live VM list — replaced at runtime when `GET /api/vms` returns inventory. */
export let vms = DEFAULT_VMS.map((v) => ({ ...v }));

let vmInventorySource = "demo";

export function getVmInventorySource() {
  return vmInventorySource;
}

/**
 * Normalize a row from JSON / exports (vSphere-ish names supported) into the shape the UI expects.
 */
export function normalizeVmRecord(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const pick = (...keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && raw[k] !== "") return raw[k];
    }
    return undefined;
  };

  const name = pick("name", "Name", "vm", "VM", "vmName", "VmName");
  if (!name) return null;

  let power = pick("power", "powerState", "PowerState", "state", "State", "runtime_powerState");
  const ps = String(power || "poweredOn").toLowerCase();
  if (ps === "on" || ps === "poweredon" || ps === "powered on") power = "poweredOn";
  else if (ps === "off" || ps === "poweredoff" || ps === "powered off" || ps === "suspended") power = "poweredOff";
  else power = ps.includes("off") ? "poweredOff" : "poweredOn";

  let ram = pick("ram", "memoryGB", "memoryGb", "MemoryGB", "memGb");
  const memMb = pick("memoryMB", "MemoryMB", "memoryMb", "memMB");
  if (ram === undefined && memMb !== undefined) ram = Math.round(Number(memMb) / 1024);
  ram = ram !== undefined ? Number(ram) : 4;

  const vcpu = Number(pick("vcpu", "vCpu", "numCpu", "NumCpu", "cpus", "Cpus") ?? 2);
  const cpu = Number(pick("cpu", "cpuUsagePercent", "CpuUsage") ?? (power === "poweredOn" ? 25 : 0));
  const mem = Number(pick("mem", "memUsagePercent", "MemUsage", "memoryUsagePercent") ?? (power === "poweredOn" ? 40 : 0));

  const id = String(pick("id", "Id", "moId", "MoRef", "vmId") ?? `vm-${index + 1}`);

  return {
    id,
    name: String(name),
    guest: String(pick("guest", "guestOS", "Guest", "GuestFullName", "os") ?? "—"),
    host: String(pick("host", "Host", "esxHost", "esxhostname", "ESXi", "hostName") ?? "—"),
    power,
    vcpu: Number.isFinite(vcpu) ? vcpu : 2,
    ram: Number.isFinite(ram) ? ram : 4,
    cpu: Number.isFinite(cpu) ? Math.min(100, Math.max(0, cpu)) : 0,
    mem: Number.isFinite(mem) ? Math.min(100, Math.max(0, mem)) : 0,
    datastore: String(pick("datastore", "Datastore", "primaryDatastore", "diskDatastore") ?? "—"),
  };
}

export function setVmsFromServer(records) {
  const normalized = (Array.isArray(records) ? records : [])
    .map((r, i) => normalizeVmRecord(r, i))
    .filter(Boolean);
  if (!normalized.length) return;
  vms.length = 0;
  vms.push(...normalized);
  vmInventorySource = "inventory";
}

export function resetVmsToDemo() {
  vms.length = 0;
  vms.push(...DEFAULT_VMS.map((v) => ({ ...v })));
  vmInventorySource = "demo";
}

export const datastores = [
  { name: "DS-SSD-01", type: "VMFS 7", capacity: 12, used: 8.4 },
  { name: "DS-NVMe-02", type: "VMFS 7", capacity: 8, used: 6.9 },
  { name: "DS-SAS-01", type: "VMFS 6", capacity: 24, used: 14.2 },
  { name: "DS-vSAN-01", type: "vSAN", capacity: 48, used: 31.5 },
];

export const dvswitches = [
  { name: "DVS-PROD-01", ports: 128, used: 94, throughput: 4.2 },
  { name: "DVS-PROD-02", ports: 64, used: 41, throughput: 2.8 },
  { name: "DVS-MGMT", ports: 32, used: 12, throughput: 0.4 },
];

export const alerts = [
  {
    id: "a1",
    severity: "critical",
    title: "Host memory pressure",
    message: "esxi-prod-03.dc.local memory utilization exceeded 80% for 15 minutes.",
    source: "esxi-prod-03",
    time: "12 min ago",
  },
  {
    id: "a2",
    severity: "warning",
    title: "Datastore capacity threshold",
    message: "DS-NVMe-02 is at 86% capacity. Consider storage reclamation or expansion.",
    source: "DS-NVMe-02",
    time: "1h ago",
  },
  {
    id: "a3",
    severity: "warning",
    title: "VM CPU ready time elevated",
    message: "k8s-worker-01 showing sustained CPU ready > 10%. Possible resource contention.",
    source: "k8s-worker-01",
    time: "2h ago",
  },
  {
    id: "a4",
    severity: "info",
    title: "vCenter connectivity restored",
    message: "All hosts in cluster DC-PROD-01 reconnected after brief network blip.",
    source: "vCenter",
    time: "4h ago",
  },
  {
    id: "a5",
    severity: "info",
    title: "Scheduled maintenance window",
    message: "HA failover test planned for Saturday 02:00–04:00 UTC.",
    source: "Operations",
    time: "6h ago",
  },
];

export function generateTimeSeries(hours = 24, points = 24) {
  const labels = [];
  const cpu = [];
  const memory = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - ((i * hours) / points) * 3600000);
    labels.push(
      t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    );
    const base = 45 + Math.sin(i / 3) * 12;
    cpu.push(Math.round(base + Math.random() * 8));
    memory.push(Math.round(base + 8 + Math.random() * 10));
  }

  return { labels, cpu, memory };
}

export function generateNetworkSeries(points = 24) {
  const labels = [];
  const ingress = [];
  const egress = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    labels.push(t.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }));
    ingress.push(+(2 + Math.random() * 3 + Math.sin(i / 4)).toFixed(2));
    egress.push(+(1.5 + Math.random() * 2.5 + Math.cos(i / 3)).toFixed(2));
  }

  return { labels, ingress, egress };
}

/**
 * Illustrative rates for “savings vs equivalent public-cloud sizing” (USD).
 * Tune these to match your org’s FinOps model or replace with API-driven values.
 */
export const savingsAssumptions = {
  /** Blended monthly $ per vCPU if same shapes ran on-demand in public cloud */
  usdPerVcpuMonth: 38,
  /** Monthly $ per GB RAM (same basis) */
  usdPerGbRamMonth: 6.5,
  /**
   * Share of that cloud-equivalent bill you treat as “saved” by running on owned DC
   * (power, amortized hardware, licensing — FinOps placeholder).
   */
  avoidedCloudSpendShare: 0.58,
};

/**
 * Estimated monthly USD “saved” vs a public-cloud list-price benchmark for powered-on VMs.
 */
export function getEstimatedSavings() {
  const powered = vms.filter((v) => v.power === "poweredOn");
  const { usdPerVcpuMonth, usdPerGbRamMonth, avoidedCloudSpendShare } = savingsAssumptions;

  let cloudBenchmarkMonthly = 0;
  for (const v of powered) {
    cloudBenchmarkMonthly += v.vcpu * usdPerVcpuMonth + v.ram * usdPerGbRamMonth;
  }

  const monthlyUsd = Math.round(cloudBenchmarkMonthly * avoidedCloudSpendShare);
  const annualUsd = monthlyUsd * 12;
  const totalVcpu = powered.reduce((s, v) => s + v.vcpu, 0);
  const totalRamGb = powered.reduce((s, v) => s + v.ram, 0);

  return {
    monthlyUsd,
    annualUsd,
    cloudBenchmarkMonthly: Math.round(cloudBenchmarkMonthly),
    poweredCount: powered.length,
    totalVcpu,
    totalRamGb,
  };
}

export function getClusterStats() {
  const poweredOn = vms.filter((v) => v.power === "poweredOn").length;
  const avgCpu = Math.round(hosts.reduce((s, h) => s + h.cpu, 0) / hosts.length);
  const avgMem = Math.round(hosts.reduce((s, h) => s + h.memory, 0) / hosts.length);
  const totalCap = datastores.reduce((s, d) => s + d.capacity, 0);
  const totalUsed = datastores.reduce((s, d) => s + d.used, 0);
  const storagePct = Math.round((totalUsed / totalCap) * 100);

  return {
    hosts: hosts.length,
    vms: vms.length,
    poweredOn,
    avgCpu,
    avgMem,
    storagePct,
    health: 94,
  };
}

/** Merge prod + DR host stubs for license mapping UI */
export function getAllHostsForLicensing() {
  return [...hosts, ...drHostsForLicensing];
}

export function daysUntilExpiry(isoDate) {
  const end = new Date(`${isoDate}T23:59:59`);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

/** 🔴 &lt;7d · 🟠 &lt;30d · 🟢 ≥30d (expired counts as critical) */
export function getExpiryTier(daysRemaining) {
  if (daysRemaining < 0) return "critical";
  if (daysRemaining < 7) return "critical";
  if (daysRemaining < 30) return "warning";
  return "safe";
}

export function pctLicenseUsed(lic) {
  if (!lic.licensedCores) return 0;
  return Math.round((lic.usedCores / lic.licensedCores) * 1000) / 10;
}

export function getUtilizationInsight(pct) {
  if (pct >= 92) {
    return {
      tone: "risk",
      label: "Over-provisioning risk",
      text: "You are close to licensed core limits. Growth or host adds may breach entitlement before renewal.",
    };
  }
  if (pct >= 80) {
    return {
      tone: "watch",
      label: "Elevated usage",
      text: "Healthy headroom is shrinking — model next host purchase against renewal core counts.",
    };
  }
  if (pct <= 55) {
    return {
      tone: "waste",
      label: "Under-utilized license",
      text: "A large share of cores is unused — right-size at renewal or consolidate clusters to optimize spend.",
    };
  }
  return {
    tone: "ok",
    label: "Balanced footprint",
    text: "Utilization sits in a practical band for most renewals.",
  };
}

/**
 * Simple 3-month projection: usedCores × (1 + monthlyGrowth%)^3 vs entitlement.
 */
export function getRenewalProjection(lic) {
  const g = lic.monthlyGrowthPct / 100;
  const horizonMonths = 3;
  let projected = lic.usedCores;
  for (let i = 0; i < horizonMonths; i++) {
    projected *= 1 + g;
  }
  projected = Math.round(projected);
  const threshold = Math.round(lic.licensedCores * 0.88);
  const headroomPct = Math.round((1 - lic.usedCores / lic.licensedCores) * 100);
  const growthToLimitPct =
    lic.licensedCores > lic.usedCores
      ? Math.round(((projected - lic.usedCores) / (lic.licensedCores - lic.usedCores)) * 100)
      : 100;

  let headline;
  if (projected >= threshold) {
    headline = `At current growth (~${lic.monthlyGrowthPct}% / mo), projected usage in ${horizonMonths} months is ~${projected} cores (${growthToLimitPct}% of remaining headroom consumed). Consider quoting **+${Math.min(
      35,
      Math.max(10, growthToLimitPct - 40)
    )}%** core uplift for renewal.`;
  } else {
    headline = `At current growth, you are likely to stay **below ~88%** of ${lic.licensedCores} licensed cores for the next ${horizonMonths} months (${headroomPct}% headroom today).`;
  }

  return { headline, projectedCores: projected, horizonMonths };
}

export function getLicenseCalendarEvents() {
  const out = [];
  for (const cluster of licenseClusters) {
    for (const lic of cluster.licenses) {
      const daysRemaining = daysUntilExpiry(lic.expiresOn);
      out.push({
        ...lic,
        clusterId: cluster.id,
        clusterName: cluster.name,
        vcenter: cluster.vcenter,
        daysRemaining,
        tier: getExpiryTier(daysRemaining),
        utilizationPct: pctLicenseUsed(lic),
      });
    }
  }
  out.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return out;
}

export function getSmartLicenseAlerts() {
  const alerts = [];
  for (const cluster of licenseClusters) {
    for (const lic of cluster.licenses) {
      const days = daysUntilExpiry(lic.expiresOn);
      const tier = getExpiryTier(days);
      const pct = pctLicenseUsed(lic);
      const exp = new Date(`${lic.expiresOn}T12:00:00`);
      const expStr = exp.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let headline;
      let detail;
      if (tier === "critical") {
        headline = `${lic.edition} — contract ${lic.contractId}`;
        detail =
          days < 0
            ? `Support **lapsed ${Math.abs(days)} day(s) ago** (${expStr}). Reconcile compliance and backline support immediately.`
            : `Renews in **${days} day(s)** (${expStr}). You are at **${pct}%** of **${lic.licensedCores}** licensed cores (**${lic.usedCores}** in use). Open PO before window closes — not just “expiring soon”.`;
      } else if (tier === "warning") {
        headline = `${lic.product} (${lic.edition})`;
        detail = `**${days} days** remaining (${expStr}). Usage **${pct}%** on **${lic.licensedCores}** cores. Add to renewal calendar and attach growth projection for finance.`;
      } else {
        headline = `${lic.edition} — healthy runway`;
        detail = `**${days} days** to renewal (${expStr}). **${pct}%** of licensed cores in use — schedule vendor outreach in the next quarter.`;
      }

      alerts.push({
        id: `${cluster.id}-${lic.id}`,
        tier,
        headline,
        detail,
        clusterName: cluster.name,
        contractId: lic.contractId,
        days,
        pct,
      });
    }
  }
  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, safe: 2 };
    return order[a.tier] - order[b.tier] || a.days - b.days;
  });
  return alerts;
}

function formatUsdRough(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function getLicensingCostBreakdown() {
  return licenseClusters.map((cluster) => {
    const clusterHosts = getAllHostsForLicensing().filter((h) => cluster.hostIds.includes(h.id));
    const totalCores = clusterHosts.reduce((s, h) => s + (h.physicalCores || 0), 0);
    const totalAnnual = cluster.licenses.reduce((s, l) => s + l.annualCostUsd, 0);
    const primary = cluster.licenses[0];
    const util = primary ? pctLicenseUsed(primary) : 0;

    const perHost = clusterHosts.map((h) => {
      const cores = h.physicalCores || 0;
      const share = totalCores ? cores / totalCores : 0;
      return {
        hostId: h.id,
        name: h.name,
        model: h.model || "—",
        cores,
        annualAllocated: Math.round(totalAnnual * share),
        monthlyAllocated: Math.round((totalAnnual * share) / 12),
      };
    });

    const wasteInsight =
      util < 55
        ? `${cluster.name} is costing **${formatUsdRough(totalAnnual)}/yr** but primary vSphere bundle is only **~${util}%** utilized — optimize SKUs or consolidate.`
        : util > 90
          ? `${cluster.name} annual spend **${formatUsdRough(totalAnnual)}** with **~${util}%** license saturation — budget for core expansion at renewal.`
          : `${cluster.name} spend **${formatUsdRough(totalAnnual)}/yr** with **~${util}%** core utilization — aligned for typical renewal.`;

    return {
      clusterId: cluster.id,
      clusterName: cluster.name,
      vcenter: cluster.vcenter,
      totalAnnualUsd: totalAnnual,
      totalMonthlyUsd: Math.round(totalAnnual / 12),
      primaryUtilizationPct: util,
      perHost,
      wasteInsight,
    };
  });
}

export function getLicensingOverviewStrip() {
  const alerts = getSmartLicenseAlerts();
  const critical = alerts.filter((a) => a.tier === "critical");
  if (critical.length) {
    const top = critical[0];
    return {
      tier: "critical",
      title: "License action required",
      message: `${top.headline} — ${top.detail.replace(/\*\*/g, "")}`,
      cluster: top.clusterName,
    };
  }
  const warn = alerts.filter((a) => a.tier === "warning");
  if (warn.length) {
    const top = warn[0];
    return {
      tier: "warning",
      title: "Renewals within 30 days",
      message: `${top.headline} — ${top.detail.replace(/\*\*/g, "")}`,
      cluster: top.clusterName,
    };
  }
  return null;
}

export function getLicensingNavBadgeCount() {
  return getLicenseCalendarEvents().filter((e) => e.tier === "critical" || e.tier === "warning").length;
}
