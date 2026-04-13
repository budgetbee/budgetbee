import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
    from_date: "",
    to_date: "",
    amount_min: "",
    amount_max: "",
};

const SELECT_CLASS =
    "w-full text-sm rounded-2xl px-3 py-2 bg-gray-800 border border-gray-600 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors";

const TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfer" },
];

export default function List() {
    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
    const [formFilters, setFormFilters] = useState(EMPTY_FILTERS);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState("");

    const { account_id } = useParams();
    const abortControllerRef = useRef(null);

    useEffect(() => {
        Api.getParentCategories().then(setParentCategories);
    }, []);

    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        async function getRecords() {
            const newData = await Api.getPaginateRecords(account_id, page, activeFilters);
            if (controller.signal.aborted) return;
            if (!Array.isArray(newData)) {
                setMoreData(false);
                return;
            }
            setData((prev) => [...prev, ...newData]);
            if (newData.length < PAGE_SIZE) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }

        return () => controller.abort();
    }, [page, account_id, moreData, activeFilters]);

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
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");
    const activeFilterCount = Object.values(activeFilters).filter((v) => v !== "").length;

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

                        {/* Category / Subcategory / Dates / Amount */}
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

                            <div className="flex flex-col gap-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">From date</label>
                                <input
                                    type="date"
                                    value={formFilters.from_date}
                                    onChange={(e) => handleFilter("from_date", e.target.value)}
                                    className={SELECT_CLASS}
                                />
                            </div>

                            <div className="flex flex-col gap-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">To date</label>
                                <input
                                    type="date"
                                    value={formFilters.to_date}
                                    onChange={(e) => handleFilter("to_date", e.target.value)}
                                    className={SELECT_CLASS}
                                />
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


