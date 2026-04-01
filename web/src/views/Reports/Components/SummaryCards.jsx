import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";

function Card({ label, value, currency, icon, iconClass, accentClass, bgClass }) {
    return (
        <div className={`flex flex-col gap-y-3 p-5 rounded-3xl ${bgClass || "bg-gray-700"}`}>
            <div className="flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full ${iconClass}`}>
                    <FontAwesomeIcon icon={icon} className="text-sm" />
                </div>
            </div>
            <div className={`text-2xl font-bold ${accentClass}`}>
                {currency} {numeral(value).format("0,0.00")}
            </div>
        </div>
    );
}

export default function SummaryCards({ searchData }) {
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [balance, setBalance] = useState(0);
    const [currency, setCurrency] = useState("");

    useEffect(() => {
        async function fetchBalance() {
            const data = await Api.getAllBalance(searchData);
            if (data && !data.error) {
                const inc = data.incomes ?? 0;
                const exp = Math.abs(data.expenses ?? 0);
                setIncome(inc);
                setExpenses(exp);
                setBalance(inc - exp);
                setCurrency(data.currency_symbol ?? "");
            }
        }
        fetchBalance();
    }, [searchData]);

    const savingsRate =
        income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
                label="Total Income"
                value={income}
                currency={currency}
                icon="fa-solid fa-arrow-trend-up"
                iconClass="bg-green-600/30 text-green-400"
                accentClass="text-green-400"
            />
            <Card
                label="Total Expenses"
                value={expenses}
                currency={currency}
                icon="fa-solid fa-arrow-trend-down"
                iconClass="bg-red-600/30 text-red-400"
                accentClass="text-red-400"
            />
            <Card
                label="Net Balance"
                value={balance}
                currency={currency}
                icon="fa-solid fa-scale-balanced"
                iconClass="bg-blue-600/30 text-blue-400"
                accentClass={balance >= 0 ? "text-blue-400" : "text-red-400"}
            />
            <div className="flex flex-col gap-y-3 p-5 rounded-3xl bg-gray-700">
                <div className="flex flex-row items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Savings Rate</span>
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600/30 text-purple-400">
                        <FontAwesomeIcon icon="fa-solid fa-piggy-bank" className="text-sm" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                    {numeral(savingsRate).format("0.0")}%
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                    <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(savingsRate, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
