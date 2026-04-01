import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import Loader from "../../../Components/Miscellaneous/Loader";

export default function TopExpensesPanel({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [topExpenses, setTopExpenses] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);

    useEffect(() => {
        async function fetchTopExpenses() {
            setIsLoading(true);
            const [data, balance] = await Promise.all([
                Api.getTopExpenses(searchData),
                Api.getAllBalance(searchData),
            ]);
            setTopExpenses(Array.isArray(data) ? data : []);
            setTotalExpenses(balance?.expenses ?? 0);
            setIsLoading(false);
        }
        fetchTopExpenses();
    }, [searchData]);

    return (
        <div className="flex flex-col gap-y-4 p-5 bg-gray-700 rounded-3xl">
            <div className="text-lg font-bold text-white">Top Expense Categories</div>

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader classes="w-16" />
                </div>
            ) : topExpenses.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No expenses for this period.</p>
            ) : (
                <div className="flex flex-row gap-x-4 flex-wrap">
                    {topExpenses.map((category, index) => {
                        const pct =
                            totalExpenses !== 0 ? (Math.abs(category.amount) / Math.abs(totalExpenses)) * 100 : 0;
                        const inline_style = { backgroundColor: category.color };
                        const medal = ["🥇", "🥈", "🥉"][index] ?? null;
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center gap-y-3 p-4 bg-gray-800 rounded-2xl flex-1 min-w-[120px]"
                            >
                                <div className="flex flex-col items-center gap-y-2">
                                    {medal && (
                                        <span className="text-xl">{medal}</span>
                                    )}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={inline_style}
                                    >
                                        <FontAwesomeIcon
                                            icon={category.icon}
                                            className="text-white text-lg"
                                        />
                                    </div>
                                    <span className="text-white text-sm font-medium text-center leading-tight">
                                        {category.name.length > 14
                                            ? category.name.slice(0, 14) + "…"
                                            : category.name}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <div className="text-white font-bold">
                                        {category.currency_symbol}{" "}
                                        {numeral(category.amount).format("0,0.00")}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {numeral(pct).format("0.0")}% of expenses
                                    </div>
                                </div>
                                {/* mini progress bar */}
                                <div className="w-full bg-gray-600 rounded-full h-1">
                                    <div
                                        className="h-1 rounded-full"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: category.color,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
