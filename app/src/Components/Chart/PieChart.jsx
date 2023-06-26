import React from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(...registerables);

export default function PieChart({ data }) {
    // Convertir el objeto de datos en un array de pares clave-valor
    const dataEntries = Object.entries(data);

    // Ordenar los datos en orden descendente según los valores
    dataEntries.sort((a, b) => b[1] - a[1]);

    // Obtener arrays separados de etiquetas y datos en el nuevo orden
    const chartData = {
        labels: dataEntries.map(([key]) => key),
        datasets: [
            {
                data: dataEntries.map(([_, value]) => value),
                backgroundColor: [
                    "rgba(75,192,192,0.2)",
                    "rgba(192,75,75,0.2)",
                    "rgba(75,192,75,0.2)",
                    // Agrega más colores si tienes más datos
                ],
                borderColor: [
                    "rgba(75,192,192,1)",
                    "rgba(192,75,75,1)",
                    "rgba(75,192,75,1)",
                    // Agrega más colores si tienes más datos
                ],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                display: false,
            },
        },
        plugins: {
            tooltip: {
                enabled: false,
            },
            zoom: {
                zoom: false,
            },
        },
        legend: {
            display: false, // Ocultar la leyenda
        },
    };

    return <Pie data={chartData} options={options} />;
}
