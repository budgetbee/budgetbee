import React, { useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import DoughnutChart from "../../../../Components/Chart/DoughnutChart";
import Loader from "../../../../Components/Miscellaneous/Loader";
import DashboardCard from "./DashboardCard";

export default function CategoryExpenseChart({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [parentCategories, setParentCategories] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function getExpenseCategoriesBalance() {
            const fetchedParentCategories =
                await Api.getExpenseCategoriesBalance(searchData);
            if (cancelled) {
                return;
            }
            const chartData = {};

            Object.keys(fetchedParentCategories || {}).forEach((key) => {
                chartData[key] = {
                    id: fetchedParentCategories[key].id,
                    amount: fetchedParentCategories[key].amount,
                    color: fetchedParentCategories[key].color,
                };
            });

            setData(chartData);
            setParentCategories(fetchedParentCategories);
            setIsLoading(false);
        }

        if (!parentCategory) {
            setIsLoading(true);
            getExpenseCategoriesBalance();
        }
        return () => {
            cancelled = true;
        };
    }, [searchData, parentCategory]);

    useEffect(() => {
        if (parentCategory && parentCategories && parentCategories[parentCategory]) {
            const childrens = parentCategories[parentCategory].childrens;
            const chartData = {};

            Object.keys(childrens).forEach((key) => {
                chartData[key] = {
                    amount: childrens[key],
                };
            });

            setData(chartData);
        } else if (!parentCategory && parentCategories) {
            const chartData = {};

            Object.keys(parentCategories).forEach((key) => {
                chartData[key] = {
                    id: parentCategories[key].id,
                    amount: parentCategories[key].amount,
                    color: parentCategories[key].color,
                };
            });

            setData(chartData);
        }
    }, [parentCategory, parentCategories]);

    let chart = <Loader classes="w-24 mt-6" />;
    if (!isLoading) {
        chart = <DoughnutChart data={data || {}} setParentKey={setParentCategory} />;
    }

    return (
        <DashboardCard
            title="Expenses by category"
            icon="fa-solid fa-chart-pie"
            tone="amber"
            subtitle={parentCategory ? "Tap 'Back' to see every category" : "Tap a slice to zoom in"}
        >
            <div className="mt-4 h-56 w-full">{chart}</div>
        </DashboardCard>
    );
}
