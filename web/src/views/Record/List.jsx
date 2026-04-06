import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

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

const INPUT_CLASS =
    "border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500";

export default function List() {
    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
    const [formFilters, setFormFilters] = useState(EMPTY_FILTERS);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState("");

    const { account_id } = useParams();

    useEffect(() => {
        Api.getParentCategories().then(setParentCategories);
    }, []);

    useEffect(() => {
        async function getRecords() {
            const newData = await Api.getPaginateRecords(account_id, page, activeFilters);
            setData((prevData) => [...prevData, ...newData]);
            if (newData.length === 0) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }
    }, [page, account_id, moreData, activeFilters]);

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
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

    const view = data.map((record, index) => (
        <div key={index}>
            <RecordCard record={record} showName={true} />
        </div>
    ));

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav />
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

                            {/* Date range */}
                            <div className="grid grid-cols-2 gap-x-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">From date</label>
                                    <input
                                        type="date"
                                        value={formFilters.from_date}
                                        onChange={(e) => handleFilter("from_date", e.target.value)}
                                        className={INPUT_CLASS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">To date</label>
                                    <input
                                        type="date"
                                        value={formFilters.to_date}
                                        onChange={(e) => handleFilter("to_date", e.target.value)}
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            </div>

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
            </div>
        </div>
    );
}
