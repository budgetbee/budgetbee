import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

/**
 * The essentials in one card: what you have, what came in and what went out.
 *
 * They used to be two separate cards plus a strip of summary numbers under
 * them, which made the top of the screen crowded and uneven.
 */
export default function BalanceCard({ searchData }) {
    const [balance, setBalance] = useState(null);
    const [totals, setTotals] = useState({ income: 0, expenses: 0, currency: "" });

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const [balanceData, allBalance] = await Promise.all([
                Api.getBalance(searchData),
                Api.getAllBalance(searchData),
            ]);
            if (cancelled) {
                return;
            }
            setBalance(balanceData);
            setTotals({
                income: allBalance?.incomes ?? 0,
                expenses: allBalance?.expenses ?? 0,
                currency:
                    allBalance?.currency_symbol ??
                    balanceData?.currency_symbol ??
                    "",
            });
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    return (
        <DashboardCard
            title="Balance"
            icon="fa-solid fa-wallet"
            tone="emerald"
            className="h-full"
        >
            <div className="mt-4 whitespace-nowrap text-3xl font-bold text-white">
                {balance?.currency_symbol} {numeral(balance?.amount).format("0,0.00")}
            </div>
            <p className="mt-1 text-xs text-gray-500">Across your accounts</p>

            <div className="mt-5 grid grid-cols-2 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1 pr-4">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                        <FontAwesomeIcon
                            icon="fa-solid fa-arrow-trend-up"
                            className="text-emerald-400"
                        />
                        Income
                    </span>
                    <span className="text-xl font-semibold text-white">
                        {totals.currency}{" "}
                        {numeral(Math.abs(totals.income)).format("0,0.00")}
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
                    <span className="text-xl font-semibold text-white">
                        {totals.currency}{" "}
                        {numeral(Math.abs(totals.expenses)).format("0,0.00")}
                    </span>
                </div>
            </div>
        </DashboardCard>
    );
}
