import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

export default function IncomeExpensesBalanceCard({ searchData }) {
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [currency, setCurrency] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function getAllBalance() {
            const balance = await Api.getAllBalance(searchData);
            if (cancelled) {
                return;
            }
            setTotalIncome(balance.incomes);
            setTotalExpenses(balance.expenses);
            setCurrency(balance.currency_symbol);
        }
        getAllBalance();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    return (
        <DashboardCard
            title="Income & expenses"
            icon="fa-solid fa-scale-balanced"
            tone="blue"
            className="h-full"
        >
            <div className="mt-4 grid grid-cols-2">
                <div className="flex flex-col gap-1 pr-4">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                        <FontAwesomeIcon
                            icon="fa-solid fa-arrow-trend-up"
                            className="text-emerald-400"
                        />
                        Income
                    </span>
                    <span className="text-2xl font-bold text-white">
                        {currency} {numeral(totalIncome).format("0,0.00")}
                    </span>
                </div>
                <div className="flex flex-col gap-1 border-l border-white/5 pl-4">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                        <FontAwesomeIcon
                            icon="fa-solid fa-arrow-trend-down"
                            className="text-red-400"
                        />
                        Expenses
                    </span>
                    <span className="text-2xl font-bold text-white">
                        {currency} {numeral(Math.abs(totalExpenses)).format("0,0.00")}
                    </span>
                </div>
            </div>
        </DashboardCard>
    );
}
