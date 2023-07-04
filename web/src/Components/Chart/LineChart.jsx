import React from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(...registerables);

export default function LineChart({ data }) {
    const dataEntries = Object.entries(data);

    const chartData = {
        labels: dataEntries.map(([key]) => key),
        datasets: [
            {
                data: dataEntries.map(([_, value]) => value),
                backgroundColor: "rgba(75,192,192,0.2)",
                borderColor: "rgba(75,192,192,1)",
                borderWidth: 2,
                pointRadius: 0,
            },
        ],
    };

    const dataValues = dataEntries.map(([_, value]) => value);
    const yMin = Math.min(...dataValues);
    const yMax = Math.max(...dataValues);

    const yMinAligned = yMin - (yMin / 10);
    const yMaxAligned = yMax + (yMax / 10);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                type: "linear",
                min: yMinAligned,
                max: yMaxAligned,
                beginAtZero: true,
                ticks: {
                    // stepSize: 1000,
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
            zoom: {
                zoom: false,
            },
        },
    };

    return <Line data={chartData} options={options} />;
}
