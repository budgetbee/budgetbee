import React from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(...registerables);

export default function LineChart({ data }) {
    // Convertir el objeto de datos en un array de pares clave-valor
    const dataEntries = Object.entries(data);

    // Obtener arrays separados de etiquetas y datos
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
    const yRange = (yMax - yMin) * 0.15; // 15% del rango total
    const yMinAdjusted = yMin - yRange;
    const yMaxAdjusted = yMax + yRange;

    // Calcular los límites del eje y con ajuste proporcional
    const yMinAligned = yMin - (yMin / 10); // 15% más bajo
    console.log(yMin);
    const yMaxAligned = yMax + (yMax / 10) // 15% más alto
    console.log(yMax);

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
                enabled: false, // Ocultar el tooltip en la parte superior
            },
            zoom: {
                zoom: false, // Desactivar el zoom
            },
        },
    };

    return <Line data={chartData} options={options} />;
}
