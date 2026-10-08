import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import LineChart from "../../../../Components/Chart/LineChart";
import Loader from "../../../../Components/Miscellaneous/Loader";
import DashboardCard from "./DashboardCard";

export default function BalanceChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [currencySymbol, setCurrencySymbol] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function getTimelineBalance() {
            const [timelineData, balanceData] = await Promise.all([
                Api.getTimelineBalance(searchData),
                Api.getBalance(searchData),
            ]);
            if (cancelled) {
                return;
            }
            setData(timelineData);
            setCurrencySymbol(balanceData?.currency_symbol || "");
            setIsLoading(false);
        }
        setIsLoading(true);
        getTimelineBalance();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    let chart = <Loader classes="w-32 mt-32" />;
    if (!isLoading && data && Object.keys(data).length > 0) {
        chart = <LineChart data={data} currencySymbol={currencySymbol} />;
    } else if (!isLoading) {
        chart = <p className="mt-3 text-sm text-gray-500">No data in this period.</p>;
    }

    return (
        <DashboardCard title="Balance over time" icon="fa-solid fa-chart-line" tone="blue">
            <div className="mt-4 h-96">{chart}</div>
        </DashboardCard>
    );
}
