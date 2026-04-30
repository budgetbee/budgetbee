import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import Layout from "../../layout/Layout";
import Loader from "../../../Components/Miscellaneous/Loader";

const PAGE_SIZE = 20;

const EMPTY_FILTERS = {
    search_term: "",
    type: "",
    parent_category_id: "",
    category_id: "",
    amount_min: "",
    amount_max: "",
};

const DATE_PRESETS = [
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

const SELECT_CLASS =
    "w-full text-sm rounded-2xl px-3 py-2 bg-gray-800 border border-gray-600 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors";

const TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfer" },
];

export default function List() {
    const { account_id } = useParams();

    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
    const [formFilters, setFormFilters] = useState(EMPTY_FILTERS);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState("");
    const [accounts, setAccounts] = useState([]);

    // Reports-style date & account filters
    const [activeAccountIds, setActiveAccountIds] = useState(
        account_id ? [parseInt(account_id)] : []
    );
    const [activeDateFrom, setActiveDateFrom] = useState("");
    const [activeDateTo, setActiveDateTo] = useState("");
    const [activePreset, setActivePreset] = useState("");
    const [customFrom, setCustomFrom] = useState(null);
    const [customTo, setCustomTo] = useState(null);

    const abortControllerRef = useRef(null);

    useEffect(() => {
        Api.getParentCategories().then(setParentCategories);
        Api.getAccounts().then(setAccounts);
    }, []);

    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        async function getRecords() {
            const apiFilters = { ...activeFilters };
            if (activeDateFrom) apiFilters.from_date = activeDateFrom;
            if (activeDateTo) apiFilters.to_date = activeDateTo;
            if (activeAccountIds.length > 0) apiFilters.account_id = activeAccountIds;
            const newData = await Api.getPaginateRecords(null, page, apiFilters);
            if (controller.signal.aborted) return;
            if (!Array.isArray(newData)) {
                setMoreData(false);
                return;
            }
            setData((prev) => (page === 1 ? newData : [...prev, ...newData]));
            if (newData.length < PAGE_SIZE) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }

        return () => controller.abort();
    }, [page, moreData, activeFilters, activeDateFrom, activeDateTo, activeAccountIds]);

    useEffect(() => {
        function loadMore() {
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100) {
                setPage((prev) => prev + 1);
            }
        }
        window.addEventListener("scroll", loadMore);
        return () => window.removeEventListener("scroll", loadMore);
    }, []);

    const handleFilter = (field, value) => {
        setFormFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleParentCategoryChange = (parentId) => {
        setSelectedParent(parentId);
        setSubcategories([]);
        setFormFilters((prev) => ({ ...prev, parent_category_id: parentId, category_id: "" }));
        if (parentId) {
            Api.getCategoriesByParent(parentId).then(setSubcategories);
        }
    };

    const handleSubcategoryChange = (categoryId) => {
        setFormFilters((prev) => ({
            ...prev,
            category_id: categoryId,
            parent_category_id: categoryId ? "" : selectedParent,
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setActiveFilters({ ...formFilters });
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const handleClear = () => {
        setFormFilters(EMPTY_FILTERS);
        setActiveFilters(EMPTY_FILTERS);
        setSelectedParent("");
        setSubcategories([]);
        setActiveAccountIds([]);
        setActiveDateFrom("");
        setActiveDateTo("");
        setActivePreset("");
        setCustomFrom(null);
        setCustomTo(null);
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const handleAccountToggle = (accountId) => {
        setActiveAccountIds((prev) =>
            prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
        );
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const handlePreset = (preset) => {
        setActivePreset(preset.label);
        if (preset.label !== "Custom") {
            setActiveDateFrom(preset.from());
            setActiveDateTo(preset.to());
            setData([]);
            setPage(1);
            setMoreData(true);
        }
    };

    const applyCustomRange = () => {
        if (!customFrom || !customTo) return;
        setActiveDateFrom(moment(customFrom).format("YYYY-MM-DD"));
        setActiveDateTo(moment(customTo).format("YYYY-MM-DD"));
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const hasActiveFilters =
        Object.values(activeFilters).some((v) => v !== "") ||
        activeAccountIds.length > 0 ||
        !!activeDateFrom;

    const activeFilterCount =
        Object.values(activeFilters).filter((v) => v !== "").length +
        (activeAccountIds.length > 0 ? 1 : 0) +
        (activeDateFrom ? 1 : 0);

    return (
        <Layout>
            <div className="flex flex-col gap-y-6 px-10 py-6 min-h-screen">

                {/* Page header */}
                <div className="flex flex-row items-center gap-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600/30">
                        <FontAwesomeIcon icon="fa-solid fa-list" className="text-blue-400 text-lg" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Records</h1>
                        <p className="text-sm text-gray-400">Browse and filter your transactions</p>
                    </div>
                </div>

                {/* Filter card */}
                <form onSubmit={handleSearch}>
                    <div className="p-5 bg-gray-700 rounded-3xl flex flex-col gap-y-4">

                        {/* Search bar + action buttons */}
                        <div className="flex gap-x-2 items-center">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    value={formFilters.search_term}
                                    onChange={(e) => handleFilter("search_term", e.target.value)}
                                    className="w-full text-sm rounded-2xl pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Search records..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-x-1.5 text-white font-medium rounded-2xl text-sm px-5 py-2 bg-blue-600 hover:bg-blue-500 transition-colors focus:outline-none"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                                Search
                            </button>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="inline-flex items-center gap-x-1.5 text-gray-300 font-medium rounded-2xl text-sm px-4 py-2 bg-gray-800 border border-gray-600 hover:bg-gray-600 hover:text-white transition-colors focus:outline-none"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Clear
                                    <span className="bg-blue-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                </button>
                            )}
                        </div>

                        <div className="border-t border-gray-600/50" />

                        {/* Date presets */}
                        <div className="flex flex-col gap-y-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</span>
                            <div className="flex flex-wrap gap-2">
                                {DATE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => handlePreset(preset)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                                            activePreset === preset.label
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                                                : "bg-gray-800 text-gray-300 hover:bg-gray-600 hover:text-white"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            {activePreset === "Custom" && (
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <DatePicker
                                        selected={customFrom}
                                        onChange={(d) => setCustomFrom(d)}
                                        selectsStart
                                        startDate={customFrom}
                                        endDate={customTo}
                                        className="border text-sm rounded-lg pl-3 pr-3 py-2 w-36 bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        placeholderText="From date"
                                    />
                                    <span className="text-gray-400 text-sm">to</span>
                                    <DatePicker
                                        selected={customTo}
                                        onChange={(d) => setCustomTo(d)}
                                        selectsEnd
                                        startDate={customFrom}
                                        endDate={customTo}
                                        minDate={customFrom}
                                        className="border text-sm rounded-lg pl-3 pr-3 py-2 w-36 bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        placeholderText="To date"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyCustomRange}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                            {activePreset && activePreset !== "Custom" && activeDateFrom && (
                                <p className="text-xs text-gray-400">
                                    {activeDateFrom} &rarr; {activeDateTo}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-gray-600/50" />

                        {/* Type pills */}
                        <div className="flex flex-col gap-y-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</span>
                            <div className="flex flex-wrap gap-2">
                                {TYPE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleFilter("type", opt.value)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            formFilters.type === opt.value
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                                                : "bg-gray-800 text-gray-300 hover:bg-gray-600 hover:text-white"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Account / Category / Subcategory / Amount */}
                        <div className="grid grid-cols-4 gap-x-4 gap-y-4">

                            <div className="flex flex-col gap-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</label>
                                <select
                                    value={selectedParent}
                                    onChange={(e) => handleParentCategoryChange(e.target.value)}
                                    className={SELECT_CLASS}
                                >
                                    <option value="">All categories</option>
                                    {parentCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Subcategory</label>
                                <select
                                    value={formFilters.category_id}
                                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                                    disabled={subcategories.length === 0}
                                    className={SELECT_CLASS + (subcategories.length === 0 ? " opacity-40 cursor-not-allowed" : "")}
                                >
                                    <option value="">All subcategories</option>
                                    {subcategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-y-1.5 col-span-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount range</label>
                                <div className="flex items-center gap-x-2">
                                    <input
                                        type="number"
                                        value={formFilters.amount_min}
                                        onChange={(e) => handleFilter("amount_min", e.target.value)}
                                        className={SELECT_CLASS}
                                        placeholder="Min"
                                        min="0"
                                        step="0.01"
                                    />
                                    <span className="text-gray-500 text-xs shrink-0">—</span>
                                    <input
                                        type="number"
                                        value={formFilters.amount_max}
                                        onChange={(e) => handleFilter("amount_max", e.target.value)}
                                        className={SELECT_CLASS}
                                        placeholder="Max"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Account filter */}
                        {accounts.length > 0 && (
                            <div className="flex flex-col gap-y-2 pt-1 border-t border-gray-600/50">
                                <div className="flex flex-row items-center gap-x-3">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                        Accounts
                                    </span>
                                    {activeAccountIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveAccountIds([]);
                                                setData([]);
                                                setPage(1);
                                                setMoreData(true);
                                            }}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {accounts.map((account) => {
                                        const isActive = activeAccountIds.includes(account.id);
                                        const dotStyle = { backgroundColor: account.color };
                                        return (
                                            <button
                                                key={account.id}
                                                type="button"
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
                </form>

                {/* Records list */}
                <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl overflow-hidden bg-gray-700">
                    {data.map((record) => (
                        <div key={record.id}>
                            <RecordCard record={record} showName={true} />
                        </div>
                    ))}

                    {moreData && (
                        <div className="flex justify-center py-5">
                            <Loader classes="w-10" />
                        </div>
                    )}

                    {!moreData && data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-medium">
                                {hasActiveFilters ? "No records match the current filters" : "No records yet"}
                            </p>
                            {hasActiveFilters && (
                                <button type="button" onClick={handleClear} className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}


