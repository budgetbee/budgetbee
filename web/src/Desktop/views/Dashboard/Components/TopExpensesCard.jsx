import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

export default function TopExpensesCard({ searchData }) {
    const [topExpenses, setTopExpenses] = useState([]);

    useEffect(() => {
        let cancelled = false;
        async function getTopExpenses() {
            const data = await Api.getTopExpenses(searchData);
            if (!cancelled) {
                setTopExpenses(Array.isArray(data) ? data : []);
            }
        }
        getTopExpenses();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    return (
        <DashboardCard
            title="Top expenses"
            icon="fa-solid fa-arrow-trend-down"
            tone="amber"
            subtitle="Biggest categories in this period"
            className="h-full"
        >
            {topExpenses.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No expenses in this period.</p>
            ) : (
                <div className="mt-3 flex flex-col">
                    {topExpenses.slice(0, 3).map((category, index) => {
                        const name =
                            category.name && category.name.length > 20
                                ? category.name.slice(0, 20) + "..."
                                : category.name;
                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 py-1.5 border-t border-white/5 first:border-t-0"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span
                                        className="flex items-center justify-center w-8 h-8 rounded-xl text-white shrink-0"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <FontAwesomeIcon
                                            icon={category.icon}
                                            className="text-sm"
                                        />
                                    </span>
                                    <span className="text-sm text-gray-300 truncate">
                                        {name}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-white shrink-0">
                                    {category.currency_symbol}{" "}
                                    {numeral(Math.abs(category.amount)).format("0,0.00")}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardCard>
    );
}
