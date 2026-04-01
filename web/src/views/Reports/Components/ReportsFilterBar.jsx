import React, { useState, useEffect } from "react";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Api from "../../../Api/Endpoints";

const PRESETS = [
    { label: "Today", from: () => moment().format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "Yesterday", from: () => moment().subtract(1, "days").format("YYYY-MM-DD"), to: () => moment().subtract(1, "days").format("YYYY-MM-DD") },
    { label: "This Week", from: () => moment().startOf("isoWeek").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "This Month", from: () => moment().startOf("month").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "Last Month", from: () => moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), to: () => moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD") },
    { label: "Last 30 Days", from: () => moment().subtract(30, "days").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "Last 3 Months", from: () => moment().subtract(3, "months").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "Last 6 Months", from: () => moment().subtract(6, "months").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "This Year", from: () => moment().startOf("year").format("YYYY-MM-DD"), to: () => moment().format("YYYY-MM-DD") },
    { label: "Last Year", from: () => moment().subtract(1, "year").startOf("year").format("YYYY-MM-DD"), to: () => moment().subtract(1, "year").endOf("year").format("YYYY-MM-DD") },
    { label: "Custom", from: null, to: null },
];

const DEFAULT_PRESET = "This Month";

export default function ReportsFilterBar({ searchData, setSearchData }) {
    const [activePreset, setActivePreset] = useState(DEFAULT_PRESET);
    const [customFrom, setCustomFrom] = useState(new Date(moment().startOf("month").format("YYYY-MM-DD")));
    const [customTo, setCustomTo] = useState(new Date(moment().format("YYYY-MM-DD")));
    const [accounts, setAccounts] = useState([]);
    const [activeAccounts, setActiveAccounts] = useState([]);

    useEffect(() => {
        async function fetchAccounts() {
            const data = await Api.getAccounts();
            if (Array.isArray(data)) setAccounts(data);
        }
        fetchAccounts();
    }, []);

    const handleAccountToggle = (accountId) => {
        setActiveAccounts((prev) => {
            const next = prev.includes(accountId)
                ? prev.filter((id) => id !== accountId)
                : [...prev, accountId];
            setSearchData((sd) => ({
                ...sd,
                account_id: next.length > 0 ? next : undefined,
            }));
            return next;
        });
    };

    const handlePreset = (preset) => {
        setActivePreset(preset.label);
        if (preset.label !== "Custom") {
            setSearchData((prev) => ({
                ...prev,
                from_date: preset.from(),
                to_date: preset.to(),
            }));
        }
    };

    const applyCustomRange = () => {
        setSearchData((prev) => ({
            ...prev,
            from_date: moment(customFrom).format("YYYY-MM-DD"),
            to_date: moment(customTo).format("YYYY-MM-DD"),
        }));
    };

    return (
        <div className="flex flex-col gap-y-3">
            {/* Preset pills */}
            <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => {
                    const isActive = activePreset === preset.label;
                    return (
                        <button
                            key={preset.label}
                            onClick={() => handlePreset(preset)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                                isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                            }`}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            {/* Custom date pickers */}
            {activePreset === "Custom" && (
                <div className="flex flex-wrap items-center gap-3 mt-1">
                    <div className="relative">
                        <DatePicker
                            selected={customFrom}
                            onChange={(d) => setCustomFrom(d)}
                            selectsStart
                            startDate={customFrom}
                            endDate={customTo}
                            className="border text-sm rounded-lg pl-3 pr-3 py-2 w-36 bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
                            placeholderText="From date"
                        />
                    </div>
                    <span className="text-gray-400 text-sm">to</span>
                    <div className="relative">
                        <DatePicker
                            selected={customTo}
                            onChange={(d) => setCustomTo(d)}
                            selectsEnd
                            startDate={customFrom}
                            endDate={customTo}
                            minDate={customFrom}
                            className="border text-sm rounded-lg pl-3 pr-3 py-2 w-36 bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
                            placeholderText="To date"
                        />
                    </div>
                    <button
                        onClick={applyCustomRange}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                        Apply
                    </button>
                </div>
            )}

            {/* Active range label (non-custom) */}
            {activePreset !== "Custom" && (
                <p className="text-xs text-gray-400">
                    {searchData.from_date} &rarr; {searchData.to_date}
                </p>
            )}

            {/* Account filter */}
            {accounts.length > 0 && (
                <div className="flex flex-col gap-y-2 pt-1 border-t border-gray-600/50">
                    <div className="flex flex-row items-center gap-x-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                            Accounts
                        </span>
                        {activeAccounts.length > 0 && (
                            <button
                                onClick={() => {
                                    setActiveAccounts([]);
                                    setSearchData((sd) => ({ ...sd, account_id: undefined }));
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {accounts.map((account) => {
                            const isActive = activeAccounts.includes(account.id);
                            const dotStyle = { backgroundColor: account.color };
                            return (
                                <button
                                    key={account.id}
                                    onClick={() => handleAccountToggle(account.id)}
                                    className={`flex items-center gap-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                                        isActive
                                            ? "border-transparent text-white shadow-sm"
                                            : "border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white bg-transparent"
                                    }`}
                                    style={isActive ? { backgroundColor: account.color + "33", borderColor: account.color } : {}}
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={dotStyle}
                                    />
                                    {account.name}
                                </button>
                            );
                        })}
                    </div>

                </div>
            )}
        </div>
    );
}
