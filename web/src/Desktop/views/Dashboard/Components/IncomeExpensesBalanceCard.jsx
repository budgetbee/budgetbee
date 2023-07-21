import React, { useEffect, useState } from "react";
import numeral from "numeral";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

export default function IncomeExpensesBalanceCard({ searchData }) {
    const [totalIncome, setTotalIncome] = useState(null);
    const [totalExpenses, setTotalExpenses] = useState(null);

    useEffect(() => {
        async function getAllBalance() {
            const balance = await Api.getAllBalance(searchData);
            setTotalIncome(balance.incomes);
            setTotalExpenses(balance.expenses);
        }
        getAllBalance();
    }, [searchData]);

    return (
        <div className="grid grid-cols-2 divide-x divide-solid divide-gray-400 px-5 py-4 bg-gray-700 rounded-3xl py-4 h-full">
            <div className="flex flex-col items-center text-center">
                <div className="flex flex-row justify-between items-center text-white text-lg pb-4">
                    <div className="flex flex-row gap-x-3 items-center">
                        <FontAwesomeIcon
                            icon="fa-solid fa-caret-up"
                            className="text-green-400"
                        />
                        <span>Income</span>
                    </div>
                </div>
                <div className="font-bold text-2xl">
                    {numeral(totalIncome).format("$0,0.00")}
                </div>
            </div>
            <div className="flex flex-col items-center text-center">
                <div className="flex flex-row justify-between items-center text-white text-lg pb-4">
                    <div className="flex flex-row gap-x-3 items-center">
                        <FontAwesomeIcon
                            icon="fa-solid fa-caret-down"
                            className="text-red-400"
                        />
                        <span>Expenses</span>
                    </div>
                </div>
                <div className="font-bold text-2xl">
                    {numeral(totalExpenses).format("$0,0.00")}
                </div>
            </div>
        </div>
    );
}
