import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { Link } from "react-router-dom";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

/**
 * How much of this month's budget is gone, as a ring.
 *
 * The amount spent and what was budgeted are added up across every budget of
 * the user, and the colour follows the same rule as the budgets list: green
 * until 80%, amber from there and red once the limit is reached.
 */
function colorFor(percent) {
    if (percent >= 100) {
        return { stroke: "#ef4444", text: "text-red-400", chip: "border-red-500/25 bg-red-500/15 text-red-300", label: "Over the limit" };
    }
    if (percent >= 80) {
        return { stroke: "#f59e0b", text: "text-amber-400", chip: "border-amber-500/25 bg-amber-500/15 text-amber-300", label: "Close to the limit" };
    }
    return { stroke: "#10b981", text: "text-emerald-400", chip: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300", label: "On track" };
}

const RADIO = 62;
const GROSOR = 14;
const VUELTA = 2 * Math.PI * RADIO;

export default function BudgetRingCard() {
    const [budgets, setBudgets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const response = await Api.getAllBudgets();
            if (cancelled) {
                return;
            }
            setBudgets(Array.isArray(response?.data) ? response.data : []);
            setIsLoading(false);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const total = budgets.reduce((suma, b) => suma + (Number(b.amount) || 0), 0);
    const gastado = budgets.reduce((suma, b) => suma + (Number(b.spent) || 0), 0);
    const percent = total > 0 ? (gastado / total) * 100 : 0;
    const color = colorFor(percent);
    const symbol = budgets[0]?.currency_symbol || "";
    const recorrido = (Math.min(100, Math.max(0, percent)) / 100) * VUELTA;

    return (
        <DashboardCard
            title="Budget used"
            icon="fa-solid fa-gauge-high"
            tone="amber"
            subtitle="This month"
            className="h-full"
            action={
                <Link
                    to="/budget"
                    className="text-sm text-emerald-300 hover:text-emerald-200 whitespace-nowrap"
                >
                    All budgets
                </Link>
            }
        >
            {isLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading budgets...</p>
            ) : budgets.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                    No budgets yet. Set one to watch a category month by month.
                </p>
            ) : (
                <div className="mt-2 flex flex-col items-center">
                    <div className="relative">
                        <svg width="160" height="160" viewBox="0 0 160 160">
                            <circle
                                cx="80"
                                cy="80"
                                r={RADIO}
                                fill="none"
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth={GROSOR}
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r={RADIO}
                                fill="none"
                                stroke={color.stroke}
                                strokeWidth={GROSOR}
                                strokeLinecap="round"
                                strokeDasharray={`${recorrido} ${VUELTA - recorrido}`}
                                transform="rotate(-90 80 80)"
                                style={{ transition: "stroke-dasharray 600ms ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${color.text}`}>
                                {numeral(percent).format("0,0")}%
                            </span>
                            <span className="text-xs text-gray-500">of the budget</span>
                        </div>
                    </div>

                    <div className="mt-3 text-center">
                        <div className="text-sm text-white">
                            {symbol} {numeral(gastado).format("0,0.00")}{" "}
                            <span className="text-gray-500">
                                of {symbol} {numeral(total).format("0,0.00")}
                            </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            {budgets.length}{" "}
                            {budgets.length === 1 ? "budget" : "budgets"} tracked
                        </div>
                    </div>

                    <span
                        className={`mt-3 rounded-full border px-3 py-1 text-xs ${color.chip}`}
                    >
                        {color.label}
                    </span>
                </div>
            )}
        </DashboardCard>
    );
}
