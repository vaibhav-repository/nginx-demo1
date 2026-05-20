const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      titleColor: "#f1f5f9",
      bodyColor: "#94a3b8",
      borderColor: "rgba(148, 163, 184, 0.2)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: "'DM Sans', sans-serif", weight: "600" },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
    },
  },
};

const gridColor = "rgba(148, 163, 184, 0.08)";
const tickColor = "#64748b";

function axisStyle() {
  return {
    grid: { color: gridColor },
    ticks: { color: tickColor, font: { size: 10, family: "'JetBrains Mono', monospace" } },
    border: { display: false },
  };
}

let utilizationChart = null;
let storageChart = null;
let networkChart = null;

export function initUtilizationChart(canvas, data) {
  if (utilizationChart) utilizationChart.destroy();

  const ctx = canvas.getContext("2d");
  const gradientCpu = ctx.createLinearGradient(0, 0, 0, 260);
  gradientCpu.addColorStop(0, "rgba(56, 189, 248, 0.35)");
  gradientCpu.addColorStop(1, "rgba(56, 189, 248, 0)");

  const gradientMem = ctx.createLinearGradient(0, 0, 0, 260);
  gradientMem.addColorStop(0, "rgba(167, 139, 250, 0.3)");
  gradientMem.addColorStop(1, "rgba(167, 139, 250, 0)");

  utilizationChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "CPU %",
          data: data.cpu,
          borderColor: "#38bdf8",
          backgroundColor: gradientCpu,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: "Memory %",
          data: data.memory,
          borderColor: "#a78bfa",
          backgroundColor: gradientMem,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      ...chartDefaults,
      scales: {
        x: { ...axisStyle() },
        y: {
          ...axisStyle(),
          min: 0,
          max: 100,
          ticks: { ...axisStyle().ticks, callback: (v) => v + "%" },
        },
      },
    },
  });

  return utilizationChart;
}

export function initStorageChart(canvas, datastores) {
  if (storageChart) storageChart.destroy();

  storageChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: datastores.map((d) => d.name),
      datasets: [
        {
          label: "Used (TB)",
          data: datastores.map((d) => d.used),
          backgroundColor: "rgba(56, 189, 248, 0.85)",
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 28,
        },
        {
          label: "Free (TB)",
          data: datastores.map((d) => +(d.capacity - d.used).toFixed(1)),
          backgroundColor: "rgba(148, 163, 184, 0.15)",
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 28,
        },
      ],
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ...axisStyle(),
          stacked: true,
          grid: { display: false },
        },
        y: {
          ...axisStyle(),
          stacked: true,
          ticks: { ...axisStyle().ticks, callback: (v) => v + " TB" },
        },
      },
    },
  });

  return storageChart;
}

export function initNetworkChart(canvas, data) {
  if (networkChart) networkChart.destroy();

  networkChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Ingress",
          data: data.ingress,
          borderColor: "#34d399",
          backgroundColor: "transparent",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Egress",
          data: data.egress,
          borderColor: "#fbbf24",
          backgroundColor: "transparent",
          tension: 0.35,
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0,
        },
      ],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            color: "#94a3b8",
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            font: { size: 11, family: "'DM Sans', sans-serif" },
          },
        },
      },
      scales: {
        x: axisStyle(),
        y: {
          ...axisStyle(),
          ticks: { ...axisStyle().ticks, callback: (v) => v + " Gbps" },
        },
      },
    },
  });

  return networkChart;
}

export function refreshCharts(utilData) {
  if (utilizationChart) {
    utilizationChart.data.labels = utilData.labels;
    utilizationChart.data.datasets[0].data = utilData.cpu;
    utilizationChart.data.datasets[1].data = utilData.memory;
    utilizationChart.update("none");
  }
}
