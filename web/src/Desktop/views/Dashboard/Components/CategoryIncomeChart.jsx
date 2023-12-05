import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import DoughnutChart from "../../../../Components/Chart/DoughnutChart";
import Loader from "../../../../Components/Miscellaneous/Loader";

export default function CategoryIncomeChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getIncomeCategoriesBalance() {
            const categories = await Api.getIncomeCategoriesBalance(searchData);

            const data = {};
            Object.keys(categories).forEach((key) => {
                data[key] = {
                    amount: categories[key].amount,
                    color: categories[key].color,
                };
            });;

            setData(data);
            setIsLoading(false);
        }
        setIsLoading(true);
        getIncomeCategoriesBalance();
    }, [searchData]);

    let chart = <Loader classes="w-32 mt-10" />;
    if (!isLoading) {
        chart = <DoughnutChart data={data} />;
    }

    return (
        <div>
            <div className="flex flex-col gap-x-2 p-4 bg-gray-700 rounded-3xl py-4">
                <div className="flex flex-row justify-between items-center text-white text-2xl pb-4">
                    <div className="font-bold">Income</div>
                </div>
                <div className="h-64 w-64">{chart}</div>
            </div>
        </div>
    );
}
