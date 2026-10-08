import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

/**
 * The user's budgets with a visual warning as a limit is approached: amber from
 * 80% of the amount, red once it is reached. The numbers come straight from the
 * budgets endpoint (per-month spend computed by the backend).
 */
function limitFor(percent) {
    if (percent >= 100) {
        return {
            bar: "bg-red-500",
            text: "text-red-400",
            badge: "bg-red-500/15 border-red-500/25 text-red-300",
            label: "Over the limit",
        };
    }
    if (percent >= 80) {
        return {
            bar: "bg-amber-500",
            text: "text-amber-400",
            badge: "bg-amber-500/15 border-amber-500/25 text-amber-300",
            label: "Close to the limit",
        };
    }
    return {
        bar: "bg-emerald-500",
        text: "text-emerald-400",
        badge: "",
        label: "",
    };
}

export default function BudgetsOverviewCard() {
    const [budgets, setBudgets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function getBudgets() {
            const response = await Api.getAllBudgets();
            if (cancelled) {
                return;
            }
            const list = Array.isArray(response?.data) ? response.data : [];
            list.sort((a, b) => b.spent_percent - a.spent_percent);
            setBudgets(list);
            setIsLoading(false);
        }
        getBudgets();
        return () => {
            cancelled = true;
        };
    }, []);

    const action = (
        <Link
            to="/budget"
            className="text-sm text-emerald-300 hover:text-emerald-200 whitespace-nowrap"
        >
            All budgets
        </Link>
    );

    return (
        <DashboardCard
            title="Budgets"
            icon="fa-solid fa-sack-dollar"
            tone="emerald"
            subtitle="This month"
            action={action}
            className="h-full"
        >
            {isLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading budgets...</p>
            ) : budgets.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                    No budgets yet. Set one to watch a category month by month.
                </p>
            ) : (
                <div className="mt-3 flex flex-col">
                    {budgets.slice(0, 4).map((budget) => {
                        const percent = Number(budget.spent_percent) || 0;
                        const limit = limitFor(percent);
                        return (
                            <div
                                key={budget.id}
                                className="flex flex-col gap-2 py-3 border-t border-gray-800/60 first:border-t-0"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className="flex items-center justify-center w-9 h-9 rounded-2xl text-white shrink-0"
                                            style={{ backgroundColor: budget.category_color }}
                                        >
                                            <FontAwesomeIcon
                                                icon={budget.category_icon}
                                                className="text-sm"
                                            />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-sm text-white truncate">
                                                {budget.category_name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {budget.parent_category_name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`text-sm font-semibold ${limit.text}`}>
                                            {numeral(percent).format("0,0")}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {numeral(budget.spent).format("0,0.00")} /{" "}
                                            {numeral(budget.amount).format("0,0.00")}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#0a0a0f]">
                                    <div
                                        className={`h-full rounded-full ${limit.bar}`}
                                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                    />
                                </div>
                                {limit.badge && (
                                    <span
                                        className={`w-fit rounded-full border px-2.5 py-0.5 text-xs ${limit.badge}`}
                                    >
                                        {limit.label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardCard>
    );
}
