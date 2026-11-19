import React, { useEffect, useState } from "react";
import moment from "moment";
import numeral from "numeral";
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar } from "react-chartjs-2";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

ChartJS.register(...registerables);

/**
 * Net flow per month.
 *
 * The server already sends the daily balance series for the period, so the flow
 * of a month is the balance it closes with minus the one the previous month
 * closed with: no extra endpoint and no extra requests. The first month of the
 * series is dropped because the balance before it is not known, and guessing it
 * would be worse than not showing it.
 */
function flujoPorMes(serie) {
    const fechas = Object.keys(serie || {}).sort();
    if (fechas.length === 0) {
        return [];
    }

    const meses = [];
    let actual = null;
    for (const fecha of fechas) {
        const mes = fecha.slice(0, 7);
        if (!actual || actual.mes !== mes) {
            actual = { mes, cierre: serie[fecha] };
            meses.push(actual);
        }
        actual.cierre = serie[fecha];
    }

    // El primero no se puede calcular: falta el saldo con el que empezaba.
    return meses.slice(1).map((mes, i) => {
        const anterior = meses[i].cierre;
        return {
            mes: mes.mes,
            flujo: Math.round((mes.cierre - anterior) * 100) / 100,
        };
    });
}

export default function CashFlowChart({ searchData }) {
    const [meses, setMeses] = useState([]);
    const [currency, setCurrency] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const [serie, balance] = await Promise.all([
                Api.getTimelineBalance(searchData),
                Api.getBalance(searchData),
            ]);
            if (cancelled) {
                return;
            }
            setMeses(flujoPorMes(serie));
            setCurrency(balance?.currency_symbol || "");
            setIsLoading(false);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    const neto = meses.reduce((total, mes) => total + mes.flujo, 0);
    const positivo = neto >= 0;
    const mejor = meses.reduce(
        (max, mes) => (max === null || mes.flujo > max.flujo ? mes : max),
        null
    );

    const chartData = {
        labels: meses.map((mes) => moment(mes.mes + "-01").format("MMM")),
        datasets: [
            {
                data: meses.map((mes) => mes.flujo),
                backgroundColor: meses.map((mes, i) => {
                    const ultimo = i === meses.length - 1;
                    if (mes.flujo >= 0) {
                        return ultimo
                            ? "rgba(16,185,129,0.95)"
                            : "rgba(16,185,129,0.45)";
                    }
                    return ultimo ? "rgba(239,68,68,0.95)" : "rgba(239,68,68,0.45)";
                }),
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 26,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const valor = ctx.parsed.y || 0;
                        const signo = valor < 0 ? "-" : "+";
                        return `${signo}${currency} ${numeral(Math.abs(valor)).format(
                            "0,0.00"
                        )}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: "rgba(255,255,255,0.45)", font: { size: 11 } },
            },
            y: {
                grid: { color: "rgba(255,255,255,0.06)" },
                border: { display: false },
                ticks: {
                    color: "rgba(255,255,255,0.45)",
                    font: { size: 11 },
                    maxTicksLimit: 5,
                    callback: (valor) => {
                        const abs = Math.abs(valor);
                        if (abs >= 1000) {
                            return `${valor < 0 ? "-" : ""}${numeral(abs / 1000).format(
                                "0,0.0"
                            )}k`;
                        }
                        return numeral(valor).format("0,0");
                    },
                },
            },
        },
    };

    return (
        <DashboardCard
            title="Cash flow"
            icon="fa-solid fa-chart-column"
            tone="emerald"
            subtitle="Net per month"
            className="h-full"
        >
            {isLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading cash flow...</p>
            ) : meses.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No data in this period.</p>
            ) : (
                <>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div
                                className={`text-3xl font-bold ${
                                    positivo ? "text-white" : "text-red-400"
                                }`}
                            >
                                {positivo ? "+" : "-"}
                                {currency}{" "}
                                {numeral(Math.abs(neto)).format("0,0.00")}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Net across the period
                            </p>
                        </div>
                        {mejor && (
                            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                                Best month:{" "}
                                {moment(mejor.mes + "-01").format("MMMM")}{" "}
                                {currency}{" "}
                                {numeral(Math.abs(mejor.flujo)).format("0,0.00")}
                            </span>
                        )}
                    </div>
                    <div className="mt-4 h-56">
                        <Bar data={chartData} options={options} />
                    </div>
                </>
            )}
        </DashboardCard>
    );
}
