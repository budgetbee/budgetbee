import React, { useEffect, useState } from "react";
import Api from "../../../Api/Endpoints";
import LineChart from "../../../Components/Chart/LineChart";
import Loader from "../../../Components/Miscellaneous/Loader";

export default function TimelinePanel({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [currencySymbol, setCurrencySymbol] = useState("");

    useEffect(() => {
        async function fetch() {
            setIsLoading(true);
            const [timeline, balance] = await Promise.all([
                Api.getTimelineBalance(searchData),
                Api.getBalance(searchData),
            ]);
            setData(timeline);
            setCurrencySymbol(balance?.currency_symbol || "");
            setIsLoading(false);
        }
        fetch();
    }, [searchData]);

    return (
        <div className="flex flex-col gap-y-3 p-5 bg-gray-700 rounded-3xl">
            <div className="flex flex-row justify-between items-center">
                <div className="text-lg font-bold text-white">Balance Over Time</div>
            </div>
            <div className="h-72">
                {isLoading || !data || Object.keys(data).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        {isLoading ? (
                            <Loader classes="w-16" />
                        ) : (
                            <p className="text-gray-400 text-sm">No data for this period.</p>
                        )}
                    </div>
                ) : (
                    <LineChart data={data} currencySymbol={currencySymbol} />
                )}
            </div>
        </div>
    );
}
