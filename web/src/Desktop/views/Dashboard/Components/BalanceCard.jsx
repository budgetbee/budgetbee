import React, { useEffect, useState } from "react";
import numeral from "numeral";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

export default function BalanceCard({ searchData }) {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function getBalance() {
            const data = await Api.getBalance(searchData);
            if (!cancelled) {
                setBalance(data);
            }
        }
        getBalance();
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
            <div className="mt-4 whitespace-nowrap text-2xl font-bold text-white xl:text-3xl">
                {balance?.currency_symbol} {numeral(balance?.amount).format("0,0.00")}
            </div>
            <p className="mt-1 text-xs text-gray-500">Across your accounts</p>
        </DashboardCard>
    );
}
