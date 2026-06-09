import React, { useEffect, useRef, useState } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { SankeyController, Flow } from "chartjs-chart-sankey";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import Loader from "../../../Components/Miscellaneous/Loader";

ChartJS.register(...registerables, SankeyController, Flow);

const CENTER_NODE = "Balance";
// Categories below this % of their side's total are merged into "Others"
const SMALL_THRESHOLD = 0.04;

function groupSmall(entries, total, othersLabel, defaultColor) {
    const main = [];
    let othersSum = 0;

    entries.forEach(([label, amount, color]) => {
        if (amount / total < SMALL_THRESHOLD) {
            othersSum += amount;
        } else {
            main.push([label, amount, color]);
        }
    });

    if (othersSum > 0) {
        main.push([othersLabel, othersSum, defaultColor]);
    }

    return main;
}

function buildSankeyData(incomeCategories, expenseCategories) {
    const flows = [];
    const colors = {};

    // Collect raw income entries
    let totalIncome = 0;
    const incomeEntries = Object.entries(incomeCategories).flatMap(([name, cat]) => {
        const amount = cat.amount ?? cat.total ?? 0;
        if (amount <= 0) return [];
        totalIncome += amount;
        return [[cat.name || name, amount, cat.color || "#22c55e"]];
    });

    // Collect raw expense entries
    let totalExpense = 0;
    const expenseEntries = Object.entries(expenseCategories).flatMap(([name, cat]) => {
        const amount = Math.abs(cat.amount ?? cat.total ?? 0);
        if (amount <= 0) return [];
        totalExpense += amount;
        return [[cat.name || name, amount, cat.color || "#ef4444"]];
    });

    // Group small categories
    const incomeGrouped = groupSmall(incomeEntries, totalIncome, "Other Income", "#6b7280");
    const expenseGrouped = groupSmall(expenseEntries, totalExpense, "Other Expenses", "#6b7280");

    // Income categories → CENTER_NODE
    incomeGrouped.forEach(([label, amount, color]) => {
        flows.push({ from: label, to: CENTER_NODE, flow: amount });
        colors[label] = color;
    });

    // CENTER_NODE → Expense categories
    expenseGrouped.forEach(([label, amount, color]) => {
        flows.push({ from: CENTER_NODE, to: label, flow: amount });
        colors[label] = color;
    });

    // Add savings node if positive
    const savings = totalIncome - totalExpense;
    if (savings > 0) {
        flows.push({ from: CENTER_NODE, to: "Savings", flow: savings });
        colors["Savings"] = "#a855f7";
    }

    colors[CENTER_NODE] = "#3b82f6";

    return { flows, colors, totalIncome, totalExpense, savings };
}

export default function SankeyPanel({ searchData }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, savings: 0, currency: "" });

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            setIsLoading(true);
            const [incomeData, expenseData] = await Promise.all([
                Api.getIncomeCategoriesBalance(searchData),
                Api.getExpenseCategoriesBalance(searchData),
            ]);

            if (cancelled) return;

            if (!incomeData || incomeData.error || !expenseData || expenseData.error) {
                setIsLoading(false);
                setIsEmpty(true);
                return;
            }

            const currencySymbol =
                Object.values(incomeData)[0]?.currency_symbol ||
                Object.values(expenseData)[0]?.currency_symbol ||
                "";

            const { flows, colors, totalIncome, totalExpense, savings } = buildSankeyData(
                incomeData,
                expenseData
            );

            if (flows.length === 0) {
                setIsEmpty(true);
                setIsLoading(false);
                return;
            }

            setSummary({ totalIncome, totalExpense, savings, currency: currencySymbol });

            // Destroy previous chart instance
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }

            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            chartRef.current = new ChartJS(ctx, {
                type: "sankey",
                data: {
                    datasets: [
                        {
                            label: "Money Flow",
                            data: flows,
                            colorFrom: (c) => colors[c.dataset.data[c.dataIndex]?.from] || "#6b7280",
                            colorTo: (c) => colors[c.dataset.data[c.dataIndex]?.to] || "#6b7280",
                            colorMode: "gradient",
                            alpha: 0.5,
                            borderWidth: 0,
                            nodeWidth: 18,
                            nodePadding: 60,
                            padding: 60,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label(ctx) {
                                    const d = ctx.dataset.data[ctx.dataIndex];
                                    return `${d.from} → ${d.to}: ${currencySymbol}${numeral(d.flow).format("0,0.00")}`;
                                },
                            },
                        },
                    },
                },
            });

            setIsEmpty(false);
            setIsLoading(false);
        }

        fetchData();

        return () => {
            cancelled = true;
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [searchData]);

    return (
        <div className="flex flex-col gap-y-4 p-5 bg-gray-700 rounded-3xl">
            {/* Header */}
            <div className="flex flex-row items-center gap-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/30">
                    <FontAwesomeIcon icon="fa-solid fa-money-bill-transfer" className="text-blue-400 text-sm" />
                </div>
                <span className="text-lg font-bold text-white">Money Flow</span>
            </div>

            {/* Legend */}
            {!isLoading && !isEmpty && (
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-x-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />
                        Income
                    </span>
                    <span className="flex items-center gap-x-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
                        Balance
                    </span>
                    <span className="flex items-center gap-x-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
                        Expenses
                    </span>
                    {summary.savings > 0 && (
                        <span className="flex items-center gap-x-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-500" />
                            Savings {numeral((summary.savings / summary.totalIncome) * 100).format("0.0")}%
                        </span>
                    )}
                </div>
            )}

            {/* Chart area */}
            <div className="relative w-full" style={{ height: 380 }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader classes="w-8 h-8" />
                    </div>
                )}
                {!isLoading && isEmpty && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2 text-gray-500">
                        <FontAwesomeIcon icon="fa-solid fa-chart-simple" className="text-3xl" />
                        <span className="text-sm">No data for this period</span>
                    </div>
                )}
                {!isEmpty && (
                    <canvas
                        ref={canvasRef}
                        style={{ display: isLoading ? "none" : "block", width: "100%", height: "100%" }}
                    />
                )}
            </div>
        </div>
    );
}
