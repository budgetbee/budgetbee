import React, { useRef } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(...registerables);

export default function LineChart({ data, currencySymbol }) {
    const chartRef = useRef(null);
    const dataEntries = Object.entries(data);

    const chartData = {
        labels: dataEntries.map(([key]) => key),
        datasets: [
            {
                data: dataEntries.map(([_, value]) => value),
                borderColor: "rgba(75,192,192,1)",
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                tension: 0.3,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return "rgba(75,192,192,0.1)";
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, "rgba(75,192,192,0.3)");
                    gradient.addColorStop(1, "rgba(75,192,192,0.02)");
                    return gradient;
                },
            },
        ],
    };

    const dataValues = dataEntries.map(([_, value]) => value);
    const yMin = Math.min(...dataValues);
    const yMax = Math.max(...dataValues);

    const range = yMax - yMin;
    const padding = range > 0 ? range * 0.1 : Math.abs(yMin) * 0.1 || 10;
    const yMinAligned = yMin - padding;
    const yMaxAligned = yMax + padding;

    const formatLabel = (dateStr) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    const symbol = currencySymbol || "";

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        scales: {
            x: {
                display: true,
                ticks: {
                    color: "rgba(255,255,255,0.5)",
                    maxTicksLimit: 12,
                    callback: function (value, index) {
                        return formatLabel(dataEntries[index]?.[0] || "");
                    },
                },
                grid: {
                    display: false,
                },
            },
            y: {
                type: "linear",
                min: yMinAligned,
                max: yMaxAligned,
                ticks: {
                    color: "rgba(255,255,255,0.5)",
                    callback: function (value) {
                        return value.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        });
                    },
                },
                grid: {
                    color: "rgba(255,255,255,0.06)",
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                backgroundColor: "rgba(30,41,59,0.95)",
                titleColor: "rgba(255,255,255,0.7)",
                bodyColor: "#fff",
                bodyFont: { size: 14, weight: "bold" },
                titleFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: function (tooltipItems) {
                        const dateStr = dataEntries[tooltipItems[0].dataIndex]?.[0] || "";
                        const date = new Date(dateStr + "T00:00:00");
                        return date.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    },
                    label: function (tooltipItem) {
                        const value = tooltipItem.raw.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });
                        return symbol + " " + value;
                    },
                },
            },
        },
    };

    return <Line ref={chartRef} data={chartData} options={options} />;
}
