import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import LineChart from "../../../../Components/Chart/LineChart";
import Loader from "../../../../Components/Miscellaneous/Loader";

export default function BalanceChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [currencySymbol, setCurrencySymbol] = useState("");

    useEffect(() => {
        async function getTimelineBalance() {
            const [timelineData, balanceData] = await Promise.all([
                Api.getTimelineBalance(searchData),
                Api.getBalance(searchData),
            ]);
            setData(timelineData);
            setCurrencySymbol(balanceData?.currency_symbol || "");
            setIsLoading(false);
        }
        setIsLoading(true);
        getTimelineBalance();
    }, [searchData]);

    let chart = <Loader classes="w-32 mt-32" />;
    if (!isLoading && data && Object.keys(data).length > 0) {
        chart = <LineChart data={data} currencySymbol={currencySymbol} />
    }

    return (
        <div>
            <div className="flex flex-col gap-y-2 p-4 bg-gray-700 rounded-3xl py-4">
                <div className="h-96">
                    {chart}
                </div>
            </div>
        </div>
    );
}
