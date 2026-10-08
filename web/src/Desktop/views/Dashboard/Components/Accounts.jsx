import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

export default function Accounts({ activeAccount, setSearchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        let cancelled = false;
        async function getAccounts() {
            const accounts = await Api.getAccounts();
            if (!cancelled) {
                setData(Array.isArray(accounts) ? accounts : []);
                setIsLoading(false);
            }
        }
        getAccounts();
        return () => {
            cancelled = true;
        };
    }, [activeAccount]);

    // The filter may hold one account or several; both are treated the same way.
    const activeIds = Array.isArray(activeAccount)
        ? activeAccount
        : activeAccount
        ? [activeAccount]
        : [];

    const handleClick = (id) => {
        const next = activeIds.includes(id)
            ? activeIds.filter((value) => value !== id)
            : [...activeIds, id];

        setSearchData((prevData) => {
            const nextData = { ...prevData, _refresh: Date.now() };
            if (next.length === 0) {
                delete nextData.account_id;
            } else {
                nextData.account_id = next;
            }
            return nextData;
        });
    };

    const handleSaveForm = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.accountAdjustBalance(formObject, activeIds[0]);
        const accounts = await Api.getAccounts();
        setData(Array.isArray(accounts) ? accounts : []);
        setSearchData((prevData) => ({ ...prevData, _refresh: Date.now() }));
        setAdjustBalanceOpen(false);
    };

    if (isLoading) {
        return null;
    }

    const adjustBalance = (
        <button
            type="button"
            onClick={() => setAdjustBalanceOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-[#0a0a0f] px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
            <FontAwesomeIcon icon="fa-solid fa-sliders" />
            Adjust balance
        </button>
    );

    const adjustBalanceForm = (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/60"
                onClick={() => setAdjustBalanceOpen(false)}
            ></div>
            <form
                onSubmit={handleSaveForm}
                className="relative z-20 w-80 rounded-2xl border border-gray-700 bg-[#2c3a50] p-5"
            >
                <div className="text-lg font-semibold text-white">Adjust balance</div>
                <input
                    type="number"
                    name="balance"
                    id="balance"
                    step="any"
                    className="mt-4 block w-full rounded-2xl border border-gray-700 bg-[#0a0a0f] px-3 py-2 text-white focus:border-emerald-500/40 focus:outline-none transition-colors"
                ></input>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setAdjustBalanceOpen(false)}
                        className="rounded-2xl px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-2xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <DashboardCard title="Accounts" icon="fa-solid fa-money-check" tone="blue">
            {adjustBalanceOpen && adjustBalanceForm}
            <div className="mt-4 flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {data.map((account) => {
                    const isActive = activeIds.includes(account.id);
                    const isDimmed = activeIds.length > 0 && !isActive;
                    return (
                        <button
                            key={account.id}
                            type="button"
                            onClick={() => handleClick(account.id)}
                            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                                isActive
                                    ? "border-emerald-500/25 bg-emerald-500/15"
                                    : "border-gray-700 bg-[#0a0a0f] hover:border-gray-700"
                            } ${isDimmed ? "opacity-50" : ""}`}
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <span
                                    className="flex items-center justify-center w-9 h-9 rounded-2xl text-white shrink-0"
                                    style={{ backgroundColor: account.color }}
                                >
                                    <FontAwesomeIcon
                                        icon="fa-solid fa-building-columns"
                                        className="text-sm"
                                    />
                                </span>
                                <span className="text-sm text-white truncate">
                                    {account.name}
                                </span>
                            </span>
                            <span
                                className={`text-sm font-semibold shrink-0 ${
                                    isActive ? "text-emerald-300" : "text-gray-300"
                                }`}
                            >
                                {account.currency_symbol}{" "}
                                {numeral(account.balance).format("0,0.00")}
                            </span>
                        </button>
                    );
                })}
                {data.length === 0 && (
                    <p className="text-sm text-gray-500">No accounts.</p>
                )}
            </div>
            {/* Adjusting a balance only makes sense for one account at a time:
                with none or several selected the numbers have no single owner. */}
            {activeIds.length === 1 && adjustBalance}
        </DashboardCard>
    );
}
