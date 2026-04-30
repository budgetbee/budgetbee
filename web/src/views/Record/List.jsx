import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Api from "../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

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

const INPUT_CLASS =
    "border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500";

export default function List() {
    const { account_id } = useParams();

    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
    const [formFilters, setFormFilters] = useState(EMPTY_FILTERS);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState("");
    const [accounts, setAccounts] = useState([]);

    // Date & account filters (applied immediately, like Reports)
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
        Api.getAccounts().then((data) => { if (Array.isArray(data)) setAccounts(data); });
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
            setData((prevData) => (page === 1 ? newData : [...prevData, ...newData]));
            if (newData.length === 0) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }

        return () => controller.abort();
    }, [page, moreData, activeFilters, activeDateFrom, activeDateTo, activeAccountIds]);

    function loadMore() {
        if (
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight
        ) {
            setPage((prevPage) => prevPage + 1);
        }
    }

    useEffect(() => {
        window.addEventListener("scroll", loadMore);
        return () => {
            window.removeEventListener("scroll", loadMore);
        };
    }, []);

    const handleFilter = (field, value) => {
        setFormFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleParentCategoryChange = (parentId) => {
        setSelectedParent(parentId);
        setSubcategories([]);
        setFormFilters((prev) => ({
            ...prev,
            parent_category_id: parentId,
            category_id: "",
        }));
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

    const view = data.map((record) => (
        <div key={record.id}>
            <RecordCard record={record} showName={true} />
        </div>
    ));

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav menu={true} />
            <div className="mt-14 px-3 pt-3 pb-2">
                <form onSubmit={handleSearch}>
                    {/* Search row */}
                    <div className="flex gap-x-2 items-center mb-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="search"
                                value={formFilters.search_term}
                                onChange={(e) => handleFilter("search_term", e.target.value)}
                                className="border text-sm rounded-lg block w-full pl-10 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search records..."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced((v) => !v)}
                            className="text-white text-sm px-3 py-2.5 rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 focus:outline-none"
                        >
                            {showAdvanced ? "▲" : "▼"}
                        </button>
                    </div>

                    {/* Advanced filters */}
                    {showAdvanced && (
                        <div className="flex flex-col gap-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700 mb-2">
                            {/* Type */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Type</label>
                                <select
                                    value={formFilters.type}
                                    onChange={(e) => handleFilter("type", e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">All types</option>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div className="grid grid-cols-2 gap-x-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                                    <select
                                        value={selectedParent}
                                        onChange={(e) => handleParentCategoryChange(e.target.value)}
                                        className={INPUT_CLASS}
                                    >
                                        <option value="">All</option>
                                        {parentCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Subcategory</label>
                                    <select
                                        value={formFilters.category_id}
                                        onChange={(e) => handleSubcategoryChange(e.target.value)}
                                        disabled={subcategories.length === 0}
                                        className={INPUT_CLASS + (subcategories.length === 0 ? " opacity-50" : "")}
                                    >
                                        <option value="">All</option>
                                        {subcategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date presets */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {DATE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => handlePreset(preset)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                activePreset === preset.label
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-700 text-gray-300 border border-gray-600"
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                {activePreset === "Custom" && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <DatePicker
                                            selected={customFrom}
                                            onChange={(d) => setCustomFrom(d)}
                                            selectsStart
                                            startDate={customFrom}
                                            endDate={customTo}
                                            className="border text-xs rounded-lg px-2 py-1.5 w-32 bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                            placeholderText="From date"
                                        />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <DatePicker
                                            selected={customTo}
                                            onChange={(d) => setCustomTo(d)}
                                            selectsEnd
                                            startDate={customFrom}
                                            endDate={customTo}
                                            minDate={customFrom}
                                            className="border text-xs rounded-lg px-2 py-1.5 w-32 bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                            placeholderText="To date"
                                        />
                                        <button
                                            type="button"
                                            onClick={applyCustomRange}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                                {activePreset && activePreset !== "Custom" && activeDateFrom && (
                                    <p className="text-xs text-gray-400 mt-1">{activeDateFrom} &rarr; {activeDateTo}</p>
                                )}
                            </div>

                            {/* Account filter */}
                            {accounts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-x-2 mb-1">
                                        <label className="block text-xs text-gray-400">Accounts</label>
                                        {activeAccountIds.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => { setActiveAccountIds([]); setData([]); setPage(1); setMoreData(true); }}
                                                className="text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {accounts.map((account) => {
                                            const isActive = activeAccountIds.includes(account.id);
                                            return (
                                                <button
                                                    key={account.id}
                                                    type="button"
                                                    onClick={() => handleAccountToggle(account.id)}
                                                    className={`flex items-center gap-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                        isActive
                                                            ? "border-transparent text-white shadow-sm"
                                                            : "border-gray-600 text-gray-300 bg-transparent"
                                                    }`}
                                                    style={isActive ? { backgroundColor: account.color + "33", borderColor: account.color } : {}}
                                                >
                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: account.color }} />
                                                    {account.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Amount range */}
                            <div className="grid grid-cols-2 gap-x-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Min amount</label>
                                    <input
                                        type="number"
                                        value={formFilters.amount_min}
                                        onChange={(e) => handleFilter("amount_min", e.target.value)}
                                        className={INPUT_CLASS}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Max amount</label>
                                    <input
                                        type="number"
                                        value={formFilters.amount_max}
                                        onChange={(e) => handleFilter("amount_max", e.target.value)}
                                        className={INPUT_CLASS}
                                        placeholder="∞"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-x-2">
                        <button
                            type="submit"
                            className="flex-1 text-white font-medium rounded-lg text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                            Search
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-white font-medium rounded-lg text-sm px-5 py-2.5 bg-gray-600 hover:bg-gray-500 focus:outline-none"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
                {moreData && <Loader classes="w-10 my-5" />}
                {!moreData && data.length === 0 && hasActiveFilters && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <p className="text-sm font-medium">No records match the current filters</p>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
