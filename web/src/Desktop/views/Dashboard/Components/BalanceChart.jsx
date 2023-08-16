import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import LineChart from "../../../../Components/Chart/LineChart";
import Loader from "../../../../Components/Miscellaneous/Loader";

export default function BalanceChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getTimelineBalance() {
            const data = await Api.getTimelineBalance(searchData);
            setData(data);
            setIsLoading(false);
        }
        getTimelineBalance();
    }, [searchData]);

    let chart = <Loader classes="w-20 mt-10" />;
    if (!isLoading) {
        chart = <LineChart data={data} />
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
