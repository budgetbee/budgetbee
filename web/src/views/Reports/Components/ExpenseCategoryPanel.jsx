import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import DoughnutChart from "../../../Components/Chart/DoughnutChart";
import Loader from "../../../Components/Miscellaneous/Loader";

export default function ExpenseCategoryPanel({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [parentCategories, setParentCategories] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);
    const [currency, setCurrency] = useState("");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setParentCategory(null);
        async function fetch() {
            setIsLoading(true);
            const fetched = await Api.getExpenseCategoriesBalance(searchData);
            if (!fetched || fetched.error) {
                setIsLoading(false);
                return;
            }
            const data = {};
            let sum = 0;
            Object.keys(fetched).forEach((key) => {
                data[key] = {
                    id: fetched[key].id,
                    amount: fetched[key].amount,
                    color: fetched[key].color,
                };
                sum += fetched[key].amount;
            });
            setChartData(data);
            setParentCategories(fetched);
            setTotal(sum);
            if (Object.values(fetched).length > 0) {
                setCurrency(Object.values(fetched)[0]?.currency_symbol || "");
            }
            setIsLoading(false);
        }
        fetch();
    }, [searchData]);

    useEffect(() => {
        if (!parentCategories) return;
        if (parentCategory && parentCategories[parentCategory]) {
            const childrens = parentCategories[parentCategory].childrens || {};
            const data = {};
            Object.keys(childrens).forEach((key) => {
                data[key] = { amount: childrens[key] };
            });
            setChartData(data);
        } else if (!parentCategory) {
            const data = {};
            Object.keys(parentCategories).forEach((key) => {
                data[key] = {
                    id: parentCategories[key].id,
                    amount: parentCategories[key].amount,
                    color: parentCategories[key].color,
                };
            });
            setChartData(data);
        }
    }, [parentCategory, parentCategories]);

    const listData = parentCategory && parentCategories?.[parentCategory]?.childrens
        ? Object.entries(parentCategories[parentCategory].childrens).map(([name, amount]) => ({
              name,
              amount,
              color: null,
              icon: null,
              currency_symbol: currency,
          }))
        : parentCategories
        ? Object.entries(parentCategories).map(([name, cat]) => ({
              name: cat.name || name,
              amount: cat.total || cat.amount,
              color: cat.color,
              icon: cat.icon,
              currency_symbol: cat.currency_symbol || currency,
          })).sort((a, b) => b.amount - a.amount)
        : [];

    const displayTotal = parentCategory && parentCategories?.[parentCategory]
        ? parentCategories[parentCategory].total || parentCategories[parentCategory].amount
        : total;

    return (
        <div className="flex flex-col gap-y-4 p-5 bg-gray-700 rounded-3xl h-full">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-white">
                        {parentCategory ? parentCategory : "Expenses by Category"}
                    </span>
                    {parentCategory && (
                        <button
                            onClick={() => setParentCategory(null)}
                            className="text-xs text-purple-400 hover:text-purple-300 text-left mt-0.5"
                        >
                            ← All categories
                        </button>
                    )}
                </div>
                {!isLoading && (
                    <span className="text-red-400 font-bold text-lg">
                        {currency} {numeral(displayTotal).format("0,0.00")}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader classes="w-16" />
                </div>
            ) : !chartData || Object.keys(chartData).length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No expenses for this period.</p>
            ) : (
                <div className="flex flex-col gap-y-5">
                    {/* Doughnut */}
                    <div className="h-52 w-52 mx-auto" id="pdf-chart-expenses">
                        <DoughnutChart data={chartData} setParentKey={setParentCategory} />
                    </div>

                    {/* Category list */}
                    <div className="flex flex-col divide-y divide-gray-600">
                        {listData.slice(0, 8).map((item, idx) => {
                            const pct = displayTotal > 0 ? (item.amount / displayTotal) * 100 : 0;
                            const inlineStyle = item.color ? { backgroundColor: item.color } : {};
                            return (
                                <div key={idx} className="flex flex-col gap-y-1 py-3">
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex flex-row items-center gap-x-2">
                                            {item.color && (
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                                    style={inlineStyle}
                                                >
                                                    {item.icon && (
                                                        <FontAwesomeIcon icon={item.icon} className="text-xs" />
                                                    )}
                                                </div>
                                            )}
                                            <span className="text-sm text-white">{item.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-white">
                                                {item.currency_symbol} {numeral(item.amount).format("0,0.00")}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-2">
                                                {numeral(pct).format("0.0")}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1">
                                        <div
                                            className="h-1 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: item.color || "#a855f7",
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
