import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

const STORAGE_KEY = "budgetbee.desktop.dashboard.filters";

// The keys the filter writes onto searchData. They are the ones the dashboard
// components already read, so nothing else has to change.
export const FILTER_KEYS = [
    "from_date",
    "to_date",
    "search_term",
    "type",
    "parent_category_id",
    "category_id",
    "amount_min",
    "amount_max",
    "account_id",
];

const DATE_PRESETS = [
    { key: "this_month", label: "This month", from: () => moment().startOf("month"), to: () => moment() },
    { key: "last_month", label: "Last month", from: () => moment().subtract(1, "month").startOf("month"), to: () => moment().subtract(1, "month").endOf("month") },
    { key: "this_year", label: "This year", from: () => moment().startOf("year"), to: () => moment() },
    { key: "last_30_days", label: "Last 30 days", from: () => moment().subtract(30, "days"), to: () => moment() },
];

const TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfer" },
];

const INPUT_CLASS =
    "w-full rounded-2xl border border-gray-700 bg-[#26334a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500/40 focus:outline-none transition-colors";

const LABEL_CLASS =
    "text-xs font-semibold uppercase tracking-wide text-gray-500";

function isEmptyFilterValue(value) {
    return (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
    );
}

/**
 * How many filters are set right now, for the badge on the top bar button.
 */
export function countActiveFilters(data) {
    if (!data) {
        return 0;
    }
    return FILTER_KEYS.reduce(
        (count, key) => (isEmptyFilterValue(data[key]) ? count : count + 1),
        0
    );
}

/**
 * The last filter the user applied, remembered across reloads. Returns null
 * when there is nothing stored or it cannot be read.
 */
export function readStoredFilters() {
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

function persistFilters(filters) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
        // Storage can be full or blocked: remembering the filter is a nicety.
    }
}

function clearStoredFilters() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Nothing here is critical.
    }
}

function buildFormState(data) {
    const accountId = data?.account_id;
    return {
        from_date: data?.from_date ?? "",
        to_date: data?.to_date ?? "",
        search_term: data?.search_term ?? "",
        type: data?.type ?? "",
        parent_category_id: data?.parent_category_id ?? "",
        category_id: data?.category_id ?? "",
        amount_min: data?.amount_min ?? "",
        amount_max: data?.amount_max ?? "",
        account_id: Array.isArray(accountId)
            ? accountId
            : accountId
            ? [accountId]
            : [],
    };
}

/**
 * The dashboard filter.
 *
 * It writes onto the same searchData object the rest of the dashboard already
 * reads, so every panel is filtered at once with no extra plumbing. The last
 * applied filter is remembered in localStorage and comes back the next time.
 */
