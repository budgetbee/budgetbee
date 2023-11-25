import React, { MouseEvent, useState, useRef } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(...registerables);

export default function DoughnutChart({ data, setParentKey }) {
    const [isZoom, setIsZoom] = useState(false);
    const dataEntries = Object.entries(data);
    dataEntries.sort((a, b) => b[1].amount - a[1].amount);

    const chartData = {
        labels: dataEntries.map(([key]) => key),
        datasets: [
            {
                data: dataEntries.map(([, value]) => value.amount),
                backgroundColor: dataEntries.map(([, value]) => value.color),
                borderColor: ["rgb(55,65,81, 0)"],
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
    };

    const chartRef = useRef(null);

    const onClick = (event) => {

        if (!setParentKey) {
            return;
        }

        const chart = chartRef.current;

        if (isZoom) {
            return;
        }

        setIsZoom(true);
        if (!chart) {
            return;
        }

        const activeElements = chart.getElementsAtEventForMode(
            event,
            "nearest",
            { intersect: true },
            false
        );

        if (activeElements.length > 0) {
            const selectedIndex = activeElements[0].index;
            const selectedData = dataEntries[selectedIndex];
            setParentKey(selectedData[0]);
        }
    };

    const handleZoomout = () => {
        setIsZoom(false);
        if (setParentKey) {
            setParentKey(null);
        }
    };

    return (
        <div className="relative h-full">
            {isZoom && (
                <div
                    className="absolute top-0 right-0 bg-gray-900 text-gray-300 px-4 py-2 rounded"
                    onClick={handleZoomout}
                >
                    Back
                </div>
            )}
            <Doughnut
                ref={chartRef}
                data={chartData}
                onClick={onClick}
                options={options}
            />
        </div>
    );
}
