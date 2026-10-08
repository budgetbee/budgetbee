import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import DoughnutChart from "../../../../Components/Chart/DoughnutChart";
import Loader from "../../../../Components/Miscellaneous/Loader";
import DashboardCard from "./DashboardCard";

export default function CategoryIncomeChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function getIncomeCategoriesBalance() {
            const categories = await Api.getIncomeCategoriesBalance(searchData);

            const chartData = {};
            Object.keys(categories || {}).forEach((key) => {
                chartData[key] = {
                    amount: categories[key].amount,
                    color: categories[key].color,
                };
            });

            if (!cancelled) {
                setData(chartData);
                setIsLoading(false);
            }
        }
        setIsLoading(true);
        getIncomeCategoriesBalance();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    let chart = <Loader classes="w-24 mt-6" />;
    if (!isLoading) {
        chart = <DoughnutChart data={data || {}} />;
    }

    return (
        <DashboardCard title="Income by category" icon="fa-solid fa-chart-pie" tone="emerald">
            <div className="mt-4 h-56 w-full">{chart}</div>
        </DashboardCard>
    );
}