export default function RecordFilter({ searchData, setSearchData, onClose }) {
    const [form, setForm] = useState(() => buildFormState(searchData));
    const [accounts, setAccounts] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [accountsData, parentsData] = await Promise.all([
                Api.getAccounts(),
                Api.getParentCategories(),
            ]);
            if (cancelled) {
                return;
            }
            setAccounts(Array.isArray(accountsData) ? accountsData : []);
            setParentCategories(Array.isArray(parentsData) ? parentsData : []);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!form.parent_category_id) {
            setSubcategories([]);
            return;
        }
        let cancelled = false;
        Api.getCategoriesByParent(form.parent_category_id).then((data) => {
            if (!cancelled) {
                setSubcategories(Array.isArray(data) ? data : []);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [form.parent_category_id]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handlePreset = (preset) => {
        setForm((prev) => ({
            ...prev,
            from_date: preset.from().format("YYYY-MM-DD"),
            to_date: preset.to().format("YYYY-MM-DD"),
        }));
    };

    const handleParentChange = (value) => {
        setForm((prev) => ({
            ...prev,
            parent_category_id: value,
            category_id: "",
        }));
    };

    const toggleAccount = (id) => {
        setForm((prev) => ({
            ...prev,
            account_id: prev.account_id.includes(id)
                ? prev.account_id.filter((value) => value !== id)
                : [...prev.account_id, id],
        }));
    };

    const applyFilters = (event) => {
        event.preventDefault();

        const applied = {};
        FILTER_KEYS.forEach((key) => {
            if (!isEmptyFilterValue(form[key])) {
                applied[key] = form[key];
            }
        });

        persistFilters(applied);

        setSearchData((prev) => {
            const next = { ...prev };
            FILTER_KEYS.forEach((key) => {
                delete next[key];
            });
            return { ...next, ...applied, _refresh: Date.now() };
        });

        onClose?.();
    };

    const clearFilters = () => {
        clearStoredFilters();
        setForm(buildFormState({}));
        setSearchData((prev) => {
            const next = { ...prev };
            FILTER_KEYS.forEach((key) => {
                delete next[key];
            });
            return { ...next, _refresh: Date.now() };
        });
    };

    return (
        <form onSubmit={applyFilters}>
            <DashboardCard
                title="Filters"
                icon="fa-solid fa-filter"
                tone="blue"
                action={
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-700 bg-[#26334a] text-gray-400 hover:text-white transition-colors"
                        title="Close filters"
                    >
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                }
            >
                <div className="mt-4 flex flex-col gap-5">
                    {/* Dates */}
                    <div className="flex flex-col gap-2">
                        <span className={LABEL_CLASS}>Period</span>
                        <div className="flex flex-row flex-wrap items-center gap-2">
                            {DATE_PRESETS.map((preset) => {
                                const isActive =
                                    form.from_date === preset.from().format("YYYY-MM-DD") &&
                                    form.to_date === preset.to().format("YYYY-MM-DD");
                                return (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        onClick={() => handlePreset(preset)}
                                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                                : "border border-gray-700 bg-[#26334a] text-gray-300 hover:text-white"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                            <input
                                type="date"
                                value={form.from_date}
                                onChange={(event) => handleChange("from_date", event.target.value)}
                                className={INPUT_CLASS + " w-40"}
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <input
                                type="date"
                                value={form.to_date}
                                onChange={(event) => handleChange("to_date", event.target.value)}
                                className={INPUT_CLASS + " w-40"}
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/5" />

                    {/* Text and type */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 flex flex-col gap-2">
                            <label className={LABEL_CLASS} htmlFor="filter-search">
                                Text
                            </label>
                            <input
                                id="filter-search"
                                type="search"
                                value={form.search_term}
                                onChange={(event) => handleChange("search_term", event.target.value)}
                                placeholder="Search movements"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className={LABEL_CLASS}>Type</span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {TYPE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value || "all"}
                                        type="button"
                                        onClick={() => handleChange("type", option.value)}
                                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                            form.type === option.value
                                                ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                                : "border border-gray-700 bg-[#26334a] text-gray-300 hover:text-white"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5" />

                    {/* Category and amount */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={LABEL_CLASS} htmlFor="filter-parent-category">
                                Category
                            </label>
                            <select
                                id="filter-parent-category"
                                value={form.parent_category_id}
                                onChange={(event) => handleParentChange(event.target.value)}
                                className={INPUT_CLASS}
                            >
                                <option value="">All categories</option>
                                {parentCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={LABEL_CLASS} htmlFor="filter-child-category">
                                Subcategory
                            </label>
                            <select
                                id="filter-child-category"
                                value={form.category_id}
                                onChange={(event) => handleChange("category_id", event.target.value)}
                                disabled={subcategories.length === 0}
                                className={INPUT_CLASS + (subcategories.length === 0 ? " opacity-40 cursor-not-allowed" : "")}
                            >
                                <option value="">All subcategories</option>
                                {subcategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 flex flex-col gap-2">
                            <span className={LABEL_CLASS}>Amount range</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount_min}
                                    onChange={(event) => handleChange("amount_min", event.target.value)}
                                    placeholder="Min"
                                    className={INPUT_CLASS}
                                />
                                <span className="text-gray-500 text-xs shrink-0">&mdash;</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount_max}
                                    onChange={(event) => handleChange("amount_max", event.target.value)}
                                    placeholder="Max"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5" />

                    {/* Accounts */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className={LABEL_CLASS}>Accounts</span>
                            {form.account_id.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleChange("account_id", [])}
                                    className="text-xs text-emerald-300 hover:text-emerald-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-row flex-wrap gap-2">
                            {accounts.map((account) => {
                                const isActive = form.account_id.includes(account.id);
                                return (
                                    <button
                                        key={account.id}
                                        type="button"
                                        onClick={() => toggleAccount(account.id)}
                                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                                : "border-gray-700 bg-[#26334a] text-gray-300 hover:text-white"
                                        }`}
                                    >
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: account.color }}
                                        />
                                        {account.name}
                                    </button>
                                );
                            })}
                            {accounts.length === 0 && (
                                <span className="text-sm text-gray-500">No accounts.</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-2xl px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-2xl bg-green-500 px-5 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                        >
                            <FontAwesomeIcon icon="fa-solid fa-check" />
                            Apply filters
                        </button>
                    </div>
                </div>
            </DashboardCard>
        </form>
    );
}
